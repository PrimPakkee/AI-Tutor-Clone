'use client'
import { useEffect, useRef, useState } from 'react'
import type { PlayerState, InstructorLiveSegment } from '@/lib/types'


type Props = {
  playerState: PlayerState
  activeLiveSeg: InstructorLiveSegment | null
  avatarVideoElId: string
  studentVideoElId: string
  onError?: (msg: string) => void
  onAvatarDone?: () => void
}

type LiveSession = {
  muteAudio: (muted: boolean) => void
  muteVideo: (muted: boolean) => void
  sendText: (text: string) => void
  isJoined: boolean
}

export function useLiveSession({
  playerState,
  activeLiveSeg,
  avatarVideoElId,
  studentVideoElId,
  onError,
  onAvatarDone,
}: Props): LiveSession {
  const clientRef = useRef<import('omnirtc-web').IOmniRTCClient | null>(null)
  const audioRef = useRef<import('omnirtc-web').IMicrophoneAudioTrack | null>(null)
  const videoRef = useRef<import('omnirtc-web').ICameraVideoTrack | null>(null)
  const aigcRef = useRef<import('omnirtc-web/aigc').Aigc | null>(null)
  const [isJoined, setIsJoined] = useState(false)
  const waitingForAvatarRef = useRef(false)
  const avatarDoneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onAvatarDoneRef = useRef(onAvatarDone)
  const aigcStartedRef = useRef(false)
  onAvatarDoneRef.current = onAvatarDone

  useEffect(() => {
    const isLive = playerState === 'LIVE_INSTRUCTOR' || playerState === 'LIVE_STUDENT'
    if (!isLive) return

    let aborted = false
    // Small delay collapses React Strict Mode double-invocation into one session
    const startTimer = setTimeout(runSession, 50)

    async function runSession() {
      if (aborted) return
      aigcStartedRef.current = false
      startSession()
    }

    async function startSession() {
      try {
        const res = await fetch('/api/rtc/token')
        if (!res.ok) throw new Error('Failed to fetch RTC token')
        const { token } = await res.json()
        if (aborted) return

        const { default: getRTCInstance } = await import('omnirtc-web')
        const { Aigc, Events } = await import('omnirtc-web/aigc')
        if (aborted) return

        const engine = getRTCInstance(token)
        const client = engine.createClient({ mode: 'rtc', codec: 'h264' })
        clientRef.current = client

        // Register BEFORE join — required by SDK
        client.on('user-joined', (user) => {
          console.log('[user-joined] uid:', (user as {uid:unknown}).uid)
        })
        client.on('user-left', (user, reason) => {
          console.log('[user-left] uid:', (user as {uid:unknown}).uid, 'reason:', reason)
        })
        client.on('user-published', async (user, mediaType) => {
          const uid = (user as {uid:unknown}).uid
          console.log('[user-published] uid:', uid, 'mediaType:', mediaType, 'aigcStarted:', aigcStartedRef.current)
          if (mediaType === 'video' && !aigcStartedRef.current) {
            console.log('[user-published] skipping video — AIGC not yet started')
            return
          }
          const track = await client.subscribe(user, mediaType as 'video' | 'audio')
          if (mediaType === 'video') {
            const el = document.getElementById(avatarVideoElId)
            console.log('[user-published] video el:', el, 'children:', el?.children.length)
            ;(track as import('omnirtc-web').IRemoteVideoTrack).on('first-frame-decoded', () => {
              console.log('[user-published] first-frame-decoded ✓')
            })
            try {
              ;(track as import('omnirtc-web').IRemoteVideoTrack).play(avatarVideoElId)
              console.log('[user-published] track.play() called, isPlaying:', (track as {isPlaying?:boolean}).isPlaying)
              setTimeout(() => {
                const el2 = document.getElementById(avatarVideoElId)
                const videoEl = el2?.querySelector('video') as HTMLVideoElement | null
                console.log('[video-check 500ms] isPlaying:', (track as {isPlaying?:boolean}).isPlaying,
                  '| videoEl:', !!videoEl,
                  '| srcObject:', !!(videoEl?.srcObject),
                  '| paused:', videoEl?.paused,
                  '| readyState:', videoEl?.readyState,
                  '| el2 children:', el2?.children.length)
              }, 500)
            } catch (e) {
              console.error('[user-published] track.play() failed:', e)
            }
          } else {
            (track as import('omnirtc-web').IRemoteAudioTrack).play()
            console.log('[user-published] audio track playing')
          }
        })

        await client.join()
        console.log('[useLiveSession] joined, client.uid:', client.uid)
        if (aborted) { await client.leave(); return }

        const [audio, video] = await engine.createMicrophoneAndCameraTracks(
          {},
          { encoderConfig: '720p' }
        )
        audioRef.current = audio
        videoRef.current = video

        video.play(studentVideoElId, { mirror: true })
        await client.publish([audio, video])
        console.log('[useLiveSession] published, mic muted:', audio.muted, 'enabled:', audio.enabled)
        if (aborted) { await cleanup(client, audio, video, null); return }

        setIsJoined(true)

        if (playerState === 'LIVE_INSTRUCTOR' && activeLiveSeg) {
          // Raw stream-message debug: if this fires, Core engine data channel works
          client.on('stream-message', (uid: unknown, payload: unknown) => {
            console.log('[stream-message raw] uid:', uid, 'bytes:', (payload as Uint8Array)?.length)
          })

          const aigc = new Aigc(token)
          aigc.bind(client as Parameters<typeof aigc.bind>[0])
          aigcRef.current = aigc

          // Log all AIGC messages (ASR transcripts, LLM responses, signaling)
          aigc.on(Events.MESSAGE, (data) => {
            console.log('[AIGC message]', data)
          })

          // Query server-side AIGC config
          const configs = await aigc.query()
          console.log('[useLiveSession] aigc.query() full:', JSON.stringify(configs))
          const avatarChatCfg = configs?.config?.avatarChat ?? configs?.avatarChat
          console.log('[useLiveSession] avatarChatCfg:', JSON.stringify(avatarChatCfg))

          const robotId = Math.random().toString().substring(2, 10)
          // prompt = LLM system instruction (role definition, NOT the question)
          // welcome = the opening question the avatar says aloud
          const systemPrompt =
            activeLiveSeg.systemPrompt ||
            `You are Emily, an AI SAT math tutor. Answer the student's questions about: "${activeLiveSeg.prompt}". Be concise and encouraging. Respond in the student's language.`
          const startPayload = {
            ...(avatarChatCfg ?? {}),
            prompt: systemPrompt,
            welcome: activeLiveSeg.prompt,
            llmConfig: avatarChatCfg?.llmConfig || 60,
          }
          console.log('[useLiveSession] aigc.start payload:', JSON.stringify(startPayload))
          const startResult = await aigc.start('avatarchat', startPayload, robotId)
          const startCode = (startResult as {code?:unknown})?.code
          if (startCode !== 0 && startCode !== undefined) {
            console.error('[useLiveSession] aigc.start FAILED, code:', startCode, 'result:', JSON.stringify(startResult))
          } else {
            console.log('[useLiveSession] aigc.start OK:', JSON.stringify(startResult))
            aigcStartedRef.current = true
          }
          // Log any remote users already in the channel
          console.log('[useLiveSession] remoteUsers after start:', (client as {remoteUsers?: unknown[]}).remoteUsers)
        }
      } catch (err) {
        if (!aborted) {
          console.error('[useLiveSession]', err)
          onError?.('Live session failed to start. Continuing lesson.')
        }
      }
    }

    return () => {
      aborted = true
      clearTimeout(startTimer)
      if (avatarDoneTimerRef.current) {
        clearTimeout(avatarDoneTimerRef.current)
        avatarDoneTimerRef.current = null
      }
      waitingForAvatarRef.current = false
      const { current: client } = clientRef
      const { current: audio } = audioRef
      const { current: video } = videoRef
      const { current: aigc } = aigcRef
      clientRef.current = null
      audioRef.current = null
      videoRef.current = null
      aigcRef.current = null
      setIsJoined(false)
      if (client) cleanup(client, audio, video, aigc)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerState])

  return {
    isJoined,
    muteAudio: (muted: boolean) => audioRef.current?.setMuted(muted),
    muteVideo: (muted: boolean) => videoRef.current?.setMuted(muted),
    sendText: (text: string) => {
      const aigc = aigcRef.current
      if (!aigc) { console.warn('[sendText] no aigc instance'); return }
      waitingForAvatarRef.current = true
      if (avatarDoneTimerRef.current) clearTimeout(avatarDoneTimerRef.current)
      avatarDoneTimerRef.current = setTimeout(() => {
        if (waitingForAvatarRef.current) {
          waitingForAvatarRef.current = false
          avatarDoneTimerRef.current = null
          onAvatarDoneRef.current?.()
        }
      }, 25000)
      import('omnirtc-web/aigc').then(({ TaskTypeEnum }) => {
        aigc.update(TaskTypeEnum.SEND_CONTENT_TO_LLM, { prompt: text })
          .then((r) => console.log('[sendText] result:', JSON.stringify(r)))
          .catch((e) => console.error('[sendText] error:', e))
      })
    },
  }
}

async function cleanup(
  client: import('omnirtc-web').IOmniRTCClient,
  audio: import('omnirtc-web').IMicrophoneAudioTrack | null,
  video: import('omnirtc-web').ICameraVideoTrack | null,
  aigc: import('omnirtc-web/aigc').Aigc | null
) {
  try { await aigc?.stop() } catch {}
  try { await client.unpublish() } catch {}
  try { audio?.close() } catch {}
  try { video?.close() } catch {}
  try { await client.leave() } catch {}
}

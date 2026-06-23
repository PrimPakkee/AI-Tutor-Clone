'use client'
import { useEffect, useRef, useCallback, useState } from 'react'

export function useTtsSession() {
  const aigcRef = useRef<import('omnirtc-web/aigc').Aigc | null>(null)
  const clientRef = useRef<import('omnirtc-web').IOmniRTCClient | null>(null)
  const [isReady, setIsReady] = useState(false)
  const pendingRef = useRef<string | null>(null)

  useEffect(() => {
    let aborted = false

    async function init() {
      const res = await fetch('/api/rtc/token')
      if (!res.ok) throw new Error('Failed to fetch RTC token')
      const { token } = await res.json()
      if (aborted) return

      const { default: getRTCInstance } = await import('omnirtc-web')
      const { Aigc } = await import('omnirtc-web/aigc')
      if (aborted) return

      const engine = getRTCInstance(token)
      const client = engine.createClient({ mode: 'live', codec: 'h264', role: 'host' })
      clientRef.current = client

      client.on('user-published', async (user, mediaType) => {
        if (mediaType === 'audio') {
          const track = await client.subscribe(user, 'audio')
          ;(track as import('omnirtc-web').IRemoteAudioTrack).play()
        }
      })

      await client.join()
      if (aborted) { await client.leave(); return }

      Aigc.BASE_URL = Aigc.BASE_URL_TEST
      const aigc = new Aigc(token)
      aigc.bind(client as Parameters<typeof aigc.bind>[0])
      aigcRef.current = aigc

      const robotId = Math.random().toString().substring(2, 10)
      const serverCfg = await aigc.query()
      console.log('[useTtsSession] aigc.query():', JSON.stringify(serverCfg))
      await aigc.start('voicechat', { voice_type: 'en_female_sarah_new_conversation_wvae_bigtts', prompt: 'Read the text exactly as given, no additions.' }, robotId)
      if (aborted) return

      setIsReady(true)
      if (pendingRef.current) {
        broadcastContent(aigc, pendingRef.current)
        pendingRef.current = null
      }
    }

    init().catch((err) => console.error('[useTtsSession]', err))

    return () => {
      aborted = true
      setIsReady(false)
      const { current: aigc } = aigcRef
      const { current: client } = clientRef
      aigcRef.current = null
      clientRef.current = null
      if (aigc) aigc.stop().catch(() => {})
      if (client) client.leave().catch(() => {})
    }
  }, [])

  const speak = useCallback((text: string) => {
    const aigc = aigcRef.current
    if (!aigc) {
      pendingRef.current = text
      return
    }
    broadcastContent(aigc, text)
  }, [])

  const stop = useCallback(() => {
    pendingRef.current = null
    const aigc = aigcRef.current
    if (!aigc) return
    import('omnirtc-web/aigc').then(({ TaskTypeEnum }) => {
      aigc.update(TaskTypeEnum.BREAK_AI_RESPONSE, null).catch(() => {})
    })
  }, [])

  return { speak, stop, isReady }
}

function broadcastContent(aigc: import('omnirtc-web/aigc').Aigc, text: string) {
  import('omnirtc-web/aigc').then(({ TaskTypeEnum }) => {
    aigc.update(TaskTypeEnum.BROADCAST_CONTENT, { content: text })
      .catch((err) => console.error('[useTtsSession] broadcast error:', err))
  })
}

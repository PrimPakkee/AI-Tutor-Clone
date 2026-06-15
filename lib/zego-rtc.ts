export type ZegoRTCConfig = {
  appId: number
  token: string
  roomId: string
  userId: string
  localVideoEl: HTMLVideoElement
}

export interface ZegoRTC {
  joinRoom(config: ZegoRTCConfig): Promise<void>
  leaveRoom(): Promise<void>
  muteLocalAudio(muted: boolean): void
  muteLocalVideo(muted: boolean): void
}

export class MockZegoRTC implements ZegoRTC {
  async joinRoom(config: ZegoRTCConfig): Promise<void> {
    console.log('[MockZegoRTC] joinRoom', config.roomId, config.userId)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      config.localVideoEl.srcObject = stream
      config.localVideoEl.play().catch(() => {})
    } catch {
      console.warn('[MockZegoRTC] Camera not available')
    }
  }

  async leaveRoom(): Promise<void> {
    console.log('[MockZegoRTC] leaveRoom')
  }

  muteLocalAudio(muted: boolean): void {
    console.log('[MockZegoRTC] muteLocalAudio', muted)
  }

  muteLocalVideo(muted: boolean): void {
    console.log('[MockZegoRTC] muteLocalVideo', muted)
  }
}

// Swap to RealZegoRTC once ZEGO API is provided
export const zegoRTC: ZegoRTC = new MockZegoRTC()

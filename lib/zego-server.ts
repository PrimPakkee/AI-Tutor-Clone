export type ZegoTokenParams = {
  appId: number
  userId: string
  roomId: string
  secret: string
  ttl: number
}

export function generateZegoToken(_params: ZegoTokenParams): string {
  // TODO: replace with actual ZEGO token generation
  // e.g. import { generateToken04 } from 'zego-token'
  // return generateToken04(params.appId, params.userId, params.secret, params.ttl, '')
  return `stub-token-${_params.userId}-${_params.roomId}-${Date.now()}`
}

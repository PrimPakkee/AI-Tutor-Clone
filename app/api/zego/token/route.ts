import { NextRequest, NextResponse } from 'next/server'
import { generateZegoToken } from '@/lib/zego-server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('roomId')
  const userId = searchParams.get('userId')

  if (!roomId || !userId) {
    return NextResponse.json({ error: 'roomId and userId are required' }, { status: 400 })
  }

  const appId = parseInt(process.env.ZEGO_APP_ID ?? '0')
  const secret = process.env.ZEGO_APP_SECRET ?? ''

  if (!appId || !secret) {
    return NextResponse.json({ error: 'ZEGO credentials not configured' }, { status: 500 })
  }

  const token = generateZegoToken({ appId, userId, roomId, secret, ttl: 3600 })
  return NextResponse.json({ token, appId })
}

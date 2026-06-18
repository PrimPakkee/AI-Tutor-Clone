import { NextResponse } from 'next/server'

export async function GET() {
  const token = process.env.OMNIRTC_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'OMNIRTC_TOKEN not configured' }, { status: 503 })
  }
  return NextResponse.json({ token })
}

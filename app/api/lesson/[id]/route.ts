import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'lessons', `${params.id}.json`)
    const raw = await readFile(filePath, 'utf-8')
    const lesson = JSON.parse(raw)
    return NextResponse.json(lesson)
  } catch {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }
}

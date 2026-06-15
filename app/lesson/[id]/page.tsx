import { notFound } from 'next/navigation'
import { LessonPlayer } from '@/components/LessonPlayer'
import type { Lesson } from '@/lib/types'

async function getLesson(id: string): Promise<Lesson | null> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${base}/api/lesson/${id}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lesson = await getLesson(id)
  if (!lesson) notFound()
  return <LessonPlayer lesson={lesson} />
}

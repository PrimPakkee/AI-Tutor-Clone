#!/usr/bin/env node
/**
 * Generates a lesson JSON bundle (slides + avatar scripts) from a topic.
 * Usage: node scripts/generate-lesson.mjs --topic "Quadratic Functions" --output data/lessons/new-lesson.json
 */
import Anthropic from '@anthropic-ai/sdk'
import { writeFileSync } from 'fs'
import { parseArgs } from 'util'

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    topic: { type: 'string' },
    output: { type: 'string' },
  },
})

if (!values.topic || !values.output) {
  console.error('Usage: node scripts/generate-lesson.mjs --topic "..." --output path/to/output.json')
  process.exit(1)
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are an expert SAT Math curriculum designer. You produce lesson JSON bundles.
Each bundle contains:
- 12 slides (each with title, formula (LaTeX or null), bullets, graph spec or null)
- 5 stream segments (each with startTime, duration, avatarVideoUrl placeholder, slide ref, and script)
- 2 instructor-initiated live segments (at ~24 min and ~38 min marks)
The digital human's spoken script and the slide content must be tightly coordinated.
Output ONLY valid JSON matching this schema, no markdown, no explanation.`

const USER_PROMPT = `Generate a complete 45-minute SAT Math lesson on the topic: "${values.topic}".
Use lessonId format: sat-math-${values.topic.toLowerCase().replace(/\s+/g, '-')}-01
Set maxLiveSeconds to 900.
Avatar video URLs should follow pattern: /content/seg-01.mp4, /content/seg-02.mp4 etc.`

async function main() {
  console.log(`Generating lesson: ${values.topic}...`)

  const message = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: USER_PROMPT }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('No JSON found in response')
    process.exit(1)
  }

  const lesson = JSON.parse(jsonMatch[0])
  writeFileSync(values.output, JSON.stringify(lesson, null, 2), 'utf-8')
  console.log(`Lesson saved to ${values.output}`)
  console.log(`Segments: ${lesson.segments.length}, Slides: ${lesson.slides.length}`)
}

main().catch(console.error)

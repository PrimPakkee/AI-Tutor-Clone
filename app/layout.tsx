import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Tutor — SAT Math',
  description: 'AI-powered SAT Math tutoring with digital human instructor',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-slate-900 antialiased">{children}</body>
    </html>
  )
}

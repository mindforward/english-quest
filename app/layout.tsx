import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'English Quest - Learn English',
  description: 'Interactive English vocabulary and grammar game',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

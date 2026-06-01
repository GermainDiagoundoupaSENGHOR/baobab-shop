import type { Metadata } from 'next'
import Navbar from './components/Navbar'
import './globals.css'

export const metadata: Metadata = {
  title: 'B@OB@B Shop',
  description: 'Le marché digital du Sénégal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 0, background: '#F5ECD7', fontFamily: 'sans-serif' }}>
        <Navbar />
        {children}
      </body>
    </html>
  )
}
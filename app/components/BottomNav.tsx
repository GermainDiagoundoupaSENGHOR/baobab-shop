'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()

  const tabs = [
    { href: '/', icon: '🏠', label: 'Accueil' },
    { href: '/electronique', icon: '📦', label: 'Catégories' },
    { href: '/messages', icon: '💬', label: 'Messagerie', badge: 3 },
    { href: '/panier', icon: '🛒', label: 'Panier', badge: 0 },
    { href: '/auth', icon: '👤', label: 'Mon Compte' },
  ]

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      background: 'white',
      borderTop: '1px solid #E8D5B0',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '8px 0 12px',
      zIndex: 9997,
      boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
    }}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link key={tab.href} href={tab.href} style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 3,
            textDecoration: 'none',
            position: 'relative', flex: 1,
          }}>
            {tab.badge && tab.badge > 0 ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <span style={{ fontSize: 24 }}>{tab.icon}</span>
                <span style={{
                  position: 'absolute', top: -4, right: -6,
                  background: '#FF4444', color: 'white',
                  borderRadius: '50%', width: 16, height: 16,
                  fontSize: 10, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700,
                }}>{tab.badge}</span>
              </div>
            ) : (
              <span style={{ fontSize: 24 }}>{tab.icon}</span>
            )}
            <span style={{
              fontSize: 10,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#2D6A4F' : '#7A5C42',
              fontFamily: 'sans-serif',
            }}>
              {tab.label}
            </span>
            {isActive && (
              <div style={{
                position: 'absolute', top: -8,
                width: 32, height: 3,
                background: '#2D6A4F', borderRadius: 2,
              }} />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
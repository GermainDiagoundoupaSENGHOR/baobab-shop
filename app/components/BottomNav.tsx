'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getCartCount } from '@/lib/cart'
import { supabase } from '@/lib/supabase'

export default function BottomNav() {
  const pathname = usePathname()
  const [cartCount, setCartCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    setCartCount(getCartCount())
    const handleUpdate = () => setCartCount(getCartCount())
    window.addEventListener('cartUpdated', handleUpdate)
    return () => window.removeEventListener('cartUpdated', handleUpdate)
  }, [])

  useEffect(() => {
    loadUnreadMessages()

    const channel = supabase
      .channel('unread-messages-bottomnav')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
      }, () => { loadUnreadMessages() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const loadUnreadMessages = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const isAdmin = userData.user.email === 'baobabshop@gmail.com'

    if (isAdmin) {
      const { data } = await supabase
        .from('conversations')
        .select('unread_count')
        .gt('unread_count', 0)
      if (data) {
        const total = data.reduce((sum, c) => sum + (c.unread_count || 0), 0)
        setUnreadMessages(total)
      }
    } else {
      const { data } = await supabase
        .from('messages')
        .select('id')
        .eq('read', false)
        .eq('is_bot', false)
        .neq('sender_id', userData.user.id)
      if (data) setUnreadMessages(data.length)
    }
  }

  const tabs = [
    { href: '/', icon: '🏠', label: 'Accueil' },
    { href: '/electronique', icon: '📦', label: 'Catégories' },
    { href: '/messages', icon: '💬', label: 'Messagerie', badge: unreadMessages },
    { href: '/panier', icon: '🛒', label: 'Panier', badge: cartCount },
    { href: '/profil', icon: '👤', label: 'Mon Compte' },
  ]

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'white', borderTop: '1px solid #E8D5B0',
      display: 'flex', justifyContent: 'space-around',
      alignItems: 'center', padding: '8px 0 12px',
      zIndex: 9997, boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
    }}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link key={tab.href} href={tab.href} style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 3,
            textDecoration: 'none', position: 'relative', flex: 1,
          }}>
            {tab.badge && tab.badge > 0 ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <span style={{ fontSize: 24 }}>{tab.icon}</span>
                <span style={{
                  position: 'absolute', top: -4, right: -6,
                  background: '#FF4444', color: 'white',
                  borderRadius: '50%', width: 16, height: 16,
                  fontSize: 10, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontWeight: 700,
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
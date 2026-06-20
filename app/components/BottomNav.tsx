'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getCartCount } from '@/lib/cart'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const ADMIN_EMAIL = 'baobabshop@gmail.com'

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [cartCount, setCartCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setCartCount(getCartCount())
    const handleUpdate = () => setCartCount(getCartCount())
    window.addEventListener('cartUpdated', handleUpdate)
    return () => window.removeEventListener('cartUpdated', handleUpdate)
  }, [])

  useEffect(() => {
    loadUser()
    loadUnreadMessages()

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null)
      loadUnreadMessages()
    })

    const channel = supabase
      .channel('unread-messages-bottomnav')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'conversations',
      }, () => { loadUnreadMessages() })
      .subscribe()

    return () => {
      authListener.subscription.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [])

  const loadUser = async () => {
    const { data } = await supabase.auth.getUser()
    setUser(data.user || null)
  }

  const loadUnreadMessages = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return
    const admin = userData.user.email === ADMIN_EMAIL
    if (admin) {
      const { data } = await supabase.from('conversations').select('unread_count').gt('unread_count', 0)
      if (data) {
        const total = data.reduce((sum, c) => sum + (c.unread_count || 0), 0)
        setUnreadMessages(total)
      }
    } else {
      const { data } = await supabase.from('messages').select('id')
        .eq('read', false).eq('is_bot', false).neq('sender_id', userData.user.id)
      if (data) setUnreadMessages(data.length)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  const tabs = [
    { href: '/', icon: '🏠', label: 'Accueil' },
    { href: '/electronique', icon: '📦', label: 'Catégories' },
    { href: '/messages', icon: '💬', label: 'Messagerie', badge: unreadMessages },
    { href: '/panier', icon: '🛒', label: 'Panier', badge: cartCount },
  ]

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'white', borderTop: '1px solid #E8D5B0',
      display: 'flex', justifyContent: 'space-around',
      alignItems: 'center', padding: '8px 0 12px',
      zIndex: 9997, boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
    }}>
      {/* 4 TABS FIXES */}
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
              fontSize: 10, fontWeight: isActive ? 700 : 500,
              color: isActive ? '#2D6A4F' : '#7A5C42', fontFamily: 'sans-serif',
            }}>
              {tab.label}
            </span>
            {isActive && (
              <div style={{
                position: 'absolute', top: -8, width: 32, height: 3,
                background: '#2D6A4F', borderRadius: 2,
              }} />
            )}
          </Link>
        )
      })}

      {/* 5ÈME TAB : selon l'état de connexion */}
      {!user ? (
        // NON CONNECTÉ
        <Link href="/auth" style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 3,
          textDecoration: 'none', flex: 1, position: 'relative',
        }}>
          <span style={{ fontSize: 24 }}>👤</span>
          <span style={{
            fontSize: 10, fontWeight: pathname === '/auth' ? 700 : 500,
            color: pathname === '/auth' ? '#2D6A4F' : '#7A5C42', fontFamily: 'sans-serif',
          }}>Connexion</span>
          {pathname === '/auth' && (
            <div style={{
              position: 'absolute', top: -8, width: 32, height: 3,
              background: '#2D6A4F', borderRadius: 2,
            }} />
          )}
        </Link>
      ) : user.email === ADMIN_EMAIL ? (
        // SUPERADMIN → peut se déconnecter
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 2 }}>
          <Link href="/superadmin" style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 2, textDecoration: 'none',
          }}>
            <span style={{ fontSize: 24 }}>👑</span>
            <span style={{ fontSize: 10, color: '#C9860A', fontWeight: 700, fontFamily: 'sans-serif' }}>
              SuperAdmin
            </span>
          </Link>
          <button onClick={handleLogout} style={{
            background: 'none', border: 'none',
            fontSize: 9, color: '#e53e3e',
            cursor: 'pointer', fontFamily: 'sans-serif',
            fontWeight: 600, padding: 0,
          }}>🚪 Déco</button>
        </div>
      ) : (
        // ADMIN NORMAL → pas de déconnexion, juste lien vers admin
        <Link href="/admin" style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 3,
          textDecoration: 'none', flex: 1, position: 'relative',
        }}>
          <span style={{ fontSize: 24 }}>⚙️</span>
          <span style={{
            fontSize: 10, fontWeight: pathname === '/admin' ? 700 : 500,
            color: pathname === '/admin' ? '#2D6A4F' : '#7A5C42', fontFamily: 'sans-serif',
          }}>Admin</span>
          {pathname === '/admin' && (
            <div style={{
              position: 'absolute', top: -8, width: 32, height: 3,
              background: '#2D6A4F', borderRadius: 2,
            }} />
          )}
        </Link>
      )}
    </nav>
  )
}
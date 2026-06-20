'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCartCount } from '@/lib/cart'
import { supabase } from '@/lib/supabase'

const ADMIN_EMAIL = 'baobabshop@gmail.com'

export default function Navbar() {
  const [search, setSearch] = useState('')
  const [showImageModal, setShowImageModal] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

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
      setIsAdmin(session?.user?.email === ADMIN_EMAIL)
      loadUnreadMessages()
    })

    const channel = supabase
      .channel('unread-messages-navbar')
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
    setIsAdmin(data.user?.email === ADMIN_EMAIL)
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
    setIsAdmin(false)
    router.push('/')
  }

  const handleSearch = () => {
    if (search.trim()) router.push(`/recherche?q=${encodeURIComponent(search)}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <>
      <header>
        <div style={{
          background: '#3A1F0A', padding: '12px 24px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <Link href="/" style={{
            fontFamily: 'Georgia, serif', color: '#F5ECD7',
            fontSize: 22, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            🌳 B<span style={{ color: '#52B788' }}>@</span>OB<span style={{ color: '#52B788' }}>@</span>B
          </Link>

          <div style={{
            flex: 1, display: 'flex', background: 'white',
            borderRadius: 24, overflow: 'hidden', maxWidth: 600, margin: '0 auto',
          }}>
            <input type="text" placeholder="Rechercher des produits..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ flex: 1, padding: '10px 16px', border: 'none', outline: 'none', fontSize: 14 }} />
            <button onClick={() => setShowImageModal(true)} style={{
              padding: '10px 12px', cursor: 'pointer', display: 'flex',
              alignItems: 'center', background: 'none', border: 'none',
              borderRight: '1px solid #eee', fontSize: 18,
            }}>📷</button>
            <button onClick={handleSearch} style={{
              background: '#2D6A4F', color: 'white', border: 'none',
              padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 14,
            }}>Chercher</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

            {/* MESSAGES - visible seulement pour les clients */}
            {!isAdmin && (
              <Link href="/messages" style={{ color: '#F5ECD7', textDecoration: 'none', fontSize: 22, position: 'relative' }}>
                💬
                {unreadMessages > 0 && (
                  <span style={{
                    position: 'absolute', top: -8, right: -8, background: '#C9860A',
                    color: 'white', borderRadius: '50%', width: 18, height: 18,
                    fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                  }}>{unreadMessages}</span>
                )}
              </Link>
            )}

            {/* PANIER - visible seulement pour les clients */}
            {!isAdmin && (
              <Link href="/panier" style={{ position: 'relative', color: '#F5ECD7', textDecoration: 'none', fontSize: 24 }}>
                🛒
                {cartCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -8, right: -8, background: '#C9860A',
                    color: 'white', borderRadius: '50%', width: 18, height: 18,
                    fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                  }}>{cartCount}</span>
                )}
              </Link>
            )}

            {/* BOUTON SELON RÔLE */}
            {!user ? (
  <Link href="/auth" style={{
    background: '#2D6A4F', color: 'white', padding: '8px 16px',
    borderRadius: 20, textDecoration: 'none', fontSize: 13, fontWeight: 600,
  }}>Connexion</Link>
) : isAdmin ? (
  <div style={{ display: 'flex', gap: 8 }}>
    <Link href="/admin" style={{
      background: '#C9860A', color: 'white', padding: '8px 16px',
      borderRadius: 20, textDecoration: 'none', fontSize: 13, fontWeight: 600,
    }}>⚙️ Admin</Link>
    <Link href="/superadmin" style={{
      background: '#5C3317', color: 'white', padding: '8px 16px',
      borderRadius: 20, textDecoration: 'none', fontSize: 13, fontWeight: 600,
    }}>👑 SuperAdmin</Link>
    {/* Déconnexion UNIQUEMENT pour le superadmin */}
    {user.email === ADMIN_EMAIL && (
      <button onClick={handleLogout} style={{
        background: '#e53e3e', color: 'white', padding: '8px 16px',
        borderRadius: 20, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
      }}>🚪 Déconnexion</button>
    )}
  </div>
) : (
  <div style={{ display: 'flex', gap: 8 }}>
    <Link href="/profil" style={{
      background: '#2D6A4F', color: 'white', padding: '8px 16px',
      borderRadius: 20, textDecoration: 'none', fontSize: 13, fontWeight: 600,
    }}>👤 Mon compte</Link>
    <button onClick={handleLogout} style={{
      background: '#5C3317', color: 'white', padding: '8px 16px',
      borderRadius: 20, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    }}>🚪 Déconnexion</button>
  </div>
)}
          </div>
        </div>

        {/* BARRE CATÉGORIES */}
        <div style={{
          background: '#5C3317', padding: '10px 24px',
          display: 'flex', gap: 8, overflowX: 'auto',
        }}>
          {[
            { label: 'Tous', href: '/' },
            { label: '📱 Électronique', href: '/electronique' },
            { label: '👗 Vêtements', href: '/vetements' },
            { label: '🎧 Accessoires', href: '/electronique?sub=access' },
            { label: '👔 Hommes', href: '/vetements?sub=men' },
            { label: '👗 Femmes', href: '/vetements?sub=women' },
            { label: '👕 Enfants', href: '/vetements?sub=kids' },
            { label: '🌱 Agriculture', href: '/agriculture' },
          ].map((cat) => (
            <Link key={cat.label} href={cat.href} style={{
              color: 'rgba(245,236,215,0.85)', textDecoration: 'none',
              padding: '6px 14px', borderRadius: 16,
              fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
            }}>
              {cat.label}
            </Link>
          ))}
        </div>
      </header>

      {/* MODAL RECHERCHE IMAGE */}
      {showImageModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setShowImageModal(false)}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 32,
            width: 420, maxWidth: '90vw',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, marginBottom: 4 }}>
                  🔍 Recherche par image
                </h2>
                <p style={{ color: '#7A5C42', fontSize: 13, margin: 0 }}>
                  Photographiez un objet pour trouver des produits similaires
                </p>
              </div>
              <button onClick={() => setShowImageModal(false)} style={{
                background: 'none', border: 'none', fontSize: 20,
                cursor: 'pointer', color: '#7A5C42', padding: 4,
              }}>×</button>
            </div>
            <button onClick={() => { setShowImageModal(false); router.push('/recherche-image') }} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: 20, border: '1.5px dashed #E8D5B0',
              borderRadius: 12, cursor: 'pointer', marginBottom: 12,
              background: 'none', width: '100%',
            }}>
              <span style={{ fontSize: 28 }}>📷</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Prendre une photo</div>
                <div style={{ color: '#7A5C42', fontSize: 12 }}>Utiliser l'appareil photo</div>
              </div>
            </button>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: 20, border: '1.5px dashed #E8D5B0',
              borderRadius: 12, cursor: 'pointer',
            }}>
              <span style={{ fontSize: 28 }}>🖼️</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Choisir depuis la galerie</div>
                <div style={{ color: '#7A5C42', fontSize: 12 }}>JPG, PNG, WebP, GIF</div>
              </div>
              <input type="file" accept="image/*" style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) { setShowImageModal(false); router.push('/recherche-image') }
                }} />
            </label>
          </div>
        </div>
      )}
    </>
  )
}
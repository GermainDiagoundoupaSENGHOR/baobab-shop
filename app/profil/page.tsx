'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Profil() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setLoading(false)
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, fontSize: 32 }}>⏳</div>
  )

  if (!user) return (
    <div style={{ background: '#F5ECD7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>👤</div>
        <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', marginBottom: 8 }}>
          Connectez-vous
        </h2>
        <p style={{ color: '#7A5C42', marginBottom: 24 }}>
          Créez un compte pour accéder à votre profil
        </p>
        <Link href="/auth" style={{
          background: '#2D6A4F', color: 'white',
          padding: '12px 32px', borderRadius: 24,
          textDecoration: 'none', fontWeight: 700,
        }}>
          Se connecter
        </Link>
      </div>
    </div>
  )

  const menuItems = [
    { icon: '🛒', label: 'Mes commandes', sub: 'Suivre vos achats', href: '/orders' },
    { icon: '❤️', label: 'Mes favoris', sub: 'Produits sauvegardés', href: '/' },
    { icon: '📍', label: 'Mes adresses', sub: 'Gérer vos adresses', href: '/' },
    { icon: '💬', label: 'Messagerie', sub: 'Vos conversations', href: '/messages' },
    { icon: '🔔', label: 'Notifications', sub: 'Gérer les alertes', href: '/' },
    { icon: '🔒', label: 'Sécurité', sub: 'Mot de passe et connexion', href: '/' },
  ]

  return (
    <div style={{ background: '#F5ECD7', minHeight: '100vh', paddingBottom: 80 }}>

      {/* HEADER PROFIL */}
      <div style={{
        background: 'linear-gradient(135deg, #3A1F0A, #5C3317)',
        padding: '32px 24px 60px',
      }}>
        <h1 style={{
          fontFamily: 'Georgia, serif',
          color: '#F5ECD7', fontSize: 20,
          margin: '0 0 24px', textAlign: 'center',
        }}>
          Mon Profil
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#2D6A4F', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 32, color: 'white', fontWeight: 700,
            border: '3px solid rgba(245,236,215,0.3)',
            flexShrink: 0,
          }}>
            {user.user_metadata?.full_name?.[0] || user.email?.[0].toUpperCase()}
          </div>
          <div>
            <div style={{ color: '#F5ECD7', fontWeight: 700, fontSize: 18 }}>
              {user.user_metadata?.full_name || 'Utilisateur'}
            </div>
            <div style={{ color: 'rgba(245,236,215,0.7)', fontSize: 13, marginTop: 2 }}>
              🇸🇳 Sénégal
            </div>
            <div style={{
              display: 'inline-block',
              background: '#2D6A4F',
              color: 'white', fontSize: 11,
              fontWeight: 600, padding: '3px 10px',
              borderRadius: 12, marginTop: 6,
            }}>
              ✅ Compte vérifié
            </div>
          </div>
        </div>
      </div>

      {/* CARTE INFOS */}
      <div style={{
        margin: '-28px 16px 16px',
        background: 'white', borderRadius: 14,
        border: '1px solid #E8D5B0',
        overflow: 'hidden',
      }}>
        {[
          { label: 'Nom complet', value: user.user_metadata?.full_name || 'Non renseigné', icon: '👤' },
          { label: 'E-mail', value: user.email || 'Non renseigné', icon: '📧' },
          { label: 'Téléphone', value: user.user_metadata?.phone || 'Incomplet', icon: '📱' },
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center',
            padding: '14px 20px',
            borderBottom: i < 2 ? '1px solid #F5ECD7' : 'none',
            cursor: 'pointer',
          }}>
            <span style={{ fontSize: 18, marginRight: 12 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#7A5C42', marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E' }}>{item.value}</div>
            </div>
            <span style={{ color: '#7A5C42', fontSize: 16 }}>›</span>
          </div>
        ))}
      </div>

      {/* MENU */}
      <div style={{
        margin: '0 16px 16px',
        background: 'white', borderRadius: 14,
        border: '1px solid #E8D5B0',
        overflow: 'hidden',
      }}>
        {menuItems.map((item, i) => (
          <Link key={i} href={item.href} style={{
            display: 'flex', alignItems: 'center',
            padding: '14px 20px', textDecoration: 'none',
            borderBottom: i < menuItems.length - 1 ? '1px solid #F5ECD7' : 'none',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#F5ECD7', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 18, marginRight: 12, flexShrink: 0,
            }}>
              {item.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E' }}>{item.label}</div>
              <div style={{ fontSize: 12, color: '#7A5C42', marginTop: 1 }}>{item.sub}</div>
            </div>
            <span style={{ color: '#7A5C42', fontSize: 16 }}>›</span>
          </Link>
        ))}
      </div>

      {/* COMPTES CONNECTÉS */}
      <div style={{
        margin: '0 16px 16px',
        background: 'white', borderRadius: 14,
        border: '1px solid #E8D5B0',
        overflow: 'hidden',
        padding: '16px 20px',
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#3A1F0A', marginBottom: 4 }}>
          Comptes connectés
        </h3>
        <p style={{ fontSize: 12, color: '#7A5C42', marginBottom: 16 }}>
          Connectez-vous plus rapidement avec ces comptes
        </p>
        {[
          { icon: '🍎', label: 'Apple', status: 'Connexion' },
          { icon: 'G', label: 'Google', status: 'Connecté', connected: true },
          { icon: 'f', label: 'Facebook', status: 'Connexion' },
        ].map((acc, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center',
            padding: '10px 0',
            borderBottom: i < 2 ? '1px solid #F5ECD7' : 'none',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: acc.label === 'Google' ? '#FFF3E0' : acc.label === 'Facebook' ? '#E8F0FE' : '#F5F5F5',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 16,
              marginRight: 12, fontWeight: 700,
              color: acc.label === 'Google' ? '#EA4335' : acc.label === 'Facebook' ? '#1877F2' : '#000',
            }}>
              {acc.icon}
            </div>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#2C1A0E' }}>{acc.label}</span>
            <span style={{
              fontSize: 13, fontWeight: 600,
              color: acc.connected ? '#2D6A4F' : '#7A5C42',
            }}>
              {acc.status} {acc.connected ? '' : '›'}
            </span>
          </div>
        ))}
      </div>

      {/* DECONNEXION */}
      <div style={{ padding: '0 16px' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', background: 'white',
            color: '#e53e3e', border: '1.5px solid #FFE4E4',
            padding: '14px', borderRadius: 12,
            cursor: 'pointer', fontWeight: 700,
            fontSize: 15, fontFamily: 'sans-serif',
          }}
        >
          🚪 Se déconnecter
        </button>
      </div>
    </div>
  )
}
'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Profil() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordEmailSent, setPasswordEmailSent] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { setLoading(false); return }
      setUser(data.user)

      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', data.user.id).single()

      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url)
      } else {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: data.user.user_metadata?.full_name || '',
          phone: data.user.user_metadata?.phone || '',
        })
      }
      setLoading(false)
    }
    getUser()
  }, [])

  // QR code avec logo baobab au centre
  useEffect(() => {
  if (!showQR || !user || !qrCanvasRef.current) return
  const canvas = qrCanvasRef.current
  const ctx = canvas.getContext('2d')!
  const size = 200
  canvas.width = size
  canvas.height = size

  const qrImg = new Image()
  qrImg.crossOrigin = 'anonymous'
  qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${user.id}&margin=10&ecc=H`
  qrImg.onload = () => {
    ctx.drawImage(qrImg, 0, 0, size, size)

    const cx = size / 2
    const cy = size / 2
    const r = 32
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = 'white'
    ctx.fill()

    const logo = new Image()
    logo.src = '/image.png'  // ← ici
    logo.onload = () => {
      const logoSize = 48
      ctx.drawImage(logo, cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize)
    }
  }
}, [showQR, user])

  const downloadQR = () => {
    if (!qrCanvasRef.current) return
    const link = document.createElement('a')
    link.download = 'mon-qrcode-baobab.png'
    link.href = qrCanvasRef.current.toDataURL()
    link.click()
  }

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 2 * 1024 * 1024) return showMsg('❌ Image trop grande (max 2MB)', 'error')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
      return showMsg('❌ Format non supporté (JPG, PNG, WEBP)', 'error')

    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`

    // Supprimer l'ancienne photo d'abord
    await supabase.storage.from('avatars').remove([path])

    const { error: uploadError } = await supabase.storage
      .from('avatars').upload(path, file, { upsert: true })

    if (uploadError) {
      setUploading(false)
      return showMsg('❌ Erreur upload: ' + uploadError.message, 'error')
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const publicUrl = data.publicUrl + '?t=' + Date.now()

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    if (updateError) {
      setUploading(false)
      return showMsg('❌ Erreur profil: ' + updateError.message, 'error')
    }

    setAvatarUrl(publicUrl)
    setUploading(false)
    showMsg('✅ Photo mise à jour !', 'success')
  }

  const sendPasswordEmail = async () => {
    if (!user?.email) return
    setSendingEmail(true)
    const { error } = await supabase.auth.resetPasswordForEmail(maskedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setSendingEmail(false)
    if (error) {
      showMsg('❌ Erreur: ' + error.message, 'error')
      return
    }
    setPasswordEmailSent(true)
  }

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
        <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', marginBottom: 8 }}>Connectez-vous</h2>
        <p style={{ color: '#7A5C42', marginBottom: 24 }}>Créez un compte pour accéder à votre profil</p>
        <Link href="/auth" style={{
          background: '#2D6A4F', color: 'white',
          padding: '12px 32px', borderRadius: 24,
          textDecoration: 'none', fontWeight: 700,
        }}>Se connecter</Link>
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

  const displayName = user.user_metadata?.full_name || 'Utilisateur'
  const shortName = displayName.length > 14 ? displayName.slice(0, 14) + '...' : displayName
  const maskedEmail = user.email?.replace(/(.{3}).*(@)/, '$1****$2') || ''

  return (
    <div style={{ background: '#F5ECD7', minHeight: '100vh', paddingBottom: 80, fontFamily: 'sans-serif' }}>

      {/* MESSAGE FEEDBACK */}
      {message && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
          border: `1px solid ${message.type === 'success' ? '#6ee7b7' : '#fca5a5'}`,
          color: message.type === 'success' ? '#065f46' : '#991b1b',
          borderRadius: 10, padding: '10px 20px', fontSize: 13,
          fontWeight: 600, zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', whiteSpace: 'nowrap',
        }}>
          {message.text}
        </div>
      )}

      {/* MODAL MOT DE PASSE */}
      {showPasswordModal && (
        <div onClick={() => { setShowPasswordModal(false); setPasswordEmailSent(false) }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: 'white', borderRadius: 20,
            padding: 28, textAlign: 'center',
            width: 300, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            {!passwordEmailSent ? (
              <>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
                <h3 style={{ margin: '0 0 8px', fontSize: 17, color: '#3A1F0A', fontFamily: 'Georgia, serif' }}>
                  Modifier le mot de passe
                </h3>
                <p style={{ fontSize: 13, color: '#7A5C42', margin: '0 0 8px', lineHeight: 1.5 }}>
                  Un lien de réinitialisation sera envoyé à :
                </p>
                <p style={{
                  fontSize: 14, fontWeight: 700, color: '#2D6A4F',
                  margin: '0 0 20px', background: '#F5ECD7',
                  padding: '8px 16px', borderRadius: 8,
                }}>
                  {maskedEmail}
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={sendPasswordEmail} disabled={sendingEmail} style={{
                    flex: 1, padding: '12px',
                    background: '#2D6A4F', color: 'white',
                    border: 'none', borderRadius: 12,
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  }}>
                    {sendingEmail ? '⏳ Envoi...' : '📧 Envoyer'}
                  </button>
                  <button onClick={() => setShowPasswordModal(false)} style={{
                    flex: 1, padding: '12px',
                    background: '#F5ECD7', color: '#3A1F0A',
                    border: '1px solid #E8D5B0', borderRadius: 12,
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  }}>Annuler</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 56, marginBottom: 12 }}>📬</div>
                <h3 style={{ margin: '0 0 8px', fontSize: 17, color: '#3A1F0A', fontFamily: 'Georgia, serif' }}>
                  Email envoyé !
                </h3>
                <p style={{ fontSize: 13, color: '#7A5C42', margin: '0 0 20px', lineHeight: 1.6 }}>
                  Vérifiez votre boîte mail <b>{maskedEmail}</b> et cliquez sur le lien pour réinitialiser votre mot de passe.
                </p>
                <button onClick={() => { setShowPasswordModal(false); setPasswordEmailSent(false) }} style={{
                  width: '100%', padding: '12px',
                  background: '#2D6A4F', color: 'white',
                  border: 'none', borderRadius: 12,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}>✅ Compris</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL QR CODE */}
      {showQR && (
        <div onClick={() => setShowQR(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: 'white', borderRadius: 20,
            padding: 28, textAlign: 'center',
            width: 280, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, color: '#3A1F0A', fontFamily: 'Georgia, serif' }}>
              Mon QR Code
            </h3>
            <p style={{ fontSize: 12, color: '#7A5C42', margin: '0 0 16px' }}>
              Identifiant unique de votre compte
            </p>
            <div style={{
              display: 'inline-block', border: '2px solid #E8D5B0',
              borderRadius: 12, padding: 8, marginBottom: 12,
            }}>
              <canvas ref={qrCanvasRef} style={{ display: 'block', width: 200, height: 200 }} />
            </div>
            <p style={{
              fontSize: 9, color: '#9A7B5A', margin: '0 0 16px',
              wordBreak: 'break-all', fontFamily: 'monospace', padding: '0 8px',
            }}>{user.id}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={downloadQR} style={{
                flex: 1, padding: '10px', background: '#2D6A4F',
                color: 'white', border: 'none', borderRadius: 12,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>⬇️ Télécharger</button>
              <button onClick={() => setShowQR(false)} style={{
                flex: 1, padding: '10px', background: '#F5ECD7',
                color: '#3A1F0A', border: '1px solid #E8D5B0',
                borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{ background: 'white', padding: '16px 20px 20px', borderBottom: '1px solid #F0E6D0' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <button onClick={() => router.back()} style={{
            background: 'none', border: 'none', fontSize: 22,
            cursor: 'pointer', color: '#3A1F0A', padding: 0, marginRight: 12,
          }}>‹</button>
          <h1 style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
            Profil
          </h1>
          <div style={{ width: 34 }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* AVATAR */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: '#F5ECD7', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: avatarUrl ? 0 : 32, color: '#3A1F0A',
              fontWeight: 700, border: '2px solid #E8D5B0', overflow: 'hidden',
            }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : displayName[0]?.toUpperCase()}
            </div>
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 26, height: 26, borderRadius: '50%',
              background: uploading ? '#9CA3AF' : '#7A5C42',
              color: 'white', border: '2px solid white',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {uploading ? '⏳' : '✏️'}
            </button>
            <input ref={fileInputRef} type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={uploadAvatar} style={{ display: 'none' }} />
          </div>

          {/* NOM + BADGE */}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a1a', marginBottom: 4 }}>
              {shortName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 13 }}>🇸🇳</span>
              <span style={{ fontSize: 13, color: '#7A5C42', fontWeight: 600 }}>SN</span>
              <span style={{ fontSize: 13, color: '#aaa' }}>ⓘ</span>
            </div>
            <button style={{
              background: '#F5F5F5', border: '1px solid #ddd',
              borderRadius: 20, padding: '4px 12px',
              fontSize: 12, color: '#555', cursor: 'pointer', fontWeight: 600,
            }}>+ Type d'acheteur</button>
          </div>

          {/* ICÔNE QR */}
          <button onClick={() => setShowQR(true)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0,
          }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect x="2" y="2" width="14" height="14" rx="2" stroke="#1a1a1a" strokeWidth="2" fill="none"/>
              <rect x="5" y="5" width="8" height="8" rx="1" fill="#1a1a1a"/>
              <rect x="20" y="2" width="14" height="14" rx="2" stroke="#1a1a1a" strokeWidth="2" fill="none"/>
              <rect x="23" y="5" width="8" height="8" rx="1" fill="#1a1a1a"/>
              <rect x="2" y="20" width="14" height="14" rx="2" stroke="#1a1a1a" strokeWidth="2" fill="none"/>
              <rect x="5" y="23" width="8" height="8" rx="1" fill="#1a1a1a"/>
              <rect x="20" y="20" width="4" height="4" fill="#1a1a1a"/>
              <rect x="26" y="20" width="4" height="4" fill="#1a1a1a"/>
              <rect x="32" y="20" width="4" height="4" fill="#1a1a1a"/>
              <rect x="20" y="26" width="4" height="4" fill="#1a1a1a"/>
              <rect x="26" y="26" width="4" height="4" fill="#1a1a1a"/>
              <rect x="32" y="32" width="4" height="4" fill="#1a1a1a"/>
              <rect x="20" y="32" width="4" height="4" fill="#1a1a1a"/>
            </svg>
          </button>
        </div>
      </div>

      {/* INFOS */}
      <div style={{
        margin: '16px 16px 0', background: 'white',
        borderRadius: 14, border: '1px solid #E8D5B0', overflow: 'hidden',
      }}>
        {[
          { label: 'Nom complet', value: user.user_metadata?.full_name || 'Non renseigné' },
          { label: 'E-mail', value: maskedEmail },
          { label: 'Numéro de téléphone', value: user.user_metadata?.phone || 'Incomplet' },
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', padding: '16px 20px',
            borderBottom: '1px solid #F5ECD7', cursor: 'pointer',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{item.label}</div>
            </div>
            <span style={{ fontSize: 14, color: '#9A7B5A', marginRight: 8 }}>{item.value}</span>
            <span style={{ color: '#bbb', fontSize: 18 }}>›</span>
          </div>
        ))}

        {/* MODIFIER MOT DE PASSE */}
        <div onClick={() => setShowPasswordModal(true)} style={{
          display: 'flex', alignItems: 'center', padding: '16px 20px', cursor: 'pointer',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Modifier le mot de passe</div>
          </div>
          <span style={{ color: '#bbb', fontSize: 18 }}>›</span>
        </div>
      </div>

      {/* MENU */}
      <div style={{
        margin: '16px 16px 0', background: 'white',
        borderRadius: 14, border: '1px solid #E8D5B0', overflow: 'hidden',
      }}>
        {menuItems.map((item, i) => (
          <Link key={i} href={item.href} style={{
            display: 'flex', alignItems: 'center', padding: '14px 20px',
            textDecoration: 'none',
            borderBottom: i < menuItems.length - 1 ? '1px solid #F5ECD7' : 'none',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#F5ECD7', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 18, marginRight: 12, flexShrink: 0,
            }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E' }}>{item.label}</div>
              <div style={{ fontSize: 12, color: '#7A5C42', marginTop: 1 }}>{item.sub}</div>
            </div>
            <span style={{ color: '#bbb', fontSize: 18 }}>›</span>
          </Link>
        ))}
      </div>

      {/* DÉCONNEXION */}
      <div style={{ padding: '16px 16px 0' }}>
        <button onClick={handleLogout} style={{
          width: '100%', background: 'white',
          color: '#e53e3e', border: '1.5px solid #FFE4E4',
          padding: '14px', borderRadius: 12,
          cursor: 'pointer', fontWeight: 700,
          fontSize: 15, fontFamily: 'sans-serif',
        }}>🚪 Se déconnecter</button>
      </div>

    </div>
  )
}
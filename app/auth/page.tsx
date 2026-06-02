'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Auth() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) return alert('Email et mot de passe obligatoires !')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) return alert('Erreur: ' + error.message)
    alert('✅ Connexion réussie !')
    router.push('/')
  }

  const handleRegister = async () => {
    if (!email || !password || !name) return alert('Tous les champs sont obligatoires !')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, phone } }
    })
    setLoading(false)
    if (error) return alert('Erreur: ' + error.message)
    alert('✅ Compte créé ! Vérifiez votre email.')
  }

  return (
    <div style={{
      background: '#F5ECD7',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 32,
        width: '100%',
        maxWidth: 400,
        border: '1px solid #E8D5B0',
      }}>
        {/* LOGO */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48 }}>🌳</div>
          <h1 style={{
            fontFamily: 'Georgia, serif',
            color: '#3A1F0A',
            fontSize: 22,
            margin: '8px 0 4px',
          }}>
            B<span style={{ color: '#52B788' }}>@</span>OB
            <span style={{ color: '#52B788' }}>@</span>B Shop
          </h1>
          <p style={{ color: '#7A5C42', fontSize: 13, margin: 0 }}>
            {tab === 'login' ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
          </p>
        </div>

        {/* TABS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          border: '1.5px solid #E8D5B0',
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 24,
        }}>
          {(['login', 'register'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: 10,
                border: 'none',
                background: tab === t ? '#3A1F0A' : '#F5ECD7',
                color: tab === t ? '#F5ECD7' : '#7A5C42',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'sans-serif',
              }}
            >
              {t === 'login' ? 'Connexion' : 'Inscription'}
            </button>
          ))}
        </div>

        {/* FORMULAIRE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tab === 'register' && (
            <>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Prénom & Nom
                </label>
                <input
                  type="text"
                  placeholder="Fatou Diallo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1.5px solid #E8D5B0',
                    borderRadius: 8,
                    fontSize: 14,
                    fontFamily: 'sans-serif',
                    background: '#F5ECD7',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Téléphone
                </label>
                <input
                  type="tel"
                  placeholder="7X XXX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1.5px solid #E8D5B0',
                    borderRadius: 8,
                    fontSize: 14,
                    fontFamily: 'sans-serif',
                    background: '#F5ECD7',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Email
            </label>
            <input
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1.5px solid #E8D5B0',
                borderRadius: 8,
                fontSize: 14,
                fontFamily: 'sans-serif',
                background: '#F5ECD7',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Mot de passe
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1.5px solid #E8D5B0',
                borderRadius: 8,
                fontSize: 14,
                fontFamily: 'sans-serif',
                background: '#F5ECD7',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            onClick={tab === 'login' ? handleLogin : handleRegister}
            disabled={loading}
            style={{
              width: '100%',
              background: '#2D6A4F',
              color: 'white',
              border: 'none',
              padding: '13px',
              borderRadius: 24,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 15,
              fontFamily: 'sans-serif',
              marginTop: 4,
            }}
          >
            {loading ? '⏳ Chargement...' : tab === 'login' ? '🔐 Se connecter' : '✅ Créer mon compte'}
          </button>
        </div>
      </div>
    </div>
  )
}
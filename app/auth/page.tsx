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
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | 'warning' } | null>(null)
  const router = useRouter()

  const showMsg = (text: string, type: 'error' | 'success' | 'warning') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleLogin = async () => {
    if (!email || !password) return showMsg('Email et mot de passe obligatoires !', 'error')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      if (error.message === 'Email not confirmed')
        showMsg('⚠️ Veuillez confirmer votre email avant de vous connecter.', 'warning')
      else if (error.message === 'Invalid login credentials')
        showMsg('❌ Email ou mot de passe incorrect.', 'error')
      else
        showMsg('Erreur: ' + error.message, 'error')
      return
    }
    showMsg('✅ Connexion réussie !', 'success')
    setTimeout(() => router.push('/'), 1000)
  }

  const handleRegister = async () => {
    if (!email || !password || !name) return showMsg('Tous les champs sont obligatoires !', 'error')
    if (password.length < 6) return showMsg('Le mot de passe doit contenir au moins 6 caractères.', 'error')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, phone } }
    })
    setLoading(false)
    if (error) {
      if (error.message === 'User already registered') {
        setTab('login')
        showMsg('⚠️ Ce compte existe déjà. Connectez-vous !', 'warning')
      } else {
        showMsg('Erreur: ' + error.message, 'error')
      }
      return
    }
    showMsg('✅ Compte créé ! Vérifiez votre email pour confirmer.', 'success')
  }

  const msgColors: Record<string, string> = {
    error: '#fee2e2', success: '#d1fae5', warning: '#fef9c3',
  }
  const msgBorder: Record<string, string> = {
    error: '#fca5a5', success: '#6ee7b7', warning: '#fde68a',
  }
  const msgText: Record<string, string> = {
    error: '#991b1b', success: '#065f46', warning: '#92400e',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #E8D5B0',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'sans-serif',
    background: '#F5ECD7',
    boxSizing: 'border-box',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: '#7A5C42',
    display: 'block',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
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
        boxShadow: '0 8px 32px rgba(58,31,10,0.1)',
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
              onClick={() => { setTab(t); setMessage(null) }}
              style={{
                padding: 10,
                border: 'none',
                background: tab === t ? '#3A1F0A' : '#F5ECD7',
                color: tab === t ? '#F5ECD7' : '#7A5C42',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'sans-serif',
                transition: 'all 0.2s',
              }}
            >
              {t === 'login' ? 'Connexion' : 'Inscription'}
            </button>
          ))}
        </div>

        {/* MESSAGE FEEDBACK */}
        {message && (
          <div style={{
            background: msgColors[message.type],
            border: `1px solid ${msgBorder[message.type]}`,
            color: msgText[message.type],
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            fontFamily: 'sans-serif',
            marginBottom: 16,
            fontWeight: 500,
          }}>
            {message.text}
          </div>
        )}

        {/* FORMULAIRE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tab === 'register' && (
            <>
              <div>
                <label style={labelStyle}>Prénom & Nom</label>
                <input
                  type="text"
                  placeholder="Fatou Diallo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Téléphone</label>
                <input
                  type="tel"
                  placeholder="7X XXX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </>
          )}

          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...inputStyle, padding: '10px 44px 10px 14px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {tab === 'register' && (
              <p style={{ fontSize: 11, color: '#9A7B5A', margin: '4px 0 0', fontFamily: 'sans-serif' }}>
                Minimum 6 caractères
              </p>
            )}
          </div>

          <button
            onClick={tab === 'login' ? handleLogin : handleRegister}
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#9CA3AF' : '#2D6A4F',
              color: 'white',
              border: 'none',
              padding: '13px',
              borderRadius: 24,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: 15,
              fontFamily: 'sans-serif',
              marginTop: 4,
              transition: 'background 0.2s',
            }}
          >
            {loading ? '⏳ Chargement...' : tab === 'login' ? '🔐 Se connecter' : '✅ Créer mon compte'}
          </button>

          {/* MOT DE PASSE OUBLIÉ */}
          {tab === 'login' && (
            <p style={{ textAlign: 'center', fontSize: 12, color: '#7A5C42', fontFamily: 'sans-serif', margin: 0 }}>
              Mot de passe oublié ?{' '}
              <span
                onClick={async () => {
                  if (!email) return showMsg('Entrez votre email d\'abord.', 'error')
                  const { error } = await supabase.auth.resetPasswordForEmail(email)
                  if (error) return showMsg('Erreur: ' + error.message, 'error')
                  showMsg('📧 Email de réinitialisation envoyé !', 'success')
                }}
                style={{ color: '#2D6A4F', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Réinitialiser
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
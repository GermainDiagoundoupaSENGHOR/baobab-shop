'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Paiement() {
  const [method, setMethod] = useState<'wave' | 'orange' | 'card'>('wave')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const total = 312500

  const handlePay = async () => {
    if (method !== 'card' && (!phone || phone.length < 9)) return alert('Entrez un numéro valide !')
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
    }, 2000)
  }

  const payMethods = [
{
  key: 'wave',
  icon: (
    <img
      src="/wave.png"
      alt="Wave"
      style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover', display: 'block', margin: '0 auto 8px' }}
    />
  ),
  name: 'Wave',
  sub: 'Paiement Wave',
},
    {
      key: 'orange',
      icon: (
        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#FF6600', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
          <span style={{ color: 'white', fontWeight: 900, fontSize: 11, fontFamily: 'Arial' }}>orange</span>
        </div>
      ),
      name: 'Orange Money',
      sub: 'Paiement OM',
    },
    {
      key: 'card',
      icon: (
        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
          <span style={{ fontSize: 24 }}>💳</span>
        </div>
      ),
      name: 'Carte',
      sub: 'Visa / Mastercard',
    },
  ]

  if (success) {
    return (
      <div style={{
        background: '#F5ECD7',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 80, marginBottom: 16 }}>✅</div>
          <h1 style={{ fontFamily: 'Georgia, serif', color: '#2D6A4F', fontSize: 28, marginBottom: 8 }}>
            Paiement réussi !
          </h1>
          <p style={{ color: '#7A5C42', marginBottom: 8 }}>Merci pour votre commande.</p>
          <p style={{ color: '#7A5C42', fontSize: 13, marginBottom: 32 }}>
            Vous recevrez une confirmation par SMS au {phone}
          </p>
          <button onClick={() => router.push('/')} style={{
            background: '#2D6A4F', color: 'white', border: 'none',
            padding: '14px 32px', borderRadius: 24, cursor: 'pointer',
            fontWeight: 700, fontSize: 16, fontFamily: 'sans-serif',
          }}>
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#F5ECD7', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <button onClick={() => router.back()} style={{
          background: 'none', border: 'none', color: '#5C3317',
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
          marginBottom: 20, padding: 0, fontFamily: 'sans-serif',
        }}>
          ← Retour au panier
        </button>

        <h1 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 28, marginBottom: 24 }}>
          💳 Paiement
        </h1>

        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#3A1F0A', marginBottom: 12 }}>
          Choisir le mode de paiement
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
          {payMethods.map((m) => (
            <div
              key={m.key}
              onClick={() => setMethod(m.key as 'wave' | 'orange' | 'card')}
              style={{
                border: `2px solid ${method === m.key ? '#2D6A4F' : '#E8D5B0'}`,
                borderRadius: 12,
                padding: 12,
                textAlign: 'center',
                cursor: 'pointer',
                background: method === m.key ? '#D8F3DC' : 'white',
                transition: 'all 0.2s',
              }}
            >
              {m.icon}
              <div style={{ fontWeight: 700, fontSize: 13, color: '#2C1A0E' }}>{m.name}</div>
              <div style={{ fontSize: 10, color: '#7A5C42', marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {method !== 'card' ? (
          <div style={{ marginBottom: 20 }}>
            <label style={{
              fontSize: 12, fontWeight: 600, color: '#7A5C42',
              display: 'block', marginBottom: 6,
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Numéro {method === 'wave' ? 'Wave' : 'Orange Money'}
            </label>
            <input
              type="tel"
              placeholder="7X XXX XX XX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px',
                border: '1.5px solid #E8D5B0', borderRadius: 8,
                fontSize: 16, fontFamily: 'sans-serif',
                background: 'white', boxSizing: 'border-box',
              }}
            />
          </div>
        ) : (
          <div style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                Numéro de carte
              </label>
              <input type="text" placeholder="1234 5678 9012 3456" style={{
                width: '100%', padding: '12px 16px',
                border: '1.5px solid #E8D5B0', borderRadius: 8,
                fontSize: 16, fontFamily: 'sans-serif',
                background: 'white', boxSizing: 'border-box',
              }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                  Expiration
                </label>
                <input type="text" placeholder="MM/AA" style={{
                  width: '100%', padding: '12px 16px',
                  border: '1.5px solid #E8D5B0', borderRadius: 8,
                  fontSize: 16, fontFamily: 'sans-serif',
                  background: 'white', boxSizing: 'border-box',
                }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                  CVV
                </label>
                <input type="text" placeholder="123" style={{
                  width: '100%', padding: '12px 16px',
                  border: '1.5px solid #E8D5B0', borderRadius: 8,
                  fontSize: 16, fontFamily: 'sans-serif',
                  background: 'white', boxSizing: 'border-box',
                }} />
              </div>
            </div>
          </div>
        )}

        <div style={{
          background: 'white', borderRadius: 10,
          padding: 16, marginBottom: 20,
          border: '1px solid #E8D5B0',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#7A5C42', marginBottom: 6 }}>
            <span>Sous-total</span><span>310 000 FCFA</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#7A5C42', marginBottom: 10 }}>
            <span>Livraison</span><span>2 500 FCFA</span>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 18, fontWeight: 700, color: '#3A1F0A',
            borderTop: '1px solid #E8D5B0', paddingTop: 10,
          }}>
            <span>Total</span>
            <span>{total.toLocaleString('fr-FR')} FCFA</span>
          </div>
        </div>

        <button
          onClick={handlePay}
          disabled={loading}
          style={{
            width: '100%',
            background: method === 'wave' ? '#1B8EF8' : method === 'orange' ? '#FF6600' : '#1a1a2e',
            color: 'white', border: 'none',
            padding: '14px', borderRadius: 24,
            cursor: 'pointer', fontWeight: 700,
            fontSize: 16, fontFamily: 'sans-serif',
          }}
        >
          {loading
            ? '⏳ Traitement...'
            : method === 'wave'
            ? `🌊 Payer avec Wave — ${total.toLocaleString('fr-FR')} FCFA`
            : method === 'orange'
            ? `🟠 Payer avec Orange Money — ${total.toLocaleString('fr-FR')} FCFA`
            : `💳 Payer par carte — ${total.toLocaleString('fr-FR')} FCFA`
          }
        </button>
      </div>
    </div>
  )
}
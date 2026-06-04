'use client'
import { useState } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 Salamaleekum ! Je suis l\'assistant de B@OB@B Shop.\n\nJe parle Wolof, Français et Anglais !\n\n🇸🇳 Wolof: Maa ngi dem jënd ak yëpp ci B@OB@B Shop\n🇫🇷 Français: Comment puis-je vous aider ?\n🇬🇧 English: How can I help you today?'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState('fr')

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMsg = { role: 'user' as const, content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          lang,
        }),
      })
      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Désolé, une erreur est survenue. Réessayez !'
      }])
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const suggestions = {
    fr: ['Quels sont vos produits ?', 'Comment passer une commande ?', 'Modes de paiement ?', 'Délai de livraison ?'],
    wo: ['Lu nekk ci katalog bi ?', 'Na nga commande ?', 'Ana yëgël ji ?', 'Banna nga jël ?'],
    en: ['What products do you have ?', 'How to order ?', 'Payment methods ?', 'Delivery time ?'],
  }

  return (
    <div style={{ background: '#F5ECD7', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #3A1F0A, #5C3317)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: '#2D6A4F', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
          }}>🤖</div>
          <div>
            <h1 style={{ color: '#F5ECD7', fontSize: 18, fontWeight: 700, margin: 0 }}>
              Assistant B@OB@B
            </h1>
            <p style={{ color: '#52B788', fontSize: 12, margin: 0 }}>● En ligne — Wolof • Français • English</p>
          </div>
        </div>

        {/* LANGUE */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'wo', label: '🇸🇳 Wolof' },
            { key: 'fr', label: '🇫🇷 Français' },
            { key: 'en', label: '🇬🇧 English' },
          ].map((l) => (
            <button
              key={l.key}
              onClick={() => setLang(l.key)}
              style={{
                padding: '5px 10px',
                borderRadius: 16,
                border: 'none',
                background: lang === l.key ? '#2D6A4F' : 'rgba(255,255,255,0.1)',
                color: '#F5ECD7',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* MESSAGES */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        maxWidth: 800,
        width: '100%',
        margin: '0 auto',
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            gap: 10,
            alignItems: 'flex-end',
          }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#2D6A4F', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>🤖</div>
            )}
            <div style={{
              maxWidth: '75%',
              background: msg.role === 'user' ? '#3A1F0A' : 'white',
              color: msg.role === 'user' ? '#F5ECD7' : '#2C1A0E',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              fontSize: 14,
              lineHeight: 1.5,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#5C3317', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>👤</div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#2D6A4F', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>🤖</div>
            <div style={{
              background: 'white', padding: '12px 16px',
              borderRadius: '18px 18px 18px 4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}>
              <span style={{ fontSize: 20 }}>⏳</span>
            </div>
          </div>
        )}
      </div>

      {/* SUGGESTIONS */}
      <div style={{
        padding: '8px 24px',
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        maxWidth: 800,
        width: '100%',
        margin: '0 auto',
      }}>
        {suggestions[lang as keyof typeof suggestions].map((s, i) => (
          <button
            key={i}
            onClick={() => setInput(s)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: '1.5px solid #5C3317',
              background: 'white',
              color: '#5C3317',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'sans-serif',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* INPUT */}
      <div style={{
        padding: '12px 24px 20px',
        maxWidth: 800,
        width: '100%',
        margin: '0 auto',
      }}>
        <div style={{
          display: 'flex',
          gap: 10,
          background: 'white',
          borderRadius: 28,
          padding: '6px 6px 6px 16px',
          border: '1.5px solid #E8D5B0',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              lang === 'wo' ? 'Bind sa laaj...' :
              lang === 'en' ? 'Type your question...' :
              'Posez votre question...'
            }
            rows={1}
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 14, fontFamily: 'sans-serif',
              resize: 'none', background: 'transparent',
              padding: '8px 0',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              background: input.trim() ? '#2D6A4F' : '#E8D5B0',
              color: 'white', border: 'none',
              borderRadius: '50%', width: 42, height: 42,
              cursor: input.trim() ? 'pointer' : 'default',
              fontSize: 18, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}
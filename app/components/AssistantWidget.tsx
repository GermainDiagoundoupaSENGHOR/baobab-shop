'use client'
import { useState } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function AssistantWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 Salamaleekum ! Je suis l\'assistant B@OB@B Shop.\n\nJe parle Wolof, Français et English !\n\nComment puis-je vous aider ?'
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
        body: JSON.stringify({ messages: [...messages, userMsg], lang }),
      })
      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Erreur. Réessayez !'
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

  return (
    <>
      {/* FENETRE CHAT */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: 80,
          left: 20,
          width: 340,
          height: 480,
          background: 'white',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9999,
          overflow: 'hidden',
        }}>
          {/* HEADER */}
          <div style={{
            background: 'linear-gradient(135deg, #3A1F0A, #5C3317)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#2D6A4F',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 18,
              }}>🤖</div>
              <div>
                <div style={{ color: '#F5ECD7', fontWeight: 700, fontSize: 14 }}>
                  Assistant B@OB@B
                </div>
                <div style={{ color: '#52B788', fontSize: 11 }}>● En ligne</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* LANGUE */}
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: '#F5ECD7',
                  border: 'none',
                  borderRadius: 8,
                  padding: '3px 6px',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                <option value="fr" style={{ background: '#3A1F0A' }}>🇫🇷 FR</option>
                <option value="wo" style={{ background: '#3A1F0A' }}>🇸🇳 WO</option>
                <option value="en" style={{ background: '#3A1F0A' }}>🇬🇧 EN</option>
              </select>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'none', border: 'none',
                  color: '#F5ECD7', fontSize: 18,
                  cursor: 'pointer', padding: 2,
                }}
              >×</button>
            </div>
          </div>

          {/* MESSAGES */}
          <div style={{
            flex: 1, overflowY: 'auto',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            background: '#F5ECD7',
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: 6,
                alignItems: 'flex-end',
              }}>
                {msg.role === 'assistant' && (
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: '#2D6A4F', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, flexShrink: 0,
                  }}>🤖</div>
                )}
                <div style={{
                  maxWidth: '80%',
                  background: msg.role === 'user' ? '#3A1F0A' : 'white',
                  color: msg.role === 'user' ? '#F5ECD7' : '#2C1A0E',
                  padding: '8px 12px',
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  fontSize: 13,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: '#2D6A4F', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 14,
                }}>🤖</div>
                <div style={{
                  background: 'white', padding: '8px 12px',
                  borderRadius: '14px 14px 14px 4px',
                  fontSize: 16,
                }}>⏳</div>
              </div>
            )}
          </div>

          {/* SUGGESTIONS */}
          <div style={{
            padding: '6px 10px',
            display: 'flex', gap: 6,
            overflowX: 'auto',
            background: 'white',
            borderTop: '1px solid #F5ECD7',
          }}>
            {(lang === 'wo'
              ? ['Lu nekk ci katalog ?', 'Na nga commande ?']
              : lang === 'en'
              ? ['What products ?', 'How to order ?']
              : ['Nos produits ?', 'Comment commander ?']
            ).map((s, i) => (
              <button key={i} onClick={() => setInput(s)} style={{
                padding: '4px 10px', borderRadius: 12,
                border: '1px solid #5C3317', background: 'white',
                color: '#5C3317', fontSize: 11, fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap',
                fontFamily: 'sans-serif',
              }}>
                {s}
              </button>
            ))}
          </div>

          {/* INPUT */}
          <div style={{
            padding: '8px 10px',
            display: 'flex', gap: 8,
            background: 'white',
            borderTop: '1px solid #F5ECD7',
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                lang === 'wo' ? 'Bind sa laaj...' :
                lang === 'en' ? 'Type your message...' :
                'Votre message...'
              }
              style={{
                flex: 1, padding: '8px 12px',
                border: '1.5px solid #E8D5B0',
                borderRadius: 20, fontSize: 13,
                fontFamily: 'sans-serif', outline: 'none',
                background: '#F5ECD7',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                background: input.trim() ? '#2D6A4F' : '#E8D5B0',
                color: 'white', border: 'none',
                borderRadius: '50%', width: 36, height: 36,
                cursor: input.trim() ? 'pointer' : 'default',
                fontSize: 16, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >➤</button>
          </div>
        </div>
      )}

      {/* BOUTON FLOTTANT */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          background: '#2D6A4F',
          color: 'white',
          border: 'none',
          borderRadius: 24,
          padding: '12px 20px',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: 14,
          fontFamily: 'sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 4px 16px rgba(45,106,79,0.4)',
          zIndex: 9998,
          transition: 'all 0.2s',
        }}
      >
        <span style={{ fontSize: 18 }}>🤖</span>
        Assistant IA
      </button>
    </>
  )
}
'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
}

interface Contact {
  id: string
  name: string
  avatar: string
  lastMessage: string
  time: string
  unread: number
}

const CONTACTS: Contact[] = [
  { id: '1', name: 'Amadou Diallo', avatar: '👨🏿', lastMessage: 'Bonjour, est-ce disponible ?', time: '10:30', unread: 2 },
  { id: '2', name: 'Fatou Sow', avatar: '👩🏿', lastMessage: 'Merci pour la livraison !', time: '09:15', unread: 0 },
  { id: '3', name: 'Moussa Ndiaye', avatar: '👨🏿‍💼', lastMessage: 'Quel est le prix final ?', time: 'Hier', unread: 1 },
  { id: '4', name: 'Aissatou Ba', avatar: '👩🏿‍💼', lastMessage: 'Je veux commander 2 pièces', time: 'Hier', unread: 0 },
]

export default function Messages() {
  const [activeContact, setActiveContact] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<{ id: string, content: string, mine: boolean, time: string }[]>([
    { id: '1', content: 'Bonjour, est-ce que le Samsung Galaxy A55 est disponible ?', mine: false, time: '10:30' },
    { id: '2', content: 'Oui, il est disponible ! Prix : 285 000 FCFA', mine: true, time: '10:32' },
    { id: '3', content: 'Est-ce que vous faites la livraison à Thiès ?', mine: false, time: '10:33' },
    { id: '4', content: 'Oui, livraison partout au Sénégal sous 2-4 jours !', mine: true, time: '10:35' },
  ])
  const [newMsg, setNewMsg] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!newMsg.trim()) return
    setMessages([...messages, {
      id: Date.now().toString(),
      content: newMsg,
      mine: true,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }])
    setNewMsg('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={{ background: '#F5ECD7', height: 'calc(100vh - 120px)', display: 'flex' }}>
      
      {/* LISTE CONTACTS */}
      <div style={{
        width: 300,
        background: 'white',
        borderRight: '1px solid #E8D5B0',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8D5B0' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 20, margin: 0 }}>
            💬 Messages
          </h2>
          <p style={{ color: '#7A5C42', fontSize: 12, margin: '4px 0 0' }}>
            {CONTACTS.filter(c => c.unread > 0).length} non lus
          </p>
        </div>

        {/* RECHERCHE */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #E8D5B0' }}>
          <input
            type="text"
            placeholder="🔍 Rechercher..."
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1.5px solid #E8D5B0',
              borderRadius: 20,
              fontSize: 13,
              fontFamily: 'sans-serif',
              background: '#F5ECD7',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* CONTACTS */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {CONTACTS.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveContact(c)}
              style={{
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                background: activeContact?.id === c.id ? '#F5ECD7' : 'white',
                borderBottom: '1px solid #F5ECD7',
                transition: 'background 0.2s',
              }}
            >
              <div style={{
                width: 44, height: 44,
                borderRadius: '50%',
                background: '#E8D5B0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                flexShrink: 0,
              }}>
                {c.avatar}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#2C1A0E' }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: '#7A5C42' }}>{c.time}</span>
                </div>
                <div style={{ fontSize: 12, color: '#7A5C42', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.lastMessage}
                </div>
              </div>
              {c.unread > 0 && (
                <div style={{
                  background: '#2D6A4F',
                  color: 'white',
                  borderRadius: '50%',
                  width: 20, height: 20,
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {c.unread}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ZONE CHAT */}
      {activeContact ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {/* HEADER CHAT */}
          <div style={{
            background: 'white',
            padding: '14px 20px',
            borderBottom: '1px solid #E8D5B0',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{
              width: 40, height: 40,
              borderRadius: '50%',
              background: '#E8D5B0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}>
              {activeContact.avatar}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#2C1A0E' }}>{activeContact.name}</div>
              <div style={{ fontSize: 12, color: '#2D6A4F' }}>● En ligne</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
              <button style={{
                background: '#F5ECD7', border: 'none',
                borderRadius: 20, padding: '6px 14px',
                fontSize: 12, fontWeight: 600,
                cursor: 'pointer', color: '#5C3317',
              }}>
                📞 Appeler
              </button>
              <button style={{
                background: '#F5ECD7', border: 'none',
                borderRadius: 20, padding: '6px 14px',
                fontSize: 12, fontWeight: 600,
                cursor: 'pointer', color: '#5C3317',
              }}>
                🔒 Sécurisé
              </button>
            </div>
          </div>

          {/* MESSAGES */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            {/* BADGE SECURITE */}
            <div style={{
              textAlign: 'center',
              background: '#D8F3DC',
              color: '#2D6A4F',
              fontSize: 12,
              padding: '6px 16px',
              borderRadius: 20,
              alignSelf: 'center',
              fontWeight: 600,
            }}>
              🔒 Conversation chiffrée et sécurisée
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.mine ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{
                  maxWidth: '70%',
                  background: msg.mine ? '#2D6A4F' : 'white',
                  color: msg.mine ? 'white' : '#2C1A0E',
                  padding: '10px 14px',
                  borderRadius: msg.mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  fontSize: 14,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}>
                  <div>{msg.content}</div>
                  <div style={{
                    fontSize: 10,
                    opacity: 0.7,
                    marginTop: 4,
                    textAlign: 'right',
                  }}>
                    {msg.time} {msg.mine && '✓✓'}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT MESSAGE */}
          <div style={{
            background: 'white',
            padding: '12px 16px',
            borderTop: '1px solid #E8D5B0',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-end',
          }}>
            <button style={{
              background: 'none', border: 'none',
              fontSize: 20, cursor: 'pointer', padding: 4,
            }}>📎</button>
            <textarea
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrire un message..."
              rows={1}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1.5px solid #E8D5B0',
                borderRadius: 20,
                fontSize: 14,
                fontFamily: 'sans-serif',
                resize: 'none',
                outline: 'none',
                background: '#F5ECD7',
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                background: '#2D6A4F',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: 40, height: 40,
                cursor: 'pointer',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ➤
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
        }}>
          <div style={{ fontSize: 64 }}>💬</div>
          <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 22 }}>
            Vos messages
          </h2>
          <p style={{ color: '#7A5C42', fontSize: 14 }}>
            Sélectionnez une conversation pour commencer
          </p>
        </div>
      )}
    </div>
  )
}
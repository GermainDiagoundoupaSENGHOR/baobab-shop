'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Conversation {
  id: string
  client_id: string
  client_name: string
  client_avatar: string
  last_message: string
  last_message_at: string
  unread_count: number
  archived: boolean
  blocked: boolean
}

interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  type: string
  image_url?: string
  read: boolean
  is_bot: boolean
  created_at: string
}

interface BotReply {
  id: string
  keywords: string[]
  reply: string
  active: boolean
}

interface BotSettings {
  id: string
  welcome_message: string
  active: boolean
  active_hours_start: number
  active_hours_end: number
}

const ADMIN_EMAIL = 'baobabshop@gmail.com'

const getTime = (date?: string) => {
  const d = date ? new Date(date) : new Date()
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function Messages() {
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [botReplies, setBotReplies] = useState<BotReply[]>([])
  const [botSettings, setBotSettings] = useState<BotSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeout = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (!activeConv) return
    loadMessages(activeConv.id)

    // Temps réel
    const channel = supabase
      .channel('messages-' + activeConv.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConv.id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as ChatMessage])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeConv])

  const init = async () => {
    const { data: authData } = await supabase.auth.getUser()
    const u = authData.user
    setUser(u)
    const admin = u?.email === ADMIN_EMAIL
    setIsAdmin(admin)

    await loadBotSettings()
    await loadBotReplies()

    if (admin) {
      await loadAllConversations()
    } else if (u) {
      await loadOrCreateConversation(u)
    }
    setLoading(false)
  }

  const loadBotSettings = async () => {
    const { data } = await supabase.from('bot_settings').select('*').limit(1).single()
    if (data) setBotSettings(data)
  }

  const loadBotReplies = async () => {
    const { data } = await supabase.from('bot_replies').select('*').eq('active', true)
    if (data) setBotReplies(data)
  }

  const loadAllConversations = async () => {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false })
    if (data) setConversations(data)
  }

  const loadOrCreateConversation = async (u: any) => {
    let { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('client_id', u.id)
      .single()

    if (!data) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          client_id: u.id,
          client_name: u.email?.split('@')[0] || 'Client',
          client_avatar: '👤',
          last_message: '',
          unread_count: 0,
        })
        .select()
        .single()
      data = newConv
    }

    if (data) {
      setConversations([data])
      setActiveConv(data)

      // Message de bienvenue si pas de messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', data.id)
        .limit(1)

      if (!msgs || msgs.length === 0) {
        await sendBotMessage(data.id, botSettings?.welcome_message || '👋 Bienvenue chez B@OB@B Shop !')
      }
    }
  }

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)

    // Marquer comme lu
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', convId)
      .eq('read', false)
      .neq('sender_id', user?.id)

    await supabase
      .from('conversations')
      .update({ unread_count: 0 })
      .eq('id', convId)

    await loadAllConversations()
  }

  const getAutoReply = (text: string): string => {
    const lower = text.toLowerCase()
    for (const entry of botReplies) {
      if (entry.keywords.some(kw => lower.includes(kw))) {
        return entry.reply
      }
    }
    return '🤖 Merci pour votre message ! Un conseiller va vous répondre très bientôt.'
  }

  const isBotActive = (): boolean => {
    if (!botSettings?.active) return false
    const now = new Date()
    const hour = now.getHours()
    return hour >= botSettings.active_hours_start && hour < botSettings.active_hours_end
  }

  const sendBotMessage = async (convId: string, content: string) => {
    await supabase.from('messages').insert({
      conversation_id: convId,
      sender_id: null,
      content,
      is_bot: true,
      read: false,
    })
    await supabase.from('conversations').update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    }).eq('id', convId)
  }

  const sendMessage = async () => {
    if (!newMsg.trim() && !imageFile) return
    if (!activeConv || !user) return

    let image_url = null

    // Upload image si présente
    if (imageFile) {
      const filename = `chat/${activeConv.id}/${Date.now()}_${imageFile.name}`
      const { data: uploadData } = await supabase.storage
        .from('avatars')
        .upload(filename, imageFile)
      if (uploadData) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filename)
        image_url = urlData.publicUrl
      }
      setImageFile(null)
    }

    const content = newMsg.trim() || '📷 Image'

    // Insérer le message
    await supabase.from('messages').insert({
      conversation_id: activeConv.id,
      sender_id: user.id,
      content,
      type: image_url ? 'image' : 'text',
      image_url,
      is_bot: false,
      read: false,
    })

    // Mettre à jour la conversation
    await supabase.from('conversations').update({
      last_message: content,
      last_message_at: new Date().toISOString(),
      unread_count: isAdmin ? 0 : (activeConv.unread_count || 0) + 1,
    }).eq('id', activeConv.id)

    const textForReply = newMsg
    setNewMsg('')

    // Bot répond automatiquement si actif et c'est un client
    if (!isAdmin && isBotActive()) {
      setIsTyping(true)
      if (typingTimeout.current) clearTimeout(typingTimeout.current)
      typingTimeout.current = setTimeout(async () => {
        const reply = getAutoReply(textForReply)
        await sendBotMessage(activeConv.id, reply)
        setIsTyping(false)
        await loadMessages(activeConv.id)
      }, 1500)
    }

    await loadMessages(activeConv.id)
  }

  const archiveConversation = async (convId: string, archived: boolean) => {
    await supabase.from('conversations').update({ archived }).eq('id', convId)
    await loadAllConversations()
    if (activeConv?.id === convId) setActiveConv(null)
  }

  const blockConversation = async (convId: string, blocked: boolean) => {
    await supabase.from('conversations').update({ blocked }).eq('id', convId)
    await loadAllConversations()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const quickReplies = [
    '✅ Oui, disponible !',
    '🚚 Livraison sous 2-4 jours',
    '💰 Le prix est indiqué sur la fiche produit',
    '📞 Appelez-nous pour plus d\'infos',
    '🙏 Merci pour votre commande !',
  ]

  const filteredConversations = conversations.filter(c => {
    if (filter === 'unread') return c.unread_count > 0
    if (filter === 'archived') return c.archived
    if (filter === 'all') return !c.archived
    return true
  }).filter(c =>
    c.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.last_message?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, fontSize: 32 }}>⏳</div>
  )

  if (!user) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <p style={{ color: '#7A5C42' }}>Connectez-vous pour accéder à la messagerie</p>
    </div>
  )

  return (
    <div style={{ background: '#F5ECD7', height: 'calc(100vh - 120px)', display: 'flex' }}>

      {/* LISTE CONVERSATIONS */}
      <div style={{
        width: 300, background: 'white',
        borderRight: '1px solid #E8D5B0',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8D5B0' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 20, margin: 0 }}>
            💬 Messages
          </h2>
          <p style={{ color: '#7A5C42', fontSize: 12, margin: '4px 0 0' }}>
            {conversations.filter(c => c.unread_count > 0).length} non lus
          </p>
        </div>

        {/* RECHERCHE */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #E8D5B0' }}>
          <input
            type="text"
            placeholder="🔍 Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px',
              border: '1.5px solid #E8D5B0', borderRadius: 20,
              fontSize: 13, background: '#F5ECD7',
              boxSizing: 'border-box' as const, fontFamily: 'sans-serif',
            }}
          />
        </div>

        {/* FILTRES */}
        {isAdmin && (
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #E8D5B0', display: 'flex', gap: 6 }}>
            {[
              { key: 'all', label: 'Tous' },
              { key: 'unread', label: '🔴 Non lus' },
              { key: 'archived', label: '📁 Archivés' },
            ].map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key as any)} style={{
                padding: '4px 10px', borderRadius: 12, border: '1px solid',
                borderColor: filter === f.key ? '#2D6A4F' : '#E8D5B0',
                background: filter === f.key ? '#2D6A4F' : 'white',
                color: filter === f.key ? 'white' : '#7A5C42',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}>{f.label}</button>
            ))}
          </div>
        )}

        {/* LISTE */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredConversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#7A5C42', fontSize: 13 }}>
              Aucune conversation
            </div>
          ) : filteredConversations.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveConv(c)}
              style={{
                padding: '14px 16px', display: 'flex',
                alignItems: 'center', gap: 12, cursor: 'pointer',
                background: activeConv?.id === c.id ? '#F5ECD7' : 'white',
                borderBottom: '1px solid #F5ECD7',
                opacity: c.blocked ? 0.5 : 1,
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: '#E8D5B0', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
              }}>
                {c.client_avatar || '👤'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#2C1A0E' }}>{c.client_name}</span>
                  <span style={{ fontSize: 10, color: '#7A5C42' }}>{getTime(c.last_message_at)}</span>
                </div>
                <div style={{ fontSize: 12, color: '#7A5C42', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.last_message || 'Nouvelle conversation'}
                </div>
              </div>
              {c.unread_count > 0 && (
                <div style={{
                  background: '#2D6A4F', color: 'white',
                  borderRadius: '50%', width: 20, height: 20,
                  fontSize: 11, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                }}>
                  {c.unread_count}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ZONE CHAT */}
      {activeConv ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* HEADER */}
          <div style={{
            background: 'white', padding: '12px 20px',
            borderBottom: '1px solid #E8D5B0',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: '#E8D5B0', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>
              {activeConv.client_avatar || '👤'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#2C1A0E' }}>{activeConv.client_name}</div>
              <div style={{ fontSize: 11, color: '#2D6A4F' }}>
                {activeConv.blocked ? '🚫 Bloqué' : '● En ligne'}
              </div>
            </div>
            {isAdmin && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button
                  onClick={() => archiveConversation(activeConv.id, !activeConv.archived)}
                  style={{
                    background: '#F5ECD7', border: 'none', borderRadius: 20,
                    padding: '6px 12px', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', color: '#5C3317',
                  }}
                >
                  {activeConv.archived ? '📂 Désarchiver' : '📁 Archiver'}
                </button>
                <button
                  onClick={() => blockConversation(activeConv.id, !activeConv.blocked)}
                  style={{
                    background: activeConv.blocked ? '#D8F3DC' : '#fee2e2',
                    border: 'none', borderRadius: 20,
                    padding: '6px 12px', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer',
                    color: activeConv.blocked ? '#2D6A4F' : '#e53e3e',
                  }}
                >
                  {activeConv.blocked ? '✅ Débloquer' : '🚫 Bloquer'}
                </button>
              </div>
            )}
          </div>

          {/* MESSAGES */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: 20,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{
              textAlign: 'center', background: '#D8F3DC',
              color: '#2D6A4F', fontSize: 12, padding: '6px 16px',
              borderRadius: 20, alignSelf: 'center', fontWeight: 600,
            }}>
              🔒 Conversation sécurisée
            </div>

            {messages.map((msg) => {
              const isMine = isAdmin ? !msg.is_bot && msg.sender_id !== activeConv.client_id : msg.sender_id === user?.id
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '70%',
                    background: isMine ? '#2D6A4F' : 'white',
                    color: isMine ? 'white' : '#2C1A0E',
                    padding: '10px 14px',
                    borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    fontSize: 14,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  }}>
                    {msg.is_bot && (
                      <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4, opacity: 0.7 }}>
                        🤖 Réponse automatique
                      </div>
                    )}
                    {msg.image_url && (
                      <img src={msg.image_url} alt="image" style={{ width: '100%', borderRadius: 8, marginBottom: 6 }} />
                    )}
                    <div>{msg.content}</div>
                    <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' }}>
                      {getTime(msg.created_at)} {isMine && (msg.read ? '✓✓' : '✓')}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* INDICATEUR TYPING */}
            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  background: 'white', padding: '10px 14px',
                  borderRadius: '16px 16px 16px 4px', fontSize: 13,
                  color: '#7A5C42', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}>
                  🤖 en train d'écrire...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* RÉPONSES RAPIDES (admin seulement) */}
          {isAdmin && (
            <div style={{
              padding: '8px 16px', background: '#F5ECD7',
              borderTop: '1px solid #E8D5B0',
              display: 'flex', gap: 6, overflowX: 'auto',
            }}>
              {quickReplies.map((qr, i) => (
                <button key={i} onClick={() => setNewMsg(qr)} style={{
                  padding: '5px 12px', borderRadius: 16,
                  border: '1px solid #E8D5B0', background: 'white',
                  color: '#5C3317', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}>{qr}</button>
              ))}
            </div>
          )}

          {/* INPUT */}
          {!activeConv.blocked && (
            <div style={{
              background: 'white', padding: '12px 16px',
              borderTop: '1px solid #E8D5B0',
              display: 'flex', gap: 10, alignItems: 'flex-end',
            }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              <button onClick={() => fileInputRef.current?.click()} style={{
                background: 'none', border: 'none',
                fontSize: 20, cursor: 'pointer', padding: 4,
              }}>📎</button>
              {imageFile && (
                <div style={{ fontSize: 11, color: '#2D6A4F', alignSelf: 'center' }}>
                  📷 {imageFile.name}
                </div>
              )}
              <textarea
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Écrire un message..."
                rows={1}
                style={{
                  flex: 1, padding: '10px 14px',
                  border: '1.5px solid #E8D5B0', borderRadius: 20,
                  fontSize: 14, fontFamily: 'sans-serif',
                  resize: 'none', outline: 'none', background: '#F5ECD7',
                }}
              />
              <button onClick={sendMessage} style={{
                background: '#2D6A4F', color: 'white',
                border: 'none', borderRadius: '50%',
                width: 40, height: 40, cursor: 'pointer',
                fontSize: 18, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>➤</button>
            </div>
          )}

          {activeConv.blocked && (
            <div style={{
              background: '#fee2e2', padding: 12, textAlign: 'center',
              fontSize: 13, color: '#991b1b', borderTop: '1px solid #fca5a5',
            }}>
              🚫 Cette conversation est bloquée
            </div>
          )}
        </div>
      ) : (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexDirection: 'column', gap: 16,
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
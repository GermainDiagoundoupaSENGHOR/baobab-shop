'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

/* ─── Types ─────────────────────────────────────────────────────────── */
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
  reply_to_id?: string
  reply_to_content?: string
  deleted?: boolean
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

/* ─── Constantes ─────────────────────────────────────────────────────── */
const ADMIN_EMAIL = 'baobabshop@gmail.com'

const EMOJIS = [
  '😊','😂','❤️','👍','🙏','😍','🎉','😭',
  '🔥','✅','💪','😅','🤔','👏','🥰','😎',
  '💯','🌟','👌','😢','🤣','😁','💕','🙌',
  '😩','🥺','✨','😬','💀','🤩','😤','👀',
  '🚀','💰','📦','🛒','🌳','🏪','🤝','🎁',
]

const QUICK_REPLIES = [
  '✅ Oui, disponible !',
  '🚚 Livraison sous 2-4 jours',
  "💰 Le prix est sur la fiche produit",
  "📞 Appelez-nous pour plus d'infos",
  '🙏 Merci pour votre commande !',
  '⏳ Je vérifie et reviens vers vous',
]

/* ─── Helpers ────────────────────────────────────────────────────────── */
const getTime = (date?: string) =>
  (date ? new Date(date) : new Date())
    .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

const getDateLabel = (date: string) => {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui"
  if (d.toDateString() === yesterday.toDateString()) return 'Hier'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const getInitials = (name: string) =>
  name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

/* ─── Son de notification ────────────────────────────────────────────── */
const playNotifSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  } catch {}
}

/* ─── CSS animations ─────────────────────────────────────────────────── */
const STYLE = `
  @keyframes dotBounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
    40% { transform: translateY(-6px); opacity: 1; }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .msg-bubble { animation: fadeIn 0.2s ease; }
  .conv-item  { animation: slideIn 0.15s ease; }
  .dot1 { animation: dotBounce 1.2s infinite 0s; }
  .dot2 { animation: dotBounce 1.2s infinite 0.2s; }
  .dot3 { animation: dotBounce 1.2s infinite 0.4s; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #E8D5B0; border-radius: 4px; }
`

/* ═══════════════════════════════════════════════════════════════════════
   CARTE DE REÇU COLORÉE
═══════════════════════════════════════════════════════════════════════ */
function ReceiptCard({ content }: { content: string }) {
  const blocks = content.split(/━{5,}/).map(b => b.trim()).filter(Boolean)
  const title = blocks[0] || '🧾 REÇU DE COMMANDE'
  const meta = (blocks[1] || '').split('\n')
  const sections = blocks.slice(2)

  const sectionStyle = (head: string) => {
    if (head.startsWith('🛒')) return { bg: '#FFF8E7', border: '#F0DDA8', color: '#8A5A00' }
    if (head.startsWith('📦')) return { bg: '#EAF7EF', border: '#BFE3CD', color: '#1B5E3B' }
    if (head.startsWith('💳')) return { bg: '#F3EBFF', border: '#DDD0F5', color: '#5B2FA0' }
    return { bg: '#F5ECD7', border: '#E8D5B0', color: '#3A1F0A' }
  }

  return (
    <div style={{ width: '100%', minWidth: 260, maxWidth: 420, fontFamily: 'sans-serif' }}>
      <div style={{
        background: 'linear-gradient(135deg, #2D6A4F, #1B5E3B)', color: 'white',
        padding: '14px 16px', borderRadius: '12px 12px 0 0',
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 0.5 }}>{title}</div>
        <div style={{ fontSize: 12, opacity: 0.9, marginTop: 6, lineHeight: 1.6 }}>
          {meta.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </div>

      <div style={{ background: 'white', padding: 10, borderRadius: '0 0 12px 12px', border: '1px solid #E8D5B0', borderTop: 'none' }}>
        {sections.map((b, i) => {
          const lines = b.split('\n').filter(l => l.trim() !== '')
          const head = lines[0] || ''

          if (head.startsWith('💰')) {
            return (
              <div key={i} style={{
                background: 'linear-gradient(135deg, #FFE27A, #F5C542)', color: '#3A1F0A',
                borderRadius: 10, padding: '12px 14px', margin: '8px 0',
                fontSize: 17, fontWeight: 800, textAlign: 'center',
                boxShadow: '0 2px 8px rgba(245,197,66,0.5)',
              }}>{head}</div>
            )
          }

          if (head.startsWith('✅')) {
            return (
              <div key={i} style={{ background: '#D8F3DC', color: '#065f46', borderRadius: 10, padding: '10px 12px', margin: '8px 0 0', fontSize: 12.5, lineHeight: 1.6 }}>
                <div style={{ fontWeight: 800, marginBottom: 2 }}>{head}</div>
                {lines.slice(1).map((l, j) => <div key={j}>{l}</div>)}
              </div>
            )
          }

          const s = sectionStyle(head)
          return (
            <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '10px 12px', margin: '8px 0' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: s.color, letterSpacing: 0.5, marginBottom: 6 }}>{head}</div>
              {lines.slice(1).map((l, j) => (
                <div key={j} style={{
                  fontSize: 12.5, color: '#2C1A0E', lineHeight: 1.7,
                  fontWeight: l.startsWith('Statut') ? 700 : 400,
                  borderTop: l.startsWith('Sous-total') ? `1px dashed ${s.border}` : 'none',
                  marginTop: l.startsWith('Sous-total') ? 6 : 0,
                  paddingTop: l.startsWith('Sous-total') ? 6 : 0,
                }}>{l}</div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════════════════════ */
export default function Messages() {
  const [user, setUser]                   = useState<any>(null)
  const [isAdmin, setIsAdmin]             = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv]       = useState<Conversation | null>(null)
  const [messages, setMessages]           = useState<ChatMessage[]>([])
  const [newMsg, setNewMsg]               = useState('')
  const [isTyping, setIsTyping]           = useState(false)
  const [botReplies, setBotReplies]       = useState<BotReply[]>([])
  const [botSettings, setBotSettings]     = useState<BotSettings | null>(null)
  const [loading, setLoading]             = useState(true)
  const [imageFile, setImageFile]         = useState<File | null>(null)
  const [search, setSearch]               = useState('')
  const [filter, setFilter]               = useState<'all' | 'unread' | 'archived'>('all')
  const [showEmoji, setShowEmoji]         = useState(false)
  const [replyingTo, setReplyingTo]       = useState<ChatMessage | null>(null)
  const [hoveredMsg, setHoveredMsg]       = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeout  = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef   = useRef<HTMLInputElement>(null)
  const textareaRef    = useRef<HTMLTextAreaElement>(null)
  // ✅ BUG 2 CORRIGÉ : -1 pour ne pas jouer le son au 1er chargement
  const prevMsgCount   = useRef(-1)

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  /* ── Son uniquement pour les nouveaux messages ── */
  useEffect(() => {
    // ✅ BUG 2 CORRIGÉ : pas de son au 1er chargement car prevMsgCount = -1
    if (prevMsgCount.current !== -1 && messages.length > prevMsgCount.current) {
      const last = messages[messages.length - 1]
      if (last?.sender_id !== user?.id) playNotifSound()
    }
    prevMsgCount.current = messages.length
  }, [messages])

  /* ── Init global ── */
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = STYLE
    document.head.appendChild(style)
    init()
    return () => { document.head.removeChild(style) }
  }, [])

  /* ── Temps réel — ✅ BUG 4 CORRIGÉ : user dans les dépendances ── */
  useEffect(() => {
    if (!activeConv || !user) return  // ✅ guard sur user

    loadMessages(activeConv.id)

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
  }, [activeConv, user])  // ✅ user ajouté ici

  /* ── Chargement ── */
  const init = async () => {
    const { data: authData } = await supabase.auth.getUser()
    const u = authData.user
    setUser(u)
    const admin = u?.email === ADMIN_EMAIL
    setIsAdmin(admin)

    // ✅ BUG 1 CORRIGÉ : loadBotSettings retourne la valeur directement
    const settings = await loadBotSettings()
    await loadBotReplies()

    if (admin) {
      await loadAllConversations()
    } else if (u) {
      // ✅ BUG 1 CORRIGÉ : on passe settings en paramètre
      await loadOrCreateConversation(u, settings)
    }

    setLoading(false)
  }

  // ✅ BUG 1 CORRIGÉ : retourne la valeur pour éviter le problème de state async
  const loadBotSettings = async (): Promise<BotSettings | null> => {
    const { data } = await supabase.from('bot_settings').select('*').limit(1).single()
    if (data) setBotSettings(data)
    return data || null
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

  // ✅ BUG 1 CORRIGÉ : reçoit settings en paramètre
  const loadOrCreateConversation = async (u: any, settings: BotSettings | null) => {
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
          client_name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Client',
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

      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', data.id)
        .limit(1)

      if (!msgs || msgs.length === 0) {
        // ✅ BUG 1 CORRIGÉ : utilise settings (valeur directe) pas botSettings (state)
        const welcomeMsg = settings?.welcome_message || '👋 Bienvenue chez B@OB@B Shop ! Comment puis-je vous aider ?'
        await sendBotMessage(data.id, welcomeMsg)
      }
    }
  }

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })

    if (data) {
      // ✅ BUG 2 CORRIGÉ : mettre à jour prevMsgCount avant setMessages
      prevMsgCount.current = data.length
      setMessages(data)
    }

    await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', convId)
      .eq('read', false)
      .neq('sender_id', user?.id ?? '')

    await supabase
      .from('conversations')
      .update({ unread_count: 0 })
      .eq('id', convId)

    // ✅ BUG 3 CORRIGÉ : uniquement pour l'admin
    if (isAdmin) await loadAllConversations()
  }

  const getAutoReply = (text: string): string => {
    const lower = text.toLowerCase()
    for (const entry of botReplies) {
      if (entry.keywords.some(kw => lower.includes(kw))) return entry.reply
    }
    return '🤖 Merci ! Un conseiller va vous répondre très bientôt.'
  }

  const isBotActive = (): boolean => {
    if (!botSettings?.active) return false
    const hour = new Date().getHours()
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

  /* ── Envoyer message ── */
  const sendMessage = async () => {
    if (!newMsg.trim() && !imageFile) return
    if (!activeConv || !user) return

    let image_url = null
    if (imageFile) {
      const filename = `chat/${activeConv.id}/${Date.now()}_${imageFile.name}`
      const { data: up } = await supabase.storage.from('avatars').upload(filename, imageFile)
      if (up) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filename)
        image_url = urlData.publicUrl
      }
      setImageFile(null)
    }

    const content = newMsg.trim() || '📷 Image'

    await supabase.from('messages').insert({
      conversation_id: activeConv.id,
      sender_id: user.id,
      content,
      type: image_url ? 'image' : 'text',
      image_url,
      is_bot: false,
      read: false,
      reply_to_id: replyingTo?.id || null,
      reply_to_content: replyingTo?.content || null,
    })

    await supabase.from('conversations').update({
      last_message: content,
      last_message_at: new Date().toISOString(),
      unread_count: isAdmin ? 0 : (activeConv.unread_count || 0) + 1,
    }).eq('id', activeConv.id)

    const textForReply = newMsg
    setNewMsg('')
    setReplyingTo(null)
    setShowEmoji(false)

    if (!isAdmin && isBotActive()) {
      setIsTyping(true)
      if (typingTimeout.current) clearTimeout(typingTimeout.current)
      typingTimeout.current = setTimeout(async () => {
        await sendBotMessage(activeConv.id, getAutoReply(textForReply))
        setIsTyping(false)
        await loadMessages(activeConv.id)
      }, 1500)
    }

    await loadMessages(activeConv.id)
  }

  /* ── Supprimer message ── */
  const deleteMessage = async (msgId: string) => {
    if (!window.confirm('Supprimer ce message ?')) return
    await supabase.from('messages')
      .update({ deleted: true, content: '🗑️ Message supprimé' })
      .eq('id', msgId)
    await loadMessages(activeConv!.id)
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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
    if (e.key === 'Escape') { setReplyingTo(null); setShowEmoji(false) }
  }

  /* ── ✅ BUG 5 CORRIGÉ : séparateurs avant de gérer deleted ── */
  const messagesWithSeparators = () => {
    const result: (ChatMessage | { type: 'separator'; label: string; key: string })[] = []
    let lastDate = ''

    for (const msg of messages) {
      // ✅ Date vérifiée EN PREMIER, avant de gérer deleted
      const d = new Date(msg.created_at).toDateString()
      if (d !== lastDate) {
        result.push({
          type: 'separator',
          label: getDateLabel(msg.created_at),
          key: 'sep-' + d,
        })
        lastDate = d
      }
      result.push(msg.deleted ? { ...msg, content: '🗑️ Message supprimé' } : msg)
    }

    return result
  }

  /* ── Filtres ── */
  const filteredConversations = conversations
    .filter(c => {
      if (filter === 'unread')   return c.unread_count > 0 && !c.archived
      if (filter === 'archived') return c.archived
      return !c.archived
    })
    .filter(c =>
      c.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.last_message?.toLowerCase().includes(search.toLowerCase())
    )

  /* ── Loading / Auth ── */
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F5ECD7' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
        <p style={{ color: '#7A5C42', fontWeight: 600 }}>Chargement…</p>
      </div>
    </div>
  )

  if (!user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F5ECD7' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
        <p style={{ color: '#7A5C42', fontSize: 15 }}>Connectez-vous pour accéder à la messagerie</p>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', background: '#F5ECD7', fontFamily: 'sans-serif', overflow: 'hidden' }}>

      {/* ── SIDEBAR ── */}
      <div style={{ width: 300, minWidth: 300, background: 'white', borderRight: '1px solid #E8D5B0', display: 'flex', flexDirection: 'column', boxShadow: '2px 0 8px rgba(0,0,0,0.04)' }}>

        <div style={{ padding: '20px 20px 14px', background: 'linear-gradient(135deg, #3A1F0A, #5C3317)' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', color: '#F5ECD7', fontSize: 20, margin: 0 }}>💬 Messages</h2>
          <p style={{ color: 'rgba(245,236,215,0.7)', fontSize: 12, margin: '4px 0 0' }}>
            {conversations.filter(c => c.unread_count > 0).length} non lu{conversations.filter(c => c.unread_count > 0).length > 1 ? 's' : ''}
          </p>
        </div>

        <div style={{ padding: '12px 14px', borderBottom: '1px solid #F5ECD7' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#7A5C42' }}>🔍</span>
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px 8px 32px',
                border: '1.5px solid #E8D5B0', borderRadius: 20,
                fontSize: 13, background: '#F5ECD7',
                boxSizing: 'border-box' as const, outline: 'none',
              }}
            />
          </div>
        </div>

        {isAdmin && (
          <div style={{ padding: '8px 14px 10px', borderBottom: '1px solid #F5ECD7', display: 'flex', gap: 6 }}>
            {[
              { key: 'all',      label: 'Tous' },
              { key: 'unread',   label: '🔴 Non lus' },
              { key: 'archived', label: '📁 Archivés' },
            ].map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key as any)} style={{
                padding: '4px 10px', borderRadius: 12, border: '1.5px solid',
                borderColor: filter === f.key ? '#2D6A4F' : '#E8D5B0',
                background: filter === f.key ? '#2D6A4F' : 'white',
                color: filter === f.key ? 'white' : '#7A5C42',
                fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              }}>{f.label}</button>
            ))}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredConversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7A5C42' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
              <p style={{ fontSize: 13, margin: 0 }}>Aucune conversation</p>
            </div>
          ) : filteredConversations.map((c) => (
            <div key={c.id} className="conv-item"
              onClick={() => setActiveConv(c)}
              style={{
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer', borderBottom: '1px solid #F5ECD7',
                background: activeConv?.id === c.id ? 'linear-gradient(135deg, #F5ECD7, #EDE0C8)' : 'white',
                opacity: c.blocked ? 0.5 : 1,
                transition: 'background 0.15s',
                borderLeft: activeConv?.id === c.id ? '3px solid #3A1F0A' : '3px solid transparent',
              }}
            >
              <div style={{
                width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #3A1F0A, #8B5E3C)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: 15,
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}>
                {c.client_avatar && c.client_avatar !== '👤' ? c.client_avatar : getInitials(c.client_name)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#2C1A0E' }}>{c.client_name}</span>
                  <span style={{ fontSize: 10, color: '#9A7B5A' }}>{getTime(c.last_message_at)}</span>
                </div>
                <div style={{
                  fontSize: 12,
                  color: c.unread_count > 0 ? '#3A1F0A' : '#7A5C42',
                  fontWeight: c.unread_count > 0 ? 600 : 400,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {c.last_message || 'Nouvelle conversation'}
                </div>
              </div>

              {c.unread_count > 0 && (
                <div style={{
                  background: '#2D6A4F', color: 'white', borderRadius: '50%',
                  width: 22, height: 22, fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(45,106,79,0.4)',
                }}>
                  {c.unread_count > 9 ? '9+' : c.unread_count}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── ZONE CHAT ── */}
      {activeConv ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          <div style={{
            background: 'white', padding: '12px 20px',
            borderBottom: '1px solid #E8D5B0',
            display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'linear-gradient(135deg, #3A1F0A, #8B5E3C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 16,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}>
              {getInitials(activeConv.client_name)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#2C1A0E' }}>{activeConv.client_name}</div>
              <div style={{ fontSize: 11, color: activeConv.blocked ? '#e53e3e' : '#2D6A4F', fontWeight: 600 }}>
                {activeConv.blocked ? '🚫 Bloqué' : '● En ligne'}
              </div>
            </div>
            {isAdmin && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button onClick={() => archiveConversation(activeConv.id, !activeConv.archived)} style={{
                  background: '#F5ECD7', border: '1px solid #E8D5B0', borderRadius: 20,
                  padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#5C3317',
                }}>
                  {activeConv.archived ? '📂 Désarchiver' : '📁 Archiver'}
                </button>
                <button onClick={() => blockConversation(activeConv.id, !activeConv.blocked)} style={{
                  background: activeConv.blocked ? '#D8F3DC' : '#fee2e2',
                  border: 'none', borderRadius: 20, padding: '7px 14px',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  color: activeConv.blocked ? '#2D6A4F' : '#e53e3e',
                }}>
                  {activeConv.blocked ? '✅ Débloquer' : '🚫 Bloquer'}
                </button>
              </div>
            )}
          </div>

          {/* Messages */}
          <div
            style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4, background: '#F5ECD7' }}
            onClick={() => setShowEmoji(false)}
          >
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <span style={{
                background: 'white', color: '#7A5C42', fontSize: 11,
                padding: '5px 14px', borderRadius: 20, fontWeight: 600,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              }}>🔒 Conversation sécurisée</span>
            </div>

            {messagesWithSeparators().map((item: any) => {

              if (item.type === 'separator') return (
                <div key={item.key} style={{ textAlign: 'center', margin: '12px 0 8px' }}>
                  <span style={{
                    background: 'rgba(255,255,255,0.85)', color: '#7A5C42',
                    fontSize: 11, padding: '4px 14px', borderRadius: 20, fontWeight: 600,
                  }}>{item.label}</span>
                </div>
              )

              const msg = item as ChatMessage
              const isMine = isAdmin
                ? !msg.is_bot && msg.sender_id !== activeConv.client_id
                : msg.sender_id === user?.id

              return (
                <div key={msg.id} className="msg-bubble"
                  style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 4 }}
                  onMouseEnter={() => setHoveredMsg(msg.id)}
                  onMouseLeave={() => setHoveredMsg(null)}
                >
                  {!isMine && (
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      background: msg.is_bot ? 'linear-gradient(135deg, #C9860A, #E8A020)' : 'linear-gradient(135deg, #3A1F0A, #8B5E3C)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginRight: 8, alignSelf: 'flex-end',
                      color: 'white', fontWeight: 700, fontSize: 12,
                    }}>
                      {msg.is_bot ? '🤖' : getInitials(activeConv.client_name)}
                    </div>
                  )}

                  <div style={{ maxWidth: '68%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>

                    {msg.reply_to_content && (
                      <div style={{
                        background: isMine ? 'rgba(255,255,255,0.2)' : '#E8D5B0',
                        borderLeft: `3px solid ${isMine ? 'white' : '#8B5E3C'}`,
                        padding: '5px 10px', borderRadius: '8px 8px 0 0',
                        fontSize: 11, color: isMine ? 'rgba(255,255,255,0.85)' : '#5C3317',
                        maxWidth: '100%', marginBottom: -4,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>↩️ {msg.reply_to_content}</div>
                    )}

                    <div style={{
                      background: isMine
                        ? 'linear-gradient(135deg, #2D6A4F, #1B5E3B)'
                        : msg.is_bot ? 'linear-gradient(135deg, #FFF8E7, #FFF3D4)' : 'white',
                      color: isMine ? 'white' : '#2C1A0E',
                      padding: '10px 14px',
                      borderRadius: isMine
                        ? (msg.reply_to_content ? '12px 4px 4px 12px' : '16px 16px 4px 16px')
                        : (msg.reply_to_content ? '4px 12px 12px 12px' : '16px 16px 16px 4px'),
                      boxShadow: isMine ? '0 2px 8px rgba(45,106,79,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
                      fontSize: 14, lineHeight: 1.5,
                      opacity: msg.deleted ? 0.6 : 1,
                    }}>
                      {msg.is_bot && !msg.deleted && !msg.content?.startsWith('🧾') && (
                        <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4, opacity: 0.7, color: '#C9860A' }}>
                          🤖 Réponse automatique
                        </div>
                      )}
                      {msg.image_url && !msg.deleted && (
                        <img src={msg.image_url} alt="img" style={{ width: '100%', borderRadius: 8, marginBottom: 6, maxHeight: 200, objectFit: 'cover' }} />
                      )}
                      {msg.is_bot && !msg.deleted && msg.content?.startsWith('🧾') ? (
                        <ReceiptCard content={msg.content} />
                      ) : (
                        <div style={{ fontStyle: msg.deleted ? 'italic' : 'normal', opacity: msg.deleted ? 0.7 : 1, whiteSpace: 'pre-wrap' }}>
                          {msg.content}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 }}>
                        <span style={{ fontSize: 10, opacity: 0.6 }}>{getTime(msg.created_at)}</span>
                        {isMine && !msg.deleted && (
                          <span style={{ fontSize: 10, opacity: 0.8 }}>{msg.read ? '✓✓' : '✓'}</span>
                        )}
                      </div>
                    </div>

                    {hoveredMsg === msg.id && !msg.deleted && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 4, animation: 'fadeIn 0.15s ease' }}>
                        <button
                          onClick={() => { setReplyingTo(msg); textareaRef.current?.focus() }}
                          style={{
                            background: 'white', border: '1px solid #E8D5B0',
                            borderRadius: 12, padding: '3px 8px',
                            fontSize: 11, cursor: 'pointer', color: '#5C3317',
                          }}
                        >↩️ Répondre</button>
                        {(isMine || isAdmin) && (
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            style={{
                              background: '#fee2e2', border: 'none',
                              borderRadius: 12, padding: '3px 8px',
                              fontSize: 11, cursor: 'pointer', color: '#e53e3e',
                            }}
                          >🗑️</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #C9860A, #E8A020)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                }}>🤖</div>
                <div style={{
                  background: 'white', padding: '12px 16px',
                  borderRadius: '16px 16px 16px 4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  display: 'flex', gap: 4, alignItems: 'center',
                }}>
                  {['dot1', 'dot2', 'dot3'].map(cls => (
                    <div key={cls} className={cls} style={{ width: 7, height: 7, borderRadius: '50%', background: '#7A5C42' }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {isAdmin && (
            <div style={{ padding: '8px 16px', background: 'white', borderTop: '1px solid #F5ECD7', display: 'flex', gap: 6, overflowX: 'auto' }}>
              {QUICK_REPLIES.map((qr, i) => (
                <button key={i} onClick={() => { setNewMsg(qr); textareaRef.current?.focus() }} style={{
                  padding: '5px 12px', borderRadius: 16, border: '1px solid #E8D5B0',
                  background: '#F5ECD7', color: '#5C3317', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                }}>{qr}</button>
              ))}
            </div>
          )}

          {replyingTo && (
            <div style={{
              background: '#EDE0C8', padding: '8px 16px', borderTop: '1px solid #E8D5B0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ fontSize: 12, color: '#5C3317' }}>
                <span style={{ fontWeight: 700 }}>↩️ Répondre à : </span>
                <span style={{ opacity: 0.8 }}>{replyingTo.content.slice(0, 60)}{replyingTo.content.length > 60 ? '…' : ''}</span>
              </div>
              <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#5C3317', padding: '0 4px' }}>✕</button>
            </div>
          )}

          {!activeConv.blocked ? (
            <div style={{ background: 'white', borderTop: '1px solid #E8D5B0', position: 'relative' }}>

              {showEmoji && (
                <div
                  style={{
                    position: 'absolute', bottom: '100%', left: 16,
                    background: 'white', borderRadius: 16,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    padding: 12, display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)',
                    gap: 4, zIndex: 100, border: '1px solid #E8D5B0',
                    animation: 'fadeIn 0.15s ease',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {EMOJIS.map((e) => (
                    <button key={e}
                      onClick={() => { setNewMsg(prev => prev + e); textareaRef.current?.focus() }}
                      style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', padding: 4, borderRadius: 8 }}
                      onMouseEnter={ev => (ev.currentTarget.style.background = '#F5ECD7')}
                      onMouseLeave={ev => (ev.currentTarget.style.background = 'none')}
                    >{e}</button>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '10px 14px' }}>
                <button onClick={(e) => { e.stopPropagation(); setShowEmoji(!showEmoji) }} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', padding: 4, flexShrink: 0 }}>😊</button>

                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                <button onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 4, flexShrink: 0 }}>📎</button>

                {imageFile && (
                  <div style={{ fontSize: 11, color: '#2D6A4F', alignSelf: 'center', background: '#D8F3DC', padding: '4px 8px', borderRadius: 8, flexShrink: 0 }}>
                    📷 {imageFile.name.slice(0, 15)}…
                    <button onClick={() => setImageFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', marginLeft: 4 }}>✕</button>
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Écrire un message…"
                  rows={1}
                  style={{
                    flex: 1, padding: '10px 16px',
                    border: '1.5px solid #E8D5B0', borderRadius: 22,
                    fontSize: 14, fontFamily: 'sans-serif',
                    resize: 'none', outline: 'none',
                    background: '#F5ECD7', lineHeight: 1.5,
                    maxHeight: 120, overflowY: 'auto',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#3A1F0A'}
                  onBlur={e => e.currentTarget.style.borderColor = '#E8D5B0'}
                />

                <button onClick={sendMessage} style={{
                  background: newMsg.trim() || imageFile ? 'linear-gradient(135deg, #2D6A4F, #1B5E3B)' : '#E8D5B0',
                  color: newMsg.trim() || imageFile ? 'white' : '#9A7B5A',
                  border: 'none', borderRadius: '50%', width: 42, height: 42, cursor: 'pointer',
                  fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.15s',
                  boxShadow: newMsg.trim() || imageFile ? '0 3px 10px rgba(45,106,79,0.35)' : 'none',
                }}>➤</button>
              </div>
            </div>
          ) : (
            <div style={{ background: '#fee2e2', padding: 14, textAlign: 'center', fontSize: 13, color: '#991b1b', borderTop: '1px solid #fca5a5', fontWeight: 600 }}>
              🚫 Cette conversation est bloquée
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 72, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>💬</div>
          <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 22, margin: 0 }}>Vos messages</h2>
          <p style={{ color: '#7A5C42', fontSize: 14, margin: 0 }}>Sélectionnez une conversation pour commencer</p>
        </div>
      )}
    </div>
  )
}
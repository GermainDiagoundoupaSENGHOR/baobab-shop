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

// ✅ Couleur unique et cohérente par nom
const getAvatarStyle = (name: string) => {
  const palettes = [
    { bg: 'linear-gradient(135deg, #1B6FBE, #0D4A8A)', shadow: 'rgba(27,111,190,0.4)' },
    { bg: 'linear-gradient(135deg, #BE5A1B, #8A3A0D)', shadow: 'rgba(190,90,27,0.4)' },
    { bg: 'linear-gradient(135deg, #1BBE5A, #0D8A3A)', shadow: 'rgba(27,190,90,0.4)' },
    { bg: 'linear-gradient(135deg, #8B1BBE, #5A0D8A)', shadow: 'rgba(139,27,190,0.4)' },
    { bg: 'linear-gradient(135deg, #BE1B1B, #8A0D0D)', shadow: 'rgba(190,27,27,0.4)' },
    { bg: 'linear-gradient(135deg, #1BBEBE, #0D8A8A)', shadow: 'rgba(27,190,190,0.4)' },
    { bg: 'linear-gradient(135deg, #BE961B, #8A660D)', shadow: 'rgba(190,150,27,0.4)' },
    { bg: 'linear-gradient(135deg, #3A1F0A, #5C3317)', shadow: 'rgba(58,31,10,0.4)'  },
    { bg: 'linear-gradient(135deg, #BE1B7A, #8A0D50)', shadow: 'rgba(190,27,122,0.4)' },
    { bg: 'linear-gradient(135deg, #1B4FBE, #0D308A)', shadow: 'rgba(27,79,190,0.4)'  },
  ]
  let hash = 0
  for (const c of (name || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return palettes[Math.abs(hash) % palettes.length]
}

const playNotifSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3)
  } catch {}
}

const STYLE = `
  @keyframes dotBounce {
    0%,80%,100%{transform:translateY(0);opacity:.4}
    40%{transform:translateY(-6px);opacity:1}
  }
  @keyframes fadeIn {
    from{opacity:0;transform:translateY(6px)}
    to{opacity:1;transform:translateY(0)}
  }
  @keyframes slideIn {
    from{opacity:0;transform:translateX(-8px)}
    to{opacity:1;transform:translateX(0)}
  }
  @keyframes spin {
    from{transform:rotate(0deg)} to{transform:rotate(360deg)}
  }
  @keyframes pulse {
    0%,100%{transform:scale(1)} 50%{transform:scale(1.05)}
  }
  .msg-bubble{animation:fadeIn .2s ease}
  .conv-item{animation:slideIn .15s ease}
  .dot1{animation:dotBounce 1.2s infinite 0s}
  .dot2{animation:dotBounce 1.2s infinite .2s}
  .dot3{animation:dotBounce 1.2s infinite .4s}
  .spinner{animation:spin .8s linear infinite}
  .avatar-pulse{animation:pulse 2s ease infinite}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:#E8D5B0;border-radius:4px}
`

// ✅ Composant Avatar amélioré
function Avatar({
  name, size = 44, src, isBot = false, showStatus = false, online = false
}: {
  name: string, size?: number, src?: string | null,
  isBot?: boolean, showStatus?: boolean, online?: boolean
}) {
  const style = getAvatarStyle(name)
  const initials = getInitials(name)
  const fontSize = size * 0.38

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: isBot ? 'linear-gradient(135deg, #C9860A, #E8A020)' : style.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontWeight: 800, fontSize,
        boxShadow: `0 3px 10px ${isBot ? 'rgba(201,134,10,0.4)' : style.shadow}`,
        border: '2px solid rgba(255,255,255,0.3)',
        overflow: 'hidden',
        letterSpacing: 0.5,
      }}>
        {isBot ? (
          <span style={{ fontSize: size * 0.45 }}>🤖</span>
        ) : src ? (
          <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {showStatus && (
        <div style={{
          position: 'absolute', bottom: 1, right: 1,
          width: size * 0.28, height: size * 0.28,
          borderRadius: '50%',
          background: online ? '#22C55E' : '#9CA3AF',
          border: '2px solid white',
          boxShadow: online ? '0 0 0 2px rgba(34,197,94,0.3)' : 'none',
        }} />
      )}
    </div>
  )
}

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
  const [imagePreview, setImagePreview]   = useState<string | null>(null)
  const [uploading, setUploading]         = useState(false)
  const [uploadError, setUploadError]     = useState<string | null>(null)
  const [search, setSearch]               = useState('')
  const [filter, setFilter]               = useState<'all' | 'unread' | 'archived'>('all')
  const [showEmoji, setShowEmoji]         = useState(false)
  const [replyingTo, setReplyingTo]       = useState<ChatMessage | null>(null)
  const [hoveredMsg, setHoveredMsg]       = useState<string | null>(null)
  const [retentionDays, setRetentionDays] = useState<number>(30)
  const [cleanupMsg, setCleanupMsg]       = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeout  = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef   = useRef<HTMLInputElement>(null)
  const textareaRef    = useRef<HTMLTextAreaElement>(null)
  const prevMsgCount   = useRef(-1)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (prevMsgCount.current !== -1 && messages.length > prevMsgCount.current) {
      const last = messages[messages.length - 1]
      if (last?.sender_id !== user?.id) playNotifSound()
    }
    prevMsgCount.current = messages.length
  }, [messages])

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = STYLE
    document.head.appendChild(style)
    init()
    return () => { document.head.removeChild(style) }
  }, [])

  useEffect(() => {
    if (!activeConv || !user) return
    loadMessages(activeConv.id)
    const channel = supabase
      .channel('messages-' + activeConv.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${activeConv.id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as ChatMessage])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeConv, user])

  const init = async () => {
    const { data: authData } = await supabase.auth.getUser()
    const u = authData.user
    setUser(u)
    const admin = u?.email === ADMIN_EMAIL
    setIsAdmin(admin)
    const settings = await loadBotSettings()
    await loadBotReplies()
    await loadRetentionSettings()
    if (admin) {
      await loadAllConversations()
      await cleanupOldMessages()  // ✅ Nettoyage auto au démarrage
    } else if (u) {
      await loadOrCreateConversation(u, settings)
    }
    setLoading(false)
  }

  // ✅ Charger la durée de rétention
  const loadRetentionSettings = async () => {
    const { data } = await supabase.from('app_settings').select('message_retention_days').single()
    if (data) setRetentionDays(data.message_retention_days)
  }

  // ✅ Nettoyage automatique des vieux messages
  const cleanupOldMessages = async () => {
    const { data: settings } = await supabase
      .from('app_settings').select('message_retention_days').single()
    if (!settings) return
    const days = settings.message_retention_days
    if (days === 0) return  // 0 = conserver indéfiniment

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    const { count } = await supabase
      .from('messages')
      .delete()
      .lt('created_at', cutoff.toISOString())
      .select('*', { count: 'exact', head: true })

    if (count && count > 0) {
      setCleanupMsg(`🗑️ ${count} message${count > 1 ? 's' : ''} supprimé${count > 1 ? 's' : ''} (>${days} jours)`)
      setTimeout(() => setCleanupMsg(null), 5000)
    }
  }

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
      .from('conversations').select('*')
      .order('last_message_at', { ascending: false })
    if (data) setConversations(data)
  }

  const loadOrCreateConversation = async (u: any, settings: BotSettings | null) => {
    let { data } = await supabase
      .from('conversations').select('*').eq('client_id', u.id).single()
    if (!data) {
      const { data: newConv } = await supabase.from('conversations').insert({
        client_id: u.id,
        client_name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Client',
        client_avatar: '', last_message: '', unread_count: 0,
      }).select().single()
      data = newConv
    }
    if (data) {
      setConversations([data])
      setActiveConv(data)
      const { data: msgs } = await supabase
        .from('messages').select('*').eq('conversation_id', data.id).limit(1)
      if (!msgs || msgs.length === 0) {
        await sendBotMessage(data.id, settings?.welcome_message || '👋 Bienvenue chez B@OB@B Shop ! Comment puis-je vous aider ?')
      }
    }
  }

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from('messages').select('*').eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    if (data) { prevMsgCount.current = data.length; setMessages(data) }
    await supabase.from('messages').update({ read: true })
      .eq('conversation_id', convId).eq('read', false).neq('sender_id', user?.id ?? '')
    await supabase.from('conversations').update({ unread_count: 0 }).eq('id', convId)
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
      conversation_id: convId, sender_id: null, content, is_bot: true, read: false,
    })
    await supabase.from('conversations').update({
      last_message: content, last_message_at: new Date().toISOString(),
    }).eq('id', convId)
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true)
    setUploadError(null)
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filename = `${Date.now()}_${cleanName}`
      const { data, error } = await supabase.storage
        .from('chat-images').upload(filename, file, {
          cacheControl: '3600', upsert: false, contentType: file.type,
        })
      if (error) { setUploadError('❌ Erreur : ' + error.message); setUploading(false); return null }
      const { data: urlData } = supabase.storage.from('chat-images').getPublicUrl(data.path)
      setUploading(false)
      return urlData.publicUrl
    } catch (err: any) {
      setUploadError('❌ ' + err.message)
      setUploading(false)
      return null
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setUploadError('❌ Max 5MB'); return }
    if (!file.type.startsWith('image/')) { setUploadError('❌ Image uniquement'); return }
    setUploadError(null)
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const cancelImage = () => {
    setImageFile(null); setImagePreview(null); setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const sendMessage = async () => {
    if (!newMsg.trim() && !imageFile) return
    if (!activeConv || !user || uploading) return
    let image_url: string | null = null
    if (imageFile) {
      image_url = await uploadImage(imageFile)
      if (!image_url) return
      setImageFile(null); setImagePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    const content = newMsg.trim() || '📷 Image'
    await supabase.from('messages').insert({
      conversation_id: activeConv.id, sender_id: user.id, content,
      type: image_url ? 'image' : 'text', image_url,
      is_bot: false, read: false,
      reply_to_id: replyingTo?.id || null,
      reply_to_content: replyingTo?.content || null,
    })
    await supabase.from('conversations').update({
      last_message: image_url ? '📷 Image' : content,
      last_message_at: new Date().toISOString(),
      unread_count: isAdmin ? 0 : (activeConv.unread_count || 0) + 1,
    }).eq('id', activeConv.id)
    const textForReply = newMsg
    setNewMsg(''); setReplyingTo(null); setShowEmoji(false)
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

  const deleteMessage = async (msgId: string) => {
    if (!window.confirm('Supprimer ce message ?')) return
    await supabase.from('messages')
      .update({ deleted: true, content: '🗑️ Message supprimé' }).eq('id', msgId)
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

  const messagesWithSeparators = () => {
    const result: (ChatMessage | { type: 'separator'; label: string; key: string })[] = []
    let lastDate = ''
    for (const msg of messages) {
      const d = new Date(msg.created_at).toDateString()
      if (d !== lastDate) {
        result.push({ type: 'separator', label: getDateLabel(msg.created_at), key: 'sep-' + d })
        lastDate = d
      }
      result.push(msg.deleted ? { ...msg, content: '🗑️ Message supprimé' } : msg)
    }
    return result
  }

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <p style={{ color: 'rgba(245,236,215,0.7)', fontSize: 12, margin: 0 }}>
              {conversations.filter(c => c.unread_count > 0).length} non lu{conversations.filter(c => c.unread_count > 0).length > 1 ? 's' : ''}
            </p>
            {isAdmin && retentionDays > 0 && (
              <span style={{ color: 'rgba(245,236,215,0.5)', fontSize: 10 }}>
                🗓️ Rétention : {retentionDays}j
              </span>
            )}
          </div>
        </div>

        {/* Nettoyage auto message */}
        {cleanupMsg && (
          <div style={{ background: '#FEF9C3', color: '#92400E', fontSize: 11, padding: '6px 14px', fontWeight: 600, borderBottom: '1px solid #FDE68A' }}>
            {cleanupMsg}
          </div>
        )}

        <div style={{ padding: '12px 14px', borderBottom: '1px solid #F5ECD7' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#7A5C42' }}>🔍</span>
            <input type="text" placeholder="Rechercher…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1.5px solid #E8D5B0', borderRadius: 20, fontSize: 13, background: '#F5ECD7', boxSizing: 'border-box' as const, outline: 'none' }}
            />
          </div>
        </div>

        {isAdmin && (
          <div style={{ padding: '8px 14px 10px', borderBottom: '1px solid #F5ECD7', display: 'flex', gap: 6 }}>
            {[{ key: 'all', label: 'Tous' }, { key: 'unread', label: '🔴 Non lus' }, { key: 'archived', label: '📁 Archivés' }].map((f) => (
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
          ) : filteredConversations.map((c) => {
            const avatarStyle = getAvatarStyle(c.client_name)
            return (
              <div key={c.id} className="conv-item" onClick={() => setActiveConv(c)} style={{
                padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer', borderBottom: '1px solid #F5ECD7',
                background: activeConv?.id === c.id ? 'linear-gradient(135deg, #F5ECD7, #EDE0C8)' : 'white',
                opacity: c.blocked ? 0.5 : 1, transition: 'all 0.15s',
                borderLeft: activeConv?.id === c.id ? '4px solid #3A1F0A' : '4px solid transparent',
              }}>
                {/* ✅ Avatar amélioré dans la liste */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: avatarStyle.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 800, fontSize: 17,
                    boxShadow: `0 3px 10px ${avatarStyle.shadow}`,
                    border: '2px solid rgba(255,255,255,0.35)',
                    letterSpacing: 0.5,
                  }}>
                    {getInitials(c.client_name)}
                  </div>
                  {/* Pastille online */}
                  <div style={{
                    position: 'absolute', bottom: 1, right: 1,
                    width: 13, height: 13, borderRadius: '50%',
                    background: '#22C55E', border: '2px solid white',
                    boxShadow: '0 0 0 2px rgba(34,197,94,0.25)',
                  }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#2C1A0E' }}>{c.client_name}</span>
                    <span style={{ fontSize: 10, color: '#9A7B5A' }}>{getTime(c.last_message_at)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: c.unread_count > 0 ? '#3A1F0A' : '#7A5C42', fontWeight: c.unread_count > 0 ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.last_message || 'Nouvelle conversation'}
                  </div>
                </div>

                {c.unread_count > 0 && (
                  <div style={{ background: '#2D6A4F', color: 'white', borderRadius: 12, minWidth: 22, height: 22, padding: '0 6px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(45,106,79,0.4)' }}>
                    {c.unread_count > 9 ? '9+' : c.unread_count}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── ZONE CHAT ── */}
      {activeConv ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Header */}
          <div style={{ background: 'white', padding: '12px 20px', borderBottom: '1px solid #E8D5B0', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Avatar name={activeConv.client_name} size={46} showStatus online />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#2C1A0E' }}>{activeConv.client_name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: activeConv.blocked ? '#e53e3e' : '#22C55E', boxShadow: activeConv.blocked ? 'none' : '0 0 0 2px rgba(34,197,94,0.2)' }} />
                <span style={{ fontSize: 11, color: activeConv.blocked ? '#e53e3e' : '#2D6A4F', fontWeight: 600 }}>
                  {activeConv.blocked ? 'Bloqué' : 'En ligne'}
                </span>
              </div>
            </div>
            {isAdmin && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button onClick={() => archiveConversation(activeConv.id, !activeConv.archived)} style={{ background: '#F5ECD7', border: '1px solid #E8D5B0', borderRadius: 20, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#5C3317' }}>
                  {activeConv.archived ? '📂 Désarchiver' : '📁 Archiver'}
                </button>
                <button onClick={() => blockConversation(activeConv.id, !activeConv.blocked)} style={{ background: activeConv.blocked ? '#D8F3DC' : '#fee2e2', border: 'none', borderRadius: 20, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: activeConv.blocked ? '#2D6A4F' : '#e53e3e' }}>
                  {activeConv.blocked ? '✅ Débloquer' : '🚫 Bloquer'}
                </button>
              </div>
            )}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4, background: '#F5ECD7' }}
            onClick={() => setShowEmoji(false)}>

            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <span style={{ background: 'white', color: '#7A5C42', fontSize: 11, padding: '5px 14px', borderRadius: 20, fontWeight: 600, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                🔒 Conversation sécurisée
                {retentionDays > 0 && isAdmin && ` · Messages conservés ${retentionDays} jours`}
              </span>
            </div>

            {messagesWithSeparators().map((item: any) => {
              if (item.type === 'separator') return (
                <div key={item.key} style={{ textAlign: 'center', margin: '12px 0 8px' }}>
                  <span style={{ background: 'rgba(255,255,255,0.85)', color: '#7A5C42', fontSize: 11, padding: '4px 14px', borderRadius: 20, fontWeight: 600 }}>{item.label}</span>
                </div>
              )

              const msg = item as ChatMessage
              const isMine = isAdmin
                ? !msg.is_bot && msg.sender_id !== activeConv.client_id
                : msg.sender_id === user?.id

              return (
                <div key={msg.id} className="msg-bubble"
                  style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 4, alignItems: 'flex-end', gap: 8 }}
                  onMouseEnter={() => setHoveredMsg(msg.id)}
                  onMouseLeave={() => setHoveredMsg(null)}
                >
                  {/* ✅ Avatar dans les messages */}
                  {!isMine && (
                    <Avatar
                      name={msg.is_bot ? 'Bot' : activeConv.client_name}
                      size={32}
                      isBot={msg.is_bot}
                    />
                  )}

                  <div style={{ maxWidth: '68%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                    {msg.reply_to_content && (
                      <div style={{ background: isMine ? 'rgba(255,255,255,0.2)' : '#E8D5B0', borderLeft: `3px solid ${isMine ? 'white' : '#8B5E3C'}`, padding: '5px 10px', borderRadius: '8px 8px 0 0', fontSize: 11, color: isMine ? 'rgba(255,255,255,0.85)' : '#5C3317', maxWidth: '100%', marginBottom: -4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        ↩️ {msg.reply_to_content}
                      </div>
                    )}

                    <div style={{
                      background: isMine
                        ? 'linear-gradient(135deg, #2D6A4F, #1B5E3B)'
                        : msg.is_bot ? 'linear-gradient(135deg, #FFF8E7, #FFF3D4)' : 'white',
                      color: isMine ? 'white' : '#2C1A0E',
                      padding: '10px 14px',
                      borderRadius: isMine
                        ? (msg.reply_to_content ? '12px 4px 4px 12px' : '16px 16px 4px 16px')
                        : (msg.reply_to_content ? '4px 12px 12px 12px' : '4px 16px 16px 16px'),
                      boxShadow: isMine ? '0 2px 8px rgba(45,106,79,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
                      fontSize: 14, lineHeight: 1.5, opacity: msg.deleted ? 0.6 : 1,
                    }}>
                      {msg.is_bot && !msg.deleted && (
                        <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4, opacity: 0.7, color: '#C9860A' }}>🤖 Réponse automatique</div>
                      )}
                      {msg.image_url && !msg.deleted && (
                        <img src={msg.image_url} alt="img" style={{ width: '100%', borderRadius: 8, marginBottom: 6, maxHeight: 200, objectFit: 'cover', cursor: 'pointer' }}
                          onClick={() => window.open(msg.image_url, '_blank')} />
                      )}
                      <div style={{ fontStyle: msg.deleted ? 'italic' : 'normal', opacity: msg.deleted ? 0.7 : 1 }}>
                        {msg.content}
                      </div>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 }}>
                        <span style={{ fontSize: 10, opacity: 0.6 }}>{getTime(msg.created_at)}</span>
                        {isMine && !msg.deleted && <span style={{ fontSize: 10, opacity: 0.8 }}>{msg.read ? '✓✓' : '✓'}</span>}
                      </div>
                    </div>

                    {hoveredMsg === msg.id && !msg.deleted && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 4, animation: 'fadeIn 0.15s ease' }}>
                        <button onClick={() => { setReplyingTo(msg); textareaRef.current?.focus() }} style={{ background: 'white', border: '1px solid #E8D5B0', borderRadius: 12, padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: '#5C3317' }}>↩️ Répondre</button>
                        {(isMine || isAdmin) && (
                          <button onClick={() => deleteMessage(msg.id)} style={{ background: '#fee2e2', border: 'none', borderRadius: 12, padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: '#e53e3e' }}>🗑️</button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Avatar admin à droite */}
                  {isMine && (
                    <Avatar name="Admin" size={32} />
                  )}
                </div>
              )
            })}

            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <Avatar name="Bot" size={32} isBot />
                <div style={{ background: 'white', padding: '12px 16px', borderRadius: '4px 16px 16px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', gap: 4, alignItems: 'center' }}>
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
                <button key={i} onClick={() => { setNewMsg(qr); textareaRef.current?.focus() }} style={{ padding: '5px 12px', borderRadius: 16, border: '1px solid #E8D5B0', background: '#F5ECD7', color: '#5C3317', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>{qr}</button>
              ))}
            </div>
          )}

          {replyingTo && (
            <div style={{ background: '#EDE0C8', padding: '8px 16px', borderTop: '1px solid #E8D5B0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 12, color: '#5C3317' }}>
                <span style={{ fontWeight: 700 }}>↩️ Répondre à : </span>
                <span style={{ opacity: 0.8 }}>{replyingTo.content.slice(0, 60)}{replyingTo.content.length > 60 ? '…' : ''}</span>
              </div>
              <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#5C3317' }}>✕</button>
            </div>
          )}

          {!activeConv.blocked ? (
            <div style={{ background: 'white', borderTop: '1px solid #E8D5B0', position: 'relative' }}>
              {showEmoji && (
                <div style={{ position: 'absolute', bottom: '100%', left: 16, background: 'white', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', padding: 12, display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4, zIndex: 100, border: '1px solid #E8D5B0', animation: 'fadeIn 0.15s ease' }}
                  onClick={(e) => e.stopPropagation()}>
                  {EMOJIS.map((e) => (
                    <button key={e} onClick={() => { setNewMsg(prev => prev + e); textareaRef.current?.focus() }}
                      style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', padding: 4, borderRadius: 8 }}
                      onMouseEnter={ev => (ev.currentTarget.style.background = '#F5ECD7')}
                      onMouseLeave={ev => (ev.currentTarget.style.background = 'none')}
                    >{e}</button>
                  ))}
                </div>
              )}

              {imagePreview && (
                <div style={{ padding: '10px 14px 0', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={imagePreview} alt="aperçu" style={{ height: 80, width: 80, objectFit: 'cover', borderRadius: 10, border: '2px solid #E8D5B0' }} />
                    <button onClick={cancelImage} style={{ position: 'absolute', top: -6, right: -6, background: '#e53e3e', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>✕</button>
                  </div>
                  <div style={{ fontSize: 12, color: '#7A5C42', alignSelf: 'center' }}>
                    <div style={{ fontWeight: 600, color: '#3A1F0A' }}>📷 {imageFile?.name.slice(0, 20)}</div>
                    <div>{imageFile ? Math.round(imageFile.size / 1024) : 0} Ko</div>
                  </div>
                </div>
              )}

              {uploadError && (
                <div style={{ padding: '6px 14px', background: '#fee2e2', color: '#991b1b', fontSize: 12, fontWeight: 600 }}>
                  {uploadError}
                  <button onClick={() => setUploadError(null)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontWeight: 700 }}>✕</button>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '10px 14px' }}>
                <button onClick={(e) => { e.stopPropagation(); setShowEmoji(!showEmoji) }} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', padding: 4, flexShrink: 0 }}>😊</button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: 'none' }} onChange={handleImageSelect} />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ background: 'none', border: 'none', fontSize: 20, cursor: uploading ? 'not-allowed' : 'pointer', padding: 4, flexShrink: 0, opacity: uploading ? 0.5 : 1 }}>📎</button>
                <textarea ref={textareaRef} value={newMsg} onChange={(e) => setNewMsg(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Écrire un message…" rows={1}
                  style={{ flex: 1, padding: '10px 16px', border: '1.5px solid #E8D5B0', borderRadius: 22, fontSize: 14, fontFamily: 'sans-serif', resize: 'none', outline: 'none', background: '#F5ECD7', lineHeight: 1.5, maxHeight: 120, overflowY: 'auto', transition: 'border-color 0.15s' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#3A1F0A'}
                  onBlur={e => e.currentTarget.style.borderColor = '#E8D5B0'}
                />
                <button onClick={sendMessage} disabled={uploading || (!newMsg.trim() && !imageFile)} style={{
                  background: uploading ? '#E8D5B0' : (newMsg.trim() || imageFile) ? 'linear-gradient(135deg, #2D6A4F, #1B5E3B)' : '#E8D5B0',
                  color: (newMsg.trim() || imageFile) && !uploading ? 'white' : '#9A7B5A',
                  border: 'none', borderRadius: '50%', width: 42, height: 42,
                  cursor: uploading || (!newMsg.trim() && !imageFile) ? 'not-allowed' : 'pointer',
                  fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.15s',
                  boxShadow: (newMsg.trim() || imageFile) && !uploading ? '0 3px 10px rgba(45,106,79,0.35)' : 'none',
                }}>
                  {uploading
                    ? <div className="spinner" style={{ width: 18, height: 18, border: '2px solid #9A7B5A', borderTop: '2px solid transparent', borderRadius: '50%' }} />
                    : '➤'}
                </button>
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
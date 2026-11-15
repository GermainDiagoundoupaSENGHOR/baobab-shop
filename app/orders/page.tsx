'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/* ─── Statuts ───────────────────────────────────────────────────────── */
const STATUS = {
  en_attente:   { label: 'En attente',   bg: '#FEF3C7', color: '#92400E', icon: '⏳' },
  confirme:     { label: 'Confirmé',     bg: '#D1FAE5', color: '#065F46', icon: '✅' },
  en_livraison: { label: 'En livraison', bg: '#DBEAFE', color: '#1E40AF', icon: '🚚' },
  livre:        { label: 'Livré',        bg: '#D8F3DC', color: '#1B5E3B', icon: '📦' },
  annule:       { label: 'Annulé',       bg: '#FEE2E2', color: '#991B1B', icon: '✖️' },
} as const
type StatusKey = keyof typeof STATUS
const STEPS: StatusKey[] = ['en_attente', 'confirme', 'en_livraison', 'livre']

// Accepte "En attente", "en_attente", "confirmé", "livrée"...
const normStatus = (s: string | null | undefined): StatusKey => {
  const k = (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[\s-]+/g, '_')
  if (k.startsWith('confirm')) return 'confirme'
  if (k.startsWith('livr') && k.includes('ison')) return 'en_livraison'
  if (k === 'en_livraison') return 'en_livraison'
  if (k.startsWith('livre')) return 'livre'
  if (k.startsWith('annul') || k === 'cancelled') return 'annule'
  return 'en_attente'
}

const payLabel = (m: string | null) =>
  m === 'wave' ? '🌊 Wave' : m === 'orange' ? '🟠 Orange Money'
  : m === 'bank' ? '🏦 Virement bancaire' : m === 'cash' ? '💵 Espèces' : (m || '—')

const fmt = (n: number) => Number(n || 0).toLocaleString('fr-FR')

const fmtDate = (d: string) => {
  const dt = new Date(d)
  return `${dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à ${dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
}

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function Orders() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [name, setName] = useState('')
  const [orders, setOrders] = useState<any[]>([])
  const [zones, setZones] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState<'all' | StatusKey>('all')
  const [open, setOpen] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const load = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('orders').select('*').eq('user_id', uid)
      .order('created_at', { ascending: false })
    if (data) { setOrders(data); setUpdatedAt(new Date()) }
  }, [])

  useEffect(() => {
    let channel: any = null
    let timer: any = null

    const init = async () => {
      const { data: auth } = await supabase.auth.getUser()
      const u = auth.user
      setUser(u)
      if (!u) { setLoading(false); return }

      const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', u.id).maybeSingle()
      setName(prof?.full_name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'Client')

      const { data: z } = await supabase.from('delivery_zones').select('id, name')
      if (z) setZones(Object.fromEntries(z.map((r: any) => [String(r.id), r.name])))

      await load(u.id)
      setLoading(false)

      // Temps réel : toute création / modification de commande rafraîchit la liste
      channel = supabase
        .channel('orders-live-' + u.id)
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${u.id}` },
          () => load(u.id))
        .subscribe((status: string) => setLive(status === 'SUBSCRIBED'))

      // Filet de sécurité : actualisation toutes les 15 secondes
      timer = setInterval(() => load(u.id), 15000)
    }
    init()
    return () => {
      if (channel) supabase.removeChannel(channel)
      if (timer) clearInterval(timer)
    }
  }, [load])

  const counts = (Object.keys(STATUS) as StatusKey[]).reduce((acc, k) => {
    acc[k] = orders.filter(o => normStatus(o.status) === k).length
    return acc
  }, {} as Record<StatusKey, number>)

  const shown = filter === 'all' ? orders : orders.filter(o => normStatus(o.status) === filter)
  const totalDepense = orders.filter(o => normStatus(o.status) !== 'annule')
    .reduce((s, o) => s + Number(o.total || 0), 0)

  const card: React.CSSProperties = {
    background: 'white', borderRadius: 16, border: '1px solid #E8D5B0',
  }

  if (loading) {
    return <div style={{ background: '#F5ECD7', minHeight: '100vh', padding: 40, textAlign: 'center', color: '#7A5C42' }}>⏳ Chargement…</div>
  }

  if (!user) {
    return (
      <div style={{ background: '#F5ECD7', minHeight: '100vh', padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <p style={{ color: '#7A5C42', marginBottom: 16 }}>Connectez-vous pour voir vos commandes</p>
        <button onClick={() => router.push('/profil')} style={{ background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 20, padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>Se connecter</button>
      </div>
    )
  }

  return (
    <div style={{ background: '#F5ECD7', minHeight: '100vh', padding: '24px 16px 120px', fontFamily: 'sans-serif' }}>
      <style>{`@keyframes bbPulse { 0%,100% { opacity: 1 } 50% { opacity: .35 } }`}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>

        <button onClick={() => router.push('/profil')} style={{ background: 'none', border: 'none', color: '#3A1F0A', fontWeight: 700, fontSize: 14, cursor: 'pointer', padding: 0, marginBottom: 14 }}>
          ← Retour au profil
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 30, margin: 0 }}>📋 Cahier de Charge</h1>
            <p style={{ color: '#7A5C42', margin: '4px 0 16px', fontSize: 14 }}>Suivi de vos commandes en temps réel</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: live ? '#1B5E3B' : '#92400E', background: live ? '#D8F3DC' : '#FEF3C7', borderRadius: 20, padding: '6px 14px', marginBottom: 16 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: live ? '#22C55E' : '#F59E0B', animation: 'bbPulse 1.4s infinite' }} />
            {live ? 'En direct' : 'Actualisation auto (15 s)'}
            {updatedAt && <span style={{ fontWeight: 500, opacity: 0.75 }}>· {updatedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>}
          </div>
        </div>

        {/* PROFIL */}
        <div style={{ ...card, padding: 22, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#2D6A4F', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800 }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontWeight: 800, fontSize: 19, color: '#2C1A0E' }}>{name}</div>
            <div style={{ fontSize: 14, color: '#7A5C42' }}>{orders.length} commande{orders.length > 1 ? 's' : ''} trouvée{orders.length > 1 ? 's' : ''}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#7A5C42' }}>Total des achats</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#2D6A4F' }}>{fmt(totalDepense)} FCFA</div>
          </div>
        </div>

        {/* COMPTEURS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 18 }}>
          {(Object.keys(STATUS) as StatusKey[]).map(k => (
            <div key={k} onClick={() => setFilter(filter === k ? 'all' : k)} style={{
              ...card, padding: '18px 10px', textAlign: 'center', cursor: 'pointer',
              border: filter === k ? `2px solid ${STATUS[k].color}` : '1px solid #E8D5B0',
              background: filter === k ? STATUS[k].bg : 'white',
            }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#2C1A0E' }}>{counts[k]}</div>
              <div style={{ fontSize: 13, color: STATUS[k].color, fontWeight: 600 }}>{STATUS[k].icon} {STATUS[k].label}</div>
            </div>
          ))}
        </div>

        {/* FILTRES */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          {([['all', 'Tous'], ...(Object.keys(STATUS) as StatusKey[]).map(k => [k, STATUS[k].label])] as [string, string][]).map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k as any)} style={{
              padding: '9px 20px', borderRadius: 24, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              border: '1.5px solid #E8D5B0',
              background: filter === k ? '#3A1F0A' : 'white',
              color: filter === k ? 'white' : '#3A1F0A',
            }}>{label}</button>
          ))}
        </div>

        {/* LISTE */}
        {shown.length === 0 ? (
          <div style={{ ...card, padding: 50, textAlign: 'center', color: '#7A5C42' }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🛍️</div>
            <p style={{ margin: 0 }}>{orders.length === 0 ? "Vous n'avez pas encore de commande." : 'Aucune commande dans ce statut.'}</p>
            {orders.length === 0 && (
              <button onClick={() => router.push('/')} style={{ marginTop: 16, background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 20, padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>Découvrir la boutique</button>
            )}
          </div>
        ) : shown.map(o => {
          const st = normStatus(o.status)
          const isOpen = open === o.id
          const items: any[] = Array.isArray(o.items) ? o.items : []
          const nbArticles = items.reduce((s, i) => s + Number(i.quantity || 1), 0)
          const ref = String(o.id).slice(0, 8).toUpperCase()
          const stepIdx = STEPS.indexOf(st)
          const zoneName = o.delivery_zone ? (zones[String(o.delivery_zone)] || o.delivery_zone) : ''

          return (
            <div key={o.id} style={{ ...card, marginBottom: 14, overflow: 'hidden' }}>
              <div onClick={() => setOpen(isOpen ? null : o.id)} style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
                <div style={{ width: 54, height: 54, borderRadius: 12, background: '#F5ECD7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>📦</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: 16, color: '#2C1A0E' }}>Commande #{ref}</span>
                    <span style={{ background: STATUS[st].bg, color: STATUS[st].color, fontSize: 12, fontWeight: 700, borderRadius: 12, padding: '3px 12px' }}>{STATUS[st].icon} {STATUS[st].label}</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#7A5C42', marginTop: 4 }}>{nbArticles} article(s) · <b style={{ color: '#2C1A0E' }}>{fmt(o.total)} FCFA</b></div>
                  <div style={{ fontSize: 13, color: '#9A7B5A' }}>{o.created_at ? fmtDate(o.created_at) : ''}</div>
                </div>
                <div style={{ fontSize: 18, color: '#7A5C42', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</div>
              </div>

              {isOpen && (
                <div style={{ borderTop: '1px solid #F5ECD7', padding: '18px 22px', background: '#FDFAF5' }}>

                  {/* SUIVI */}
                  {st === 'annule' ? (
                    <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 10, padding: '10px 14px', fontWeight: 700, fontSize: 13, marginBottom: 16 }}>✖️ Cette commande a été annulée.</div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 20 }}>
                      {STEPS.map((s, i) => (
                        <div key={s} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                          {i > 0 && <div style={{ position: 'absolute', top: 15, left: '-50%', width: '100%', height: 3, background: i <= stepIdx ? '#2D6A4F' : '#E8D5B0' }} />}
                          <div style={{ position: 'relative', width: 32, height: 32, borderRadius: '50%', margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, background: i <= stepIdx ? '#2D6A4F' : '#E8D5B0', color: 'white', fontWeight: 800 }}>
                            {i <= stepIdx ? '✓' : i + 1}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: i === stepIdx ? 800 : 500, color: i <= stepIdx ? '#1B5E3B' : '#9A7B5A' }}>{STATUS[s].label}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ARTICLES */}
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#3A1F0A', marginBottom: 8 }}>🛒 Articles</div>
                  {items.map((it, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #F5ECD7' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: '#F5ECD7', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {it.image_url ? <img src={it.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🛍️'}
                      </div>
                      <div style={{ flex: 1, fontSize: 14, color: '#2C1A0E', fontWeight: 600 }}>{it.name} <span style={{ color: '#7A5C42', fontWeight: 400 }}>× {it.quantity}</span></div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E' }}>{fmt(Number(it.price) * Number(it.quantity))} FCFA</div>
                    </div>
                  ))}

                  {/* DÉTAILS */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 16 }}>
                    <div style={{ background: '#EAF7EF', border: '1px solid #BFE3CD', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#2C1A0E', lineHeight: 1.7 }}>
                      <div style={{ fontWeight: 800, color: '#1B5E3B', marginBottom: 4 }}>📦 Livraison</div>
                      {o.delivery_type === 'pickup' ? '🏪 Retrait en magasin' : '🚚 Livraison à domicile'}<br />
                      {zoneName && <>📍 {zoneName}<br /></>}
                      {o.address && <>🏠 {o.address}<br /></>}
                      {o.phone && <>📞 {o.phone}<br /></>}
                      💰 Frais : {fmt(o.delivery_fee)} FCFA
                    </div>
                    <div style={{ background: '#F3EBFF', border: '1px solid #DDD0F5', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#2C1A0E', lineHeight: 1.7 }}>
                      <div style={{ fontWeight: 800, color: '#5B2FA0', marginBottom: 4 }}>💳 Paiement</div>
                      {payLabel(o.payment_method)}<br />
                      {o.payment_phone && <>Numéro : {o.payment_phone}<br /></>}
                      <b>Total : {fmt(o.total)} FCFA</b>
                    </div>
                  </div>

                  <button onClick={() => router.push('/messages')} style={{ marginTop: 14, background: '#3A1F0A', color: 'white', border: 'none', borderRadius: 20, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    🧾 Voir mon reçu dans la messagerie
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const STATUS = {
  en_attente:   { label: 'En attente',   bg: '#FEF3C7', color: '#92400E', icon: '⏳' },
  confirme:     { label: 'Confirmé',     bg: '#D1FAE5', color: '#065F46', icon: '✅' },
  en_livraison: { label: 'En livraison', bg: '#DBEAFE', color: '#1E40AF', icon: '🚚' },
  livre:        { label: 'Livré',        bg: '#D8F3DC', color: '#1B5E3B', icon: '📦' },
  annule:       { label: 'Annulé',       bg: '#FEE2E2', color: '#991B1B', icon: '✖️' },
} as const
type StatusKey = keyof typeof STATUS

const normStatus = (s: string | null | undefined): StatusKey => {
  const k = (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[\s-]+/g, '_')
  if (k.startsWith('confirm')) return 'confirme'
  if (k === 'en_livraison' || (k.startsWith('livr') && k.includes('ison'))) return 'en_livraison'
  if (k.startsWith('livre')) return 'livre'
  if (k.startsWith('annul') || k === 'cancelled') return 'annule'
  return 'en_attente'
}

const payLabel = (m: string | null) =>
  m === 'wave' ? '🌊 Wave' : m === 'orange' ? '🟠 Orange Money'
  : m === 'bank' ? '🏦 Virement' : m === 'cash' ? '💵 Espèces' : (m || '—')

const fmt = (n: number) => Number(n || 0).toLocaleString('fr-FR')
const fmtDate = (d: string) => {
  const dt = new Date(d)
  return `${dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} à ${dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
}

export default function GestionCommandes() {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | StatusKey>('en_attente')
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  // Charge les commandes. Renvoie false si l'accès est refusé.
  const load = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) { setAllowed(false); return false }
    const res = await fetch('/api/admin-orders', { headers: { Authorization: `Bearer ${token}` } })
    if (res.status === 403) { setAllowed(false); return false }
    const json = await res.json()
    if (res.ok) { setOrders(json.orders || []); setAllowed(true) }
    return res.ok
  }, [])

  useEffect(() => {
    let timer: any
    load().then(ok => { if (ok) timer = setInterval(load, 10000) }) // actualisation toutes les 10 s
    return () => { if (timer) clearInterval(timer) }
  }, [load])

  const changeStatus = async (orderId: string, status: StatusKey, ask?: string) => {
    if (ask && !window.confirm(ask)) return
    setBusy(orderId)
    const { data } = await supabase.auth.getSession()
    const res = await fetch('/api/admin-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token}` },
      body: JSON.stringify({ orderId, status }),
    })
    const json = await res.json()
    setBusy(null)
    if (!res.ok) setToast('❌ ' + (json.error || 'Erreur'))
    else { setToast('✅ Statut mis à jour — le client a été prévenu par message'); await load() }
    setTimeout(() => setToast(''), 4000)
  }

  if (allowed === null) return <div style={{ background: '#F5ECD7', minHeight: '100vh', padding: 40, textAlign: 'center', color: '#7A5C42' }}>⏳ Chargement…</div>
  if (!allowed) {
    return (
      <div style={{ background: '#F5ECD7', minHeight: '100vh', padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <p style={{ color: '#7A5C42' }}>Accès réservé au Super Admin et aux administrateurs de B@OB@B Shop.</p>
        <button onClick={() => router.push('/profil')} style={{ background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 20, padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>Se connecter</button>
      </div>
    )
  }

  const counts = (Object.keys(STATUS) as StatusKey[]).reduce((a, k) => {
    a[k] = orders.filter(o => normStatus(o.status) === k).length
    return a
  }, {} as Record<StatusKey, number>)
  const shown = filter === 'all' ? orders : orders.filter(o => normStatus(o.status) === filter)

  const btn = (bg: string): React.CSSProperties => ({
    background: bg, color: 'white', border: 'none', borderRadius: 20,
    padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
  })

  return (
    <div style={{ background: '#F5ECD7', minHeight: '100vh', padding: '24px 16px 120px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 28, margin: 0 }}>🧾 Gestion des commandes</h1>
        <p style={{ color: '#7A5C42', margin: '4px 0 18px', fontSize: 14 }}>
          Confirmez les paiements reçus : le client est prévenu dans sa messagerie. Sans action de votre part, une commande « en attente » est confirmée automatiquement.
        </p>

        {toast && <div style={{ background: toast.startsWith('✅') ? '#D8F3DC' : '#FEE2E2', color: toast.startsWith('✅') ? '#065F46' : '#991B1B', borderRadius: 10, padding: '10px 16px', fontWeight: 700, fontSize: 13, marginBottom: 14 }}>{toast}</div>}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          {([['all', `Toutes (${orders.length})`], ...(Object.keys(STATUS) as StatusKey[]).map(k => [k, `${STATUS[k].icon} ${STATUS[k].label} (${counts[k]})`])] as [string, string][]).map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k as any)} style={{
              padding: '9px 18px', borderRadius: 24, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              border: '1.5px solid #E8D5B0', background: filter === k ? '#3A1F0A' : 'white', color: filter === k ? 'white' : '#3A1F0A',
            }}>{label}</button>
          ))}
        </div>

        {shown.length === 0 && (
          <div style={{ background: 'white', border: '1px solid #E8D5B0', borderRadius: 16, padding: 40, textAlign: 'center', color: '#7A5C42' }}>
            Aucune commande dans cette catégorie.
          </div>
        )}

        {shown.map(o => {
          const st = normStatus(o.status)
          const items: any[] = Array.isArray(o.items) ? o.items : []
          const ref = String(o.id).slice(0, 8).toUpperCase()
          const isBusy = busy === o.id
          return (
            <div key={o.id} style={{ background: 'white', border: '1px solid #E8D5B0', borderRadius: 16, padding: 20, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: 17, color: '#2C1A0E' }}>#{ref} · {o.client_name}</span>
                    <span style={{ background: STATUS[st].bg, color: STATUS[st].color, fontSize: 12, fontWeight: 700, borderRadius: 12, padding: '3px 12px' }}>{STATUS[st].icon} {STATUS[st].label}</span>
                    {st === 'confirme' && o.confirmed_by && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#7A5C42', background: '#F5ECD7', borderRadius: 10, padding: '3px 10px' }}>
                        {o.confirmed_by === 'auto' ? '🤖 Confirmée automatiquement' : `👤 Confirmée par ${o.confirmed_by}`}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#9A7B5A', marginTop: 2 }}>{o.created_at ? fmtDate(o.created_at) : ''}</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#2D6A4F' }}>{fmt(o.total)} FCFA</div>
              </div>

              <div style={{ fontSize: 13.5, color: '#2C1A0E', lineHeight: 1.8 }}>
                {items.map((it, i) => <div key={i}>• {it.name} × {it.quantity} — {fmt(Number(it.price) * Number(it.quantity))} FCFA</div>)}
                <div style={{ marginTop: 6, color: '#7A5C42' }}>
                  💳 {payLabel(o.payment_method)}{o.payment_phone ? ` · ${o.payment_phone}` : ''}
                  {' · '}{o.delivery_type === 'pickup' ? '🏪 Retrait magasin' : `🚚 ${o.zone_name || 'Livraison'}`}
                </div>
                <div style={{ color: '#7A5C42' }}>📞 {o.phone || '—'}{o.address ? ` · 🏠 ${o.address}` : ''}</div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                {st === 'en_attente' && <button disabled={isBusy} onClick={() => changeStatus(o.id, 'confirme')} style={btn('#2D6A4F')}>{isBusy ? '⏳…' : '✅ Confirmer le paiement reçu'}</button>}
                {st === 'confirme' && <button disabled={isBusy} onClick={() => changeStatus(o.id, 'en_livraison')} style={btn('#1E40AF')}>{o.delivery_type === 'pickup' ? '🏪 Prête à retirer' : '🚚 Passer en livraison'}</button>}
                {st === 'en_livraison' && <button disabled={isBusy} onClick={() => changeStatus(o.id, 'livre')} style={btn('#1B5E3B')}>📦 Marquer comme livré</button>}
                {(st === 'en_attente' || st === 'confirme') && <button disabled={isBusy} onClick={() => changeStatus(o.id, 'annule', 'Annuler cette commande ? Le client sera prévenu.')} style={btn('#B91C1C')}>✖️ Annuler</button>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
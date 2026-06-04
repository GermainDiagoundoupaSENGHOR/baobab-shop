'use client'
import { useState } from 'react'
import Link from 'next/link'

interface Order {
  id: string
  client: string
  articles: number
  total: number
  status: 'En attente' | 'Confirmé' | 'En livraison' | 'Livré' | 'Annulé'
  date: string
}

const ORDERS: Order[] = [
  { id: '1', client: 'Amadou Diallo', articles: 1, total: 285000, status: 'En attente', date: '4 juin 2026 à 10:30' },
  { id: '2', client: 'Fatou Sow', articles: 2, total: 50000, status: 'Confirmé', date: '3 juin 2026 à 09:15' },
  { id: '3', client: 'Moussa Ndiaye', articles: 1, total: 32000, status: 'En livraison', date: '2 juin 2026 à 14:00' },
  { id: '4', client: 'Aissatou Ba', articles: 3, total: 75000, status: 'Livré', date: '1 juin 2026 à 11:20' },
  { id: '5', client: 'Ibrahima Fall', articles: 1, total: 18000, status: 'Annulé', date: '31 mai 2026 à 08:45' },
]

const STATUS_COLORS: Record<string, { bg: string, color: string }> = {
  'En attente': { bg: '#FFF3CD', color: '#856404' },
  'Confirmé': { bg: '#D8F3DC', color: '#2D6A4F' },
  'En livraison': { bg: '#CCE5FF', color: '#004085' },
  'Livré': { bg: '#D4EDDA', color: '#155724' },
  'Annulé': { bg: '#FFE4E4', color: '#e53e3e' },
}

export default function Orders() {
  const [filter, setFilter] = useState('Tous')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filters = ['Tous', 'En attente', 'Confirmé', 'En livraison', 'Livré', 'Annulé']
  const filtered = filter === 'Tous' ? ORDERS : ORDERS.filter(o => o.status === filter)

  const stats = [
    { label: 'En attente', value: ORDERS.filter(o => o.status === 'En attente').length },
    { label: 'Confirmé', value: ORDERS.filter(o => o.status === 'Confirmé').length },
    { label: 'En livraison', value: ORDERS.filter(o => o.status === 'En livraison').length },
    { label: 'Livré', value: ORDERS.filter(o => o.status === 'Livré').length },
    { label: 'Annulé', value: ORDERS.filter(o => o.status === 'Annulé').length },
  ]

  return (
    <div style={{ background: '#F5ECD7', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* RETOUR */}
        <Link href="/admin" style={{
          color: '#5C3317', textDecoration: 'none',
          fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6,
          marginBottom: 20,
        }}>
          ← Retour au dashboard
        </Link>

        {/* HEADER */}
        <h1 style={{
          fontFamily: 'Georgia, serif',
          color: '#3A1F0A', fontSize: 26,
          marginBottom: 4,
        }}>
          📋 Cahier de Charge
        </h1>
        <p style={{ color: '#7A5C42', fontSize: 13, marginBottom: 20 }}>
          Commandes contenant vos produits
        </p>

        {/* VENDEUR */}
        <div style={{
          background: 'white', borderRadius: 12,
          padding: '16px 20px', marginBottom: 16,
          border: '1px solid #E8D5B0',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: '#2D6A4F', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 18,
          }}>G</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#2C1A0E' }}>
              Germain Diagoundoupa Senghor
            </div>
            <div style={{ fontSize: 13, color: '#7A5C42' }}>
              {ORDERS.length} commandes trouvées
            </div>
          </div>
        </div>

        {/* STATS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 10, marginBottom: 20,
        }}>
          {stats.map((s) => (
            <div key={s.label} style={{
              background: 'white', borderRadius: 10,
              padding: '14px 8px', textAlign: 'center',
              border: '1px solid #E8D5B0',
              cursor: 'pointer',
            }} onClick={() => setFilter(s.label)}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#3A1F0A' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#7A5C42', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* FILTRES */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }}>
          {filters.map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 20,
              border: '1.5px solid',
              borderColor: filter === f ? '#3A1F0A' : '#E8D5B0',
              background: filter === f ? '#3A1F0A' : 'white',
              color: filter === f ? '#F5ECD7' : '#7A5C42',
              fontSize: 12, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap',
              fontFamily: 'sans-serif',
            }}>
              {f}
            </button>
          ))}
        </div>

        {/* LISTE COMMANDES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((order) => (
            <div
              key={order.id}
              style={{
                background: 'white', borderRadius: 12,
                border: '1px solid #E8D5B0', overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '16px 20px', display: 'flex',
                  alignItems: 'center', gap: 14, cursor: 'pointer',
                }}
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                <div style={{
                  width: 40, height: 40, background: '#F5ECD7',
                  borderRadius: 8, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>📦</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#2C1A0E' }}>
                      {order.client}
                    </span>
                    <span style={{
                      background: STATUS_COLORS[order.status].bg,
                      color: STATUS_COLORS[order.status].color,
                      fontSize: 11, fontWeight: 600,
                      padding: '2px 8px', borderRadius: 8,
                    }}>
                      {order.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#7A5C42' }}>
                    {order.articles} article(s) · {order.total.toLocaleString('fr-FR')} FCFA
                  </div>
                  <div style={{ fontSize: 11, color: '#7A5C42', marginTop: 2 }}>
                    {order.date}
                  </div>
                </div>
                <span style={{ color: '#7A5C42', fontSize: 16 }}>
                  {expanded === order.id ? '▲' : '▼'}
                </span>
              </div>

              {/* DETAILS */}
              {expanded === order.id && (
                <div style={{
                  padding: '0 20px 16px',
                  borderTop: '1px solid #F5ECD7',
                }}>
                  <div style={{ paddingTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {['Confirmer', 'En livraison', 'Livré', 'Annuler'].map((action) => (
                      <button key={action} style={{
                        padding: '7px 16px', borderRadius: 20,
                        border: '1.5px solid #E8D5B0',
                        background: action === 'Confirmer' ? '#2D6A4F' : action === 'Annuler' ? '#FFE4E4' : 'white',
                        color: action === 'Confirmer' ? 'white' : action === 'Annuler' ? '#e53e3e' : '#5C3317',
                        fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'sans-serif',
                      }}>
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
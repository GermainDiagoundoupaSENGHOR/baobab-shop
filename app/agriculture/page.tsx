'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  price: number
  category: string
  sub_category: string
  emoji: string
  description: string
  stock: number
}

const subCats = [
  { key: 'all', label: 'Tout' },
  { key: 'seeds', label: '🌾 Semences' },
  { key: 'tools', label: '🔧 Outils' },
  { key: 'fertilizers', label: '🌿 Engrais' },
  { key: 'animals', label: '🐄 Animaux' },
]

export default function Agriculture() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSub, setActiveSub] = useState('all')

  useEffect(() => {
    fetchProducts()
  }, [activeSub])

  const fetchProducts = async () => {
    setLoading(true)
    let query = supabase.from('products').select('*').eq('category', 'agri')
    if (activeSub !== 'all') query = query.eq('sub_category', activeSub)
    const { data } = await query
    setProducts(data || [])
    setLoading(false)
  }

  return (
    <div>
      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #1B4332, #2D6A4F)',
        padding: '32px 24px',
      }}>
        <h1 style={{
          fontFamily: 'Georgia, serif',
          color: '#F5ECD7',
          fontSize: 32,
          margin: 0,
          marginBottom: 8,
        }}>
          🌱 Agriculture
        </h1>
        <p style={{ color: 'rgba(245,236,215,0.7)', margin: 0 }}>
          Semences, outils, engrais et animaux
        </p>
      </div>

      {/* FILTRES */}
      <div style={{
        background: 'white',
        padding: '12px 24px',
        display: 'flex',
        gap: 8,
        borderBottom: '1px solid #E8D5B0',
        overflowX: 'auto',
      }}>
        {subCats.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSub(s.key)}
            style={{
              padding: '8px 18px',
              borderRadius: 20,
              border: '1.5px solid',
              borderColor: activeSub === s.key ? '#1B4332' : '#E8D5B0',
              background: activeSub === s.key ? '#1B4332' : 'transparent',
              color: activeSub === s.key ? '#F5ECD7' : '#7A5C42',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* PRODUITS */}
      <div style={{ padding: '24px', background: '#F5ECD7', minHeight: '60vh' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, fontSize: 32 }}>⏳</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🌱</div>
            <p style={{ color: '#7A5C42', fontSize: 16, marginBottom: 8 }}>
              Aucun produit disponible
            </p>
            <p style={{ color: '#7A5C42', fontSize: 13 }}>
              Les produits seront ajoutés bientôt !
            </p>
            <Link href="/admin" style={{
              display: 'inline-block',
              marginTop: 16,
              background: '#1B4332',
              color: 'white',
              padding: '12px 24px',
              borderRadius: 20,
              textDecoration: 'none',
              fontWeight: 600,
            }}>
              ⚙️ Ajouter des produits
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {products.map((p) => (
              <div key={p.id} style={{
                background: 'white',
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid #E8D5B0',
                cursor: 'pointer',
              }}>
                <div style={{
                  height: 140,
                  background: '#F5ECD7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 56,
                }}>
                  {p.emoji || '🌱'}
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#2C1A0E' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1B4332', marginBottom: 8 }}>
                    {p.price?.toLocaleString('fr-FR')} FCFA
                  </div>
                  <button style={{
                    width: '100%',
                    background: '#1B4332',
                    color: 'white',
                    border: 'none',
                    padding: 8,
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 12,
                    fontFamily: 'sans-serif',
                  }}>
                    🛒 Ajouter au panier
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
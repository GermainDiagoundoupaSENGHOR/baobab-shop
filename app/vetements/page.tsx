'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { addToCart } from '@/lib/cart'
import { useSearchParams } from 'next/navigation'

interface Product {
  id: string
  name: string
  price: number
  category: string
  sub_category: string
  emoji: string
  description: string
  stock: number
  image_url?: string
}

const subCats = [
  { key: 'all', label: 'Tout' },
  { key: 'men', label: '👔 Hommes' },
  { key: 'women', label: '👗 Femmes' },
  { key: 'kids', label: '👕 Enfants' },
]

export default function Vetements() {
  const searchParams = useSearchParams()
  const subParam = searchParams.get('sub')
  const [activeSub, setActiveSub] = useState(subParam || 'all')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  useEffect(() => {
  setActiveSub(subParam || 'all')
}, [subParam])

  useEffect(() => { fetchProducts() }, [activeSub])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  const fetchProducts = async () => {
  setLoading(true)
  let query = supabase.from('products').select('*').eq('category', 'cloth')
  if (activeSub === 'men') query = query.eq('sub_category', 'men')
  else if (activeSub === 'women') query = query.eq('sub_category', 'women')
  else if (activeSub === 'kids') query = query.eq('sub_category', 'kids')
  else if (activeSub !== 'all') query = query.eq('sub_category', activeSub)
  const { data } = await query
  setProducts(data || [])
  setLoading(false)
  }

  return (
    <div>
      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: '#2D6A4F', color: 'white', padding: '10px 20px',
          borderRadius: 20, fontSize: 13, fontWeight: 600, zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)', fontFamily: 'sans-serif',
          whiteSpace: 'nowrap',
        }}>
          ✅ {toast}
        </div>
      )}

      <div style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)', padding: '32px 24px' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', color: '#F5ECD7', fontSize: 32, margin: 0, marginBottom: 8 }}>
          👗 Vêtements
        </h1>
        <p style={{ color: 'rgba(245,236,215,0.7)', margin: 0 }}>
          Mode homme, femme et enfant
        </p>
      </div>

      <div style={{
        background: 'white', padding: '12px 24px',
        display: 'flex', gap: 8, borderBottom: '1px solid #E8D5B0', overflowX: 'auto',
      }}>
        {subCats.map((s) => (
          <button key={s.key} onClick={() => setActiveSub(s.key)} style={{
            padding: '8px 18px', borderRadius: 20, border: '1.5px solid',
            borderColor: activeSub === s.key ? '#2D6A4F' : '#E8D5B0',
            background: activeSub === s.key ? '#2D6A4F' : 'transparent',
            color: activeSub === s.key ? '#F5ECD7' : '#7A5C42',
            fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '24px', background: '#F5ECD7', minHeight: '60vh' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, fontSize: 32 }}>⏳</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>👗</div>
            <p style={{ color: '#7A5C42', fontSize: 16, marginBottom: 8 }}>Aucun produit disponible</p>
            <p style={{ color: '#7A5C42', fontSize: 13 }}>Les produits seront ajoutés bientôt !</p>
            <Link href="/admin" style={{
              display: 'inline-block', marginTop: 16, background: '#2D6A4F',
              color: 'white', padding: '12px 24px', borderRadius: 20,
              textDecoration: 'none', fontWeight: 600,
            }}>⚙️ Ajouter des produits</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {products.map((p) => (
              <Link key={p.id} href={`/produit/${p.id}`} prefetch={true} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #E8D5B0', cursor: 'pointer' }}>
                  <div style={{
                    height: 160, background: '#F5ECD7',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 56, overflow: 'hidden',
                  }}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (p.emoji || '👗')}
                  </div>
                  <div style={{ padding: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#2C1A0E' }}>{p.name}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#2D6A4F', marginBottom: 8 }}>
                      {p.price?.toLocaleString('fr-FR')} FCFA
                    </div>
                    <div style={{ fontSize: 11, marginBottom: 8, color: p.stock > 0 ? '#2D6A4F' : '#e53e3e', fontWeight: 600 }}>
                      {p.stock > 0 ? `✅ En stock (${p.stock})` : '❌ Rupture de stock'}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        addToCart({ id: p.id, name: p.name, price: p.price, emoji: p.emoji || '👗', image_url: p.image_url })
                        showToast('Ajouté au panier !')
                      }}
                      disabled={p.stock === 0}
                      style={{
                        width: '100%', background: p.stock > 0 ? '#2D6A4F' : '#9CA3AF',
                        color: 'white', border: 'none', padding: 8, borderRadius: 6,
                        cursor: p.stock > 0 ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 12, fontFamily: 'sans-serif',
                      }}
                    >
                      {p.stock > 0 ? '🛒 Ajouter au panier' : 'Indisponible'}
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
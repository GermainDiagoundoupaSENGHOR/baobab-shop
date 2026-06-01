'use client'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  price: number
  category: string
  emoji: string
  description: string
}

function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const search = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      setProducts(data || [])
      setLoading(false)
    }
    if (query) search()
  }, [query])

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{
        fontFamily: 'Georgia, serif',
        color: '#3A1F0A',
        fontSize: 28,
        marginBottom: 8,
      }}>
        Résultats pour : <span style={{ color: '#2D6A4F' }}>"{query}"</span>
      </h1>
      <p style={{ color: '#7A5C42', marginBottom: 24 }}>
        {loading ? 'Recherche en cours...' : `${products.length} produit(s) trouvé(s)`}
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, fontSize: 32 }}>⏳</div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
          <p style={{ color: '#7A5C42', fontSize: 16 }}>Aucun produit trouvé pour "{query}"</p>
          <Link href="/" style={{
            display: 'inline-block',
            marginTop: 16,
            background: '#2D6A4F',
            color: 'white',
            padding: '12px 24px',
            borderRadius: 20,
            textDecoration: 'none',
            fontWeight: 600,
          }}>
            Retour à l'accueil
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
                {p.emoji || '📦'}
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#2D6A4F', marginBottom: 8 }}>
                  {p.price?.toLocaleString('fr-FR')} FCFA
                </div>
                <button style={{
                  width: '100%',
                  background: '#5C3317',
                  color: 'white',
                  border: 'none',
                  padding: 8,
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 12,
                }}>
                  Voir le produit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RecherchePage() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: 'center' }}>⏳ Chargement...</div>}>
      <SearchResults />
    </Suspense>
  )
}
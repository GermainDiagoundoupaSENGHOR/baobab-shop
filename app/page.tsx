'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'
import { addToCart } from '@/lib/cart'

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

export default function Home() {
  const searchParams = useSearchParams()
  const catParam = searchParams.get('cat')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState(catParam || 'all')
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => { fetchProducts() }, [activeFilter])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  const fetchProducts = async () => {
    setLoading(true)
    let query = supabase.from('products').select('*').order('created_at', { ascending: false })
    if (activeFilter === 'elec') query = query.eq('category', 'elec')
    else if (activeFilter === 'cloth') query = query.eq('category', 'cloth')
    else if (activeFilter === 'agri') query = query.eq('category', 'agri')
    else if (activeFilter === 'men') query = query.eq('category', 'cloth').eq('sub_category', 'men')
    else if (activeFilter === 'women') query = query.eq('category', 'cloth').eq('sub_category', 'women')
    else if (activeFilter === 'kids') query = query.eq('category', 'cloth').eq('sub_category', 'kids')
    else if (activeFilter === 'access') query = query.eq('category', 'elec').eq('sub_category', 'access')
    const { data } = await query
    setProducts(data || [])
    setLoading(false)
  }

  const filters = [
    { key: 'all', label: 'Tous' },
    { key: 'elec', label: '📱 Électronique' },
    { key: 'cloth', label: '👗 Vêtements' },
    { key: 'access', label: '🎧 Accessoires' },
    { key: 'men', label: '👔 Hommes' },
    { key: 'women', label: '👗 Femmes' },
    { key: 'kids', label: '👕 Enfants' },
    { key: 'agri', label: '🌱 Agriculture' },
  ]

  return (
    <main>
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

      {/* HERO */}
      <section style={{
        backgroundImage: 'linear-gradient(rgba(58,31,10,0.65), rgba(58,31,10,0.80)), url("https://www.publicdomainpictures.net/pictures/590000/velka/baobab-tree-africa-1709928044FwT.jpg")',
        backgroundSize: 'cover', backgroundPosition: 'center',
        padding: '80px 24px 60px', textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block', background: '#2D6A4F', color: 'white',
          fontSize: 11, fontWeight: 700, padding: '4px 14px',
          borderRadius: 20, marginBottom: 16, letterSpacing: 1, textTransform: 'uppercase',
        }}>
          🇸🇳 Le marché digital du Sénégal
        </div>
        <h1 style={{ fontFamily: 'Georgia, serif', color: '#F5ECD7', fontSize: 44, marginBottom: 12, lineHeight: 1.2 }}>
          B<span style={{ color: '#52B788' }}>@</span>OB<span style={{ color: '#52B788' }}>@</span>B Shop
        </h1>
        <p style={{ color: 'rgba(245,236,215,0.85)', fontSize: 16, maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.6 }}>
          Électronique, Vêtements, Agriculture — Livraison partout au Sénégal
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/electronique" style={{
            background: '#2D6A4F', color: 'white', padding: '13px 28px',
            borderRadius: 24, textDecoration: 'none', fontWeight: 700, fontSize: 15,
          }}>🛍️ Découvrir</Link>
          <Link href="/assistant" style={{
            background: 'rgba(255,255,255,0.15)', color: '#F5ECD7',
            border: '1.5px solid rgba(245,236,215,0.5)', padding: '13px 28px',
            borderRadius: 24, textDecoration: 'none', fontWeight: 700, fontSize: 15,
          }}>🤖 Assistant IA</Link>
        </div>
      </section>

      {/* TOUS LES PRODUITS */}
      <section style={{ padding: '20px 16px 24px', background: '#F5ECD7' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 20, marginBottom: 14 }}>
          🏪 Tous les produits
        </h2>

        {/* FILTRES */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
          {filters.map((f) => (
            <button key={f.key} onClick={() => setActiveFilter(f.key)} style={{
              padding: '7px 16px', borderRadius: 20, border: '1.5px solid',
              borderColor: activeFilter === f.key ? '#3A1F0A' : '#E8D5B0',
              background: activeFilter === f.key ? '#3A1F0A' : 'white',
              color: activeFilter === f.key ? '#F5ECD7' : '#7A5C42',
              fontWeight: 600, fontSize: 12, cursor: 'pointer',
              whiteSpace: 'nowrap', fontFamily: 'sans-serif',
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* LISTE PRODUITS */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, fontSize: 32 }}>⏳</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <p style={{ color: '#7A5C42' }}>Aucun produit dans cette catégorie</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 14,
          }}>
            {products.map((p) => (
              <Link key={p.id} href={`/produit/${p.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'white', borderRadius: 12,
                  overflow: 'hidden', border: '1px solid #E8D5B0', cursor: 'pointer',
                }}>
                  <div style={{
                    height: 150, background: '#F5ECD7',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 52, overflow: 'hidden',
                  }}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (p.emoji || '📦')}
                  </div>
                  <div style={{ padding: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#2C1A0E', marginBottom: 4 }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#2D6A4F', marginBottom: 6 }}>
                      {p.price?.toLocaleString('fr-FR')} FCFA
                    </div>
                    <div style={{ fontSize: 10, color: p.stock > 0 ? '#2D6A4F' : '#e53e3e', fontWeight: 600, marginBottom: 6 }}>
                      {p.stock > 0 ? `✅ En stock (${p.stock})` : '❌ Rupture'}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        addToCart({ id: p.id, name: p.name, price: p.price, emoji: p.emoji || '📦', image_url: p.image_url })
                        showToast('Ajouté au panier !')
                      }}
                      disabled={p.stock === 0}
                      style={{
                        width: '100%', background: p.stock > 0 ? '#5C3317' : '#9CA3AF',
                        color: 'white', border: 'none', padding: '7px',
                        borderRadius: 6, cursor: p.stock > 0 ? 'pointer' : 'not-allowed',
                        fontWeight: 600, fontSize: 11, fontFamily: 'sans-serif',
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
      </section>

      {/* POURQUOI BAOBAB */}
      <section style={{ padding: '20px 16px', background: 'white', margin: '0 16px 20px', borderRadius: 16, border: '1px solid #E8D5B0' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 18, marginBottom: 16, textAlign: 'center' }}>
          🌳 Pourquoi B@OB@B Shop ?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {[
            { icon: '📦', title: 'Livraison rapide', sub: 'Partout au Sénégal en 2-4 jours' },
            { icon: '🌊', title: 'Wave & Orange Money', sub: 'Paiement simple et sécurisé' },
            { icon: '🤖', title: 'Assistant IA', sub: 'En Wolof, Français et English' },
            { icon: '🔒', title: '100% Sécurisé', sub: 'Vos données sont protégées' },
          ].map((f) => (
            <div key={f.title} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: 10, background: '#F5ECD7', borderRadius: 10,
            }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#3A1F0A' }}>{f.title}</div>
                <div style={{ fontSize: 11, color: '#7A5C42', marginTop: 2 }}>{f.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        background: '#3A1F0A', padding: '28px 16px', gap: 20,
      }}>
        {[
          { icon: '📦', title: 'Livraison rapide', sub: 'Partout au Sénégal' },
          { icon: '🌊', title: 'Paiement Wave', sub: 'Simple & sécurisé' },
          { icon: '🟠', title: 'Orange Money', sub: 'Accepté partout' },
          { icon: '🔒', title: 'Sécurisé', sub: 'Données protégées' },
        ].map((f) => (
          <div key={f.title} style={{ textAlign: 'center', padding: '8px 4px' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{f.icon}</div>
            <div style={{ color: '#F5ECD7', fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{f.title}</div>
            <div style={{ color: 'rgba(245,236,215,0.6)', fontSize: 11 }}>{f.sub}</div>
          </div>
        ))}
      </section>
    </main>
  )
}
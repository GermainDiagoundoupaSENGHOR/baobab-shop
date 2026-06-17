'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
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
  video_url?: string
}

export default function ProductDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [similar, setSimilar] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMedia, setActiveMedia] = useState<'image' | 'video'>('image')
  const [toast, setToast] = useState<string | null>(null)
  const [aiDescription, setAiDescription] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    if (id) fetchProduct()
  }, [id])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  const fetchProduct = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (data) {
      setProduct(data)
      // Charger produits similaires
      const { data: sim } = await supabase
        .from('products')
        .select('*')
        .eq('category', data.category)
        .neq('id', data.id)
        .limit(6)
      setSimilar(sim || [])
    }
    setLoading(false)
  }

 const generateAiDescription = async () => {
  if (!product) return
  setAiLoading(true)
  try {
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lang: 'fr',
        messages: [
          {
            role: 'user',
            content: `Génère une description commerciale courte et attrayante pour ce produit vendu au Sénégal : "${product.name}", prix: ${product.price} FCFA, catégorie: ${product.category}. Maximum 3 phrases en français.`
          }
        ]
      })
    })
    const data = await response.json()
    setAiDescription(data.message || 'Description non disponible')
  } catch {
    setAiDescription('Erreur lors de la génération de la description.')
  }
  setAiLoading(false)
}

  const getCategoryLabel = (cat: string) => {
    const cats: Record<string, string> = {
      elec: '📱 Électronique', cloth: '👗 Vêtements', agri: '🌱 Agriculture'
    }
    return cats[cat] || cat
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, fontSize: 32 }}>⏳</div>
  )

  if (!product) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
      <p style={{ color: '#7A5C42' }}>Produit introuvable</p>
      <button onClick={() => router.back()} style={{
        marginTop: 16, padding: '10px 24px', background: '#2D6A4F',
        color: 'white', border: 'none', borderRadius: 20, cursor: 'pointer', fontWeight: 700,
      }}>← Retour</button>
    </div>
  )

  return (
    <div style={{ background: '#F5ECD7', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: 80 }}>

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: '#2D6A4F', color: 'white', padding: '10px 20px',
          borderRadius: 20, fontSize: 13, fontWeight: 600, zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
        }}>
          ✅ {toast}
        </div>
      )}

      {/* HEADER */}
      <div style={{
        background: '#3A1F0A', padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => router.back()} style={{
          background: 'none', border: 'none', color: '#F5ECD7',
          fontSize: 22, cursor: 'pointer',
        }}>←</button>
        <h1 style={{
          fontFamily: 'Georgia, serif', color: '#F5ECD7',
          fontSize: 18, margin: 0, flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {product.name}
        </h1>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px' }}>

        {/* MÉDIA PRINCIPAL */}
        <div style={{
          background: 'white', borderRadius: 16, overflow: 'hidden',
          marginBottom: 16, border: '1px solid #E8D5B0',
        }}>
          {/* SÉLECTEUR IMAGE/VIDÉO */}
          {product.video_url && (
            <div style={{ display: 'flex', borderBottom: '1px solid #E8D5B0' }}>
              <button
                onClick={() => setActiveMedia('image')}
                style={{
                  flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
                  background: activeMedia === 'image' ? '#3A1F0A' : 'white',
                  color: activeMedia === 'image' ? '#F5ECD7' : '#7A5C42',
                  fontWeight: 700, fontSize: 13,
                }}
              >🖼️ Photo</button>
              <button
                onClick={() => setActiveMedia('video')}
                style={{
                  flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
                  background: activeMedia === 'video' ? '#3A1F0A' : 'white',
                  color: activeMedia === 'video' ? '#F5ECD7' : '#7A5C42',
                  fontWeight: 700, fontSize: 13,
                }}
              >🎬 Vidéo</button>
            </div>
          )}

          {/* AFFICHAGE IMAGE */}
          {activeMedia === 'image' && (
            <div style={{
              height: 320, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: '#F5ECD7', overflow: 'hidden',
            }}>
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <span style={{ fontSize: 80 }}>{product.emoji || '📦'}</span>
              )}
            </div>
          )}

          {/* AFFICHAGE VIDÉO */}
          {activeMedia === 'video' && product.video_url && (
            <div style={{ height: 320, background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video
                src={product.video_url}
                controls
                autoPlay
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          )}
        </div>

        {/* INFOS PRODUIT */}
        <div style={{
          background: 'white', borderRadius: 16, padding: 20,
          marginBottom: 16, border: '1px solid #E8D5B0',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', color: '#2C1A0E', fontSize: 22, margin: 0, flex: 1 }}>
              {product.name}
            </h2>
            <span style={{
              background: '#F5ECD7', color: '#5C3317',
              fontSize: 11, fontWeight: 700, padding: '4px 10px',
              borderRadius: 20, flexShrink: 0, marginLeft: 8,
            }}>
              {getCategoryLabel(product.category)}
            </span>
          </div>

          <div style={{ fontSize: 26, fontWeight: 700, color: '#2D6A4F', marginBottom: 12 }}>
            {product.price?.toLocaleString('fr-FR')} FCFA
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: product.stock > 0 ? '#D8F3DC' : '#fee2e2',
            color: product.stock > 0 ? '#2D6A4F' : '#e53e3e',
            padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
            marginBottom: 16,
          }}>
            {product.stock > 0 ? `✅ En stock (${product.stock} disponibles)` : '❌ Rupture de stock'}
          </div>

          {/* DESCRIPTION */}
          {product.description && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#3A1F0A', marginBottom: 8 }}>
                📋 Description
              </h3>
              <p style={{ fontSize: 14, color: '#7A5C42', lineHeight: 1.6, margin: 0 }}>
                {product.description}
              </p>
            </div>
          )}

          {/* DESCRIPTION IA */}
          <div style={{
            background: '#F5ECD7', borderRadius: 12, padding: 14, marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#3A1F0A', margin: 0 }}>
                🤖 Description IA
              </h3>
              <button
                onClick={generateAiDescription}
                disabled={aiLoading}
                style={{
                  background: '#3A1F0A', color: '#F5ECD7',
                  border: 'none', borderRadius: 20, padding: '6px 14px',
                  fontSize: 12, fontWeight: 700, cursor: aiLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {aiLoading ? '⏳ Génération...' : '✨ Générer'}
              </button>
            </div>
            {aiDescription ? (
              <p style={{ fontSize: 13, color: '#5C3317', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                {aiDescription}
              </p>
            ) : (
              <p style={{ fontSize: 12, color: '#7A5C42', margin: 0 }}>
                Cliquez sur "Générer" pour obtenir une description assistée par IA
              </p>
            )}
          </div>

          {/* BOUTON AJOUTER AU PANIER */}
          <button
            onClick={() => {
              if (product.stock === 0) return
              addToCart({
                id: product.id,
                name: product.name,
                price: product.price,
                emoji: product.emoji || '📦',
                image_url: product.image_url,
              })
              showToast('Ajouté au panier !')
            }}
            disabled={product.stock === 0}
            style={{
              width: '100%', padding: '15px',
              background: product.stock > 0 ? '#5C3317' : '#9CA3AF',
              color: 'white', border: 'none', borderRadius: 24,
              fontSize: 16, fontWeight: 700, cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            {product.stock > 0 ? '🛒 Ajouter au panier' : 'Indisponible'}
          </button>
        </div>

        {/* PRODUITS SIMILAIRES */}
        {similar.length > 0 && (
          <div>
            <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 18, marginBottom: 14 }}>
              🔍 Produits similaires
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 12,
            }}>
              {similar.map((p) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/produit/${p.id}`)}
                  style={{
                    background: 'white', borderRadius: 12,
                    overflow: 'hidden', border: '1px solid #E8D5B0', cursor: 'pointer',
                  }}
                >
                  <div style={{
                    height: 130, background: '#F5ECD7',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 48, overflow: 'hidden',
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
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#2D6A4F' }}>
                      {p.price?.toLocaleString('fr-FR')} FCFA
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getCart, removeFromCart, updateQuantity, CartItem } from '@/lib/cart'

export default function Panier() {
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    setItems(getCart())
    const handleUpdate = () => setItems(getCart())
    window.addEventListener('cartUpdated', handleUpdate)
    return () => window.removeEventListener('cartUpdated', handleUpdate)
  }, [])

  const updateQty = (id: string, delta: number) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    const newQty = Math.max(1, item.quantity + delta)
    updateQuantity(id, newQty)
  }

  const removeItem = (id: string) => {
    removeFromCart(id)
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const livraison = items.length > 0 ? 2500 : 0
  const total = subtotal + livraison

  return (
    <div style={{ background: '#F5ECD7', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 28, marginBottom: 8 }}>
          🛒 Mon Panier
        </h1>
        <p style={{ color: '#7A5C42', marginBottom: 24, fontSize: 13 }}>
          {items.length} article(s)
        </p>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
            <p style={{ color: '#7A5C42', fontSize: 16, marginBottom: 8 }}>Panier vide</p>
            <Link href="/" style={{
              display: 'inline-block', background: '#2D6A4F', color: 'white',
              padding: '12px 24px', borderRadius: 20, textDecoration: 'none', fontWeight: 600,
            }}>Continuer les achats</Link>
          </div>
        ) : (
          <>
            {items.map((item) => (
              <div key={item.id} style={{
                background: 'white', borderRadius: 12, padding: 16,
                marginBottom: 12, display: 'flex', alignItems: 'center',
                gap: 16, border: '1px solid #E8D5B0',
              }}>
                <div style={{
                  width: 60, height: 60, background: '#F5ECD7',
                  borderRadius: 8, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 28, flexShrink: 0,
                  overflow: 'hidden',
                }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : item.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{item.name}</div>
                  <div style={{ fontSize: 14, color: '#2D6A4F', fontWeight: 700 }}>
                    {(item.price * item.quantity).toLocaleString('fr-FR')} FCFA
                  </div>
                  <div style={{ fontSize: 11, color: '#7A5C42' }}>
                    {item.price.toLocaleString('fr-FR')} FCFA / unité
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => updateQty(item.id, -1)} style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: '1.5px solid #5C3317', background: 'none',
                    cursor: 'pointer', fontSize: 14, fontWeight: 700,
                    color: '#5C3317', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>−</button>
                  <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, 1)} style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: '1.5px solid #5C3317', background: 'none',
                    cursor: 'pointer', fontSize: 14, fontWeight: 700,
                    color: '#5C3317', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>+</button>
                  <button onClick={() => removeItem(item.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 18, color: '#e53e3e', marginLeft: 8,
                  }}>×</button>
                </div>
              </div>
            ))}

            <div style={{
              background: '#3A1F0A', borderRadius: 12, padding: 20,
              color: '#F5ECD7', marginTop: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                <span>Sous-total</span>
                <span>{subtotal.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 12 }}>
                <span>Livraison</span>
                <span>{livraison.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 20, fontWeight: 700,
                borderTop: '1px solid rgba(245,236,215,0.2)', paddingTop: 12,
              }}>
                <span>Total</span>
                <span>{total.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <button onClick={() => router.push('/paiement')} style={{
                width: '100%', background: '#2D6A4F', color: 'white',
                border: 'none', padding: '14px', borderRadius: 24,
                cursor: 'pointer', fontWeight: 700, fontSize: 16,
                marginTop: 16, fontFamily: 'sans-serif',
              }}>
                💳 Procéder au paiement
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
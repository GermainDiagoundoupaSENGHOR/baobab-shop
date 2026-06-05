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

export default function Admin() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '', price: '', category: 'elec',
    sub_category: '', emoji: '', description: '', stock: '',
  })

  useEffect(() => { fetchProducts() }, [])

  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.price) return alert('Nom et prix obligatoires !')
    const { error } = await supabase.from('products').insert({
      name: form.name, price: parseFloat(form.price),
      category: form.category, sub_category: form.sub_category,
      emoji: form.emoji, description: form.description,
      stock: parseInt(form.stock) || 0,
    })
    if (error) return alert('Erreur: ' + error.message)
    alert('✅ Produit ajouté !')
    setShowForm(false)
    setForm({ name: '', price: '', category: 'elec', sub_category: '', emoji: '', description: '', stock: '' })
    fetchProducts()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return
    await supabase.from('products').delete().eq('id', id)
    fetchProducts()
  }

  const stats = [
    { icon: '📦', label: 'Produits', value: products.length },
    { icon: '✅', label: 'En stock', value: products.filter(p => p.stock > 0).length },
    { icon: '👁️', label: 'Vues', value: '—' },
    { icon: '🛒', label: 'Commandes', value: 0 },
  ]

  const actions = [
    { icon: '➕', label: 'Ajouter un produit', sub: 'Publier un nouveau produit', color: '#2D6A4F', onClick: () => setShowForm(true) },
    { icon: '📋', label: 'Voir les commandes', sub: 'Commandes reçues', color: '#1B8EF8', href: '/orders' },
    { icon: '💬', label: 'Messagerie', sub: 'Discuter avec les clients', color: '#FF6600', href: '/messages' },
    { icon: '👤', label: 'Mon profil', sub: 'Modifier mes infos', color: '#5C3317', href: '/auth' },
  ]

  return (
    <div style={{ background: '#F5ECD7', minHeight: '100vh', padding: 20 }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 24, margin: 0 }}>
            Mon Tableau de Bord
          </h1>
          <p style={{ color: '#7A5C42', fontSize: 13, margin: '4px 0 0' }}>
            Bonjour, Bienvenue sur B@OB@B Shop 👋
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/orders" style={{
            background: 'white', color: '#3A1F0A',
            border: '1.5px solid #E8D5B0', padding: '9px 16px',
            borderRadius: 20, textDecoration: 'none',
            fontSize: 13, fontWeight: 600,
          }}>
            🛒 Voir les commandes
          </Link>
          <button
            onClick={() => setShowForm(true)}
            style={{
              background: '#2D6A4F', color: 'white',
              border: 'none', padding: '9px 16px',
              borderRadius: 20, cursor: 'pointer',
              fontSize: 13, fontWeight: 700,
              fontFamily: 'sans-serif',
            }}
          >
            + Ajouter un produit
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {stats.map((s) => (
          <div key={s.label} style={{
            background: 'white', borderRadius: 12,
            padding: '20px 16px', textAlign: 'center',
            border: '1px solid #E8D5B0',
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#3A1F0A' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#7A5C42', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ACTIONS RAPIDES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {actions.map((a) => (
          a.href ? (
            <Link key={a.label} href={a.href} style={{
              background: 'white', borderRadius: 12,
              padding: '16px 12px', textDecoration: 'none',
              border: '1px solid #E8D5B0',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: a.color + '20',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 20,
                flexShrink: 0,
              }}>{a.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#2C1A0E' }}>{a.label}</div>
                <div style={{ fontSize: 11, color: '#7A5C42', marginTop: 2 }}>{a.sub}</div>
              </div>
            </Link>
          ) : (
            <button key={a.label} onClick={a.onClick} style={{
              background: 'white', borderRadius: 12,
              padding: '16px 12px', border: '1px solid #E8D5B0',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: 12,
              textAlign: 'left', width: '100%',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: a.color + '20',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 20,
                flexShrink: 0,
              }}>{a.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#2C1A0E' }}>{a.label}</div>
                <div style={{ fontSize: 11, color: '#7A5C42', marginTop: 2 }}>{a.sub}</div>
              </div>
            </button>
          )
        ))}
      </div>

      {/* FORMULAIRE */}
      {showForm && (
        <div style={{
          background: 'white', borderRadius: 12,
          padding: 24, marginBottom: 24,
          border: '1px solid #E8D5B0',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 18, margin: 0 }}>
              Nouveau produit
            </h2>
            <button onClick={() => setShowForm(false)} style={{
              background: 'none', border: 'none',
              fontSize: 20, cursor: 'pointer', color: '#7A5C42',
            }}>×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { key: 'name', label: 'Nom du produit *', placeholder: 'Samsung Galaxy A55' },
              { key: 'price', label: 'Prix (FCFA) *', placeholder: '285000' },
              { key: 'emoji', label: 'Emoji', placeholder: '📱' },
              { key: 'stock', label: 'Stock', placeholder: '10' },
            ].map((f) => (
              <div key={f.key}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 4 }}>
                  {f.label}
                </label>
                <input
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: '1.5px solid #E8D5B0', borderRadius: 8,
                    fontSize: 14, fontFamily: 'sans-serif',
                    boxSizing: 'border-box' as const,
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 4 }}>
              Catégorie
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={{
                width: '100%', padding: '10px 12px',
                border: '1.5px solid #E8D5B0', borderRadius: 8,
                fontSize: 14, fontFamily: 'sans-serif',
              }}
            >
              <option value="elec">📱 Électronique</option>
              <option value="cloth">👗 Vêtements</option>
              <option value="agri">🌱 Agriculture</option>
            </select>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 4 }}>
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description du produit..."
              rows={3}
              style={{
                width: '100%', padding: '10px 12px',
                border: '1.5px solid #E8D5B0', borderRadius: 8,
                fontSize: 14, fontFamily: 'sans-serif',
                resize: 'vertical' as const,
                boxSizing: 'border-box' as const,
              }}
            />
          </div>
          <button onClick={handleSubmit} style={{
            marginTop: 16, background: '#2D6A4F',
            color: 'white', border: 'none',
            padding: '12px 32px', borderRadius: 24,
            cursor: 'pointer', fontWeight: 700,
            fontSize: 15, fontFamily: 'sans-serif',
          }}>
            ✅ Sauvegarder
          </button>
        </div>
      )}

      {/* LISTE PRODUITS */}
      <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #E8D5B0' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F5ECD7', display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 17, margin: 0 }}>
            Mes Produits
          </h2>
          <span style={{ color: '#7A5C42', fontSize: 13 }}>{products.length} produits</span>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>⏳ Chargement...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#7A5C42' }}>
            Aucun produit — cliquez sur "+ Ajouter produit"
          </div>
        ) : products.map((p) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center',
            gap: 14, padding: '14px 20px',
            borderBottom: '1px solid #F5ECD7',
          }}>
            <div style={{
              width: 44, height: 44, background: '#F5ECD7',
              borderRadius: 8, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}>
              {p.emoji || '📦'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E' }}>{p.name}</div>
              <div style={{ fontSize: 12, color: '#7A5C42', marginTop: 2 }}>
                {p.category === 'elec' ? '📱 Électronique' : p.category === 'cloth' ? '👗 Vêtements' : '🌱 Agriculture'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#2D6A4F' }}>
                {p.price?.toLocaleString('fr-FR')} FCFA
              </div>
              <div style={{
                display: 'inline-block',
                background: p.stock > 0 ? '#D8F3DC' : '#FFE4E4',
                color: p.stock > 0 ? '#2D6A4F' : '#e53e3e',
                fontSize: 11, fontWeight: 600,
                padding: '2px 8px', borderRadius: 8, marginTop: 2,
              }}>
                {p.stock > 0 ? 'En stock' : 'Rupture'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{
                background: 'none', border: '1px solid #E8D5B0',
                borderRadius: 6, padding: '5px 10px',
                fontSize: 14, cursor: 'pointer',
              }}>👁️</button>
              <button
                onClick={() => handleDelete(p.id)}
                style={{
                  background: 'none', border: '1px solid #FFE4E4',
                  borderRadius: 6, padding: '5px 10px',
                  fontSize: 14, cursor: 'pointer', color: '#e53e3e',
                }}
              >🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
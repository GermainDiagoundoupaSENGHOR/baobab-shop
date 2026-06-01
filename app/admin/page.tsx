'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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
    name: '',
    price: '',
    category: 'elec',
    sub_category: '',
    emoji: '',
    description: '',
    stock: '',
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.price) return alert('Nom et prix obligatoires !')
    const { error } = await supabase.from('products').insert({
      name: form.name,
      price: parseFloat(form.price),
      category: form.category,
      sub_category: form.sub_category,
      emoji: form.emoji,
      description: form.description,
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

  return (
    <div style={{ padding: 24, background: '#F5ECD7', minHeight: '100vh' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 28, margin: 0 }}>
            ⚙️ Admin
          </h1>
          <p style={{ color: '#7A5C42', margin: 0, fontSize: 13 }}>Gestion des produits</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: '#2D6A4F',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 20,
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {showForm ? '✕ Annuler' : '+ Ajouter produit'}
        </button>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Produits', value: products.length, icon: '📦' },
          { label: 'Électronique', value: products.filter(p => p.category === 'elec').length, icon: '📱' },
          { label: 'Vêtements', value: products.filter(p => p.category === 'cloth').length, icon: '👗' },
          { label: 'Agriculture', value: products.filter(p => p.category === 'agri').length, icon: '🌱' },
        ].map((s) => (
          <div key={s.label} style={{
            background: 'white',
            borderRadius: 10,
            padding: 16,
            border: '1px solid #E8D5B0',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 24 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#3A1F0A' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#7A5C42', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* FORMULAIRE */}
      {showForm && (
        <div style={{
          background: 'white',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
          border: '1px solid #E8D5B0',
        }}>
          <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 20, marginBottom: 16 }}>
            Nouveau produit
          </h2>
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
                    width: '100%',
                    padding: '10px 12px',
                    border: '1.5px solid #E8D5B0',
                    borderRadius: 8,
                    fontSize: 14,
                    fontFamily: 'sans-serif',
                    boxSizing: 'border-box',
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
                width: '100%',
                padding: '10px 12px',
                border: '1.5px solid #E8D5B0',
                borderRadius: 8,
                fontSize: 14,
                fontFamily: 'sans-serif',
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
                width: '100%',
                padding: '10px 12px',
                border: '1.5px solid #E8D5B0',
                borderRadius: 8,
                fontSize: 14,
                fontFamily: 'sans-serif',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            onClick={handleSubmit}
            style={{
              marginTop: 16,
              background: '#2D6A4F',
              color: 'white',
              border: 'none',
              padding: '12px 32px',
              borderRadius: 24,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            ✅ Sauvegarder
          </button>
        </div>
      )}

      {/* TABLE PRODUITS */}
      <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #E8D5B0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#3A1F0A' }}>
              {['Produit', 'Catégorie', 'Prix', 'Stock', 'Actions'].map((h) => (
                <th key={h} style={{
                  color: '#F5ECD7',
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40 }}>⏳ Chargement...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#7A5C42' }}>
                Aucun produit — cliquez sur "+ Ajouter produit"
              </td></tr>
            ) : products.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #F5ECD7' }}>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>
                  {p.emoji} {p.name}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    background: '#F5ECD7',
                    color: '#5C3317',
                    padding: '3px 10px',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 600,
                  }}>
                    {p.category === 'elec' ? '📱 Électronique' : p.category === 'cloth' ? '👗 Vêtements' : '🌱 Agriculture'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#2D6A4F' }}>
                  {p.price?.toLocaleString('fr-FR')} FCFA
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{p.stock}</td>
                <td style={{ padding: '12px 16px' }}>
                  <button
                    onClick={() => handleDelete(p.id)}
                    style={{
                      background: 'none',
                      border: '1px solid #E8D5B0',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 11,
                      cursor: 'pointer',
                      color: '#e53e3e',
                    }}
                  >
                    🗑️ Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
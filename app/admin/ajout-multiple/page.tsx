'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Variant {
  couleur: string
  emoji: string
  stock: string
}

export default function AjoutMultiple() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    price: '',
    category: 'elec',
    sub_category: '',
    description: '',
  })
  const [variants, setVariants] = useState<Variant[]>([
    { couleur: '', emoji: '', stock: '10' },
    { couleur: '', emoji: '', stock: '10' },
  ])
  const [loading, setLoading] = useState(false)

  const addVariant = () => {
    setVariants([...variants, { couleur: '', emoji: '', stock: '10' }])
  }

  const removeVariant = (i: number) => {
    setVariants(variants.filter((_, idx) => idx !== i))
  }

  const updateVariant = (i: number, key: keyof Variant, value: string) => {
    setVariants(variants.map((v, idx) => idx === i ? { ...v, [key]: value } : v))
  }

  const handleSubmit = async () => {
    if (!form.name || !form.price) return alert('Nom et prix obligatoires !')
    if (variants.some(v => !v.couleur)) return alert('Remplissez toutes les couleurs !')

    setLoading(true)

    const products = variants.map(v => ({
      name: `${form.name} — ${v.couleur}`,
      price: parseFloat(form.price),
      category: form.category,
      sub_category: form.sub_category,
     emoji: v.emoji || (form.category === 'elec' ? '📱' : form.category === 'cloth' ? '👗' : '🌱'),
      description: form.description,
      stock: parseInt(v.stock) || 0,
    }))

    const { error } = await supabase.from('products').insert(products)
    setLoading(false)

    if (error) return alert('Erreur: ' + error.message)
    alert(`✅ ${variants.length} produits ajoutés avec succès !`)
    router.push('/admin')
  }

  return (
    <div style={{ background: '#F5ECD7', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        {/* HEADER */}
        <button onClick={() => router.push('/admin')} style={{
          background: 'none', border: 'none',
          color: '#5C3317', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', marginBottom: 20,
          padding: 0, fontFamily: 'sans-serif',
        }}>
          ← Retour au dashboard
        </button>

        <h1 style={{
          fontFamily: 'Georgia, serif',
          color: '#3A1F0A', fontSize: 26, marginBottom: 4,
        }}>
          📦 Ajout multiple
        </h1>
        <p style={{ color: '#7A5C42', fontSize: 13, marginBottom: 24 }}>
          Ajoutez plusieurs variantes d'un même produit en une seule fois
        </p>

        {/* INFOS COMMUNES */}
        <div style={{
          background: 'white', borderRadius: 14,
          padding: 24, marginBottom: 20,
          border: '1px solid #E8D5B0',
        }}>
          <h2 style={{
            fontFamily: 'Georgia, serif',
            color: '#3A1F0A', fontSize: 17, marginBottom: 16,
          }}>
            📝 Informations communes
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 5 }}>
                Nom du produit *
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Montre Casio"
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1.5px solid #E8D5B0', borderRadius: 8,
                  fontSize: 14, fontFamily: 'sans-serif',
                  boxSizing: 'border-box' as const,
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 5 }}>
                Prix (FCFA) *
              </label>
              <input
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="Ex: 15000"
                type="number"
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1.5px solid #E8D5B0', borderRadius: 8,
                  fontSize: 14, fontFamily: 'sans-serif',
                  boxSizing: 'border-box' as const,
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 5 }}>
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

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 5 }}>
              Description (commune à toutes les variantes)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ex: Montre Casio originale, résistante à l'eau, garantie 1 an..."
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
        </div>

        {/* VARIANTES */}
        <div style={{
          background: 'white', borderRadius: 14,
          padding: 24, marginBottom: 20,
          border: '1px solid #E8D5B0',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{
              fontFamily: 'Georgia, serif',
              color: '#3A1F0A', fontSize: 17, margin: 0,
            }}>
              🎨 Variantes ({variants.length})
            </h2>
            <button onClick={addVariant} style={{
              background: '#2D6A4F', color: 'white',
              border: 'none', padding: '7px 16px',
              borderRadius: 20, cursor: 'pointer',
              fontSize: 12, fontWeight: 700,
              fontFamily: 'sans-serif',
            }}>
              + Ajouter une variante
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {variants.map((v, i) => (
              <div key={i} style={{
                background: '#F5ECD7', borderRadius: 10,
                padding: '14px 16px',
                border: '1px solid #E8D5B0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#3A1F0A' }}>
                    Variante {i + 1}
                  </span>
                  {variants.length > 1 && (
                    <button onClick={() => removeVariant(i)} style={{
                      background: 'none', border: 'none',
                      color: '#e53e3e', cursor: 'pointer',
                      fontSize: 16, padding: 0,
                    }}>×</button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 4 }}>
                      Couleur / Variante *
                    </label>
                    <input
                      value={v.couleur}
                      onChange={(e) => updateVariant(i, 'couleur', e.target.value)}
                      placeholder="Ex: Rouge, Bleu, Noir..."
                      style={{
                        width: '100%', padding: '9px 12px',
                        border: '1.5px solid #E8D5B0', borderRadius: 8,
                        fontSize: 13, fontFamily: 'sans-serif',
                        background: 'white', boxSizing: 'border-box' as const,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 4 }}>
                      Emoji
                    </label>
                    <input
                      value={v.emoji}
                      onChange={(e) => updateVariant(i, 'emoji', e.target.value)}
                      placeholder="⌚"
                      style={{
                        width: '100%', padding: '9px 12px',
                        border: '1.5px solid #E8D5B0', borderRadius: 8,
                        fontSize: 13, fontFamily: 'sans-serif',
                        background: 'white', boxSizing: 'border-box' as const,
                        textAlign: 'center',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 4 }}>
                      Stock
                    </label>
                    <input
                      value={v.stock}
                      onChange={(e) => updateVariant(i, 'stock', e.target.value)}
                      type="number"
                      placeholder="10"
                      style={{
                        width: '100%', padding: '9px 12px',
                        border: '1.5px solid #E8D5B0', borderRadius: 8,
                        fontSize: 13, fontFamily: 'sans-serif',
                        background: 'white', boxSizing: 'border-box' as const,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* APERÇU */}
        {form.name && (
          <div style={{
            background: 'white', borderRadius: 14,
            padding: 20, marginBottom: 20,
            border: '1px solid #E8D5B0',
          }}>
            <h3 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 15, marginBottom: 12 }}>
              👁️ Aperçu des produits qui seront créés
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {variants.map((v, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center',
                  gap: 12, padding: '8px 12px',
                  background: '#F5ECD7', borderRadius: 8,
                }}>
                  <span style={{ fontSize: 20 }}>{v.emoji || (form.category === 'elec' ? '📱' : form.category === 'cloth' ? '👗' : '🌱')}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E' }}>
                      {form.name}{v.couleur ? ` — ${v.couleur}` : ''}
                    </div>
                    <div style={{ fontSize: 11, color: '#7A5C42' }}>Stock: {v.stock || 0}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#2D6A4F' }}>
                    {form.price ? parseInt(form.price).toLocaleString('fr-FR') + ' FCFA' : '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOUTON */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', background: '#2D6A4F',
            color: 'white', border: 'none',
            padding: '14px', borderRadius: 24,
            cursor: 'pointer', fontWeight: 700,
            fontSize: 16, fontFamily: 'sans-serif',
          }}
        >
          {loading ? '⏳ Ajout en cours...' : `✅ Ajouter ${variants.length} produit(s)`}
        </button>
      </div>
    </div>
  )
}
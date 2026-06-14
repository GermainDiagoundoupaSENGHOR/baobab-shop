'use client'
import { useEffect, useState, useRef } from 'react'
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
  image_url?: string
  video_url?: string
}

export default function Admin() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({})
  const [cancelCounts, setCancelCounts] = useState<Record<string, number>>({})
  const [totalOrders, setTotalOrders] = useState(0)
  const [totalCancels, setTotalCancels] = useState(0)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    name: '', price: '', category: 'elec',
    sub_category: '', emoji: '', description: '', stock: '',
  })

  useEffect(() => { fetchProducts(); fetchOrderStats() }, [])

  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  const fetchOrderStats = async () => {
    const { data: orders } = await supabase.from('orders').select('items, status')
    if (!orders) return
    const counts: Record<string, number> = {}
    const cancels: Record<string, number> = {}
    let totalO = 0, totalC = 0
    orders.forEach((order) => {
      const items = order.items || []
      items.forEach((item: any) => {
        const pid = item.product_id || item.id
        if (pid) {
          counts[pid] = (counts[pid] || 0) + 1
          totalO++
          if (order.status === 'cancelled' || order.status === 'annulé') {
            cancels[pid] = (cancels[pid] || 0) + 1
            totalC++
          }
        }
      })
    })
    setOrderCounts(counts)
    setCancelCounts(cancels)
    setTotalOrders(totalO)
    setTotalCancels(totalC)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return alert('❌ Image trop grande (max 5MB)')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) return alert('❌ Vidéo trop grande (max 50MB)')
    setVideoFile(file)
    setVideoPreview(URL.createObjectURL(file))
  }

  const uploadFile = async (file: File, folder: string) => {
    const ext = file.name.split('.').pop()
    const path = `${folder}/${Date.now()}.${ext}`
    const { data: buckets } = await supabase.storage.listBuckets()
    console.log('Buckets:', JSON.stringify(buckets?.map(b => b.name)))
    const { error } = await supabase.storage.from('Products').upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('Products').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSubmit = async () => {
    if (!form.name || !form.price) return alert('Nom et prix obligatoires !')
    setUploading(true)
    let image_url = ''
    let video_url = ''
    try {
      if (imageFile) image_url = await uploadFile(imageFile, 'images')
      if (videoFile) video_url = await uploadFile(videoFile, 'videos')
    } catch (err: any) {
      setUploading(false)
      return alert('❌ Erreur upload: ' + err.message)
    }
    const { error } = await supabase.from('products').insert({
      name: form.name, price: parseFloat(form.price),
      category: form.category, sub_category: form.sub_category,
      emoji: form.emoji, description: form.description,
      stock: parseInt(form.stock) || 0,
      image_url: image_url || null,
      video_url: video_url || null,
    })
    setUploading(false)
    if (error) return alert('Erreur: ' + error.message)
    alert('✅ Produit ajouté !')
    setShowForm(false)
    setForm({ name: '', price: '', category: 'elec', sub_category: '', emoji: '', description: '', stock: '' })
    setImageFile(null); setImagePreview(null)
    setVideoFile(null); setVideoPreview(null)
    fetchProducts()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return
    await supabase.from('products').delete().eq('id', id)
    fetchProducts()
  }

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'elec': return { label: 'Électronique', icon: '📱', color: '#1B8EF8' }
      case 'cloth': return { label: 'Vêtements', icon: '👗', color: '#FF6600' }
      case 'agri': return { label: 'Agriculture', icon: '🌱', color: '#2D6A4F' }
      default: return { label: cat, icon: '📦', color: '#8B5E3C' }
    }
  }

  const stats = [
    { icon: '📦', label: 'Produits', value: products.length },
    { icon: '✅', label: 'En stock', value: products.filter(p => p.stock > 0).length },
    { icon: '🛒', label: 'Commandes', value: totalOrders },
    { icon: '❌', label: 'Annulations', value: totalCancels },
  ]

  const actions = [
    { icon: '➕', label: 'Ajouter un produit', sub: 'Publier un nouveau produit', color: '#2D6A4F', onClick: () => setShowForm(true) },
    { icon: '📦', label: 'Ajout multiple', sub: 'Plusieurs variantes à la fois', color: '#8B5E3C', href: '/admin/ajout-multiple' },
    { icon: '📋', label: 'Voir les commandes', sub: 'Commandes reçues', color: '#1B8EF8', href: '/orders' },
    { icon: '💬', label: 'Messagerie', sub: 'Discuter avec les clients', color: '#FF6600', href: '/messages' },
    { icon: '👤', label: 'Mon profil', sub: 'Modifier mes infos', color: '#5C3317', href: '/profil' },
  ]

  const uploadZoneStyle = {
    border: '2px dashed #E8D5B0', borderRadius: 12,
    padding: '32px 20px', textAlign: 'center' as const,
    cursor: 'pointer', background: '#FDFAF5',
  }

  return (
    <div style={{ background: '#F5ECD7', minHeight: '100vh', padding: 20, fontFamily: 'sans-serif' }}>

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
            borderRadius: 20, textDecoration: 'none', fontSize: 13, fontWeight: 600,
          }}>🛒 Voir les commandes</Link>
          <button onClick={() => setShowForm(true)} style={{
            background: '#2D6A4F', color: 'white', border: 'none',
            padding: '9px 16px', borderRadius: 20, cursor: 'pointer',
            fontSize: 13, fontWeight: 700,
          }}>+ Ajouter un produit</button>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {stats.map((s) => (
          <div key={s.label} style={{
            background: 'white', borderRadius: 12,
            padding: '20px 16px', textAlign: 'center', border: '1px solid #E8D5B0',
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#3A1F0A' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#7A5C42', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ACTIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        {actions.map((a) => (
          a.href ? (
            <Link key={a.label} href={a.href} style={{
              background: 'white', borderRadius: 12, padding: '16px 12px',
              textDecoration: 'none', border: '1px solid #E8D5B0',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: a.color + '20',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>{a.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#2C1A0E' }}>{a.label}</div>
                <div style={{ fontSize: 11, color: '#7A5C42', marginTop: 2 }}>{a.sub}</div>
              </div>
            </Link>
          ) : (
            <button key={a.label} onClick={a.onClick} style={{
              background: 'white', borderRadius: 12, padding: '16px 12px',
              border: '1px solid #E8D5B0', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 12,
              textAlign: 'left', width: '100%',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: a.color + '20',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
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
          padding: 24, marginBottom: 24, border: '1px solid #E8D5B0',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 18, margin: 0 }}>
              Nouveau produit
            </h2>
            <button onClick={() => setShowForm(false)} style={{
              background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#7A5C42',
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
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: '1.5px solid #E8D5B0', borderRadius: 8,
                    fontSize: 14, boxSizing: 'border-box' as const,
                  }}
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 4 }}>Catégorie</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E8D5B0', borderRadius: 8, fontSize: 14 }}>
              <option value="elec">📱 Électronique</option>
              <option value="cloth">👗 Vêtements</option>
              <option value="agri">🌱 Agriculture</option>
            </select>
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 4 }}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description du produit..." rows={3}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E8D5B0', borderRadius: 8, fontSize: 14, resize: 'vertical' as const, boxSizing: 'border-box' as const }} />
          </div>

          {/* PHOTO */}
          <div style={{ marginTop: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#3A1F0A', display: 'block', marginBottom: 8 }}>
              📸 Photo du produit
            </label>
            <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange} style={{ display: 'none' }} />
            {!imagePreview ? (
              <div onClick={() => imageInputRef.current?.click()} style={uploadZoneStyle}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>⬆️</div>
                <div style={{ fontWeight: 600, color: '#3A1F0A', marginBottom: 4 }}>Cliquez pour ajouter une photo</div>
                <div style={{ fontSize: 12, color: '#7A5C42' }}>JPG, PNG — Max 5MB</div>
              </div>
            ) : (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={imagePreview} alt="preview" style={{ width: 200, height: 200, objectFit: 'cover', borderRadius: 12, border: '2px solid #E8D5B0' }} />
                <button onClick={() => { setImageFile(null); setImagePreview(null) }} style={{
                  position: 'absolute', top: 6, right: 6, background: '#e53e3e',
                  color: 'white', border: 'none', borderRadius: '50%',
                  width: 24, height: 24, cursor: 'pointer', fontSize: 14, fontWeight: 700,
                }}>×</button>
              </div>
            )}
          </div>

          {/* VIDÉO */}
          <div style={{ marginTop: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#3A1F0A', display: 'block', marginBottom: 8 }}>
              🎬 Vidéo du produit (optionnel)
            </label>
            <input ref={videoInputRef} type="file" accept="video/mp4,video/mov,video/quicktime"
              onChange={handleVideoChange} style={{ display: 'none' }} />
            {!videoPreview ? (
              <div onClick={() => videoInputRef.current?.click()} style={uploadZoneStyle}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎬</div>
                <div style={{ fontWeight: 600, color: '#3A1F0A', marginBottom: 4 }}>Cliquez pour ajouter une vidéo</div>
                <div style={{ fontSize: 12, color: '#7A5C42' }}>MP4, MOV — Max 50MB</div>
              </div>
            ) : (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <video src={videoPreview} controls style={{ width: 300, borderRadius: 12, border: '2px solid #E8D5B0' }} />
                <button onClick={() => { setVideoFile(null); setVideoPreview(null) }} style={{
                  position: 'absolute', top: 6, right: 6, background: '#e53e3e',
                  color: 'white', border: 'none', borderRadius: '50%',
                  width: 24, height: 24, cursor: 'pointer', fontSize: 14, fontWeight: 700,
                }}>×</button>
              </div>
            )}
          </div>

          <button onClick={handleSubmit} disabled={uploading} style={{
            marginTop: 20, background: uploading ? '#9CA3AF' : '#2D6A4F',
            color: 'white', border: 'none', padding: '12px 32px',
            borderRadius: 24, cursor: uploading ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: 15,
          }}>
            {uploading ? '⏳ Upload en cours...' : '✅ Sauvegarder'}
          </button>
        </div>
      )}

      {/* TABLEAU PRODUITS */}
      <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #E8D5B0' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F5ECD7', display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 17, margin: 0 }}>Mes Produits</h2>
          <span style={{ color: '#7A5C42', fontSize: 13 }}>{products.length} produits</span>
        </div>

        {/* EN-TÊTES */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 80px',
          padding: '10px 20px', background: '#FAF5EC',
          borderBottom: '1px solid #E8D5B0',
          fontSize: 11, fontWeight: 700, color: '#7A5C42',
          textTransform: 'uppercase' as const, letterSpacing: '0.5px',
        }}>
          <div>Produit</div>
          <div>Type</div>
          <div style={{ textAlign: 'center' }}>Stock</div>
          <div style={{ textAlign: 'center' }}>Prix</div>
          <div style={{ textAlign: 'center' }}>Commandes</div>
          <div style={{ textAlign: 'center' }}>Annulations</div>
          <div style={{ textAlign: 'center' }}>Actions</div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>⏳ Chargement...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#7A5C42' }}>
            Aucun produit — cliquez sur "+ Ajouter produit"
          </div>
        ) : products.map((p) => {
          const cat = getCategoryLabel(p.category)
          const orders = orderCounts[p.id] || 0
          const cancels = cancelCounts[p.id] || 0
          return (
            <div key={p.id} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 80px',
              alignItems: 'center', padding: '14px 20px',
              borderBottom: '1px solid #F5ECD7',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 8, overflow: 'hidden',
                  background: '#F5ECD7', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (p.emoji || '📦')}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#7A5C42' }}>{p.price?.toLocaleString('fr-FR')} FCFA</div>
                </div>
              </div>
              <div>
                <span style={{
                  background: cat.color + '15', color: cat.color,
                  fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                  border: `1px solid ${cat.color}30`,
                }}>{cat.icon} {cat.label}</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  background: p.stock > 10 ? '#D8F3DC' : p.stock > 0 ? '#FEF9C3' : '#FFE4E4',
                  color: p.stock > 10 ? '#2D6A4F' : p.stock > 0 ? '#92400e' : '#e53e3e',
                  fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                }}>{p.stock} {p.stock === 0 ? '❌' : p.stock <= 10 ? '⚠️' : '✅'}</span>
              </div>
              <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#2D6A4F' }}>
                {p.price?.toLocaleString('fr-FR')}
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  background: orders > 0 ? '#DBEAFE' : '#F5F5F5',
                  color: orders > 0 ? '#1B8EF8' : '#9A7B5A',
                  fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                }}>🛒 {orders}</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  background: cancels > 0 ? '#FFE4E4' : '#F5F5F5',
                  color: cancels > 0 ? '#e53e3e' : '#9A7B5A',
                  fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                }}>❌ {cancels}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                <button style={{
                  background: 'none', border: '1px solid #E8D5B0',
                  borderRadius: 6, padding: '5px 8px', fontSize: 14, cursor: 'pointer',
                }}>✏️</button>
                <button onClick={() => handleDelete(p.id)} style={{
                  background: 'none', border: '1px solid #FFE4E4',
                  borderRadius: 6, padding: '5px 8px', fontSize: 14,
                  cursor: 'pointer', color: '#e53e3e',
                }}>🗑️</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
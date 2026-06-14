'use client'
import { useState, useRef } from 'react'
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
    name: '', price: '', original_price: '',
    category: 'elec', sub_category: '', description: '',
  })
  const [variants, setVariants] = useState<Variant[]>([
    { couleur: '', emoji: '', stock: '10' },
    { couleur: '', emoji: '', stock: '10' },
  ])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const addVariant = () => setVariants([...variants, { couleur: '', emoji: '', stock: '10' }])
  const removeVariant = (i: number) => setVariants(variants.filter((_, idx) => idx !== i))
  const updateVariant = (i: number, key: keyof Variant, value: string) =>
    setVariants(variants.map((v, idx) => idx === i ? { ...v, [key]: value } : v))

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
    const { error } = await supabase.storage.from('Products').upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('Products').getPublicUrl(path)
    return data.publicUrl
  }

  const generateDescription = async () => {
    if (!form.name) return alert("Entrez le nom du produit d'abord !")
    setAiLoading(true)
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lang: 'fr',
          messages: [{
            role: 'user',
            content: `Génère une description courte et attractive (2-3 phrases) pour ce produit à vendre sur un e-commerce sénégalais: "${form.name}". Réponds UNIQUEMENT avec la description, sans introduction.`
          }]
        })
      })
      const data = await res.json()
      setForm({ ...form, description: data.message })
    } catch { alert('Erreur IA') }
    setAiLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.price) return alert('Nom et prix obligatoires !')
    if (variants.some(v => !v.couleur)) return alert('Remplissez toutes les couleurs !')
    setLoading(true)

    let image_url = ''
    let video_url = ''

    try {
      if (imageFile) image_url = await uploadFile(imageFile, 'images')
      if (videoFile) video_url = await uploadFile(videoFile, 'videos')
    } catch (err: any) {
      setLoading(false)
      return alert('❌ Erreur upload: ' + err.message)
    }

    const products = variants.map(v => ({
      name: `${form.name} — ${v.couleur}`,
      price: parseFloat(form.price),
      category: form.category,
      sub_category: form.sub_category,
      emoji: v.emoji || (form.category === 'elec' ? '📱' : form.category === 'cloth' ? '👗' : '🌱'),
      description: form.description,
      stock: parseInt(v.stock) || 0,
      image_url: image_url || null,
      video_url: video_url || null,
    }))

    const { error } = await supabase.from('products').insert(products)
    setLoading(false)
    if (error) return alert('Erreur: ' + error.message)
    alert(`✅ ${variants.length} produits ajoutés !`)
    router.push('/admin')
  }

  const uploadZoneStyle = {
    border: '2px dashed #E8D5B0', borderRadius: 12,
    padding: '32px 20px', textAlign: 'center' as const,
    cursor: 'pointer', background: '#FDFAF5',
  }

  return (
    <div style={{ background: '#F5ECD7', minHeight: '100vh', padding: 24, fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        <button onClick={() => router.push('/admin')} style={{
          background: 'none', border: 'none', color: '#5C3317',
          fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 20, padding: 0,
        }}>← Retour au dashboard</button>

        <h1 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 26, marginBottom: 4 }}>
          📦 Ajout multiple
        </h1>
        <p style={{ color: '#7A5C42', fontSize: 13, marginBottom: 24 }}>
          Ajoutez plusieurs variantes d'un même produit en une seule fois
        </p>

        {/* INFOS COMMUNES */}
        <div style={{ background: 'white', borderRadius: 14, padding: 24, marginBottom: 20, border: '1px solid #E8D5B0' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 17, marginBottom: 16 }}>
            📝 Informations communes
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            {[
              { key: 'name', label: 'Nom du produit *', placeholder: 'Ex: Montre Casio', type: 'text' },
              { key: 'price', label: 'Prix (FCFA) *', placeholder: 'Ex: 15000', type: 'number' },
              { key: 'original_price', label: 'Prix original (FCFA)', placeholder: 'Ex: 25000', type: 'number' },
            ].map((f) => (
              <div key={f.key}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 5 }}>{f.label}</label>
                <input type={f.type} value={(form as any)[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E8D5B0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' as const }} />
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 5 }}>Catégorie</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E8D5B0', borderRadius: 8, fontSize: 14 }}>
              <option value="elec">📱 Électronique</option>
              <option value="cloth">👗 Vêtements</option>
              <option value="agri">🌱 Agriculture</option>
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42' }}>Description</label>
              <button onClick={generateDescription} style={{
                background: '#C9860A', color: 'white', border: 'none',
                padding: '5px 12px', borderRadius: 16, cursor: 'pointer',
                fontSize: 12, fontWeight: 700,
              }}>{aiLoading ? '⏳' : '🤖 IA'}</button>
            </div>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description ou cliquez sur IA..." rows={3}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E8D5B0', borderRadius: 8, fontSize: 14, resize: 'vertical' as const, boxSizing: 'border-box' as const }} />
          </div>
        </div>

        {/* PHOTO & VIDÉO */}
        <div style={{ background: 'white', borderRadius: 14, padding: 24, marginBottom: 20, border: '1px solid #E8D5B0' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 17, marginBottom: 16 }}>
            🖼️ Médias (communs à toutes les variantes)
          </h2>

          {/* PHOTO */}
          <div style={{ marginBottom: 20 }}>
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
          <div>
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
        </div>

        {/* VARIANTES */}
        <div style={{ background: 'white', borderRadius: 14, padding: 24, marginBottom: 20, border: '1px solid #E8D5B0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 17, margin: 0 }}>
              🎨 Variantes ({variants.length})
            </h2>
            <button onClick={addVariant} style={{
              background: '#2D6A4F', color: 'white', border: 'none',
              padding: '7px 16px', borderRadius: 20, cursor: 'pointer',
              fontSize: 12, fontWeight: 700,
            }}>+ Ajouter une variante</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {variants.map((v, i) => (
              <div key={i} style={{ background: '#F5ECD7', borderRadius: 10, padding: '14px 16px', border: '1px solid #E8D5B0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#3A1F0A' }}>Variante {i + 1}</span>
                  {variants.length > 1 && (
                    <button onClick={() => removeVariant(i)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: 16 }}>×</button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: 10 }}>
                  {[
                    { key: 'couleur', label: 'Couleur / Variante *', placeholder: 'Ex: Rouge, Bleu...', type: 'text', align: 'left' },
                    { key: 'emoji', label: 'Emoji', placeholder: '⌚', type: 'text', align: 'center' },
                    { key: 'stock', label: 'Stock', placeholder: '10', type: 'number', align: 'left' },
                  ].map((f) => (
                    <div key={f.key}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 4 }}>{f.label}</label>
                      <input type={f.type} value={(v as any)[f.key]}
                        onChange={(e) => updateVariant(i, f.key as keyof Variant, e.target.value)}
                        placeholder={f.placeholder}
                        style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E8D5B0', borderRadius: 8, fontSize: 13, background: 'white', boxSizing: 'border-box' as const, textAlign: f.align as any }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* APERÇU */}
        {form.name && (
          <div style={{ background: 'white', borderRadius: 14, padding: 20, marginBottom: 20, border: '1px solid #E8D5B0' }}>
            <h3 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 15, marginBottom: 12 }}>
              👁️ Aperçu des produits
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {variants.map((v, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#F5ECD7', borderRadius: 8 }}>
                  {imagePreview ? (
                    <img src={imagePreview} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 20 }}>{v.emoji || (form.category === 'elec' ? '📱' : form.category === 'cloth' ? '👗' : '🌱')}</span>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E' }}>
                      {form.name}{v.couleur ? ` — ${v.couleur}` : ''}
                    </div>
                    <div style={{ fontSize: 11, color: '#7A5C42' }}>Stock: {v.stock || 0}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#2D6A4F' }}>
                      {form.price ? parseInt(form.price).toLocaleString('fr-FR') + ' FCFA' : '—'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', background: loading ? '#9CA3AF' : '#2D6A4F',
          color: 'white', border: 'none', padding: '14px',
          borderRadius: 24, cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 700, fontSize: 16,
        }}>
          {loading ? '⏳ Upload en cours...' : `✅ Ajouter ${variants.length} produit(s)`}
        </button>
      </div>
    </div>
  )
}
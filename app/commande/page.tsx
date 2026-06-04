'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Commande() {
  const [form, setForm] = useState({
    nom: '',
    telephone: '',
    region: '',
    adresse: '',
    notes: '',
  })
  const router = useRouter()

  const regions = [
    'Dakar', 'Thiès', 'Saint-Louis', 'Diourbel',
    'Louga', 'Kaolack', 'Ziguinchor', 'Kolda',
    'Matam', 'Tambacounda', 'Fatick', 'Kaffrine',
    'Kédougou', 'Sédhiou',
  ]

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    border: '1.5px solid #8B5E3C',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'sans-serif',
    background: '#3A1F0A',
    boxSizing: 'border-box' as const,
    color: '#F5ECD7',
    outline: 'none',
  }

  const labelStyle = {
    fontSize: 13,
    fontWeight: 600 as const,
    color: '#3A1F0A',
    display: 'block' as const,
    marginBottom: 6,
  }

  const handleSubmit = () => {
    if (!form.nom || !form.telephone || !form.region || !form.adresse) {
      return alert('Veuillez remplir tous les champs obligatoires !')
    }
    router.push('/paiement')
  }

  return (
    <div style={{ background: '#F5ECD7', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{
          fontFamily: 'Georgia, serif',
          color: '#3A1F0A',
          fontSize: 28,
          marginBottom: 24,
        }}>
          🛍️ Finaliser ma commande
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>

          {/* FORMULAIRE LIVRAISON */}
          <div style={{
            background: 'white',
            borderRadius: 14,
            padding: 28,
            border: '1px solid #E8D5B0',
          }}>
            <h2 style={{
              fontSize: 17, fontWeight: 700,
              color: '#3A1F0A', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              📍 Informations de livraison
            </h2>

            {/* NOM + TELEPHONE */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Nom complet *</label>
                <input
                  type="text"
                  placeholder="Ex: Amadou Diallo"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Téléphone *</label>
                <input
                  type="tel"
                  placeholder="77 123 45 67"
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* REGION */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Région *</label>
              <select
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                style={inputStyle}
              >
                <option value="" style={{ background: '#3A1F0A', color: '#F5ECD7' }}>
                  Choisir votre région
                </option>
                {regions.map((r) => (
                  <option key={r} value={r} style={{ background: '#3A1F0A', color: '#F5ECD7' }}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* ADRESSE */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Adresse complète *</label>
              <input
                type="text"
                placeholder="Ex: Médina, Rue 12, Dakar"
                value={form.adresse}
                onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                style={inputStyle}
              />
            </div>

            {/* NOTES */}
            <div>
              <label style={labelStyle}>Notes (optionnel)</label>
              <textarea
                placeholder="Instructions spéciales pour la livraison..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={4}
                style={{
                  ...inputStyle,
                  resize: 'vertical' as const,
                }}
              />
            </div>
          </div>

          {/* RÉSUMÉ */}
          <div>
            <div style={{
              background: 'white',
              borderRadius: 14,
              padding: 24,
              border: '1px solid #E8D5B0',
              position: 'sticky' as const,
              top: 20,
            }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#3A1F0A', marginBottom: 16 }}>
                Résumé
              </h2>

              {/* PRODUIT */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                marginBottom: 16, paddingBottom: 16,
                borderBottom: '1px solid #F5ECD7',
              }}>
                <div style={{
                  width: 44, height: 44, background: '#F5ECD7',
                  borderRadius: 8, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0,
                }}>
                  📱
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E' }}>
                    Samsung Galaxy A55
                  </div>
                  <div style={{ fontSize: 12, color: '#7A5C42' }}>x1</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E' }}>
                  285 000 FCFA
                </div>
              </div>

              {/* TOTAUX */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#7A5C42', marginBottom: 8 }}>
                  <span>Sous-total</span><span>285 000 FCFA</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#7A5C42', marginBottom: 12 }}>
                  <span>Livraison</span><span>2 500 FCFA</span>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 17, fontWeight: 700, color: '#2D6A4F',
                  borderTop: '1px solid #E8D5B0', paddingTop: 12,
                }}>
                  <span>Total</span><span>287 500 FCFA</span>
                </div>
              </div>

              {/* BOUTON */}
              <button
                onClick={handleSubmit}
                style={{
                  width: '100%', background: '#2D6A4F',
                  color: 'white', border: 'none',
                  padding: '14px', borderRadius: 24,
                  cursor: 'pointer', fontWeight: 700,
                  fontSize: 15, fontFamily: 'sans-serif',
                  marginBottom: 12,
                }}
              >
                🛒 Confirmer la commande
              </button>

              {/* PAIEMENT SECURISE */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: '#7A5C42', marginBottom: 6 }}>Paiement sécurisé</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#1B8EF8', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1B8EF8', display: 'inline-block' }}></span>
                    Wave
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#FF6600', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF6600', display: 'inline-block' }}></span>
                    Orange
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#2C6E9E', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2C6E9E', display: 'inline-block' }}></span>
                    Free
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCart, clearCart, CartItem } from '@/lib/cart'
import { supabase } from '@/lib/supabase'

interface Zone { key: string; label: string; price: number; sub: string }

export default function Paiement() {
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery')
  const [deliveryZone, setDeliveryZone] = useState('dakar')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null)
  const [paymentSettings, setPaymentSettings] = useState({
    wave_link: '', orange_number: '',
    bank_name: '', bank_account_name: '', bank_account_number: '', bank_iban: '',
  })
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [modalError, setModalError] = useState('')
  const [paymentPhone, setPaymentPhone] = useState('')
  const [deliveryZones, setDeliveryZones] = useState<Zone[]>([
    { key: 'dakar', label: 'Dakar centre', price: 1500, sub: 'Plateau, Médina, Gueule Tapée...' },
    { key: 'banlieue', label: 'Banlieue Dakar', price: 2500, sub: 'Pikine, Guédiawaye, Rufisque...' },
    { key: 'thies', label: 'Thiès', price: 4000, sub: 'Livraison sous 2-3 jours' },
    { key: 'regions', label: 'Autres régions', price: 6000, sub: 'Saint-Louis, Kaolack, Ziguinchor...' },
  ])

  useEffect(() => {
    const cart = getCart()
    if (cart.length === 0) router.push('/panier')
    setItems(cart)
    loadPaymentSettings()
    loadDeliveryZones()
  }, [])

  const loadPaymentSettings = async () => {
    const { data } = await supabase.from('payment_settings').select('*').limit(1).single()
    if (data) setPaymentSettings(data)
  }

  // Zones configurées par le Super Admin (table delivery_zones)
  const loadDeliveryZones = async () => {
    const { data } = await supabase
      .from('delivery_zones').select('*').eq('is_active', true).order('position')
    if (data && data.length > 0) {
      setDeliveryZones(data.map((z: any) => ({
        key: z.id, label: z.name, price: z.price, sub: z.description || z.delay || '',
      })))
      setDeliveryZone(data[0].id)
    }
  }

  const showMsg = (text: string, type: 'error' | 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const selectedZone = deliveryZones.find(z => z.key === deliveryZone)
  const livraison = deliveryType === 'delivery' ? (selectedZone?.price || 0) : 0
  const total = subtotal + livraison

  const paymentMethods = [
    { key: 'wave', label: 'Wave', img: '/wave.png', color: '#1B9CFC', bg: '#EBF8FF' },
    { key: 'orange', label: 'Orange Money', img: '/orange.png', color: '#FF6600', bg: '#FFF3EB' },
    { key: 'bank', label: 'Virement bancaire', icon: '🏦', color: '#7C3AED', bg: '#F3EBFF' },
    { key: 'cash', label: deliveryType === 'delivery' ? 'Paiement à la livraison' : 'Paiement sur place', icon: '💵', color: '#2D6A4F', bg: '#EBFFF3' },
  ] as { key: string; label: string; img?: string; icon?: string; color: string; bg: string }[]

  const handlePay = () => {
    if (!selectedMethod) return showMsg('❌ Choisissez un mode de paiement', 'error')
    if (!phone) return showMsg('❌ Numéro de téléphone requis', 'error')
    if (deliveryType === 'delivery' && !address) return showMsg('❌ Adresse de livraison requise', 'error')
    setPaymentPhone(phone)
    setShowPaymentModal(true)
  }

  const openWaveLink = () => {
    if (!paymentSettings.wave_link) return
    const url = paymentSettings.wave_link.includes('?')
      ? `${paymentSettings.wave_link}&amount=${total}`
      : `${paymentSettings.wave_link}?amount=${total}`
    window.open(url, '_blank')
  }

  // Envoi du reçu via l'API (service_role, contourne les RLS)
  const sendReceipt = async (userId: string, orderId: string) => {
    try {
      const res = await fetch('/api/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId, orderId, items, total, subtotal, livraison,
          selectedZone, deliveryType, deliveryZone,
          phone, address, selectedMethod, paymentPhone, paymentSettings,
        }),
      })
      if (!res.ok) console.error('Erreur reçu:', await res.json())
    } catch (err) {
      console.error('Erreur appel API reçu:', err)
    }
  }

  const submitOrder = async () => {
    if ((selectedMethod === 'wave' || selectedMethod === 'orange') && !paymentPhone)
      return setModalError('❌ Votre numéro Wave / Orange Money est requis')

    setLoading(true)
    setModalError('')
    const { data: userData } = await supabase.auth.getUser()

    const { data: orderData, error } = await supabase
      .from('orders')
      .insert({
        user_id: userData.user?.id || null,
        items: items.map(i => ({
          product_id: i.id, name: i.name, price: i.price,
          quantity: i.quantity, image_url: i.image_url,
        })),
        total,
        payment_method: selectedMethod,
        payment_phone: selectedMethod === 'wave' || selectedMethod === 'orange' ? paymentPhone : null,
        delivery_type: deliveryType,
        delivery_zone: deliveryType === 'delivery' ? deliveryZone : null,
        delivery_fee: livraison,
        phone,
        address: deliveryType === 'delivery' ? address : 'Retrait en magasin — B@OB@B Shop',
        status: 'en_attente',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Erreur commande:', error)
      setLoading(false)
      setModalError('❌ ' + error.message + (error.details ? ' — ' + error.details : ''))
      return
    }

    if (userData.user?.id && orderData?.id) {
      await sendReceipt(userData.user.id, orderData.id)
    }

    setLoading(false)
    setShowPaymentModal(false)
    clearCart()
    router.push('/commande')
  }

  const card: React.CSSProperties = {
    background: 'white', borderRadius: 14, padding: 20, marginBottom: 16, border: '1px solid #E8D5B0',
  }
  const h2: React.CSSProperties = {
    fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 16, marginBottom: 12,
  }

  return (
    <div style={{ background: '#F5ECD7', minHeight: '100vh', padding: 24, fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#3A1F0A' }}>←</button>
          <h1 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 26, margin: 0 }}>💳 Paiement</h1>
        </div>

        {message && (
          <div style={{
            background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
            border: `1px solid ${message.type === 'success' ? '#6ee7b7' : '#fca5a5'}`,
            color: message.type === 'success' ? '#065f46' : '#991b1b',
            borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 600, marginBottom: 16,
          }}>{message.text}</div>
        )}

        {/* RÉCAPITULATIF */}
        <div style={card}>
          <h2 style={h2}>📦 Récapitulatif ({items.length} article{items.length > 1 ? 's' : ''})</h2>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', color: '#7A5C42', borderBottom: '1px solid #F5ECD7' }}>
              <span>{item.name} × {item.quantity}</span>
              <span style={{ fontWeight: 600, color: '#2C1A0E' }}>{(item.price * item.quantity).toLocaleString('fr-FR')} FCFA</span>
            </div>
          ))}
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#7A5C42', marginBottom: 4 }}>
              <span>Sous-total</span><span>{subtotal.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#7A5C42', marginBottom: 6 }}>
              <span>Livraison {deliveryType === 'delivery' && selectedZone ? `(${selectedZone.label})` : ''}</span>
              <span>{livraison === 0 ? 'Gratuit' : livraison.toLocaleString('fr-FR') + ' FCFA'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 700, color: '#3A1F0A', paddingTop: 8, borderTop: '2px solid #F5ECD7' }}>
              <span>Total</span><span>{total.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>
        </div>

        {/* TYPE DE RÉCUPÉRATION */}
        <div style={card}>
          <h2 style={h2}>🚚 Comment récupérer votre commande ?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: deliveryType === 'delivery' ? 16 : 0 }}>
            {[
              { key: 'delivery', icon: '🚚', label: 'Livraison à domicile', sub: 'Selon votre zone' },
              { key: 'pickup', icon: '🏪', label: 'Retrait en magasin', sub: 'Gratuit — Sous 24h' },
            ].map((opt) => (
              <div key={opt.key} onClick={() => setDeliveryType(opt.key as 'delivery' | 'pickup')} style={{
                border: `2px solid ${deliveryType === opt.key ? '#2D6A4F' : '#E8D5B0'}`,
                background: deliveryType === opt.key ? '#D8F3DC' : 'white',
                borderRadius: 12, padding: '16px 12px', textAlign: 'center', cursor: 'pointer',
              }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{opt.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#2C1A0E' }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: '#7A5C42', marginTop: 2 }}>{opt.sub}</div>
              </div>
            ))}
          </div>

          {deliveryType === 'delivery' && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 8 }}>
                📍 Choisissez votre zone de livraison
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {deliveryZones.map((zone) => (
                  <div key={zone.key} onClick={() => setDeliveryZone(zone.key)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 10,
                    border: `2px solid ${deliveryZone === zone.key ? '#2D6A4F' : '#E8D5B0'}`,
                    background: deliveryZone === zone.key ? '#D8F3DC' : '#FDFAF5', cursor: 'pointer',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#2C1A0E' }}>{zone.label}</div>
                      <div style={{ fontSize: 11, color: '#7A5C42' }}>{zone.sub}</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#2D6A4F', whiteSpace: 'nowrap' }}>
                      {zone.price.toLocaleString('fr-FR')} FCFA
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {deliveryType === 'pickup' && (
            <div style={{ marginTop: 12, padding: 12, background: '#F5ECD7', borderRadius: 8, fontSize: 12, color: '#7A5C42' }}>
              📍 B@OB@B Shop, Dakar, Sénégal — Vous recevrez un message quand votre commande sera prête.
            </div>
          )}
        </div>

        {/* CONTACT */}
        <div style={card}>
          <h2 style={h2}>📍 {deliveryType === 'delivery' ? 'Informations de livraison' : 'Informations de contact'}</h2>
          <div style={{ marginBottom: deliveryType === 'delivery' ? 12 : 0 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 4 }}>Numéro de téléphone *</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="7X XXX XX XX"
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8D5B0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          {deliveryType === 'delivery' && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 4 }}>Adresse précise *</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Quartier, rue, repère..." rows={2}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8D5B0', borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
          )}
        </div>

        {/* MODES DE PAIEMENT */}
        <div style={card}>
          <h2 style={h2}>💰 Mode de paiement</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {paymentMethods.map((m) => (
              <div key={m.key} onClick={() => setSelectedMethod(m.key)} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12,
                border: `2px solid ${selectedMethod === m.key ? m.color : '#E8D5B0'}`,
                background: selectedMethod === m.key ? m.bg : 'white', cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, overflow: 'hidden' }}>
                  {m.img
                    ? <img src={m.img} alt={m.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : m.icon}
                </div>
                <div style={{ flex: 1, fontWeight: 700, fontSize: 14, color: '#2C1A0E' }}>{m.label}</div>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${selectedMethod === m.key ? m.color : '#E8D5B0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedMethod === m.key && <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.color }} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* INFO REÇU */}
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
          <div style={{ fontSize: 28, flexShrink: 0 }}>💬</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#2C1A0E', marginBottom: 2 }}>Reçu automatique par messagerie</div>
            <div style={{ fontSize: 12, color: '#7A5C42', lineHeight: 1.5 }}>
              Après confirmation, vous recevrez un reçu détaillé dans votre messagerie B@OB@B Shop.
            </div>
          </div>
        </div>

        <button onClick={handlePay} disabled={loading} style={{
          width: '100%', background: loading ? '#9CA3AF' : '#2D6A4F', color: 'white', border: 'none',
          padding: '15px', borderRadius: 24, cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 700, fontSize: 16, boxShadow: '0 4px 12px rgba(45,106,79,0.3)',
        }}>
          {loading ? '⏳ Traitement...' : `✅ Confirmer — ${total.toLocaleString('fr-FR')} FCFA`}
        </button>
      </div>

      {/* MODAL */}
      {showPaymentModal && (
        <div onClick={() => !loading && setShowPaymentModal(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: 'white', borderRadius: 20, padding: 28, maxWidth: 420, width: '100%',
            textAlign: 'center', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, margin: '0 auto 12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, overflow: 'hidden',
              background: paymentMethods.find(m => m.key === selectedMethod)?.bg,
            }}>
              {selectedMethod === 'wave' && <img src="/wave.png" alt="Wave" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              {selectedMethod === 'orange' && <img src="/orange.png" alt="Orange" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              {selectedMethod === 'bank' && '🏦'}
              {selectedMethod === 'cash' && '💵'}
            </div>

            <h3 style={{ margin: '0 0 4px', fontSize: 18, color: '#3A1F0A', fontFamily: 'Georgia, serif' }}>
              {selectedMethod === 'wave' && 'Payer avec Wave'}
              {selectedMethod === 'orange' && 'Payer avec Orange Money'}
              {selectedMethod === 'bank' && 'Virement bancaire'}
              {selectedMethod === 'cash' && (deliveryType === 'delivery' ? 'Paiement à la livraison' : 'Paiement sur place')}
            </h3>
            <p style={{ fontSize: 13, color: '#7A5C42', margin: '0 0 20px' }}>
              Montant : <b style={{ color: '#2D6A4F', fontSize: 16 }}>{total.toLocaleString('fr-FR')} FCFA</b>
            </p>

            {selectedMethod === 'wave' && (
              <div style={{ marginBottom: 16, textAlign: 'left' }}>
                {paymentSettings.wave_link ? (
                  <button onClick={openWaveLink} style={{
                    width: '100%', padding: '14px', background: '#1B9CFC', color: 'white', border: 'none',
                    borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  }}>
                    <img src="/wave.png" alt="Wave" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover' }} />
                    Ouvrir Wave — {total.toLocaleString('fr-FR')} FCFA
                  </button>
                ) : (
                  <p style={{ fontSize: 12, color: '#e53e3e', textAlign: 'center' }}>⚠️ Lien Wave non configuré</p>
                )}
                <p style={{ fontSize: 11, color: '#7A5C42', lineHeight: 1.5 }}>
                  📲 Ouvrez Wave, confirmez le paiement, puis cliquez sur « J'ai payé ».
                </p>
              </div>
            )}

            {selectedMethod === 'orange' && (
              <div style={{ marginBottom: 16, textAlign: 'left' }}>
                {paymentSettings.orange_number ? (
                  <div style={{ background: '#FFF3EB', border: '1.5px solid #FFD8B8', borderRadius: 12, padding: 16, textAlign: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: '#7A5C42', marginBottom: 4 }}>Transférez vers</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#FF6600', letterSpacing: 2 }}>{paymentSettings.orange_number}</div>
                    <div style={{ fontSize: 12, color: '#7A5C42', marginTop: 6 }}>Montant : <b>{total.toLocaleString('fr-FR')} FCFA</b></div>
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: '#e53e3e' }}>⚠️ Numéro Orange Money non configuré</p>
                )}
                <p style={{ fontSize: 11, color: '#7A5C42', lineHeight: 1.5 }}>
                  📲 Composez <b>#150#</b>, choisissez « Transfert », entrez ce numéro et le montant.
                </p>
              </div>
            )}

            {selectedMethod === 'bank' && (
              <div style={{ marginBottom: 16, textAlign: 'left' }}>
                {paymentSettings.bank_account_number ? (
                  <div style={{ background: '#F3EBFF', border: '1.5px solid #DDD6FE', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                    {[
                      { label: 'Banque', value: paymentSettings.bank_name },
                      { label: 'Titulaire', value: paymentSettings.bank_account_name },
                      { label: 'Compte', value: paymentSettings.bank_account_number },
                      { label: 'IBAN', value: paymentSettings.bank_iban },
                    ].filter(f => f.value).map(f => (
                      <div key={f.label} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 11, color: '#7A5C42' }}>{f.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', fontFamily: 'monospace' }}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: '#e53e3e' }}>⚠️ Coordonnées bancaires non configurées</p>
                )}
              </div>
            )}

            {selectedMethod === 'cash' && (
              <div style={{ background: '#F5ECD7', borderRadius: 10, padding: 14, fontSize: 13, color: '#7A5C42', marginBottom: 16, lineHeight: 1.6 }}>
                💵 Vous paierez <b>{total.toLocaleString('fr-FR')} FCFA</b> en espèces
                {deliveryType === 'delivery' ? ' à la réception.' : ' lors du retrait en magasin.'}
              </div>
            )}

            {(selectedMethod === 'wave' || selectedMethod === 'orange') && (
              <div style={{ marginBottom: 16, textAlign: 'left' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 4 }}>
                  Votre numéro {selectedMethod === 'wave' ? 'Wave' : 'Orange Money'} *
                </label>
                <input type="tel" value={paymentPhone} onChange={(e) => setPaymentPhone(e.target.value)} placeholder="7X XXX XX XX"
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E8D5B0', borderRadius: 8, fontSize: 16, boxSizing: 'border-box', textAlign: 'center', fontWeight: 700 }} />
              </div>
            )}

            <div style={{ background: '#D8F3DC', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #6ee7b7' }}>
              <span style={{ fontSize: 18 }}>💬</span>
              <span style={{ fontSize: 12, color: '#065f46', fontWeight: 600, textAlign: 'left' }}>
                Un reçu détaillé sera envoyé dans votre messagerie B@OB@B Shop.
              </span>
            </div>

            {modalError && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600, marginBottom: 14, textAlign: 'left' }}>
                {modalError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowPaymentModal(false)} disabled={loading} style={{
                flex: 1, padding: '12px', background: '#F5ECD7', color: '#3A1F0A',
                border: '1px solid #E8D5B0', borderRadius: 20, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>Annuler</button>
              <button onClick={submitOrder} disabled={loading} style={{
                flex: 2, padding: '12px', background: loading ? '#9CA3AF' : '#2D6A4F', color: 'white',
                border: 'none', borderRadius: 20, fontSize: 14, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}>
                {loading ? '⏳ Envoi du reçu...' : "✅ J'ai payé / Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
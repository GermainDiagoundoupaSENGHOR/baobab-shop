import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Client admin (service_role) : contourne les règles RLS, utilisé uniquement côté serveur
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      userId, orderId, items, total, subtotal,
      livraison, selectedZone, deliveryType, deliveryZone,
      phone, address, selectedMethod, paymentPhone, paymentSettings,
    } = body

    if (!userId || !orderId) {
      return NextResponse.json({ error: 'userId et orderId requis' }, { status: 400 })
    }

    // 1. Trouver ou créer la conversation du client
    let { data: conv } = await supabaseAdmin
      .from('conversations')
      .select('id, unread_count')
      .eq('client_id', userId)
      .maybeSingle()

    if (!conv) {
      const { data: profile } = await supabaseAdmin
        .from('profiles').select('full_name').eq('id', userId).maybeSingle()
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)

      const { data: newConv, error: convError } = await supabaseAdmin
        .from('conversations')
        .insert({
          client_id: userId,
          client_name: profile?.full_name || authUser?.user?.email?.split('@')[0] || 'Client',
          client_avatar: '',
          last_message: '',
          unread_count: 0,
          archived: false,
          blocked: false,
        })
        .select('id, unread_count')
        .single()

      if (convError) return NextResponse.json({ error: convError.message }, { status: 500 })
      conv = newConv
    }

    if (!conv) {
      return NextResponse.json({ error: 'Conversation introuvable' }, { status: 500 })
    }

    // 2. Construire le reçu
    const now = new Date()
    const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const ref = String(orderId).slice(0, 8).toUpperCase()
    const fmt = (n: number) => Number(n || 0).toLocaleString('fr-FR')

    const itemsList = (items || [])
      .map((i: any) => `  • ${i.name} × ${i.quantity}  →  ${fmt(i.price * i.quantity)} FCFA`)
      .join('\n')

    const paymentLabel = () => {
      switch (selectedMethod) {
        case 'wave': return '🌊 Wave'
        case 'orange': return '🟠 Orange Money'
        case 'bank': return '🏦 Virement bancaire'
        case 'cash':
          return deliveryType === 'delivery' ? '💵 Paiement à la livraison' : '💵 Paiement sur place'
        default: return String(selectedMethod || '')
      }
    }

    const paymentDetail = () => {
      if ((selectedMethod === 'wave' || selectedMethod === 'orange') && paymentPhone) {
        return `${paymentLabel()}\nNuméro : ${paymentPhone}`
      }
      if (selectedMethod === 'bank') {
        const lines = [paymentLabel()]
        if (paymentSettings?.bank_name) lines.push(`Banque : ${paymentSettings.bank_name}`)
        if (paymentSettings?.bank_account_name) lines.push(`Titulaire : ${paymentSettings.bank_account_name}`)
        if (paymentSettings?.bank_account_number) lines.push(`Compte : ${paymentSettings.bank_account_number}`)
        return lines.join('\n')
      }
      return paymentLabel()
    }

    const deliveryInfo = deliveryType === 'delivery'
      ? [
          '🚚 Livraison à domicile',
          `📍 Zone : ${selectedZone?.label || deliveryZone || '—'}`,
          `🏠 Adresse : ${address}`,
          `📞 Téléphone : ${phone}`,
          `💰 Frais de livraison : ${fmt(livraison)} FCFA`,
        ].join('\n')
      : [
          '🏪 Retrait en magasin — B@OB@B Shop',
          '📍 Dakar, Sénégal',
          `📞 Téléphone : ${phone}`,
          '✅ Votre commande sera prête sous 24h',
        ].join('\n')

    const recu = `🧾 REÇU DE COMMANDE — B@OB@B Shop
━━━━━━━━━━━━━━━━━━━━━━━━━
📅 ${dateStr} à ${timeStr}
🔖 Référence : #${ref}
━━━━━━━━━━━━━━━━━━━━━━━━━

🛒 ARTICLES
${itemsList}

Sous-total articles : ${fmt(subtotal)} FCFA

━━━━━━━━━━━━━━━━━━━━━━━━━
📦 LIVRAISON
${deliveryInfo}

━━━━━━━━━━━━━━━━━━━━━━━━━
💳 PAIEMENT
${paymentDetail()}
Statut : ⏳ En attente de confirmation

━━━━━━━━━━━━━━━━━━━━━━━━━
💰 TOTAL : ${fmt(total)} FCFA
━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Commande reçue avec succès !
Notre équipe va traiter votre commande dans les plus brefs délais.

Pour toute question, répondez directement à ce message. 🌳`

    // 3. Insérer le message
    const { error: msgError } = await supabaseAdmin.from('messages').insert({
      conversation_id: conv.id,
      sender_id: null,
      content: recu,
      type: 'text',
      is_bot: true,
      read: false,
    })
    if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 })

    // 4. Mettre à jour la conversation
    await supabaseAdmin.from('conversations').update({
      last_message: `🧾 Reçu #${ref} — ${fmt(total)} FCFA`,
      last_message_at: new Date().toISOString(),
      unread_count: (conv.unread_count || 0) + 1,
    }).eq('id', conv.id)

    return NextResponse.json({ success: true, conversationId: conv.id })
  } catch (err: any) {
    console.error('send-receipt error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
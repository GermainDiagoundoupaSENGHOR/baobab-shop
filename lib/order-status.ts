import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export const SUPER_ADMIN_EMAIL = 'baobabshop@gmail.com'

// ═══ RÉGLAGES DE LA CONFIRMATION AUTOMATIQUE ═══════════════════════════
export const AUTO_CONFIRM = {
  enabled: true,        // false = jamais de confirmation automatique
  minutesOnline: 30,    // Wave / Orange Money / virement : délai avant confirmation auto
  minutesCash: 5,       // Paiement à la livraison / sur place
}

// Client admin (service_role) : uniquement côté serveur
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Valeur écrite dans la base (cohérente avec le tableau de bord Super Admin)
export const DB_STATUS: Record<string, string> = {
  en_attente: 'en_attente',
  confirme: 'confirme',
  en_livraison: 'en_livraison',
  livre: 'livre',
  annule: 'annulé',
}

/* ─── Qui a le droit ? Super Admin OU employé avec le rôle "admin" ─── */
export async function getAdminEmail(req: NextRequest): Promise<string | null> {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '')
  if (!token) return null
  const { data } = await supabaseAdmin.auth.getUser(token)
  const email = data?.user?.email
  if (!email) return null
  if (email.toLowerCase() === SUPER_ADMIN_EMAIL) return email
  const { data: emp } = await supabaseAdmin
    .from('employees').select('role').ilike('email', email).maybeSingle()
  return emp?.role === 'admin' ? email : null
}

/* ─── Changer le statut + prévenir le client ─── */
export async function applyStatus(orderId: string, status: string, by: string) {
  const auto = by === 'auto'
  const payload: any = { status: DB_STATUS[status] }
  if (status === 'confirme') { payload.confirmed_by = by; payload.confirmed_at = new Date().toISOString() }

  const run = async (p: any) => {
    let q = supabaseAdmin.from('orders').update(p).eq('id', orderId)
    if (auto) q = q.eq('status', 'en_attente') // évite un double traitement
    return q.select('id, user_id, total, payment_method, delivery_type').maybeSingle()
  }

  let { data: order, error } = await run(payload)
  if (error && /column/i.test(error.message)) {
    // colonnes confirmed_by / confirmed_at pas encore créées : on enregistre au moins le statut
    ;({ data: order, error } = await run({ status: DB_STATUS[status] }))
  }
  if (error) return { ok: false, error: error.message }
  if (!order) return { ok: false, skipped: true } // déjà traitée entre-temps

  const ref = String(order.id).slice(0, 8).toUpperCase()
  const total = Number(order.total || 0).toLocaleString('fr-FR')
  const cash = order.payment_method === 'cash'

  const textes: Record<string, string> = {
    confirme: auto
      ? (cash
        ? `✅ COMMANDE CONFIRMÉE — B@OB@B Shop

Votre commande #${ref} est confirmée et en préparation. Vous paierez ${total} FCFA ${order.delivery_type === 'pickup' ? 'lors du retrait en magasin' : 'à la livraison'}. 🌳`
        : `✅ COMMANDE CONFIRMÉE — B@OB@B Shop

Votre commande #${ref} (${total} FCFA) a été confirmée automatiquement et passe en préparation.

Notre équipe vérifie la réception de votre paiement. En cas de souci, nous vous contacterons ici. 🌳`)
      : `✅ PAIEMENT CONFIRMÉ — B@OB@B Shop

Bonne nouvelle ! Nous avons bien reçu votre paiement de ${total} FCFA pour la commande #${ref}.

Votre commande est confirmée et en cours de préparation. 🌳

Merci de votre confiance !`,
    en_livraison: order.delivery_type === 'pickup'
      ? `🏪 COMMANDE PRÊTE — B@OB@B Shop

Votre commande #${ref} est prête ! Vous pouvez venir la retirer en magasin. 🌳`
      : `🚚 COMMANDE EN LIVRAISON — B@OB@B Shop

Votre commande #${ref} est en route vers vous ! Gardez votre téléphone à portée de main. 🌳`,
    livre: `📦 COMMANDE LIVRÉE — B@OB@B Shop

Votre commande #${ref} a été livrée. Merci d'avoir choisi B@OB@B Shop ! 🌳

N'hésitez pas à nous dire ce que vous en pensez.`,
    annule: `✖️ COMMANDE ANNULÉE — B@OB@B Shop

Votre commande #${ref} a été annulée. Pour toute question, répondez directement à ce message.`,
  }

  const content = textes[status]
  if (content && order.user_id) {
    const { data: convs } = await supabaseAdmin
      .from('conversations').select('id, unread_count')
      .eq('client_id', order.user_id).order('id').limit(1)
    let conv: any = convs?.[0]

    if (!conv) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(order.user_id)
      const { data: created } = await supabaseAdmin.from('conversations').insert({
        client_id: order.user_id,
        client_name: authUser?.user?.email?.split('@')[0] || 'Client',
        client_avatar: '', last_message: '', unread_count: 0, archived: false, blocked: false,
      }).select('id, unread_count').single()
      conv = created
    }

    if (conv) {
      await supabaseAdmin.from('messages').insert({
        conversation_id: conv.id, sender_id: null, content,
        type: 'text', is_bot: true, read: false,
      })
      await supabaseAdmin.from('conversations').update({
        last_message: content.split('\n')[0],
        last_message_at: new Date().toISOString(),
        unread_count: (conv.unread_count || 0) + 1,
      }).eq('id', conv.id)
    }
  }
  return { ok: true }
}

/* ─── Confirmation automatique des commandes oubliées ─── */
export async function autoConfirmSweep() {
  if (!AUTO_CONFIRM.enabled) return { confirmed: 0 }

  const { data: pending } = await supabaseAdmin
    .from('orders').select('id, created_at, payment_method').eq('status', 'en_attente')

  const now = Date.now()
  let confirmed = 0
  for (const o of pending || []) {
    const minutes = o.payment_method === 'cash' ? AUTO_CONFIRM.minutesCash : AUTO_CONFIRM.minutesOnline
    if (now - new Date(o.created_at).getTime() >= minutes * 60_000) {
      const r = await applyStatus(o.id, 'confirme', 'auto')
      if (r.ok) confirmed++
    }
  }
  return { confirmed }
}
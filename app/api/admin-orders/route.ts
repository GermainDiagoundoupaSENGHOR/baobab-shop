import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getAdminEmail, applyStatus, autoConfirmSweep, DB_STATUS } from '@/lib/order-status'

/* ─── GET : liste de toutes les commandes (Super Admin ou admin) ─── */
export async function GET(req: NextRequest) {
  if (!(await getAdminEmail(req))) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  await autoConfirmSweep() // confirme au passage les commandes oubliées

  const { data: orders, error } = await supabaseAdmin
    .from('orders').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ids = Array.from(new Set((orders || []).map((o: any) => o.user_id).filter(Boolean)))
  let names: Record<string, string> = {}
  if (ids.length > 0) {
    const { data: profs } = await supabaseAdmin.from('profiles').select('id, full_name').in('id', ids)
    names = Object.fromEntries((profs || []).map((p: any) => [p.id, p.full_name]))
    const { data: convs } = await supabaseAdmin.from('conversations').select('client_id, client_name').in('client_id', ids)
    ;(convs || []).forEach((c: any) => { if (!names[c.client_id]) names[c.client_id] = c.client_name })
  }

  const { data: zones } = await supabaseAdmin.from('delivery_zones').select('id, name')
  const zoneNames = Object.fromEntries((zones || []).map((z: any) => [String(z.id), z.name]))

  return NextResponse.json({
    orders: (orders || []).map((o: any) => ({
      ...o,
      client_name: names[o.user_id] || 'Client',
      zone_name: o.delivery_zone ? (zoneNames[String(o.delivery_zone)] || o.delivery_zone) : '',
    })),
  })
}

/* ─── POST : change le statut + prévient le client par message ─── */
export async function POST(req: NextRequest) {
  try {
    const adminEmail = await getAdminEmail(req)
    if (!adminEmail) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    const { orderId, status } = await req.json()
    if (!orderId || !DB_STATUS[status]) {
      return NextResponse.json({ error: 'orderId et statut valide requis' }, { status: 400 })
    }
    const r = await applyStatus(orderId, status, adminEmail)
    if (!r.ok) return NextResponse.json({ error: r.error || 'Commande déjà traitée' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('admin-orders error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
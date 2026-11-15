import { NextResponse } from 'next/server'
import { autoConfirmSweep } from '@/lib/order-status'

// Confirme automatiquement les commandes restées "en attente" trop longtemps.
// Sans danger : ne fait que ce que le système aurait fait de toute façon.
export async function GET() {
  try {
    const r = await autoConfirmSweep()
    return NextResponse.json({ success: true, ...r })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
export const POST = GET
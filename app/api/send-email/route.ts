import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { orderDetails } = await request.json()

    const { data, error } = await resend.emails.send({
      from: 'B@OB@B Shop <onboarding@resend.dev>',
      to: ['senghorgermaindiagounda@gmail.com'],
      subject: '🛒 Nouvelle commande reçue !',
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #F5ECD7; padding: 32px; border-radius: 12px;">
          <h1 style="color: #3A1F0A; font-size: 24px; margin-bottom: 8px;">
            🌳 B@OB@B Shop
          </h1>
          <h2 style="color: #2D6A4F; font-size: 20px; margin-bottom: 24px;">
            Nouvelle commande reçue !
          </h2>

          <div style="background: white; border-radius: 10px; padding: 20px; margin-bottom: 16px;">
            <h3 style="color: #3A1F0A; margin-bottom: 12px;">📦 Détails de la commande</h3>
            <p><strong>Produit :</strong> ${orderDetails.product}</p>
            <p><strong>Quantité :</strong> ${orderDetails.quantity}</p>
            <p><strong>Total :</strong> ${orderDetails.total} FCFA</p>
            <p><strong>Paiement :</strong> ${orderDetails.paymentMethod}</p>
          </div>

          <div style="background: white; border-radius: 10px; padding: 20px; margin-bottom: 16px;">
            <h3 style="color: #3A1F0A; margin-bottom: 12px;">📍 Informations de livraison</h3>
            <p><strong>Nom :</strong> ${orderDetails.nom}</p>
            <p><strong>Téléphone :</strong> ${orderDetails.telephone}</p>
            <p><strong>Région :</strong> ${orderDetails.region}</p>
            <p><strong>Adresse :</strong> ${orderDetails.adresse}</p>
          </div>

          <div style="background: #2D6A4F; border-radius: 10px; padding: 16px; text-align: center;">
            <p style="color: white; font-weight: 700; margin: 0;">
              🎉 Connectez-vous à l'Admin pour gérer cette commande
            </p>
          </div>

          <p style="color: #7A5C42; font-size: 12px; text-align: center; margin-top: 16px;">
            B@OB@B Shop — Le marché digital du Sénégal
          </p>
        </div>
      `,
    })

    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
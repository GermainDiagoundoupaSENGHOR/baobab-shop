import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { messages, lang } = await request.json()

    const systemPrompt = `Tu es l'assistant officiel de B@OB@B Shop, un e-commerce sénégalais qui vend de l'électronique, des vêtements et des produits agricoles. Tu acceptes les paiements Wave, Orange Money et par carte bancaire. Tu livres partout au Sénégal en 2-4 jours.

IMPORTANT: Tu réponds TOUJOURS dans la langue choisie par l'utilisateur:
- Si lang="wo": réponds en Wolof (langue sénégalaise)
- Si lang="fr": réponds en Français
- Si lang="en": réponds en Anglais
- Si l'utilisateur écrit dans une autre langue, détecte-la et réponds dans cette même langue

La langue actuelle est: ${lang === 'wo' ? 'Wolof' : lang === 'en' ? 'Anglais' : 'Français'}

Tu connais ces informations sur la boutique:
- Produits: Téléphones, Laptops, Vêtements (homme/femme/enfant), Semences, Outils agricoles
- Paiement: Wave 🌊, Orange Money 🟠, Carte bancaire 💳
- Livraison: 2 500 FCFA, délai 2-4 jours, partout au Sénégal
- Contact: via la messagerie de la plateforme

Sois chaleureux, helpful et utilise des emojis. Garde tes réponses courtes et claires.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages.map((m: { role: string, content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    })

    const message = response.content[0].type === 'text'
      ? response.content[0].text
      : 'Désolé, je ne peux pas répondre pour le moment.'

    return NextResponse.json({ message })

  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: '❌ Désolé, une erreur est survenue. Réessayez !' },
      { status: 500 }
    )
  }
}
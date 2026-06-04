import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { messages, lang } = await request.json()

    const systemPrompt = `Tu es l'assistant officiel de B@OB@B Shop, un e-commerce sénégalais qui vend de l'électronique, des vêtements et des produits agricoles. Tu acceptes les paiements Wave, Orange Money et par carte bancaire. Tu livres partout au Sénégal en 2-4 jours.

IMPORTANT: Tu réponds TOUJOURS dans la langue choisie:
- Si lang="wo": réponds en Wolof
- Si lang="fr": réponds en Français  
- Si lang="en": réponds en Anglais

La langue actuelle est: ${lang === 'wo' ? 'Wolof' : lang === 'en' ? 'Anglais' : 'Français'}

Infos boutique:
- Produits: Téléphones, Laptops, Vêtements (homme/femme/enfant), Agriculture
- Paiement: Wave, Orange Money, Carte bancaire
- Livraison: 2 500 FCFA, 2-4 jours, partout au Sénégal

Sois chaleureux et utilise des emojis. Réponds de façon courte et claire.`

    const response = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: { role: string, content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      max_tokens: 500,
    })

    const message = response.choices[0]?.message?.content || 'Désolé, je ne peux pas répondre.'

    return NextResponse.json({ message })

  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: '❌ Désolé, une erreur est survenue. Réessayez !' },
      { status: 500 }
    )
  }
}

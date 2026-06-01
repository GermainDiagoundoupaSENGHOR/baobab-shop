import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File

    if (!image) {
      return NextResponse.json({ error: 'Aucune image fournie' }, { status: 400 })
    }

    // Convertir l'image en base64
    const bytes = await image.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mediaType = image.type as 'image/jpeg' | 'image/png' | 'image/webp'

    // Analyser l'image avec Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: 'Analyse cette image et identifie le produit. Réponds UNIQUEMENT avec les mots-clés de recherche en français séparés par des virgules (ex: téléphone, samsung, smartphone). Maximum 5 mots-clés.',
            },
          ],
        },
      ],
    })

    const keywords = response.content[0].type === 'text' 
      ? response.content[0].text.trim() 
      : ''

    // Chercher dans Supabase avec les mots-clés
    const keywordList = keywords.split(',').map((k: string) => k.trim())
    
    let allProducts: any[] = []
    
    for (const keyword of keywordList) {
      const { data } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%,category.ilike.%${keyword}%`)
      
      if (data) allProducts = [...allProducts, ...data]
    }

    // Supprimer les doublons
    const unique = allProducts.filter((p, i, self) =>
      i === self.findIndex((t) => t.id === p.id)
    )

    return NextResponse.json({ keywords, products: unique })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
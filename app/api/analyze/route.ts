import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { EntryType, AIAnalysis } from '@/types';

// Force dynamic rendering to avoid build-time execution
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Check API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is missing');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { text, type }: { text: string; type: EntryType } = await req.json();

    const systemPrompt = `Du är en expert på maghälsa och matanalys. Analysera användarens text och returnera ENDAST valid JSON.

KONTEXT: Användaren registrerar ${
  type === 'FOOD' ? 'mat de har ätit' : 
  type === 'SYMPTOM' ? 'magbesvär/symtom' : 
  type === 'EXERCISE' ? 'fysisk aktivitet' : 
  'sitt allmänna mående/känslor'
}.

TIDSSTÄMPEL-REGLER:
- "frukost" = 08:00 samma dag
- "lunch" = 12:00 samma dag  
- "middag" = 18:00 samma dag
- "kvällen"/"kväll" = 20:00 samma dag
- "igår" = samma tid föregående dag
- "idag" eller ingen tid = nuvarande tid

${type === 'FOOD' ? `
MAT-ANALYS:
1. Bryt ner alla ingredienser/livsmedel som nämns
2. För varje ingrediens, identifiera ALLA relevanta triggers:
   - Laktos (mjölkprodukter: mjölk, ost, grädde, yoghurt, smör)
   - Gluten (vete, råg, korn, pasta, bröd, pizza)
   - FODMAP (lök, vitlök, bönor, linser, äpple, päron, honung, cashew)
   - Socker (godis, läsk, juice, sötsaker, kex)
   - Fett (friterat, fet mat, ost, nötter, avokado)
   - Fiber (fullkorn, bönor, grönsaker, frukt, havre)
   - Kryddor (stark mat, chili, peppar, curry)
   - Koffein (kaffe, te, läsk, energidryck)
   - Alkohol (vin, öl, sprit)
3. Uppskatta mängd om möjligt
4. VIKTIGT: Uppskatta total fibermängd i gram (fiberEstimateGrams). Referens:
   - Grönsaker: ~2-4g/100g
   - Frukt: ~2-3g/st
   - Fullkornsbröd: ~6-8g/skiva
   - Havregryn: ~10g/dl
   - Bönor/linser: ~15g/dl
   - Vitt bröd/pasta: ~1-2g/portion
5. Ge insiktsfull sammanfattning om potentiella risker

EXEMPEL:
Input: "Åt havregrynsgröt med banan till frukost"
Output: {
  "type": "FOOD",
  "timestamp": "2026-01-22T08:00:00Z",
  "ingredients": [
    {"name": "Havregryn", "amount": "1 dl", "triggers": [{"name": "Fiber"}, {"name": "Gluten"}]},
    {"name": "Mjölk", "amount": "~150ml", "triggers": [{"name": "Laktos"}]},
    {"name": "Banan", "amount": "1 st", "triggers": [{"name": "Fiber"}, {"name": "FODMAP"}]}
  ],
  "fiberEstimateGrams": 13,
  "summary": "Bra fiberrik frukost (~13g fiber). Havre innehåller spår av gluten. Mogen banan kan ge FODMAP-reaktion hos känsliga."
}
` : type === 'SYMPTOM' ? `
SYMTOM-ANALYS:
1. Typ: Gas (uppblåsthet, rapningar, flatulens) | Smärta (kramper, ont i magen) | Avföring (diarré, förstoppning, bajsat, toalett, lös mage) | Annan
2. Intensitet: 1-10 baserat på ordval:
   - "lite", "lätt", "något" = 2-3
   - "ganska", "rätt", "jobbigt" = 5-6
   - "mycket", "jätte", "väldigt" = 7-8
   - "extremt", "outhärdligt" = 9-10
   - Om inget anges, uppskatta 5
3. Beskriv symtomet tydligt

EXEMPEL:
Input: "Känner mig svullen och ont i magen, ganska jobbigt"
Output: {
  "type": "SYMPTOM",
  "timestamp": "2026-01-22T14:30:00Z",
  "symptomData": {
    "type": "Smärta",
    "intensity": 6,
    "description": "Uppblåsthet kombinerat med magsmärta"
  },
  "tags": ["Uppblåsthet", "Kramper"],
  "summary": "Måttliga till kraftiga besvär med uppblåsthet och smärta, kan vara reaktion på nyligen intagen mat."
}
` : type === 'EXERCISE' ? `
TRÄNINGS-ANALYS:
Extrahera typ av träning, intensitet och duration. Tagga med relevanta nyckelord.

EXEMPEL:
Input: "30 min löpning"
Output: {
  "type": "EXERCISE",
  "timestamp": "2026-01-22T18:00:00Z",
  "tags": ["Löpning", "Cardio", "30min", "Måttlig intensitet"],
  "summary": "Måttlig konditionsträning som kan påverka matsmältningen positivt."
}
` : `
MÅENDE-ANALYS:
Identifiera känslor, stress-nivå, sömnkvalitet och andra faktorer som kan påverka maghälsan.

EXEMPEL:
Input: "Känner mig stressad på jobbet"
Output: {
  "type": "MOOD",
  "timestamp": "2026-01-22T15:00:00Z",
  "tags": ["Stress", "Jobb", "Oro"],
  "summary": "Stress kan påverka matsmältningen negativt genom mag-tarm-kopplingen."
}
`}

RETURNERA ENDAST JSON - ingen annan text!`;

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const aiResponse = completion.choices[0]?.message?.content || '{}';

    // Parse AI response
    let analysis: AIAnalysis;
    try {
      analysis = JSON.parse(aiResponse);
    } catch (e) {
      // Fallback if AI doesn't return valid JSON
      analysis = {
        type,
        timestamp: new Date().toISOString(),
        summary: text,
      };
    }

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Analysis error:', error);
    const errorMessage = error?.message || 'Failed to analyze entry';
    console.error('Error details:', errorMessage);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze entry',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
      },
      { status: 500 }
    );
  }
}

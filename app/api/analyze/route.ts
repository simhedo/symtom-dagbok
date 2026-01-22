import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { EntryType, AIAnalysis } from '@/types';

export async function POST(req: NextRequest) {
  const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  try {
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
   - Fiber (fullkorn, bönor, grönsaker, frukt)
   - Kryddor (stark mat, chili, peppar, curry)
   - Koffein (kaffe, te, läsk, energidryck)
   - Alkohol (vin, öl, sprit)
3. Uppskatta mängd om möjligt
4. Ge insiktsfull sammanfattning om potentiella risker

EXEMPEL:
Input: "Åt lasagne till lunch"
Output: {
  "type": "FOOD",
  "timestamp": "2026-01-22T12:00:00Z",
  "ingredients": [
    {"name": "Pasta", "amount": "medium portion", "triggers": [{"name": "Gluten"}, {"name": "FODMAP"}]},
    {"name": "Köttfärs", "amount": "~150g", "triggers": [{"name": "Fett"}]},
    {"name": "Tomatsås", "amount": "~100ml", "triggers": [{"name": "FODMAP"}]},
    {"name": "Ost", "amount": "~50g", "triggers": [{"name": "Laktos"}, {"name": "Fett"}]},
    {"name": "Grädde", "amount": "~50ml", "triggers": [{"name": "Laktos"}, {"name": "Fett"}]}
  ],
  "summary": "Lasagne innehåller flera potentiella triggers: gluten (pasta), laktos (ost, grädde), FODMAP (lök i såsen) och högt fettinnehåll. Kombinationen kan orsaka uppblåsthet."
}
` : type === 'SYMPTOM' ? `
SYMTOM-ANALYS:
1. Typ: Gas (uppblåsthet, rapningar, flatulens) | Smärta (kramper, ont i magen) | Avföring (diarré, förstoppning, konsistens) | Annan
2. Intensitet: 1-10 (1=knappt märkbart, 5=besvärande, 10=outhärdligt)
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
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze entry' },
      { status: 500 }
    );
  }
}

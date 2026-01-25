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

    // Skicka exakt servertid till AI:n för att undvika hallucinationer
    const now = new Date();
    const serverTime = now.toISOString();
    const serverHour = now.getHours();
    const serverDate = now.toISOString().split('T')[0];

    const systemPrompt = `Du är en expert på maghälsa och IBS. Analysera användarens text och returnera ENDAST valid JSON.

KRITISKT - TIDSSTÄMPEL:
Serverns exakta tid är: ${serverTime}
Dagens datum är: ${serverDate}
Klockan är: ${serverHour}:${String(now.getMinutes()).padStart(2, '0')}

TIDSREGLER (använd ALLTID dagens datum ${serverDate} som bas):
- "nu", "nyss", "just" = ${serverTime}
- "för X timmar sen" = räkna bakåt från ${serverTime}
- "frukost" = ${serverDate}T08:00:00Z
- "lunch" = ${serverDate}T12:00:00Z  
- "middag" = ${serverDate}T18:00:00Z
- "kväll" = ${serverDate}T20:00:00Z
- "igår" = byt datum till gårdagens, behåll tid
- RETURNERA ALLTID relativeTime-fält ("nu", "-1h", "-3h", "frukost", "igår lunch")

KONTEXT: Användaren registrerar ${
  type === 'FOOD' ? 'mat de har ätit' : 
  type === 'SYMPTOM' ? 'magbesvär/symtom' : 
  type === 'EXERCISE' ? 'fysisk aktivitet' : 
  type === 'MEDICATION' ? 'mediciner de har tagit' :
  'sitt allmänna mående/känslor'
}.

${type === 'FOOD' ? `
MAT-ANALYS - DJUP NEDBRYTNING TILL INGREDIENSER & TRIGGERS!

KRITISKA REGLER:
1. ALDRIG produktnamn som ingrediens - bryt ner till komponenter!
   ✗ "Cloetta Twist" ✓ "Socker, glukossirap, gelatin, färgämne"
   ✗ "Pizza" ✓ "Vetemjöl, ost, tomatsås, olivolja, salami"
   
2. SKANNADE PRODUKTER: Om texten innehåller "Ingredienser: ...", extrahera VARJE ingrediens därifrån

3. TRIGGERS - KOMPLETT LISTA (lägg till ALLA som matchar):
   - Gluten: vete, vetemjöl, råg, korn, dinkel, pasta, bröd, pizza
   - Laktos: mjölk, ost, grädde, yoghurt, smör, glass, filmjölk, kvarg
   - FODMAP-lök/vitlök: lök, vitlök, schalottenlök, purjolök, löksalt
   - FODMAP-frukt: äpple, päron, mango, vattenmelon, persika, plommon
   - FODMAP-socker: honung, agavesirap, fruktossirap
   - FODMAP-leguminos: bönor, linser, kikärter, sojabönor
   - FODMAP-nötter: cashew, pistagenötter
   - Fett: olja, smör, grädde, ost, nötter, avokado, friterat, bacon
   - Socker: socker, glukossirap, fruktossirap, honung, saft, läsk
   - Sötningsmedel: sorbitol, xylitol, manitol, aspartam, sukralos (i "sockerfritt")
   - Fiber-olöslig: vetekli, fullkorn, grönsaker med skal, rå morötter
   - Fiber-löslig: havre, havregryn, äpple utan skal, apelsin, bönor
   - Koffein: kaffe, espresso, te, cola, energidryck, choklad
   - Alkohol: öl, vin, sprit, cider
   - Kryddor/stark: chili, cayennepeppar, curry, peppar, tabasco
   - Syra: citron, tomat, ättika, äppelcider

FIBER-ANALYS:
- fiberEstimateGrams: uppskatta totalt i gram
- fiberType: "low" (<5g), "medium" (5-15g), "high" (>15g)
- fiberSoluble: true om mestadels löslig (havre, frukt), false om olöslig (vetekli, grönsaker)

EXEMPEL:
Input: "Åt pizza och cola till lunch"
Output: {
  "type": "FOOD",
  "timestamp": "${serverDate}T12:00:00Z",
  "relativeTime": "lunch",
  "ingredients": [
    {"name": "Vetemjöl", "amount": "~100g", "triggers": [{"name": "Gluten"}, {"name": "FODMAP"}]},
    {"name": "Ost", "amount": "~80g", "triggers": [{"name": "Laktos"}, {"name": "Fett"}]},
    {"name": "Tomatsås", "amount": "~50g", "triggers": []},
    {"name": "Olivolja", "amount": "~15ml", "triggers": [{"name": "Fett"}]},
    {"name": "Cola", "amount": "~330ml", "triggers": [{"name": "Socker"}, {"name": "Koffein"}]}
  ],
  "tags": ["gluten", "laktos", "fodmap", "fett", "socker", "koffein"],
  "fiberEstimateGrams": 3,
  "fiberType": "low",
  "fiberSoluble": false,
  "summary": "Tung måltid: gluten+laktos+fett. Cola ger extra socker och koffein. Låg fiber."
}
` : type === 'SYMPTOM' ? `
SYMPTOM-ANALYS - Konvertera ALLTID text till mätvärden!

OBLIGATORISKA FÄLT:
1. type: Gas | Smärta | Avföring | Annan
2. intensity: 1-10 (baserat på ordval nedan)
3. description: kort beskrivning

INTENSITETSSKALA (tolka från texten):
- "lite", "lätt", "något", "lindrigt" = 2-3
- "ganska", "rätt", "jobbigt", "besvärligt" = 5-6  
- "mycket", "jätte", "väldigt", "kraftigt" = 7-8
- "extremt", "outhärdligt", "värsta" = 9-10
- Ingen indikation = 5

AVFÖRING - Extrahera alltid:
- bristol: 1-7 (Bristol Stool Scale)
  1-2 = hård, förstoppad ("hård", "får inte ut", "svårt")
  3-4 = normal, formad
  5-6 = lös, mosig ("lös", "diarré", "rinner")
  7 = vattnig ("bara vatten", "helt flytande")
- smell: "normal" | "illaluktande" | "sur" (om nämnt)
- mucus: true/false (om slem nämns)

GAS - Använd gasLevel:
- 0 = ingen
- 1 = lite ("några")
- 2 = måttligt ("ganska gasig")
- 3 = mycket ("extremt gasig", "konstant")

EXEMPEL:
Input: "Bajsat, ganska lös och illaluktande. Lite gasig också"
Output: {
  "type": "SYMPTOM",
  "timestamp": "${serverTime}",
  "relativeTime": "nu",
  "symptomData": {
    "type": "Avföring",
    "intensity": 5,
    "bristol": 5,
    "smell": "illaluktande",
    "mucus": false,
    "gasLevel": 1,
    "description": "Lös avföring med dålig lukt, lätt gasig"
  },
  "tags": ["avföring", "lös mage", "gas", "illaluktande"],
  "summary": "Bristol 5 (lös). Illaluktande kan tyda på malabsorption eller bakteriell obalans."
}
` : type === 'EXERCISE' ? `
TRÄNINGS-ANALYS:
Extrahera typ, intensitet, duration. Notera att träning ofta hjälper matsmältningen.

Output: {
  "type": "EXERCISE",
  "timestamp": "${serverTime}",
  "relativeTime": "nu",
  "tags": ["typ", "duration", "intensitet"],
  "summary": "Kort beskrivning av träningens påverkan på magen"
}
` : type === 'MEDICATION' ? `
MEDICIN-ANALYS:
1. Identifiera ALLA mediciner
2. Notera tid om angiven, annars använd ${serverTime}
3. Tagga med medicinnamn (lowercase)

Output: {
  "type": "MEDICATION",
  "timestamp": "${serverTime}",
  "relativeTime": "nu",
  "tags": ["medicinnamn1", "medicinnamn2"],
  "summary": "Mediciner intagna"
}
` : `
MÅENDE-ANALYS:
Identifiera känslor, stress, sömn. Stress påverkar magen kraftigt!

Output: {
  "type": "MOOD",
  "timestamp": "${serverTime}",
  "relativeTime": "nu", 
  "tags": ["känsla1", "känsla2"],
  "summary": "Hur detta kan påverka magen"
}
`}

RETURNERA ENDAST VALID JSON!`;

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

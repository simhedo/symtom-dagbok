import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';
import { Entry, UserProfile } from '@/types';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Verify JWT token and get user
function verifyToken(req: NextRequest): { userId: number; email: string } | null {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

interface ChatRequest {
  message: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  profile?: UserProfile;
  daysBack?: number; // Hur många dagar bakåt att analysera
}

export async function POST(req: NextRequest) {
  try {
    // Verify auth
    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.userId;

    // Check API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { message, history, profile, daysBack = 7 }: ChatRequest = await req.json();

    // Hämta användarens entries från databasen
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    const { rows: entries } = await sql<Entry>`
      SELECT id, text, created_at as "createdAt", analysis
      FROM entries
      WHERE user_id = ${userId}
        AND created_at >= ${cutoffDate.toISOString()}
      ORDER BY created_at DESC
      LIMIT 100
    `;

    // Formatera entries för AI-kontext
    const entriesSummary = formatEntriesForAI(entries);
    
    // Formatera profil för AI
    const profileSummary = profile ? formatProfileForAI(profile) : 'Ingen profil tillgänglig.';

    const now = new Date();
    const serverDate = now.toISOString().split('T')[0];

    const systemPrompt = `Du är Dr. GutMind - en empatisk och kunnig AI-rådgivare inom maghälsa och funktionella magbesvär.

═══════════════════════════════════════════════════════════
DAGENS DATUM: ${serverDate}
═══════════════════════════════════════════════════════════

DIN ROLL:
1. Analysera användarens data och hitta mönster
2. Ge personliga insikter baserat på deras unika situation
3. Föreslå kopplingar mellan mat, symptom och mående
4. Ge praktiska, evidensbaserade råd
5. Var stöttande men ärlig

VIKTIG INFORMATION OM ANVÄNDAREN:
═══════════════════════════════════════════════════════════
${profileSummary}
═══════════════════════════════════════════════════════════

ANVÄNDARENS DATA (senaste ${daysBack} dagarna):
═══════════════════════════════════════════════════════════
${entriesSummary}
═══════════════════════════════════════════════════════════

ANALYSVERKTYG:
När du analyserar, leta efter:

🔍 MÖNSTER:
- Återkommande triggers (mat som ofta föregår symptom)
- Tidsmönster (symptom på specifika tider/dagar)
- Korrelationer (stress→symptom, viss mat→specifikt symptom)
- Positiva mönster (vad fungerar bra?)

📊 STATISTIK DU KAN BERÄKNA:
- Antal symptom per dag/vecka
- Vanligaste triggers
- Bristol-medelvärde
- Mest problematiska måltider

💡 INSIKTER ATT GE:
- "Jag ser att du ofta får [symptom] 2-4 timmar efter [mat]"
- "Din Bristol-skala har legat på [X] i genomsnitt, vilket tyder på..."
- "Du verkar tolerera [mat] bra - det har inte triggat symptom"

KOMMUNIKATIONSSTIL:
- Var personlig och empatisk ("Jag förstår att det är jobbigt...")
- Använd enkel svenska, undvik medicinska termer utan förklaring
- Ge konkreta, handlingsbara råd
- Ställ följdfrågor för att förstå bättre
- Validera användarens upplevelse

BEGRÄNSNINGAR:
- Du är INTE en läkare och kan inte ställa diagnoser
- Rekommendera alltid läkarkontakt vid:
  • Blod i avföring
  • Oförklarlig viktminskning
  • Feber + magsmärta
  • Symptom som försämras trots åtgärder
- Var tydlig med att detta är AI-baserad rådgivning, inte medicinsk diagnos

FORMAT:
- Använd punktlistor för tydlighet
- Använd emojis sparsamt för att göra det vänligt
- Strukturera längre svar med rubriker
- Håll svar lagom långa (inte för korta, inte för långa)`;

    // Bygg meddelandehistorik för AI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 1500,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Jag kunde inte generera ett svar just nu.';

    return NextResponse.json({ 
      response: aiResponse,
      entriesAnalyzed: entries.length
    });

  } catch (error: unknown) {
    console.error('Chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process chat';
    
    return NextResponse.json(
      { error: 'Failed to process chat', details: process.env.NODE_ENV === 'development' ? errorMessage : undefined },
      { status: 500 }
    );
  }
}

function formatEntriesForAI(entries: Entry[]): string {
  if (entries.length === 0) {
    return 'Ingen data registrerad ännu.';
  }

  // Gruppera efter datum
  const byDate: Record<string, Entry[]> = {};
  
  for (const entry of entries) {
    const date = new Date(entry.createdAt).toISOString().split('T')[0];
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(entry);
  }

  let summary = '';
  
  for (const [date, dayEntries] of Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0]))) {
    const weekday = new Date(date).toLocaleDateString('sv-SE', { weekday: 'long' });
    summary += `\n📅 ${date} (${weekday}):\n`;
    
    for (const entry of dayEntries) {
      const time = new Date(entry.createdAt).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
      const type = entry.analysis?.type || 'OKÄND';
      const emojiMap: Record<string, string> = {
        'FOOD': '🍽️',
        'SYMPTOM': '🩺',
        'BATHROOM': '🚽',
        'EXERCISE': '🏃',
        'MOOD': '😊',
        'MEDICATION': '💊'
      };
      const typeEmoji = emojiMap[type] || '📝';
      
      summary += `  ${time} ${typeEmoji} ${type}: ${entry.text.substring(0, 100)}${entry.text.length > 100 ? '...' : ''}\n`;
      
      // Lägg till analysdata om det finns
      if (entry.analysis) {
        const a = entry.analysis;
        
        if (a.ingredients && a.ingredients.length > 0) {
          const triggers = a.ingredients
            .flatMap(i => i.triggers || [])
            .map(t => t.name)
            .filter((v, i, arr) => arr.indexOf(v) === i);
          if (triggers.length > 0) {
            summary += `    ⚠️ Triggers: ${triggers.join(', ')}\n`;
          }
        }
        
        if (a.symptomData) {
          summary += `    📊 ${a.symptomData.primaryType || a.symptomData.type}: Intensitet ${a.symptomData.intensity}/10\n`;
        }
        
        if (a.bathroomData) {
          summary += `    📊 Bristol: ${a.bathroomData.bristol} (${a.bathroomData.bristolCategory || ''})\n`;
        }
        
        if (a.stackingWarning) {
          summary += `    🚨 Stacking: ${a.stackingWarning.triggers.join(' + ')}\n`;
        }
      }
    }
  }
  
  // Lägg till sammanfattande statistik
  const stats = calculateStats(entries);
  summary += `\n📈 STATISTIK (${entries.length} registreringar):\n`;
  summary += `  • Måltider: ${stats.foodCount}\n`;
  summary += `  • Symptom: ${stats.symptomCount}\n`;
  summary += `  • Toabesök: ${stats.bathroomCount}\n`;
  if (stats.avgBristol) summary += `  • Genomsnittlig Bristol: ${stats.avgBristol.toFixed(1)}\n`;
  if (stats.avgSymptomIntensity) summary += `  • Genomsnittlig symptomintensitet: ${stats.avgSymptomIntensity.toFixed(1)}/10\n`;
  if (stats.topTriggers.length > 0) summary += `  • Vanligaste triggers: ${stats.topTriggers.slice(0, 5).join(', ')}\n`;
  
  return summary;
}

function formatProfileForAI(profile: UserProfile): string {
  let summary = '';
  
  if (profile.diagnoses?.length > 0) {
    summary += `🏥 Diagnoser: ${profile.diagnoses.join(', ')}\n`;
  }
  
  if (profile.confirmedTriggers && profile.confirmedTriggers.length > 0) {
    summary += `⚠️ Bekräftade triggers: ${profile.confirmedTriggers.join(', ')}\n`;
  }
  
  if (profile.safeFoods && profile.safeFoods.length > 0) {
    summary += `✅ Säkra livsmedel: ${profile.safeFoods.join(', ')}\n`;
  }
  
  if (profile.regularMedications && profile.regularMedications.length > 0) {
    summary += `💊 Mediciner: ${profile.regularMedications.join(', ')}\n`;
  }
  
  if (profile.diet && profile.diet !== 'normal') {
    summary += `🥗 Kosthållning: ${profile.diet}\n`;
  }
  
  if (profile.goals && profile.goals.length > 0) {
    summary += `🎯 Mål: ${profile.goals.join(', ')}\n`;
  }
  
  if (profile.notes) {
    summary += `📝 Anteckningar: ${profile.notes}\n`;
  }
  
  return summary || 'Ingen profilinformation angiven.';
}

function calculateStats(entries: Entry[]) {
  const foodCount = entries.filter(e => e.analysis?.type === 'FOOD').length;
  const symptomCount = entries.filter(e => e.analysis?.type === 'SYMPTOM').length;
  const bathroomCount = entries.filter(e => e.analysis?.type === 'BATHROOM').length;
  
  // Bristol-genomsnitt
  const bristolEntries = entries.filter(e => e.analysis?.bathroomData?.bristol);
  const avgBristol = bristolEntries.length > 0
    ? bristolEntries.reduce((sum, e) => sum + (e.analysis?.bathroomData?.bristol || 0), 0) / bristolEntries.length
    : null;
  
  // Symptom-intensitet genomsnitt
  const symptomEntries = entries.filter(e => e.analysis?.symptomData?.intensity);
  const avgSymptomIntensity = symptomEntries.length > 0
    ? symptomEntries.reduce((sum, e) => sum + (e.analysis?.symptomData?.intensity || 0), 0) / symptomEntries.length
    : null;
  
  // Top triggers
  const triggerCounts: Record<string, number> = {};
  for (const entry of entries) {
    if (entry.analysis?.ingredients) {
      for (const ing of entry.analysis.ingredients) {
        for (const trigger of ing.triggers || []) {
          triggerCounts[trigger.name] = (triggerCounts[trigger.name] || 0) + 1;
        }
      }
    }
    if (entry.analysis?.triggers) {
      for (const trigger of entry.analysis.triggers) {
        triggerCounts[trigger.name] = (triggerCounts[trigger.name] || 0) + 1;
      }
    }
  }
  
  const topTriggers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
  
  return {
    foodCount,
    symptomCount,
    bathroomCount,
    avgBristol,
    avgSymptomIntensity,
    topTriggers
  };
}

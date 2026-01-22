# Smart Gut Tracker

En mobil-optimerad MVP för att spåra maghälsa med AI-drivna insikter.

## Funktioner

- 📱 Mobiloptimerad design med mörk tema
- 🍽️ Registrera mat med automatisk ingrediens-analys
- 🤢 Spåra symtom med intensitetsnivåer
- 💪 Logga träning och aktiviteter
- 🧠 Dokumentera mående och omständigheter
- 🤖 AI-analys med OpenAI för att identifiera triggers och mönster
- 💾 LocalStorage för snabb MVP (strukturerad för framtida Supabase-migration)

## Tech Stack

- **Next.js 15** med App Router
- **TypeScript**
- **Tailwind CSS** för styling
- **Lucide React** för ikoner
- **Vercel AI SDK** för OpenAI-integration
- **LocalStorage** för datapersistence

## Kom igång

### Förutsättningar

- Node.js 18+ installerat
- OpenAI API-nyckel

### Installation

1. Installera dependencies:
```bash
npm install
```

2. Skapa en `.env.local` fil och lägg till din OpenAI API-nyckel:
```
OPENAI_API_KEY=din-openai-api-nyckel
```

3. Kör utvecklingsservern:
```bash
npm run dev
```

4. Öppna [http://localhost:3000](http://localhost:3000) i din webbläsare.

## Användning

1. **Första gången**: Ange ditt namn på välkomstskärmen
2. **Dashboard**: Se dagens datum och alla inlägg för idag
3. **Lägg till inlägg**: Tryck på någon av de fyra knapparna längst ner:
   - 🍽️ Mat - Registrera vad du ätit
   - 🤢 Symtom - Logga magbesvär
   - 💪 Träning - Spara träningsaktiviteter
   - 🧠 Mående - Dokumentera hur du känner dig
4. **AI-analys**: Varje inlägg analyseras automatiskt och taggas med relevanta triggers

## Projektstruktur

```
app/
├── api/analyze/      # OpenAI-integration för textanalys
├── dashboard/        # Huvuddashboard
├── layout.tsx        # Root layout
└── page.tsx          # Välkomstsida

components/
├── ActionBar.tsx     # Knappfält för snabbinmatning
├── EntryCard.tsx     # Kort som visar inlägg med taggar
└── EntryModal.tsx    # Modal för att skapa nya inlägg

lib/
└── storage.ts        # LocalStorage utilities

types/
└── index.ts          # TypeScript type definitions
```

## Framtida Förbättringar

- [ ] Migration till Supabase för molnbaserad lagring
- [ ] Användarautentisering med Supabase Auth
- [ ] Historik och trendanalys
- [ ] Export av data
- [ ] Notifikationer och påminnelser
- [ ] Delning med vårdpersonal

## Licens

MIT

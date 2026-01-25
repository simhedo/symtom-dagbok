# Smart Gut Tracker - Universal Input Upgrade

## 🎯 Genomförda Uppgraderingar

### ✅ 1. Universal Input-modul (Text + Bild + Skanning)
**Ny komponent:** `UniversalEntryModal.tsx`

**Funktioner:**
- 📝 **Text:** Fri textinmatning som tidigare
- 📷 **Kamera:** Ta bilder direkt eller välj från galleri
  - Stöd för flera bilder per inlägg
  - Preview och radering av bilder
- 🔍 **Streckkodsläsare:** Skanna produkter (endast för MAT)
  - Web Barcode Detection API (modern browsers)
  - Fallback till manuell inmatning
  - Multi-skanning: Skanna flera produkter i rad

### ✅ 2. Open Food Facts Integration
**Ny API-route:** `/api/product`

**Funktioner:**
- Hämtar produktdata från Open Food Facts databas
- Returnerar: namn, märke, ingredienslista, näringsvärden, bild
- Ingredienslistan matas automatiskt till AI för analys

### ✅ 3. Förbättrad AI-Analys
**Uppdaterad:** `/api/analyze/route.ts`

**Nya regler:**
- Djupare ingrediens-nedbrytning (pizza → vetemjöl, ost, tomatsås...)
- Utökad trigger-lista (20+ triggers inklusive syra, specifika FODMAP-kategorier)
- Automatisk hantering av skannade produkter med ingredienslistor
- Bättre extraktion från produktnamn till faktiska komponenter

### ✅ 4. Redan Implementerat (ingen ändring)
Dessa funktioner fanns redan:
- ✅ Bristol Stool Scale (1-7)
- ✅ Intensitetsskala (1-10)
- ✅ Fiber-klassificering (löslig/olöslig, low/medium/high)
- ✅ Detaljer: slem, lukt, gasLevel

---

## 🚀 Aktivera den nya modalen

För att börja använda den nya Universal Input-modalen:

### 1. Uppdatera dashboard/page.tsx

**Före:**
\`\`\`tsx
import EntryModal from '@/components/EntryModal';
\`\`\`

**Efter:**
\`\`\`tsx
import UniversalEntryModal from '@/components/UniversalEntryModal';
\`\`\`

**Och längre ner i komponenten:**

**Före:**
\`\`\`tsx
<EntryModal
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
  type={selectedType}
  onSave={handleSave}
  selectedDate={selectedDate}
/>
\`\`\`

**Efter:**
\`\`\`tsx
<UniversalEntryModal
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
  type={selectedType}
  onSave={handleSave}
  selectedDate={selectedDate}
/>
\`\`\`

### 2. Uppdatera handleSave för att hantera nya metadata

**Nuvarande signatur:**
\`\`\`tsx
const handleSave = async (text: string, type: EntryType, timestamp: Date, meta?: { gasLevel?: number })
\`\`\`

**Ny signatur:**
\`\`\`tsx
const handleSave = async (
  text: string, 
  type: EntryType, 
  timestamp: Date, 
  meta?: { 
    gasLevel?: number; 
    products?: ScannedProduct[]; 
    images?: string[] 
  }
)
\`\`\`

**OBS:** `handleSave` kan behållas som den är - `meta.products` och `meta.images` kommer att skickas till API men AI:n får redan all info i `text`-fältet.

---

## 📱 Användarflöde

### Exempel: Registrera pizza med bild och skanning

1. Tryck på 🍽️ **Mat**-knappen
2. Tre alternativ visas:
   - 📷 **Bild** - Ta foto av maten
   - 🔍 **Skanna** - Skanna streckkod (t.ex. på dressing eller läsk)
   - Eller bara skriv text som vanligt

3. **Scenario A - Endast text:**
   "Åt margherita pizza till lunch"
   → AI bryter ner: vetemjöl (gluten, FODMAP), ost (laktos, fett), tomatsås (syra), olivolja (fett)

4. **Scenario B - Med skanning:**
   - Skanna Coca-Cola (streckkod)
   - Produktdata hämtas: "Ingredienser: vatten, socker, kolsyra, karamell..."
   - Skriv: "Åt pizza och"
   → Text blir: "Åt pizza och Coca-Cola (Ingredienser: vatten, socker, kolsyra...)"
   → AI analyserar BÅDE pizza OCH faktiska Cola-ingredienser

5. **Scenario C - Multi-skanning:**
   - Skanna dressing
   - Skanna läsk
   - Skanna dessert
   - Skriv: "Sallad till lunch"
   → Alla tre produkter läggs till, AI analyserar alla ingredienser

---

## 🔧 Tekniska detaljer

### API Endpoints

**`/api/product?barcode={EAN-kod}`**
- Hämtar från Open Food Facts
- Returnerar JSON med produktinfo
- Använder svenska namn om tillgängligt

**`/api/analyze` (uppdaterad)**
- Tar emot längre text med alla produktingredienser
- Bryter ner varje komponent till triggers
- Returnerar strukturerad data med ingredienser, triggers, fiber, etc.

### Browser Compatibility

**Barcode Detection API:**
- ✅ Chrome/Edge 83+
- ✅ Android Chrome
- ❌ Safari (fallback till manuell input)
- ❌ Firefox (fallback till manuell input)

**Camera API:**
- ✅ Alla moderna browsers med HTTPS

---

## 🎨 UX-förbättringar

- Enhetligt gränssnitt för alla entry-typer
- Visuell feedback vid skanning (laddar... / skannar...)
- Preview av skannade produkter innan save
- Radera funktion för bilder och produkter
- Mobiloptimerad kameravy med stor capture-knapp

---

## 🔜 Framtida förbättringar (valfritt)

1. **Bildigenkänning:** Använd AI för att analysera matbilder
2. **Favoritprodukter:** Spara ofta skannade produkter för snabbval
3. **Offline-stöd:** Cacha produktdata för vanliga produkter
4. **QR-kod:** Stöd för restaurangmenyer med QR-koder
5. **Hantera skannade bilder:** Spara bilder till databasen/Supabase

---

## 📋 Checklista

- [x] Skapa `/api/product` för Open Food Facts
- [x] Skapa `UniversalEntryModal` med kamera + skanner
- [x] Implementera multi-produkt skanning
- [x] Förbättra AI-prompt för ingrediens-nedbrytning
- [x] Testa och verifiera kompilering
- [ ] Aktivera i dashboard (byt ut EntryModal → UniversalEntryModal)
- [ ] Testa i produktion
- [ ] (Valfritt) Spara bilder till databas istället för base64

---

## 💡 Tips

**För utveckling:**
- Testa med produkter från svensk supermarket (ICA, Coop har bra Open Food Facts-data)
- Använd Chrome DevTools för att simulera mobil kamera
- Kontrollera console för API-fel

**För användaren:**
- Tydliga fel-meddelanden vid misslyckad skanning
- "Försök igen" om produkten inte finns i databasen
- Möjlighet att skippa skanning och skriva manuellt

---

God kod! 🚀

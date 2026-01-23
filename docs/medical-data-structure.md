# Medical Data Structure - Gut Health Tracker

## Filosofi
Strukturera data som en gastroenterolog gör - exakt, mätbar, korrelationsbar.

## Datatyper

### 1. BATHROOM 🚽
**Bristol Scale (1-7)** - Medicinsk standard för avföringstyp
- **Type 1-2**: Förstoppning (hård, svår)
- **Type 3-4**: Normalt (idealisk)
- **Type 5-7**: Diarré (lös, flytande)

**Andra mätpunkter:**
- Urgency (1-5): Hur bråttom?
- Strain: Måste krysta?
- Pain (0-10): Smärta?
- Blood/Mucus: Varningssignaler
- Incomplete: Ofullständig tömning?

**Analyseras för:**
- Frekvens per dag/vecka
- Konstistens-trender
- Samband med mat 6-48h tidigare
- Stress/sömnkorrelation

### 2. FOOD 🍽️
**Detaljerad måltidsloggning:**
- **Meal Type**: Frukost/Lunch/Middag/Mellanmål
- **Ingredients**: Kategoriserade (protein, carbs, triggers, etc)
- **Context**: Stress, hastighet, tuggning, hydration
- **Portion Size**: Small/Normal/Large
- **Templates**: Spara vanliga måltider

**Analyseras för:**
- Trigger-exponering över tid (ex: 5 dagar socker)
- Måltidsmönster (hoppar över frukost?)
- Eating behavior (äter för fort, tuggar dåligt)
- Kombinationseffekter (fett + socker = värre än bara fett)

### 3. SYMPTOM 🤢
**Medicinskt exakta symptom:**
- **Type**: Abdominal pain, Bloating, Gas, Nausea, etc
- **Location**: 9-punkts body map
- **Intensity**: 1-10 scale
- **Pattern**: Constant, Intermittent, Waves, Stabbing
- **Duration**: Hur länge det varade

**Analyseras för:**
- Fördröjning från mat till symptom
- Symptomkluster (bloating + gas = ofta tillsammans)
- Severity trends över tid
- Relief factors (vad hjälper?)

### 4. LIFESTYLE 🏃
**Kontext som påverkar:**
- **Exercise**: Type, Duration, Intensity
- **Sleep**: Hours, Quality
- **Stress**: Level (1-10), Triggers
- **Hydration**: Glas vatten/dag
- **Medications/Supplements**
- **Menstruation** (för kvinnor)

**Analyseras för:**
- Stress-symptom korrelation
- Sömnkvalitetens påverkan
- Motion som lindring
- Medicinering-effekt

## Analytiska Samband

### Temporal Correlation
```
Pizza (laktos + fett) kl 18:00
  ↓ 2h senare
Bloating intensity 7 kl 20:00
  ↓ 4h senare
Diarrhea Bristol 6 kl 22:00
```

### Cumulative Effects
```
Vecka med mycket socker:
- Dag 1-2: Inga symptom
- Dag 3-4: Mild bloating
- Dag 5-7: Gas + Diarrhea

→ Tröskelvärde nått efter 3 dagar
```

### Pattern Detection
```
Konstipation mönster:
- Låg fiber (<20g/dag)
+ Lite vatten (<6 glas)
+ Stress (>7/10)
+ Ingen motion
= Bristol 1-2 inom 2 dagar
```

## UI Implementation

### Entry Creation
- Visual Bristol Scale med bilder
- Body map för symptom-location
- Ingredient picker med autocomplete
- Context toggles (stress/rushed/etc)

### Analytics Dashboard
- Symptom-timeline (visuell graf)
- Trigger heatmap (vilka dagar exponerad)
- Correlation matrix (mat vs symptom)
- Pattern alerts ("Du har haft 3 dagar socker")

### Medical Report
- Weekly summary för läkare
- Correlation confidence levels
- Severity trends
- Export till PDF

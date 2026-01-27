export type EntryType = 'FOOD' | 'SYMPTOM' | 'BATHROOM' | 'EXERCISE' | 'MOOD' | 'MEDICATION';

export interface Trigger {
  name: string;
  confidence?: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  mechanism?: string; // Förklaring av varför detta är en trigger
}

export interface Ingredient {
  name: string;
  amount?: string;
  category?: string; // "protein", "kolhydrat", "fett", "tillsats" etc.
  triggers: Trigger[];
}

export interface SymptomData {
  primaryType?: 'Gas' | 'Smärta' | 'Illamående' | 'Uppblåsthet' | 'Reflux' | 'Annan';
  type?: 'Gas' | 'Smärta' | 'Avföring' | 'Annan'; // Legacy support
  intensity: number; // 1-10
  location?: 'övre mage' | 'nedre mage' | 'hela buken' | 'vänster' | 'höger';
  character?: 'krampande' | 'molande' | 'brännande' | 'tryckande' | 'stickande';
  duration?: 'akut (<1h)' | 'kortvarig (1-4h)' | 'långvarig (>4h)' | 'konstant';
  description?: string;
  gasLevel?: number; // 0-3: ingen, lite, måttlig, mycket
  bristol?: number; // 1-7: Bristol Stool Scale
  smell?: 'normal' | 'illaluktande' | 'sur';
  mucus?: boolean; // slem
  associatedSymptoms?: string[];
  relievingFactors?: string[];
  aggravatingFactors?: string[];
}

export interface GasData {
  level: number; // 0-3
  type?: 'uppstötningar' | 'flatulens' | 'uppblåsthet' | 'rörelser';
  timing?: 'efter måltid' | 'fastande' | 'konstant';
  odor?: 'luktfri' | 'normal' | 'illaluktande' | 'svavel';
  clinicalNote?: string;
}

export interface BathroomData {
  bristol: number; // 1-7
  bristolCategory?: 'förstoppning' | 'normal' | 'lös' | 'diarré';
  urgency?: 'ingen' | 'normal' | 'brådskande' | 'akut';
  completeness?: 'fullständig' | 'ofullständig' | 'känsla av mer kvar';
  strain?: 'ingen' | 'lite' | 'mycket';
  pain?: 'ingen' | 'före' | 'under' | 'efter';
  blood?: false | 'på papper' | 'i stolen' | 'färskt' | 'mörkt';
  mucus?: false | 'lite' | 'mycket';
  color?: 'normal brun' | 'ljus/lerfärgad' | 'mörk' | 'grön' | 'gul';
  odor?: 'normal' | 'extra illaluktande' | 'sur' | 'ruttnande';
  floating?: boolean;
  frequency?: 'första idag' | '2-3/dag' | '4+/dag';
}

export interface FiberAnalysis {
  totalGrams?: number;
  type: 'low' | 'medium' | 'high';
  soluble?: number;
  insoluble?: number;
  ratio?: 'balanced' | 'soluble-dominant' | 'insoluble-dominant';
  clinicalNote?: string;
}

export interface GastricEmptying {
  impact: 'fast' | 'normal' | 'slow' | 'very-slow';
  fatContent?: number;
  fiberContent?: number;
  estimatedEmptyingTime?: string;
  clinicalNote?: string;
}

export interface StackingWarning {
  level: 'low' | 'medium' | 'high';
  triggers: string[];
  message: string;
}

export interface ClinicalCorrelation {
  likelyTriggers?: string[];
  timeFromLastMeal?: string;
  pattern?: string;
  differentialConsiderations?: string[];
  recommendation?: string;
}

export interface AIAnalysis {
  type: EntryType;
  timestamp: string;
  relativeTime?: string; // "nu", "-1h", "-2h", "frukost", etc.
  ingredients?: Ingredient[];
  symptomData?: SymptomData;
  bathroomData?: BathroomData;
  gasData?: GasData;
  tags?: string[];
  triggers?: Trigger[];
  summary?: string;
  clinicalInsight?: string; // Expert-observation
  
  // Fiber & digestion analysis
  fiberAnalysis?: FiberAnalysis;
  fiberEstimateGrams?: number; // Legacy support
  fiberType?: 'low' | 'medium' | 'high'; // Legacy support
  fiberSoluble?: boolean; // Legacy support
  
  // Advanced analysis
  gastricEmptying?: GastricEmptying;
  stackingWarning?: StackingWarning;
  clinicalCorrelation?: ClinicalCorrelation;
}

export interface Entry {
  id: string;
  text: string;
  createdAt: string;
  analysis?: AIAnalysis;
  userId?: number;
}

export interface User {
  id?: number;
  name: string;
  email?: string;
  createdAt?: string;
}

// Användarprofil för AI-analys
export interface UserProfile {
  // Diagnoser
  diagnoses: string[]; // ["IBS-D", "Laktosintolerans", "SIBO", "Gastropares", "Celiaki", etc.]
  
  // Kända triggers (bekräftade av användaren)
  confirmedTriggers: string[];
  
  // Säkra livsmedel
  safeFoods: string[];
  
  // Mediciner som tas regelbundet
  regularMedications: string[];
  
  // Kosthållning
  diet?: 'normal' | 'lowFODMAP' | 'glutenfri' | 'laktosfri' | 'vegan' | 'vegetarian' | 'annat';
  
  // Mål
  goals?: string[]; // ["Identifiera triggers", "Minska uppblåsthet", "Förbättra avföring"]
  
  // Anteckningar
  notes?: string;
  
  // Senast uppdaterad
  updatedAt?: string;
}

// Chat-meddelanden
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

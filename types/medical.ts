// Medical-grade data types for gut health tracking

export type EntryType = 'FOOD' | 'BATHROOM' | 'SYMPTOM' | 'LIFESTYLE';

// ==================== BATHROOM (Bristol Scale) ====================
export type BristolType = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface BathroomData {
  bristolScale: BristolType;
  urgency: 1 | 2 | 3 | 4 | 5; // 1=normal, 5=very urgent
  duration: number; // minutes
  strain: boolean; // måste krysta?
  pain: number; // 0-10
  blood: boolean;
  mucus: boolean;
  incomplete: boolean; // känns som det inte kom allt ut?
  color?: 'brown' | 'yellow' | 'green' | 'black' | 'red';
  notes?: string;
}

// ==================== FOOD (Detailed Nutrition) ====================
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type PortionSize = 'small' | 'normal' | 'large' | 'very-large';

export interface FoodIngredient {
  name: string;
  category: 'protein' | 'carbs' | 'fat' | 'vegetable' | 'fruit' | 'dairy' | 'grain' | 'sugar' | 'spice' | 'drink';
  amount?: string;
  triggers: string[]; // ['laktos', 'gluten', 'fodmap', etc]
}

export interface FoodData {
  mealType: MealType;
  mealTime: string; // ISO time
  ingredients: FoodIngredient[];
  portionSize: PortionSize;
  eatingSpeed: 'slow' | 'normal' | 'fast'; // påverkar digestion
  chewingQuality: 'good' | 'normal' | 'poor'; // tuggning
  context: {
    stressed: boolean;
    rushed: boolean;
    standing: boolean; // åt stående/gående?
    hydration: 'none' | 'little' | 'normal' | 'much'; // dryck under mål
  };
  satisfaction: number; // 1-10, blev du mätt?
  cravings?: string[]; // vad du ville ha
  templateId?: string; // länk till sparad måltid
  notes?: string;
}

// ==================== SYMPTOM (Medical Precision) ====================
export type SymptomType = 
  | 'abdominal-pain'
  | 'bloating'
  | 'gas'
  | 'nausea'
  | 'heartburn'
  | 'cramping'
  | 'constipation-feeling'
  | 'diarrhea-feeling'
  | 'fullness'
  | 'loss-of-appetite';

export type SymptomLocation = 
  | 'upper-left' | 'upper-center' | 'upper-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'lower-left' | 'lower-center' | 'lower-right';

export type SymptomPattern = 'constant' | 'intermittent' | 'waves' | 'stabbing';

export interface SymptomData {
  type: SymptomType;
  location?: SymptomLocation;
  intensity: number; // 1-10
  duration: number; // minutes
  pattern: SymptomPattern;
  onset: string; // ISO timestamp när det började
  triggers?: string[]; // vad tror du orsakade det
  reliefFactors?: string[]; // vad hjälpte (värme, gå, ligga, etc)
  associatedSymptoms?: SymptomType[]; // andra symptom samtidigt
  notes?: string;
}

// ==================== LIFESTYLE (Context Matters) ====================
export type ExerciseIntensity = 'light' | 'moderate' | 'intense';
export type SleepQuality = 'poor' | 'fair' | 'good' | 'excellent';
export type StressLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface LifestyleData {
  exercise?: {
    type: string;
    duration: number;
    intensity: ExerciseIntensity;
  };
  sleep?: {
    hours: number;
    quality: SleepQuality;
  };
  stress?: {
    level: StressLevel;
    triggers?: string[];
  };
  hydration?: number; // glas vatten
  supplements?: string[];
  medications?: string[];
  menstruation?: boolean; // for women
  notes?: string;
}

// ==================== UNIFIED ENTRY ====================
export interface MedicalEntry {
  id: string;
  userId: number;
  type: EntryType;
  timestamp: string; // ISO timestamp
  
  // Type-specific data
  bathroomData?: BathroomData;
  foodData?: FoodData;
  symptomData?: SymptomData;
  lifestyleData?: LifestyleData;
  
  // Metadata
  tags?: string[];
  mood?: 1 | 2 | 3 | 4 | 5; // allmänt mående
  aiSummary?: string; // AI-generated summary
  
  createdAt: string;
  updatedAt?: string;
}

// ==================== ANALYTICS TYPES ====================
export interface Correlation {
  trigger: string; // "laktos" | "stress" | "godis"
  effect: string; // "bloating" | "diarrhea"
  confidence: number; // 0-100%
  avgDelayHours: number; // genomsnittlig fördröjning
  occurrences: number;
}

export interface Pattern {
  type: 'temporal' | 'cumulative' | 'combination';
  description: string;
  evidence: {
    date: string;
    entries: string[]; // entry IDs
  }[];
  strength: number; // 0-100%
}

export interface DailyStats {
  date: string;
  bathroomVisits: number;
  avgBristolScale: number;
  totalSymptomIntensity: number;
  uniqueSymptoms: SymptomType[];
  triggerExposure: Record<string, number>;
  moodAvg: number;
}

export interface WeeklyAnalysis {
  weekStart: string;
  weekEnd: string;
  dailyStats: DailyStats[];
  topTriggers: string[];
  worstDays: string[];
  bestDays: string[];
  patterns: Pattern[];
  correlations: Correlation[];
  recommendations: string[];
}

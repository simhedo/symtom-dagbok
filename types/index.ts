export type EntryType = 'FOOD' | 'SYMPTOM' | 'EXERCISE' | 'MOOD' | 'MEDICATION';

export interface Trigger {
  name: string;
  confidence?: number;
}

export interface Ingredient {
  name: string;
  amount?: string;
  triggers: Trigger[];
}

export interface SymptomData {
  type: 'Gas' | 'Smärta' | 'Avföring' | 'Annan';
  intensity: number; // 1-10
  description?: string;
  gasLevel?: number; // 0-3: ingen, lite, måttlig, mycket
  bristol?: number; // 1-7: Bristol Stool Scale
  smell?: 'normal' | 'illaluktande' | 'sur';
  mucus?: boolean; // slem
}

export interface AIAnalysis {
  type: EntryType;
  timestamp: string;
  relativeTime?: string; // "nu", "-1h", "-2h", "frukost", etc.
  ingredients?: Ingredient[];
  symptomData?: SymptomData;
  tags?: string[];
  summary?: string;
  fiberEstimateGrams?: number;
  fiberType?: 'low' | 'medium' | 'high';
  fiberSoluble?: boolean; // löslig fiber (havre, frukt) vs olöslig (vetekli)
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

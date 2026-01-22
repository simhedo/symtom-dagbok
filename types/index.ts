export type EntryType = 'FOOD' | 'SYMPTOM' | 'EXERCISE' | 'MOOD';

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
}

export interface AIAnalysis {
  type: EntryType;
  timestamp: string;
  ingredients?: Ingredient[];
  symptomData?: SymptomData;
  tags?: string[];
  summary?: string;
}

export interface Entry {
  id: string;
  text: string;
  createdAt: string;
  analysis?: AIAnalysis;
  userName: string;
}

export interface User {
  name: string;
  createdAt: string;
}

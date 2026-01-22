import { Entry, User } from '@/types';

const STORAGE_KEYS = {
  USER: 'gut_tracker_user',
  ENTRIES: 'gut_tracker_entries',
} as const;

// User functions
export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEYS.USER);
  return data ? JSON.parse(data) : null;
};

export const saveUser = (name: string): User => {
  const user: User = {
    name,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  return user;
};

export const clearUser = (): void => {
  localStorage.removeItem(STORAGE_KEYS.USER);
};

// Entry functions
export const getEntries = (): Entry[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.ENTRIES);
  return data ? JSON.parse(data) : [];
};

export const saveEntry = (entry: Entry): void => {
  const entries = getEntries();
  entries.unshift(entry); // Add to beginning
  localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
};

export const updateEntry = (id: string, updatedEntry: Entry): void => {
  const entries = getEntries();
  const index = entries.findIndex(e => e.id === id);
  if (index !== -1) {
    entries[index] = updatedEntry;
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
  }
};

export const deleteEntry = (id: string): void => {
  const entries = getEntries().filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
};

export const getTodayEntries = (): Entry[] => {
  const entries = getEntries();
  const today = new Date().toDateString();
  return entries.filter(e => new Date(e.createdAt).toDateString() === today);
};

// Get all unique triggers/tags from entries
export const getAllTriggers = (): string[] => {
  const entries = getEntries();
  const triggersSet = new Set<string>();
  
  entries.forEach(entry => {
    if (entry.analysis?.ingredients) {
      entry.analysis.ingredients.forEach(ing => {
        ing.triggers.forEach(trigger => triggersSet.add(trigger.name));
      });
    }
    if (entry.analysis?.tags) {
      entry.analysis.tags.forEach(tag => triggersSet.add(tag));
    }
  });
  
  return Array.from(triggersSet).sort();
};

// Get all unique ingredients from entries
export const getAllIngredients = (): string[] => {
  const entries = getEntries();
  const ingredientsSet = new Set<string>();
  
  entries.forEach(entry => {
    if (entry.analysis?.ingredients) {
      entry.analysis.ingredients.forEach(ing => {
        ingredientsSet.add(ing.name);
      });
    }
  });
  
  return Array.from(ingredientsSet).sort();
};

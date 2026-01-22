import { Entry, User } from '@/types';

const STORAGE_KEYS = {
  USER: 'gut_tracker_user',
} as const;

// User functions (still in localStorage - no auth system yet)
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

// Entry functions (via API)
export const getEntries = async (): Promise<Entry[]> => {
  try {
    const user = getUser();
    if (!user) return [];

    const response = await fetch('/api/entries', {
      headers: {
        'x-user-name': user.name,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch entries');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting entries:', error);
    return [];
  }
};

export const saveEntry = async (entry: Entry): Promise<void> => {
  try {
    const response = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      throw new Error('Failed to save entry');
    }
  } catch (error) {
    console.error('Error saving entry:', error);
    throw error;
  }
};

export const updateEntry = async (id: string, updatedEntry: Entry): Promise<void> => {
  try {
    const response = await fetch('/api/entries', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updatedEntry, id }),
    });

    if (!response.ok) {
      throw new Error('Failed to update entry');
    }
  } catch (error) {
    console.error('Error updating entry:', error);
    throw error;
  }
};

export const deleteEntry = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`/api/entries?id=${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete entry');
    }
  } catch (error) {
    console.error('Error deleting entry:', error);
    throw error;
  }
};

export const getTodayEntries = async (): Promise<Entry[]> => {
  try {
    const allEntries = await getEntries();
    const today = new Date().toDateString();
    return allEntries.filter(e => new Date(e.createdAt).toDateString() === today);
  } catch (error) {
    console.error('Error getting today entries:', error);
    return [];
  }
};

// Get all unique triggers/tags from entries
export const getAllTriggers = async (): Promise<string[]> => {
  try {
    const entries = await getEntries();
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
  } catch (error) {
    console.error('Error getting triggers:', error);
    return [];
  }
};

// Get all unique ingredients from entries
export const getAllIngredients = async (): Promise<string[]> => {
  try {
    const entries = await getEntries();
    const ingredientsSet = new Set<string>();
    
    entries.forEach(entry => {
      if (entry.analysis?.ingredients) {
        entry.analysis.ingredients.forEach(ing => {
          ingredientsSet.add(ing.name);
        });
      }
    });
    
    return Array.from(ingredientsSet).sort();
  } catch (error) {
    console.error('Error getting ingredients:', error);
    return [];
  }
};

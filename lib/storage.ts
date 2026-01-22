import { Entry, User } from '@/types';

const STORAGE_KEYS = {
  USER: 'gut_tracker_user',
  TOKEN: 'gut_tracker_token',
} as const;

// Get auth headers with JWT token
const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// User functions
export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEYS.USER);
  return data ? JSON.parse(data) : null;
};

export const saveUser = (user: User, token: string): void => {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
};

export const clearUser = (): void => {
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
};

// Entry functions (via API with JWT authentication)
export const getEntries = async (): Promise<Entry[]> => {
  try {
    const response = await fetch('/api/entries', {
      headers: getAuthHeaders(),
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
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
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
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
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
      headers: getAuthHeaders(),
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

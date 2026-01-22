import { sql } from '@vercel/postgres';
import { Entry, User } from '@/types';

// Initialize database tables
export async function initDb() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS entries (
        id VARCHAR(50) PRIMARY KEY,
        user_name VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL,
        entry_type VARCHAR(20) NOT NULL,
        analysis JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at DESC)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_entries_user_name ON entries(user_name)
    `;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// User functions
export const getUser = async (): Promise<User | null> => {
  try {
    // For MVP, just check localStorage (no multi-user yet)
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('gut_tracker_user');
      return data ? JSON.parse(data) : null;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const saveUser = async (name: string): Promise<User> => {
  const user: User = {
    name,
    createdAt: new Date().toISOString(),
  };
  
  // Store in localStorage for now
  if (typeof window !== 'undefined') {
    localStorage.setItem('gut_tracker_user', JSON.stringify(user));
  }
  
  return user;
};

export const clearUser = async (): Promise<void> => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gut_tracker_user');
  }
};

// Entry functions
export const getEntries = async (): Promise<Entry[]> => {
  try {
    const user = await getUser();
    if (!user) return [];

    const { rows } = await sql`
      SELECT * FROM entries 
      WHERE user_name = ${user.name}
      ORDER BY created_at DESC
    `;

    return rows.map(row => ({
      id: row.id,
      text: row.text,
      createdAt: row.created_at,
      analysis: row.analysis,
      userName: row.user_name,
    }));
  } catch (error) {
    console.error('Error getting entries:', error);
    return [];
  }
};

export const saveEntry = async (entry: Entry): Promise<void> => {
  try {
    await sql`
      INSERT INTO entries (id, user_name, text, created_at, entry_type, analysis)
      VALUES (
        ${entry.id},
        ${entry.userName},
        ${entry.text},
        ${entry.createdAt},
        ${entry.analysis?.type || 'FOOD'},
        ${JSON.stringify(entry.analysis)}
      )
    `;
  } catch (error) {
    console.error('Error saving entry:', error);
    throw error;
  }
};

export const updateEntry = async (id: string, updatedEntry: Entry): Promise<void> => {
  try {
    await sql`
      UPDATE entries 
      SET 
        text = ${updatedEntry.text},
        created_at = ${updatedEntry.createdAt},
        entry_type = ${updatedEntry.analysis?.type || 'FOOD'},
        analysis = ${JSON.stringify(updatedEntry.analysis)},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;
  } catch (error) {
    console.error('Error updating entry:', error);
    throw error;
  }
};

export const deleteEntry = async (id: string): Promise<void> => {
  try {
    await sql`DELETE FROM entries WHERE id = ${id}`;
  } catch (error) {
    console.error('Error deleting entry:', error);
    throw error;
  }
};

export const getTodayEntries = async (): Promise<Entry[]> => {
  try {
    const user = await getUser();
    if (!user) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { rows } = await sql`
      SELECT * FROM entries 
      WHERE user_name = ${user.name}
        AND created_at >= ${today.toISOString()}
        AND created_at < ${tomorrow.toISOString()}
      ORDER BY created_at DESC
    `;

    return rows.map(row => ({
      id: row.id,
      text: row.text,
      createdAt: row.created_at,
      analysis: row.analysis,
      userName: row.user_name,
    }));
  } catch (error) {
    console.error('Error getting today entries:', error);
    return [];
  }
};

// Get all unique triggers/tags from entries
export const getAllTriggers = async (): Promise<string[]> => {
  try {
    const user = await getUser();
    if (!user) return [];

    const { rows } = await sql`
      SELECT DISTINCT jsonb_array_elements_text(
        CASE 
          WHEN analysis->'ingredients' IS NOT NULL 
          THEN (
            SELECT jsonb_agg(trigger->>'name')
            FROM jsonb_array_elements(analysis->'ingredients') AS ingredient,
                 jsonb_array_elements(ingredient->'triggers') AS trigger
          )
          WHEN analysis->'tags' IS NOT NULL
          THEN analysis->'tags'
          ELSE '[]'::jsonb
        END
      ) AS trigger_name
      FROM entries
      WHERE user_name = ${user.name}
        AND (analysis->'ingredients' IS NOT NULL OR analysis->'tags' IS NOT NULL)
    `;

    return rows.map(row => row.trigger_name).filter(Boolean).sort();
  } catch (error) {
    console.error('Error getting triggers:', error);
    return [];
  }
};

// Get all unique ingredients from entries
export const getAllIngredients = async (): Promise<string[]> => {
  try {
    const user = await getUser();
    if (!user) return [];

    const { rows } = await sql`
      SELECT DISTINCT ingredient->>'name' AS ingredient_name
      FROM entries,
           jsonb_array_elements(analysis->'ingredients') AS ingredient
      WHERE user_name = ${user.name}
        AND analysis->'ingredients' IS NOT NULL
      ORDER BY ingredient_name
    `;

    return rows.map(row => row.ingredient_name).filter(Boolean);
  } catch (error) {
    console.error('Error getting ingredients:', error);
    return [];
  }
};

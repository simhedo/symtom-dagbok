'use client';

import { useMemo, useState } from 'react';
import { Entry } from '@/types';
import Calendar from './Calendar';

interface SymptomCalendarViewProps {
  entries: Entry[];
}

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase();
}

export default function SymptomCalendarView({ entries }: SymptomCalendarViewProps) {
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [query, setQuery] = useState('');

  // Hämta alla unika taggar/symtom
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach(entry => {
      (entry.analysis?.tags || []).forEach(tag => tagSet.add(normalizeTag(tag)));
      if (entry.analysis?.ingredients) {
        entry.analysis.ingredients.forEach(ing => tagSet.add(normalizeTag(ing.name)));
      }
    });
    return Array.from(tagSet).sort();
  }, [entries]);

  // Filtrera entries på vald tagg
  const filteredEntries = useMemo(() => {
    if (!selectedTag) return [];
    return entries.filter(entry => {
      const tags = [
        ...(entry.analysis?.tags || []).map(normalizeTag),
        ...(entry.analysis?.ingredients || []).map(ing => normalizeTag(ing.name))
      ];
      return tags.includes(selectedTag);
    });
  }, [entries, selectedTag]);

  // Visa entries för vald dag
  const entriesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEntries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      return entryDate.toDateString() === selectedDate.toDateString();
    });
  }, [filteredEntries, selectedDate]);

  // För kalendern: markera dagar med matchande entry
  const calendarEntries = useMemo(() => {
    if (!selectedTag) return [];
    return filteredEntries;
  }, [filteredEntries, selectedTag]);

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-100">Symtomkalender</h2>
        <p className="text-sm text-gray-400">Välj ett symtom, trigger eller ingrediens för att se förekomst markerad i kalendern.</p>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Sök symtom, trigger eller ingrediens..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gray-600"
        />
        <div className="flex flex-wrap gap-2 mt-1">
          {allTags.filter(tag => tag.includes(query.toLowerCase())).slice(0, 30).map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                selectedTag === tag
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tag.charAt(0).toUpperCase() + tag.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <Calendar
          entries={calendarEntries}
          onDateSelect={setSelectedDate}
          selectedDate={selectedDate}
        />
      </div>

      {selectedDate && entriesForSelectedDate.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-2">
          <div className="text-sm text-gray-300 mb-2">Inlägg {selectedDate.toLocaleDateString('sv-SE')}</div>
          {entriesForSelectedDate.map(entry => (
            <div key={entry.id} className="p-2 rounded bg-gray-800 text-gray-100 text-sm">
              {entry.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Entry } from '@/types';
import Calendar from './Calendar';

interface SymptomCalendarViewProps {
  entries: Entry[];
}

// Kända triggers som är relevanta för IBS-analys
const KNOWN_TRIGGERS = new Set([
  'fodmap', 'gluten', 'laktos', 'fett', 'socker', 'koffein', 'alkohol',
  'fruktos', 'sorbitol', 'mannitol', 'lök', 'vitlök', 'bönor', 'linser',
  'vete', 'råg', 'korn', 'mjölk', 'grädde', 'ost', 'glass',
  'äpple', 'päron', 'mango', 'vattenmelon', 'honung',
  'kryddor', 'stark mat', 'fet mat', 'stekt', 'friterad',
  'kolsyra', 'sötningsmedel', 'fiber', 'olöslig fiber', 'löslig fiber'
]);

// Kända symptomtyper
const KNOWN_SYMPTOMS = new Set([
  'gas', 'uppblåst', 'buksmärta', 'kramper', 'illamående',
  'diarré', 'lös mage', 'förstoppning', 'halsbränna', 'rapningar',
  'reflux', 'magknip', 'obehag', 'trötthet', 'huvudvärk'
]);

// Kända träningstyper
const KNOWN_EXERCISE = new Set([
  'promenad', 'löpning', 'cykling', 'simning', 'styrketräning',
  'yoga', 'stretching', 'cardio', 'hiit', 'gym', 'träning'
]);

type FilterCategory = 'triggers' | 'symptoms' | 'medications' | 'exercise';

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase();
}

function categorizeTag(tag: string, entryType?: string): FilterCategory | null {
  const normalized = normalizeTag(tag);
  
  // Filtrera bort irrelevanta saker (mängder, produktnamn, etc.)
  if (/^\d/.test(normalized)) return null; // Börjar med siffra (1km, 3st)
  if (normalized.length < 2) return null;
  if (['st', 'ml', 'dl', 'g', 'kg', 'km', 'm'].includes(normalized)) return null;
  
  if (KNOWN_SYMPTOMS.has(normalized)) return 'symptoms';
  if (KNOWN_TRIGGERS.has(normalized)) return 'triggers';
  if (KNOWN_EXERCISE.has(normalized)) return 'exercise';
  
  // Baserat på entry-typ
  if (entryType === 'MEDICATION') return 'medications';
  if (entryType === 'SYMPTOM') return 'symptoms';
  if (entryType === 'EXERCISE') return 'exercise';
  
  return null;
}

export default function SymptomCalendarView({ entries }: SymptomCalendarViewProps) {
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [query, setQuery] = useState('');

  // Hämta och kategorisera relevanta taggar
  const categorizedTags = useMemo(() => {
    const categories: Record<FilterCategory, Set<string>> = {
      triggers: new Set(),
      symptoms: new Set(),
      medications: new Set(),
      exercise: new Set()
    };
    
    entries.forEach(entry => {
      const entryType = entry.analysis?.type;
      
      // Extrahera triggers från ingredienser
      entry.analysis?.ingredients?.forEach(ing => {
        ing.triggers?.forEach(trigger => {
          const cat = categorizeTag(trigger.name, entryType);
          if (cat) categories[cat].add(normalizeTag(trigger.name));
        });
      });
      
      // Extrahera symptomtyp
      if (entry.analysis?.symptomData?.type) {
        categories.symptoms.add(normalizeTag(entry.analysis.symptomData.type));
      }
      
      // Mediciner - spara hela texten som tagg om MEDICATION
      if (entryType === 'MEDICATION') {
        // Extrahera medicinnamn från texten (första ordet oftast)
        const medMatch = entry.text.match(/^(\w+)/i);
        if (medMatch) {
          categories.medications.add(normalizeTag(medMatch[1]));
        }
      }
      
      // Träning
      if (entryType === 'EXERCISE') {
        const exerciseTypes = ['promenad', 'löpning', 'cykling', 'gym', 'yoga', 'cardio', 'styrka'];
        exerciseTypes.forEach(type => {
          if (entry.text.toLowerCase().includes(type)) {
            categories.exercise.add(type);
          }
        });
        // Fallback
        if (categories.exercise.size === 0) {
          categories.exercise.add('träning');
        }
      }
      
      // Kända triggers från tags
      (entry.analysis?.tags || []).forEach(tag => {
        const cat = categorizeTag(tag, entryType);
        if (cat) categories[cat].add(normalizeTag(tag));
      });
    });
    
    return {
      triggers: Array.from(categories.triggers).sort(),
      symptoms: Array.from(categories.symptoms).sort(),
      medications: Array.from(categories.medications).sort(),
      exercise: Array.from(categories.exercise).sort()
    };
  }, [entries]);

  // Filtrera entries på vald tagg - förbättrad matchning
  const filteredEntries = useMemo(() => {
    if (!selectedTag) return [];
    const normalizedSelected = normalizeTag(selectedTag);
    
    return entries.filter(entry => {
      // Matcha triggers i ingredienser
      const triggerMatch = entry.analysis?.ingredients?.some(ing =>
        ing.triggers?.some(t => normalizeTag(t.name) === normalizedSelected)
      );
      if (triggerMatch) return true;
      
      // Matcha symptomtyp
      if (entry.analysis?.symptomData?.type && 
          normalizeTag(entry.analysis.symptomData.type) === normalizedSelected) {
        return true;
      }
      
      // Matcha tags
      if ((entry.analysis?.tags || []).some(t => normalizeTag(t) === normalizedSelected)) {
        return true;
      }
      
      // Matcha medicin i text
      if (entry.analysis?.type === 'MEDICATION' && 
          entry.text.toLowerCase().includes(normalizedSelected)) {
        return true;
      }
      
      // Matcha träning i text
      if (entry.analysis?.type === 'EXERCISE' && 
          entry.text.toLowerCase().includes(normalizedSelected)) {
        return true;
      }
      
      return false;
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

  // Visa taggar baserat på kategori och sökfråga
  const visibleTags = useMemo(() => {
    const q = query.toLowerCase();
    const filter = (tags: string[]) => 
      tags.filter(tag => !q || tag.includes(q));
    
    if (selectedCategory === 'all') {
      return {
        triggers: filter(categorizedTags.triggers),
        symptoms: filter(categorizedTags.symptoms),
        medications: filter(categorizedTags.medications),
        exercise: filter(categorizedTags.exercise)
      };
    }
    
    return {
      triggers: selectedCategory === 'triggers' ? filter(categorizedTags.triggers) : [],
      symptoms: selectedCategory === 'symptoms' ? filter(categorizedTags.symptoms) : [],
      medications: selectedCategory === 'medications' ? filter(categorizedTags.medications) : [],
      exercise: selectedCategory === 'exercise' ? filter(categorizedTags.exercise) : []
    };
  }, [categorizedTags, selectedCategory, query]);

  const categoryLabels: Record<FilterCategory, { label: string; color: string }> = {
    triggers: { label: '⚠️ Triggers', color: 'text-red-400' },
    symptoms: { label: '🩺 Symptom', color: 'text-orange-400' },
    medications: { label: '💊 Mediciner', color: 'text-blue-400' },
    exercise: { label: '🏃 Träning', color: 'text-green-400' }
  };

  const renderTagGroup = (category: FilterCategory, tags: string[]) => {
    if (tags.length === 0) return null;
    const { label, color } = categoryLabels[category];
    
    return (
      <div key={category} className="space-y-2">
        <div className={`text-xs font-medium ${color}`}>{label}</div>
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 15).map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
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
    );
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-100">Symtomkalender</h2>
          <p className="text-sm text-gray-400">Filtrera på triggers, symptom eller mediciner</p>
        </div>
        
        {/* Kategori-flikar */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-gray-700 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-750'
            }`}
          >
            Alla
          </button>
          {(Object.keys(categoryLabels) as FilterCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-750'
              }`}
            >
              {categoryLabels[cat].label}
            </button>
          ))}
        </div>

        {/* Sökfält */}
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Sök..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gray-600"
        />
        
        {/* Tagg-grupper */}
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {renderTagGroup('triggers', visibleTags.triggers)}
          {renderTagGroup('symptoms', visibleTags.symptoms)}
          {renderTagGroup('medications', visibleTags.medications)}
          {renderTagGroup('exercise', visibleTags.exercise)}
          
          {visibleTags.triggers.length === 0 && 
           visibleTags.symptoms.length === 0 && 
           visibleTags.medications.length === 0 && 
           visibleTags.exercise.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              Inga relevanta taggar hittades. Logga fler inlägg!
            </p>
          )}
        </div>
        
        {selectedTag && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Visar:</span>
            <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
              {selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1)}
            </span>
            <button 
              onClick={() => setSelectedTag('')}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              Rensa
            </button>
          </div>
        )}
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

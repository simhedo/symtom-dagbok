'use client';

import { useState, useEffect } from 'react';
import { X, Clock, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { EntryType } from '@/types';

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: EntryType;
  onSave: (text: string, type: EntryType, timestamp: Date) => void;
  selectedDate?: Date;
}

const modalConfig: Record<EntryType, { title: string; placeholder: string; suggestions: string[] }> = {
  FOOD: {
    title: 'Mat',
    placeholder: 'Vad åt du?',
    suggestions: ['Frukost', 'Lunch', 'Middag', 'Fika', 'Kaffe']
  },
  SYMPTOM: {
    title: 'Symptom',
    placeholder: 'Beskriv hur du mår',
    suggestions: ['Uppblåst', 'Magont', 'Illamående', 'Diarré', 'Förstoppning', 'Trött']
  },
  EXERCISE: {
    title: 'Aktivitet',
    placeholder: 'Vad gjorde du?',
    suggestions: ['Promenad', 'Träning', 'Yoga', 'Löpning']
  },
  MOOD: {
    title: 'Mående',
    placeholder: 'Hur mår du?',
    suggestions: ['Bra', 'Okej', 'Stressad', 'Trött', 'Energisk', 'Glad', 'Ledsen', 'Orolig', 'Lugn', 'Irriterad']
  },
  MEDICATION: {
    title: 'Medicin',
    placeholder: 'Vilken medicin?',
    suggestions: []
  }
};

// Bristol-skala (1-7) - visas endast vid toalettrelaterade symptom
const bristolLabels = ['Hård', '', 'Normal', '', 'Lös', '', 'Vattnig'];

// Formatera tid som HH:MM
function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// Extrahera tid från text (HH:MM, HH.MM, H.MM, osv)
function extractTimeFromText(text: string): string | null {
  // Matchar format: HH:MM, HH.MM, H:MM, H.MM, osv
  const timeMatch = text.match(/(\d{1,2})[:.]\s?(\d{2})/);
  if (timeMatch) {
    const hours = String(parseInt(timeMatch[1])).padStart(2, '0');
    const minutes = timeMatch[2];
    return `${hours}:${minutes}`;
  }
  return null;
}

// Kolla om texten nämner "igår"
function containsYesterday(text: string): boolean {
  return text.toLowerCase().includes('igår') || text.toLowerCase().includes('i går');
}

// Hämta custom moods från localStorage
function getCustomMoods(): string[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('custom_moods');
  return saved ? JSON.parse(saved) : [];
}

function saveCustomMood(mood: string) {
  const existing = getCustomMoods();
  if (!existing.includes(mood)) {
    localStorage.setItem('custom_moods', JSON.stringify([...existing, mood]));
  }
}

export default function EntryModal({ isOpen, onClose, type, onSave, selectedDate }: EntryModalProps) {
  const [text, setText] = useState('');
  const [intensity, setIntensity] = useState<number | null>(null);
  const [bristol, setBristol] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [customMoods, setCustomMoods] = useState<string[]>([]);
  const [newMood, setNewMood] = useState('');
  const [showAddMood, setShowAddMood] = useState(false);
  
  // Tid - default till nu
  const now = new Date();
  const [time, setTime] = useState(formatTime(now));
  const [hours, setHours] = useState(now.getHours());
  const [minutes, setMinutes] = useState(now.getMinutes());
  
  // Ladda custom moods
  useEffect(() => {
    setCustomMoods(getCustomMoods());
  }, []);
  
  // Synka time state med hours/minutes
  useEffect(() => {
    setTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
  }, [hours, minutes]);

  if (!isOpen) return null;

  const config = modalConfig[type];
  
  const isSymptom = type === 'SYMPTOM';
  const showBristol = isSymptom && 
    (text.toLowerCase().includes('diarré') || 
     text.toLowerCase().includes('förstoppning') ||
     text.toLowerCase().includes('toalett') ||
     text.toLowerCase().includes('avföring') ||
     text.toLowerCase().includes('bajsa') ||
     text.toLowerCase().includes('lös mage') ||
     text.toLowerCase().includes('hård mage') ||
     text.toLowerCase().includes('kissat') === false && text.toLowerCase().includes('wc'));

  // Auto-parse tid från text
  const extractedTime = extractTimeFromText(text);
  const displayTime = extractedTime || time;

  const handleSave = async () => {
    if (!text.trim()) return;
    
    let finalText = text;
    if (intensity) finalText += ` (${intensity}/10)`;
    if (bristol) finalText += ` [Bristol ${bristol}]`;
    
    // Skapa timestamp från vald tid och datum
    const [hours, minutes] = (extractedTime || time).split(':').map(Number);
    let baseDate = selectedDate || new Date();
    
    // Om texten nämner "igår", dra av en dag
    if (containsYesterday(text)) {
      baseDate = new Date(baseDate);
      baseDate.setDate(baseDate.getDate() - 1);
    }
    
    const timestamp = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      hours,
      minutes
    );
    
    setIsSubmitting(true);
    try {
      await onSave(finalText, type, timestamp);
      setText('');
      setIntensity(null);
      setBristol(null);
      setTime(formatTime(new Date())); // Reset till nu
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-gray-900 w-full sm:max-w-md sm:rounded-xl rounded-t-xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <h2 className="font-medium text-gray-100">{config.title}</h2>
            <button
              onClick={() => setShowTimePicker(!showTimePicker)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-gray-200 bg-gray-800 px-2.5 py-1 rounded-lg transition-colors"
            >
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono">{displayTime}</span>
              {extractedTime && (
                <span className="text-xs text-gray-500">(auto)</span>
              )}
            </button>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* 24h Time Picker */}
        {showTimePicker && (
          <div className="px-4 py-3 border-b border-gray-800 bg-gray-850">
            <div className="flex items-center justify-center gap-4">
              {/* Timmar */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setHours(h => h === 23 ? 0 : h + 1)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
                <span className="text-2xl font-mono text-white w-12 text-center">
                  {String(hours).padStart(2, '0')}
                </span>
                <button
                  onClick={() => setHours(h => h === 0 ? 23 : h - 1)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
              
              <span className="text-2xl font-mono text-gray-500">:</span>
              
              {/* Minuter */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setMinutes(m => m === 59 ? 0 : m + 1)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
                <span className="text-2xl font-mono text-white w-12 text-center">
                  {String(minutes).padStart(2, '0')}
                </span>
                <button
                  onClick={() => setMinutes(m => m === 0 ? 59 : m - 1)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
              
              {/* Snabbval */}
              <div className="flex flex-col gap-1 ml-4">
                {[5, 15, 30].map(min => (
                  <button
                    key={min}
                    onClick={() => setMinutes(m => (m + min) % 60)}
                    className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                  >
                    +{min}m
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setShowTimePicker(false)}
              className="w-full mt-3 text-sm text-blue-400 hover:text-blue-300"
            >
              Klar
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Text input */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={config.placeholder}
            autoFocus
            className="w-full h-20 bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:border-gray-600"
          />

          {/* Suggestions - horisontell scroll för MOOD */}
          {type === 'MOOD' && !text && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {[...config.suggestions, ...customMoods].map((s) => (
                  <button
                    key={s}
                    onClick={() => setText(s)}
                    className="flex-shrink-0 px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-gray-200 rounded-full border border-gray-700 transition-colors whitespace-nowrap"
                  >
                    {s}
                  </button>
                ))}
                <button
                  onClick={() => setShowAddMood(true)}
                  className="flex-shrink-0 px-3 py-2 text-sm bg-gray-800/50 hover:bg-gray-700 text-gray-400 rounded-full border border-dashed border-gray-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {/* Lägg till nytt mående */}
              {showAddMood && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMood}
                    onChange={(e) => setNewMood(e.target.value)}
                    placeholder="Nytt mående..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gray-600"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (newMood.trim()) {
                        saveCustomMood(newMood.trim());
                        setCustomMoods([...customMoods, newMood.trim()]);
                        setText(newMood.trim());
                        setNewMood('');
                        setShowAddMood(false);
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
                  >
                    Lägg till
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Suggestions - vanlig wrap för andra typer */}
          {type !== 'MOOD' && config.suggestions.length > 0 && !text && (
            <div className="flex flex-wrap gap-2">
              {config.suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setText(s)}
                  className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-750 text-gray-300 rounded-full border border-gray-700 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Intensity slider - bara för symptom */}
          {isSymptom && text && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Intensitet</span>
                <span>{intensity || '–'}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={intensity || 5}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Milt</span>
                <span>Svårt</span>
              </div>
            </div>
          )}

          {/* Bristol scale - diskret, bara vid behov */}
          {showBristol && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Konsistens</span>
                <span>{bristol ? `${bristol} - ${bristolLabels[bristol - 1] || ''}` : '–'}</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <button
                    key={n}
                    onClick={() => setBristol(bristol === n ? null : n)}
                    className={`flex-1 h-8 rounded text-sm transition-colors ${
                      bristol === n
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-750'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleSave}
            disabled={!text.trim() || isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {isSubmitting ? 'Sparar...' : 'Spara'}
          </button>
        </div>
      </div>
    </div>
  );
}

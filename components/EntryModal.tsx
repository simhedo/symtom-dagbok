'use client';

import { useState } from 'react';
import { X, Clock } from 'lucide-react';
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
    suggestions: ['Bra', 'Okej', 'Stressad', 'Trött', 'Energisk']
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

export default function EntryModal({ isOpen, onClose, type, onSave, selectedDate }: EntryModalProps) {
  const [text, setText] = useState('');
  const [intensity, setIntensity] = useState<number | null>(null);
  const [bristol, setBristol] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Tid - default till nu
  const now = new Date();
  const [time, setTime] = useState(formatTime(now));

  if (!isOpen) return null;

  const config = modalConfig[type];
  
  const isSymptom = type === 'SYMPTOM';
  const showBristol = isSymptom && 
    (text.toLowerCase().includes('diarré') || 
     text.toLowerCase().includes('förstoppning') ||
     text.toLowerCase().includes('toalett') ||
     text.toLowerCase().includes('avföring'));

  const handleSave = async () => {
    if (!text.trim()) return;
    
    let finalText = text;
    if (intensity) finalText += ` (${intensity}/10)`;
    if (bristol) finalText += ` [Bristol ${bristol}]`;
    
    // Skapa timestamp från vald tid och datum
    const [hours, minutes] = time.split(':').map(Number);
    const baseDate = selectedDate || new Date();
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
            <div className="flex items-center gap-1.5 text-gray-400">
              <Clock className="w-4 h-4" />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-transparent border-none text-sm text-gray-300 focus:outline-none focus:text-white cursor-pointer"
              />
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

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

          {/* Suggestions */}
          {config.suggestions.length > 0 && !text && (
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

'use client';

import { UtensilsCrossed, Activity, Brain, HeartPulse, Pill } from 'lucide-react';
import { EntryType } from '@/types';

interface ActionBarProps {
  onAction: (type: EntryType) => void;
}

export default function ActionBar({ onAction }: ActionBarProps) {
  const actions = [
    { 
      type: 'FOOD' as EntryType, 
      icon: UtensilsCrossed, 
      label: 'Mat', 
      emoji: '🍽️',
      color: 'bg-green-600 hover:bg-green-700 active:bg-green-800' 
    },
    { 
      type: 'SYMPTOM' as EntryType, 
      icon: HeartPulse, 
      label: 'Symptom', 
      emoji: '🤢',
      color: 'bg-red-600 hover:bg-red-700 active:bg-red-800' 
    },
    { 
      type: 'MEDICATION' as EntryType, 
      icon: Pill, 
      label: 'Medicin', 
      emoji: '💊',
      color: 'bg-pink-600 hover:bg-pink-700 active:bg-pink-800' 
    },
    { 
      type: 'EXERCISE' as EntryType, 
      icon: Activity, 
      label: 'Aktivitet', 
      emoji: '💪',
      color: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800' 
    },
    { 
      type: 'MOOD' as EntryType, 
      icon: Brain, 
      label: 'Mående', 
      emoji: '🧠',
      color: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800' 
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 p-3 pb-safe z-40">
      <div className="grid grid-cols-5 gap-2 max-w-3xl mx-auto">
        {actions.map(({ type, emoji, label, color }) => (
          <button
            key={type}
            onClick={() => onAction(type)}
            className={`${color} rounded-xl p-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg`}
          >
            <span className="text-xl sm:text-2xl">{emoji}</span>
            <span className="text-[10px] sm:text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

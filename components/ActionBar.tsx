'use client';

import { UtensilsCrossed, Activity, Brain, AlertCircle, Pill, Dumbbell } from 'lucide-react';
import { EntryType } from '@/types';

// Toalett-ikon (finns ej i Lucide, så vi använder emoji som fallback)
const ToiletIcon = () => (
  <span className="text-lg leading-none">🚽</span>
);

interface ActionBarProps {
  onAction: (type: EntryType) => void;
}

export default function ActionBar({ onAction }: ActionBarProps) {
  const actions = [
    { type: 'FOOD' as EntryType, icon: UtensilsCrossed, label: 'Mat', isEmoji: false },
    { type: 'SYMPTOM' as EntryType, icon: AlertCircle, label: 'Symptom', isEmoji: false },
    { type: 'BATHROOM' as EntryType, icon: ToiletIcon, label: 'Toa', isEmoji: true },
    { type: 'MEDICATION' as EntryType, icon: Pill, label: 'Medicin', isEmoji: false },
    { type: 'EXERCISE' as EntryType, icon: Dumbbell, label: 'Träning', isEmoji: false },
    { type: 'MOOD' as EntryType, icon: Brain, label: 'Mående', isEmoji: false },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 p-3 pb-safe z-40">
      <div className="grid grid-cols-6 gap-1.5 max-w-lg mx-auto">
        {actions.map(({ type, icon: Icon, label, isEmoji }) => (
          <button
            key={type}
            onClick={() => onAction(type)}
            className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border border-gray-700"
          >
            {isEmoji ? <Icon /> : <Icon className="w-5 h-5 text-gray-300" />}
            <span className="text-[10px] text-gray-400">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

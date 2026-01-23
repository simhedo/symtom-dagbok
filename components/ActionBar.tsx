'use client';

import { UtensilsCrossed, Activity, Brain, AlertCircle, Pill } from 'lucide-react';
import { EntryType } from '@/types';

interface ActionBarProps {
  onAction: (type: EntryType) => void;
}

export default function ActionBar({ onAction }: ActionBarProps) {
  const actions = [
    { type: 'FOOD' as EntryType, icon: UtensilsCrossed, label: 'Mat' },
    { type: 'SYMPTOM' as EntryType, icon: AlertCircle, label: 'Symptom' },
    { type: 'MEDICATION' as EntryType, icon: Pill, label: 'Medicin' },
    { type: 'MOOD' as EntryType, icon: Brain, label: 'Mående' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 p-3 pb-safe z-40">
      <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
        {actions.map(({ type, icon: Icon, label }) => (
          <button
            key={type}
            onClick={() => onAction(type)}
            className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 border border-gray-700"
          >
            <Icon className="w-5 h-5 text-gray-300" />
            <span className="text-xs text-gray-400">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

'use client';

import { UtensilsCrossed, Activity, Brain, Timer } from 'lucide-react';
import { EntryType } from '@/types';

interface ActionBarProps {
  onAction: (type: EntryType) => void;
}

export default function ActionBar({ onAction }: ActionBarProps) {
  const actions = [
    { type: 'FOOD' as EntryType, icon: UtensilsCrossed, label: 'Mat', color: 'bg-green-600 hover:bg-green-700' },
    { type: 'SYMPTOM' as EntryType, icon: Timer, label: 'Symtom', color: 'bg-red-600 hover:bg-red-700' },
    { type: 'EXERCISE' as EntryType, icon: Activity, label: 'Träning', color: 'bg-blue-600 hover:bg-blue-700' },
    { type: 'MOOD' as EntryType, icon: Brain, label: 'Mående', color: 'bg-purple-600 hover:bg-purple-700' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 pb-safe">
      <div className="grid grid-cols-4 gap-3 max-w-2xl mx-auto">
        {actions.map(({ type, icon: Icon, label, color }) => (
          <button
            key={type}
            onClick={() => onAction(type)}
            className={`${color} rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors active:scale-95`}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { EntryType } from '@/types';

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: EntryType;
  onSave: (text: string, type: EntryType) => void;
}

const modalTitles = {
  FOOD: '🍽️ Registrera Mat',
  SYMPTOM: '🤢 Registrera Symtom',
  EXERCISE: '💪 Registrera Träning',
  MOOD: '🧠 Registrera Mående',
};

const placeholders = {
  FOOD: 'Åt lasagne till lunch...',
  SYMPTOM: 'Känner mig svullen, ont i magen...',
  EXERCISE: '30 min löpning...',
  MOOD: 'Känner mig stressad...',
};

export default function EntryModal({ isOpen, onClose, type, onSave }: EntryModalProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!text.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSave(text, type);
      setText('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-gray-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl border border-gray-800 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold">{modalTitles[type]}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholders[type]}
            className="w-full h-40 bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleSave}
            disabled={!text.trim() || isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-4 rounded-xl transition-colors text-lg"
          >
            {isSubmitting ? 'Analyserar...' : 'Spara'}
          </button>
        </div>
      </div>
    </div>
  );
}

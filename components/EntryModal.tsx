'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { EntryType } from '@/types';
import { getEntries } from '@/lib/storage';

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: EntryType;
  onSave: (text: string, type: EntryType) => void;
}

const modalConfig = {
  FOOD: {
    title: '🍽️ Mat & Dryck',
    placeholder: 'Vad åt/drack du?',
    quickOptions: [
      'Frukost ✅',
      'Lunch ✅', 
      'Middag ✅',
      'Mellanmål',
      'Kaffe ☕',
      'Vatten 💧'
    ],
    detailPrompts: [
      'Känner du igen några triggers? (laktos, gluten, socker...)',
      'Hur mätt blev du? (1-10)',
      'Åt du stressad/snabbt?'
    ]
  },
  SYMPTOM: {
    title: '🤢 Symptom',
    placeholder: 'Hur känner du dig?',
    quickOptions: [
      'Uppblåst 😮‍💨',
      'Ont i magen 😣',
      'Gas 💨',
      'Illamående 🤢',
      'Trött 😴',
      'Huvudvärk 🤕'
    ],
    detailPrompts: [
      'Hur intensivt? (1-10)',
      'Var sitter det? (övre/nedre magen)',
      'Började nyss eller för länge sen?'
    ]
  },
  MEDICATION: {
    title: '💊 Medicin',
    placeholder: 'Vilken medicin tog du?',
    quickOptions: [], // Fylls med tidigare mediciner
    detailPrompts: [
      'Dos? (ex: 20mg, 1 tablett)',
      'Varför tar du den? (symptom/förebyggande)',
      'Var det receptbelagt eller receptfritt?'
    ]
  },
  EXERCISE: {
    title: '💪 Aktivitet',
    placeholder: 'Vad gjorde du?',
    quickOptions: [
      'Promenad 🚶',
      'Löpning 🏃',
      'Gym 🏋️',
      'Yoga 🧘',
      'Cykling 🚴',
      'Simning 🏊'
    ],
    detailPrompts: [
      'Hur länge?',
      'Hur intensivt? (lätt/medel/hårt)'
    ]
  },
  MOOD: {
    title: '🧠 Allmänt Mående',
    placeholder: 'Hur mår du idag?',
    quickOptions: [
      'Bra! 😊',
      'Okej 😐',
      'Lite dåligt 😔',
      'Stressad 😰',
      'Energilös 😮‍💨',
      'Arg/Frustrerad 😠'
    ],
    detailPrompts: [
      'Stresskänsla? (1-10)',
      'Sömnkvalitet? (bra/dålig)',
  const [previousMedications, setPreviousMedications] = useState<string[]>([]);

  // Load previous medications when modal opens for MEDICATION type
  useEffect(() => {
    if (isOpen && type === 'MEDICATION') {
      loadPreviousMedications();
    }
  }, [isOpen, type]);

  const loadPreviousMedications = async () => {
    const entries = await getEntries();
    const medEntries = entries.filter(e => e.analysis?.type === 'MEDICATION');
    const meds = medEntries.map(e => e.text.trim());
    const uniqueMeds = [...new Set(meds)].slice(0, 8); // Top 8 most recent unique
    setPreviousMedications(uniqueMeds);
  };

  if (!isOpen) return null;

  const config = modalConfig[type];
  const quickOptions = type === 'MEDICATION' && previousMedications.length > 0 
    ? previousMedications 
    : config.quickOptions

export default function EntryModal({ isOpen, onClose, type, onSave }: EntryModalProps) {
  const [text, setText] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [showAiHint, setShowAiHint] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const config = modalConfig[type];

  const handleQuickSelect = (option: string) => {
    setText(option);
  };

  const handleSave = async () => {
    if (!text.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSave(text, type);
      setText('');
      setShowDetails(false);
      setShowAiHint(true);
    } finally {
      setIsSubmitting(false);
    }
  };{quickOptions.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">
                {type === 'MEDICATION' && previousMedications.length > 0 
                  ? 'Tidigare mediciner:' 
                  : 'Snabbval:'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {quickOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleQuickSelect(option)}
                    className={`p-3 rounded-lg border transition-colors text-left ${
                      text === option
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-800 border-gray-700 hover:border-gray-600 text-gray-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}ssName="flex-1 p-4 overflow-y-auto space-y-4">
          {/* Quick Options */}
          <div>
            <p className="text-sm text-gray-400 mb-2">Snabbval:</p>
            <div className="grid grid-cols-2 gap-2">
              {config.quickOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleQuickSelect(option)}
                  className={`p-3 rounded-lg border transition-colors text-left ${
                    text === option
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600 text-gray-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Text */}
          <div>
            <p className="text-sm text-gray-400 mb-2">Eller skriv fritt:</p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={configtype !== 'MEDICATION' && .placeholder}
              className="w-full h-24 bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* AI Hint */}
          {showAiHint && text && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex gap-2">
              <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-400 font-medium mb-1">AI kommer analysera</p>
                <p className="text-gray-400 text-xs">
                  {type === 'FOOD' && 'Hittar ingredienser, triggers och beräknar näring automatiskt'}
                  {type === 'SYMPTOM' && 'Kopplar ihop med mat, söker mönster och trender'}
                  {type === 'EXERCISE' && 'Spårar aktivitetsnivå och korrelerar med mående'}
                  {type === 'MOOD' && 'Analyserar sammanhang med mat, sömn och stress'}
                </p>
              </div>
            </div>
          )}

          {/* Optional Details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>Lägg till detaljer (valfritt)</span>
          </button>

          {showDetails && (
            <div className="space-y-3 pl-6 border-l-2 border-gray-700">
              {config.detailPrompts.map((prompt, idx) => (
                <div key={idx}>
                  <label className="text-xs text-gray-500 mb-1 block">{prompt}</label>
                  <input
                    type="text"
                    placeholder="..."
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <button
            onClick={handleSave}
            disabled={!text.trim() || isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-xl transition-colors"
          >
            {isSubmitting ? 'Sparar & analyserar...' : 'Spara'}
          </button>
          
          {text && (
            <p className="text-xs text-center text-gray-500">
              AI-analys körs i bakgrunden - inget steg behövs! ✨
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

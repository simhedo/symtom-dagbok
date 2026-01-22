'use client';

import { Entry } from '@/types';

interface CompactEntryCardProps {
  entry: Entry;
  onEdit: (entry: Entry) => void;
}

export default function CompactEntryCard({ entry, onEdit }: CompactEntryCardProps) {
  const type = entry.analysis?.type || 'FOOD';
  const time = new Date(entry.createdAt).toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const getIcon = () => {
    switch (type) {
      case 'FOOD': return '🍽️';
      case 'SYMPTOM': return '🤢';
      case 'EXERCISE': return '💪';
      case 'MOOD': return '🧠';
      default: return '📝';
    }
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 8) return 'bg-red-500';
    if (intensity >= 5) return 'bg-orange-500';
    return 'bg-yellow-500';
  };

  const getTriggerCount = () => {
    if (type === 'FOOD' && entry.analysis?.ingredients) {
      const triggers = entry.analysis.ingredients.flatMap(ing => ing.triggers || []);
      return triggers.length;
    }
    return 0;
  };

  const getSummary = () => {
    if (type === 'SYMPTOM' && entry.analysis?.symptomData) {
      return entry.analysis.symptomData.type || 'Symtom';
    }
    // Take first 30 chars of text
    return entry.text.length > 30 ? entry.text.substring(0, 30) + '...' : entry.text;
  };

  const triggerCount = getTriggerCount();

  return (
    <button
      onClick={() => onEdit(entry)}
      className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 mb-2 hover:bg-gray-850 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        {/* Time */}
        <div className="text-xs text-gray-500 w-12 flex-shrink-0">
          {time}
        </div>

        {/* Icon */}
        <div className="text-xl flex-shrink-0">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-200 truncate">
            {getSummary()}
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Symptom intensity */}
          {type === 'SYMPTOM' && entry.analysis?.symptomData?.intensity && (
            <div className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${getIntensityColor(entry.analysis.symptomData.intensity)}`}>
              {entry.analysis.symptomData.intensity}/10
            </div>
          )}

          {/* Trigger count */}
          {type === 'FOOD' && triggerCount > 0 && (
            <div className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-300 border border-red-800">
              ⚠️ {triggerCount}
            </div>
          )}

          {/* Tags count */}
          {(type === 'EXERCISE' || type === 'MOOD') && entry.analysis?.tags && entry.analysis.tags.length > 0 && (
            <div className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-800">
              {entry.analysis.tags.length}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

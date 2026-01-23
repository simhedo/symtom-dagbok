'use client';

import { useState } from 'react';
import { Entry } from '@/types';
import { UtensilsCrossed, Activity, Brain, AlertCircle, Pill, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface TimelineViewProps {
  entries: Entry[];
  onEdit?: (entry: Entry) => void;
}

const iconMap = {
  FOOD: UtensilsCrossed,
  SYMPTOM: AlertCircle,
  EXERCISE: Activity,
  MOOD: Brain,
  MEDICATION: Pill,
};

const colorMap = {
  FOOD: 'bg-gray-600',
  SYMPTOM: 'bg-gray-600',
  EXERCISE: 'bg-gray-600',
  MOOD: 'bg-gray-600',
  MEDICATION: 'bg-gray-600',
};

const bgColorMap = {
  FOOD: 'bg-gray-800/50 border-gray-700',
  SYMPTOM: 'bg-gray-800/50 border-gray-700',
  EXERCISE: 'bg-gray-800/50 border-gray-700',
  MOOD: 'bg-gray-800/50 border-gray-700',
  MEDICATION: 'bg-gray-800/50 border-gray-700',
};

function formatTimeDiff(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} tim`;
  }
  return `${hours} tim ${mins} min`;
}

function getTimeDiffMinutes(date1: Date, date2: Date): number {
  return Math.round(Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60));
}

// Hitta mat som kan ha orsakat ett symptom (2-8 timmar innan)
function findPossibleCauses(symptomEntry: Entry, allEntries: Entry[]): Entry[] {
  const symptomTime = new Date(symptomEntry.createdAt);
  const minTime = new Date(symptomTime.getTime() - 8 * 60 * 60 * 1000); // 8 timmar innan
  const maxTime = new Date(symptomTime.getTime() - 30 * 60 * 1000); // 30 min innan
  
  return allEntries.filter(entry => {
    if (entry.analysis?.type !== 'FOOD') return false;
    const entryTime = new Date(entry.createdAt);
    return entryTime >= minTime && entryTime <= maxTime;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export default function TimelineView({ entries, onEdit }: TimelineViewProps) {
  const [expandedCauses, setExpandedCauses] = useState<string | null>(null);
  
  // Sortera entries efter tid (nyast först)
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (sortedEntries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-lg mb-2">Ingen tidslinje än</p>
        <p className="text-sm">Logga mat och symptom för att se mönster</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Tidslinje-linje */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-800" />
      
      <div className="space-y-0">
        {sortedEntries.map((entry, index) => {
          const type = entry.analysis?.type || 'FOOD';
          const Icon = iconMap[type];
          const timeDiff = index < sortedEntries.length - 1
            ? getTimeDiffMinutes(
                new Date(entry.createdAt),
                new Date(sortedEntries[index + 1].createdAt)
              )
            : null;
          
          const isSymptom = type === 'SYMPTOM';
          const possibleCauses = isSymptom ? findPossibleCauses(entry, sortedEntries) : [];
          const intensity = entry.analysis?.symptomData?.intensity;
          const isExpanded = expandedCauses === entry.id;

          return (
            <div key={entry.id}>
              {/* Entry */}
              <div className="relative flex items-start gap-4 pb-2">
                {/* Tidspunkt-ikon */}
                <div className={`relative z-10 w-12 h-12 rounded-full ${colorMap[type]} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                {/* Innehåll */}
                <div 
                  className={`flex-1 p-4 rounded-xl border ${bgColorMap[type]} cursor-pointer transition-all hover:scale-[1.01]`}
                  onClick={() => onEdit?.(entry)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-400">
                          {new Date(entry.createdAt).toLocaleTimeString('sv-SE', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        {intensity && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            intensity >= 7 ? 'bg-red-600 text-red-100' :
                            intensity >= 4 ? 'bg-orange-600 text-orange-100' :
                            'bg-yellow-600 text-yellow-100'
                          }`}>
                            {intensity}/10
                          </span>
                        )}
                      </div>
                      <p className="text-white">{entry.text}</p>
                      
                      {/* Visa ingredienser/triggers */}
                      {entry.analysis?.ingredients && entry.analysis.ingredients.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entry.analysis.ingredients.slice(0, 3).map((ing, i) => (
                            <span key={i} className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-300">
                              {ing.name}
                            </span>
                          ))}
                          {entry.analysis.ingredients.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{entry.analysis.ingredients.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* "Vad orsakade detta?" knapp för symptom */}
                  {isSymptom && possibleCauses.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedCauses(isExpanded ? null : entry.id);
                      }}
                      className="mt-3 flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      <span>Visa möjliga orsaker</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
              
              {/* Expanderad vy med möjliga orsaker */}
              {isExpanded && possibleCauses.length > 0 && (
                <div className="ml-16 mb-4 p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                  <p className="text-sm text-gray-400 mb-3">
                    Mat 30 min - 8 tim innan:
                  </p>
                  <div className="space-y-2">
                    {possibleCauses.map((cause) => {
                      const timeBefore = getTimeDiffMinutes(
                        new Date(cause.createdAt),
                        new Date(entry.createdAt)
                      );
                      return (
                        <div 
                          key={cause.id}
                          className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg"
                        >
                          <span className="text-sm text-gray-200">{cause.text}</span>
                          <span className="text-xs text-gray-500">
                            {formatTimeDiff(timeBefore)} innan
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Tidsavstånd till nästa entry */}
              {timeDiff !== null && timeDiff > 0 && (
                <div className="relative flex items-center gap-4 py-2">
                  <div className="w-12 flex justify-center">
                    <div className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800">
                      ↓ {formatTimeDiff(timeDiff)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { Entry } from '@/types';
import { UtensilsCrossed, Activity, Brain, AlertCircle, Edit2, Trash2, Pill } from 'lucide-react';

interface EntryCardProps {
  entry: Entry;
  onEdit?: (entry: Entry) => void;
  onDelete?: (id: string) => void;
}

const iconMap: Record<string, typeof UtensilsCrossed> = {
  FOOD: UtensilsCrossed,
  SYMPTOM: AlertCircle,
  EXERCISE: Activity,
  MOOD: Brain,
  MEDICATION: Pill,
};

export default function EntryCard({ entry, onEdit, onDelete }: EntryCardProps) {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const type = entry.analysis?.type || 'FOOD';
  const Icon = iconMap[type] || AlertCircle;
  
  const minSwipeDistance = 50;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setShowActions(false);
        setSwipeDistance(0);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    const distance = touchStart - e.targetTouches[0].clientX;
    if (distance > 0 && distance < 150) {
      setSwipeDistance(distance);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    
    if (isLeftSwipe) {
      setShowActions(true);
      setSwipeDistance(120);
    } else {
      setShowActions(false);
      setSwipeDistance(0);
    }
  };

  return (
    <div className="relative overflow-hidden mb-3" ref={cardRef}>
      {/* Action buttons (revealed on swipe) */}
      <div className="absolute right-0 top-0 bottom-0 flex gap-2 items-center pr-3">
        {onEdit && (
          <button
            onClick={() => onEdit(entry)}
            className="bg-blue-600 hover:bg-blue-700 p-3 rounded-lg transition-colors"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(entry.id)}
            className="bg-red-600 hover:bg-red-700 p-3 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main card */}
      <div
        className="bg-gray-900 rounded-lg p-4 border border-gray-800 transition-transform"
        style={{ 
          transform: `translateX(-${swipeDistance}px)`,
          transition: touchEnd ? 'transform 0.3s ease-out' : 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-start gap-3">
          <div className="bg-gray-800 p-2 rounded-lg">
            <Icon className="w-5 h-5 text-blue-400" />
          </div>
          
          <div className="flex-1">
            <div className="flex justify-end items-start mb-2">
              {/* Desktop edit button */}
              {onEdit && (
                <button
                  onClick={() => onEdit(entry)}
                  className="hidden sm:block p-1 hover:bg-gray-800 rounded transition-colors text-gray-500 hover:text-gray-300"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <p className="text-sm text-gray-200 mb-3">{entry.text}</p>
            
            {/* Tags */}
            {entry.analysis && (
              <div className="space-y-2">
                {/* Ingredients with triggers */}
                {entry.analysis.ingredients && entry.analysis.ingredients.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {entry.analysis.ingredients.map((ing, idx) => (
                      <div key={idx} className="flex flex-wrap gap-1">
                        <span className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-full">
                          {ing.name}
                        </span>
                        {ing.triggers.map((trigger, tidx) => (
                          <span 
                            key={tidx} 
                            className="px-2 py-1 bg-red-900/30 text-red-300 text-xs rounded-full border border-red-800"
                          >
                            {trigger.name}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Symptom data */}
                {entry.analysis.symptomData && (
                  <div className="flex gap-2 items-center">
                    <span className="px-2 py-1 bg-orange-900/30 text-orange-300 text-xs rounded-full border border-orange-800">
                      {entry.analysis.symptomData.type}
                    </span>
                    <span className="px-2 py-1 bg-yellow-900/30 text-yellow-300 text-xs rounded-full border border-yellow-800">
                      Intensitet: {entry.analysis.symptomData.intensity}/10
                    </span>
                  </div>
                )}
                
                {/* General tags */}
                {entry.analysis.tags && entry.analysis.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {entry.analysis.tags.map((tag, idx) => (
                      <span 
                        key={idx} 
                        className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded-full border border-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* AI Summary */}
                {entry.analysis.summary && (
                  <p className="text-xs text-gray-400 italic mt-2">
                    💡 {entry.analysis.summary}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

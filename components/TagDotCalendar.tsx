'use client';

import { useMemo } from 'react';
import { Entry } from '@/types';

interface TagDotCalendarProps {
  entries: Entry[];
  selectedTags: string[];
  onSelectDate?: (date: Date) => void;
  days?: number;
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

function getEntryTags(entry: Entry): string[] {
  const tags = new Set<string>();

  entry.analysis?.tags?.forEach((tag) => {
    tags.add(normalizeTag(tag));
  });

  entry.analysis?.ingredients?.forEach((ingredient) => {
    if (ingredient.name) {
      tags.add(normalizeTag(ingredient.name));
    }
    ingredient.triggers?.forEach((trigger) => {
      if (trigger.name) {
        tags.add(normalizeTag(trigger.name));
      }
    });
  });

  return Array.from(tags);
}

export default function TagDotCalendar({ entries, selectedTags, onSelectDate, days = 120 }: TagDotCalendarProps) {
  const normalizedSelected = useMemo(
    () => selectedTags.map(normalizeTag),
    [selectedTags]
  );

  const groupedMonths = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const totalDays = Math.max(30, days);

    const dates = Array.from({ length: totalDays }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() - (totalDays - 1 - i));
      return date;
    });

    const monthMap = new Map<string, { label: string; days: Date[] }>();
    dates.forEach((date) => {
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!monthMap.has(key)) {
        monthMap.set(key, {
          label: date.toLocaleDateString('sv-SE', { month: 'short', year: 'numeric' }),
          days: [],
        });
      }
      monthMap.get(key)?.days.push(date);
    });

    return Array.from(monthMap.values());
  }, [days]);

  const hasTagMatch = (date: Date): boolean => {
    const dayEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.createdAt);
      return entryDate.toDateString() === date.toDateString();
    });

    if (dayEntries.length === 0) return false;

    if (normalizedSelected.length === 0) return true;

    return dayEntries.some((entry) => {
      const entryTags = getEntryTags(entry);
      return normalizedSelected.some((tag) => entryTags.includes(tag));
    });
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-200">Förekomst över tid</h3>
        <span className="text-xs text-gray-500">Senaste {days} dagar</span>
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-6 min-w-max pb-2">
          {groupedMonths.map((month) => (
            <div key={month.label}>
              <div className="text-xs text-gray-500 mb-2 capitalize">{month.label}</div>
              <div className="flex gap-1">
                {month.days.map((date) => {
                  const match = hasTagMatch(date);
                  const isToday = new Date().toDateString() === date.toDateString();
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => onSelectDate?.(date)}
                      title={date.toLocaleDateString('sv-SE')}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        match ? 'bg-blue-400 hover:bg-blue-300' : 'bg-gray-700 hover:bg-gray-600'
                      } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {normalizedSelected.length === 0 && (
        <div className="mt-3 text-xs text-gray-500">
          Välj en tagg för att se specifik förekomst.
        </div>
      )}
    </div>
  );
}

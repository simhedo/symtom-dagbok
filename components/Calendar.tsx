'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Entry } from '@/types';

interface CalendarProps {
  entries: Entry[];
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
}

export default function Calendar({ entries, onDateSelect, selectedDate }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Swedish month names
  const monthNames = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
  ];

  const weekDays = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

  // Get entries count for each day
  const getEntriesForDate = (day: number) => {
    const date = new Date(year, month, day);
    return entries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      return entryDate.toDateString() === date.toDateString();
    }).length;
  };

  // Get severity level for a day based on symptoms
  const getDaySeverity = (day: number): 'none' | 'low' | 'medium' | 'high' => {
    const date = new Date(year, month, day);
    const dayEntries = entries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      return entryDate.toDateString() === date.toDateString();
    });

    const symptoms = dayEntries.filter(e => e.analysis?.type === 'SYMPTOM');
    if (symptoms.length === 0) return 'none';

    // Find highest intensity
    const maxIntensity = Math.max(
      ...symptoms.map(s => s.analysis?.symptomData?.intensity || 0)
    );

    if (maxIntensity >= 8) return 'high';
    if (maxIntensity >= 5) return 'medium';
    return 'low';
  };

  // Generate calendar days
  const calendarDays = [];
  // Adjust for Monday start (0 = Sunday, 1 = Monday, etc.)
  const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
  
  // Empty cells before month starts
  for (let i = 0; i < adjustedStartDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  // Month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const entriesCount = getEntriesForDate(day);
    const severity = getDaySeverity(day);
    const isToday = new Date().toDateString() === date.toDateString();
    const isSelected = selectedDate?.toDateString() === date.toDateString();
    const hasEntries = entriesCount > 0;

    // Determine background color based on severity
    const getBgColor = () => {
      if (isSelected) return 'bg-blue-600 border-blue-500 text-white';
      
      if (severity === 'high') return 'bg-red-900/50 border-red-800 hover:bg-red-900/60 text-red-100';
      if (severity === 'medium') return 'bg-orange-900/40 border-orange-800 hover:bg-orange-900/50 text-orange-100';
      if (severity === 'low') return 'bg-yellow-900/30 border-yellow-800 hover:bg-yellow-900/40 text-yellow-100';
      
      if (hasEntries) return 'bg-gray-800 border-gray-700 hover:bg-gray-750 text-gray-100';
      return 'bg-gray-900 border-gray-800 hover:bg-gray-850 text-gray-400';
    };

    calendarDays.push(
      <button
        key={day}
        onClick={() => onDateSelect(date)}
        className={`
          aspect-square p-1 rounded-lg border transition-all relative
          ${getBgColor()}
          ${isToday && !isSelected ? 'ring-2 ring-blue-500' : ''}
        `}
      >
        <div className="text-sm font-medium">{day}</div>
        {hasEntries && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {[...Array(Math.min(entriesCount, 3))].map((_, i) => (
              <div
                key={i}
                className={`w-1 h-1 rounded-full ${
                  isSelected ? 'bg-white' : 
                  severity === 'high' ? 'bg-red-300' :
                  severity === 'medium' ? 'bg-orange-300' :
                  severity === 'low' ? 'bg-yellow-300' :
                  'bg-blue-400'
                }`}
              />
            ))}
          </div>
        )}
      </button>
    );
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-lg font-semibold">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={goToToday}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Idag
          </button>
        </div>

        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs text-gray-500 font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-800 flex justify-center flex-wrap gap-3 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full ring-2 ring-blue-500" />
          <span>Idag</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span>Inlägg</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Dålig dag (8-10)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span>Medel (5-7)</span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Entry } from '@/types';

interface InfiniteCalendarProps {
  entries: Entry[];
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
}

const weekDays = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];
const monthNames = [
  'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
  'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
];

function getEntriesForDate(entries: Entry[], date: Date) {
  return entries.filter(entry => {
    const entryDate = new Date(entry.createdAt);
    return entryDate.toDateString() === date.toDateString();
  });
}

function getDaySeverity(entries: Entry[], date: Date): 'none' | 'low' | 'medium' | 'high' {
  const dayEntries = getEntriesForDate(entries, date);
  const symptoms = dayEntries.filter(e => e.analysis?.type === 'SYMPTOM');
  if (symptoms.length === 0) return 'none';

  const maxIntensity = Math.max(
    ...symptoms.map(s => s.analysis?.symptomData?.intensity || 0)
  );

  if (maxIntensity >= 8) return 'high';
  if (maxIntensity >= 5) return 'medium';
  return 'low';
}

export default function InfiniteCalendar({ entries, onDateSelect, selectedDate }: InfiniteCalendarProps) {
  const [monthsBack, setMonthsBack] = useState(18);

  const months = useMemo(() => {
    const today = new Date();
    const list: Array<{ year: number; month: number }> = [];
    for (let i = 0; i < monthsBack; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      list.push({ year: date.getFullYear(), month: date.getMonth() });
    }
    return list;
  }, [monthsBack]);

  return (
    <div
      className="bg-gray-900 rounded-xl border border-gray-800 p-4 max-h-[70vh] overflow-y-auto"
      onScroll={(e) => {
        const target = e.currentTarget;
        if (target.scrollHeight - target.scrollTop - target.clientHeight < 200) {
          setMonthsBack((prev) => prev + 6);
        }
      }}
    >
      <div className="space-y-8">
        {months.map(({ year, month }) => {
          const firstDayOfMonth = new Date(year, month, 1);
          const lastDayOfMonth = new Date(year, month + 1, 0);
          const daysInMonth = lastDayOfMonth.getDate();
          const startingDayOfWeek = firstDayOfMonth.getDay();
          const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

          const calendarCells: React.ReactNode[] = [];

          for (let i = 0; i < adjustedStartDay; i++) {
            calendarCells.push(<div key={`empty-${year}-${month}-${i}`} />);
          }

          for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayEntries = getEntriesForDate(entries, date);
            const hasEntries = dayEntries.length > 0;
            const severity = getDaySeverity(entries, date);
            const isToday = new Date().toDateString() === date.toDateString();
            const isSelected = selectedDate?.toDateString() === date.toDateString();

            calendarCells.push(
              <button
                key={`${year}-${month}-${day}`}
                onClick={() => onDateSelect(date)}
                className={`aspect-square p-1 rounded-lg border transition-all relative text-left ${
                  isSelected ? 'bg-blue-600 text-white border-blue-500' : 'border-gray-800 hover:border-gray-700'
                } ${isToday && !isSelected ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="text-xs font-medium">{day}</div>
                {hasEntries && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {[...Array(Math.min(dayEntries.length, 3))].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 h-1 rounded-full ${
                          isSelected
                            ? 'bg-white'
                            : severity === 'high'
                              ? 'bg-red-300'
                              : severity === 'medium'
                                ? 'bg-orange-300'
                                : 'bg-blue-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          }

          return (
            <div key={`${year}-${month}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">
                  {monthNames[month]} {year}
                </h3>
              </div>
              <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-2">
                {weekDays.map((day) => (
                  <div key={day} className="text-center">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarCells}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

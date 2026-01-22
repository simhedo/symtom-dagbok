'use client';

import { Entry } from '@/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface InsightsProps {
  entries: Entry[];
}

export default function Insights({ entries }: InsightsProps) {
  // Helper: Get date key for grouping
  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Helper: Get week number
  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  };

  // Get last 4 weeks of data
  const getLast4Weeks = () => {
    const now = new Date();
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    
    const weeklyData: { [key: string]: { symptoms: number[], exercises: number } } = {};
    
    entries.forEach(entry => {
      const entryDate = new Date(entry.createdAt);
      if (entryDate >= fourWeeksAgo) {
        const weekKey = getWeekNumber(entryDate);
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { symptoms: [], exercises: 0 };
        }
        
        if (entry.analysis?.type === 'SYMPTOM' && entry.analysis.symptomData?.intensity) {
          weeklyData[weekKey].symptoms.push(entry.analysis.symptomData.intensity);
        }
        
        if (entry.analysis?.type === 'EXERCISE') {
          weeklyData[weekKey].exercises++;
        }
      }
    });
    
    return weeklyData;
  };

  // Calculate daily averages for last 30 days
  const getDailyAverages = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const dailyData: { [key: string]: number[] } = {};
    
    entries.forEach(entry => {
      const entryDate = new Date(entry.createdAt);
      if (entryDate >= thirtyDaysAgo && entry.analysis?.type === 'SYMPTOM' && entry.analysis.symptomData?.intensity) {
        const dateKey = getDateKey(entryDate);
        if (!dailyData[dateKey]) dailyData[dateKey] = [];
        dailyData[dateKey].push(entry.analysis.symptomData.intensity);
      }
    });
    
    // Calculate daily averages
    const averages = Object.entries(dailyData).map(([date, intensities]) => ({
      date,
      avg: intensities.reduce((a, b) => a + b, 0) / intensities.length,
      count: intensities.length
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    return averages;
  };

  // Get trigger statistics
  const getTriggerStats = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Get high symptom days (intensity >= 7)
    const highSymptomDays = new Set<string>();
    const lowSymptomDays = new Set<string>();
    
    entries.forEach(entry => {
      const entryDate = new Date(entry.createdAt);
      if (entryDate >= thirtyDaysAgo && entry.analysis?.type === 'SYMPTOM') {
        const intensity = entry.analysis.symptomData?.intensity || 0;
        const dateKey = getDateKey(entryDate);
        
        if (intensity >= 7) {
          highSymptomDays.add(dateKey);
        } else if (intensity <= 4) {
          lowSymptomDays.add(dateKey);
        }
      }
    });
    
    // Count trigger occurrences on high vs low symptom days
    const triggerCounts: { [key: string]: { high: number, low: number, total: number } } = {};
    
    entries.forEach(entry => {
      const entryDate = new Date(entry.createdAt);
      if (entryDate >= thirtyDaysAgo && entry.analysis?.type === 'FOOD' && entry.analysis.ingredients) {
        const dateKey = getDateKey(entryDate);
        const isHighDay = highSymptomDays.has(dateKey);
        const isLowDay = lowSymptomDays.has(dateKey);
        
        entry.analysis.ingredients.forEach(ing => {
          ing.triggers?.forEach(trigger => {
            if (!triggerCounts[trigger.name]) {
              triggerCounts[trigger.name] = { high: 0, low: 0, total: 0 };
            }
            triggerCounts[trigger.name].total++;
            if (isHighDay) triggerCounts[trigger.name].high++;
            if (isLowDay) triggerCounts[trigger.name].low++;
          });
        });
      }
    });
    
    return Object.entries(triggerCounts)
      .map(([name, counts]) => ({
        name,
        ...counts,
        highPercent: counts.total > 0 ? (counts.high / counts.total) * 100 : 0
      }))
      .sort((a, b) => b.highPercent - a.highPercent);
  };

  // Calculate statistics
  const weeklyData = getLast4Weeks();
  const dailyAverages = getDailyAverages();
  const triggerStats = getTriggerStats();
  
  const weeks = Object.keys(weeklyData).sort();
  const weeklySymptomAvgs = weeks.map(week => {
    const symptoms = weeklyData[week].symptoms;
    return symptoms.length > 0 ? symptoms.reduce((a, b) => a + b, 0) / symptoms.length : 0;
  });
  
  // Calculate trends
  const recentAvg = weeklySymptomAvgs.slice(-2).reduce((a, b) => a + b, 0) / 2;
  const olderAvg = weeklySymptomAvgs.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
  const trend = recentAvg - olderAvg;
  
  // Max value for scaling bars
  const maxSymptom = Math.max(...weeklySymptomAvgs, 10);
  const maxDaily = Math.max(...dailyAverages.map(d => d.avg), 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-2xl font-bold mb-2">📊 Insikter & Analys</h2>
        <p className="text-sm text-gray-400">Långsiktiga mönster senaste 30 dagarna</p>
      </div>

      {/* Trend Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <div className="text-xs text-gray-400 mb-1">Trend</div>
          <div className="flex items-center gap-2">
            {trend < -0.5 ? (
              <>
                <TrendingDown className="w-5 h-5 text-green-400" />
                <span className="text-lg font-semibold text-green-400">Förbättring</span>
              </>
            ) : trend > 0.5 ? (
              <>
                <TrendingUp className="w-5 h-5 text-red-400" />
                <span className="text-lg font-semibold text-red-400">Försämring</span>
              </>
            ) : (
              <>
                <Minus className="w-5 h-5 text-gray-400" />
                <span className="text-lg font-semibold text-gray-400">Stabilt</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <div className="text-xs text-gray-400 mb-1">Genomsnitt senaste 2 veckor</div>
          <div className="text-2xl font-bold">
            {recentAvg > 0 ? recentAvg.toFixed(1) : '-'}
            <span className="text-sm text-gray-500">/10</span>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <div className="text-xs text-gray-400 mb-1">Totalt symtom</div>
          <div className="text-2xl font-bold">
            {entries.filter(e => e.analysis?.type === 'SYMPTOM').length}
          </div>
        </div>
      </div>

      {/* Weekly Symptom Intensity Chart */}
      {weeklySymptomAvgs.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold mb-4">Genomsnittlig symtomintensitet per vecka</h3>
          <div className="space-y-3">
            {weeks.map((week, idx) => {
              const avg = weeklySymptomAvgs[idx];
              const exercises = weeklyData[week].exercises;
              const height = (avg / maxSymptom) * 100;
              
              return (
                <div key={week} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Vecka {week.split('-W')[1]}</span>
                    <div className="flex items-center gap-3">
                      {exercises > 0 && (
                        <span className="text-xs text-blue-400">💪 {exercises}x träning</span>
                      )}
                      <span className="font-semibold">
                        {avg > 0 ? avg.toFixed(1) : '-'}
                      </span>
                    </div>
                  </div>
                  <div className="h-8 bg-gray-800 rounded-lg overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        avg >= 7 ? 'bg-red-500' : avg >= 5 ? 'bg-orange-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${height}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily Symptom Chart (Last 30 days) */}
      {dailyAverages.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold mb-4">Symtomintensitet senaste 30 dagarna</h3>
          <div className="flex items-end gap-1 h-32 overflow-x-auto">
            {dailyAverages.slice(-30).map((day, idx) => {
              const height = (day.avg / maxDaily) * 100;
              return (
                <div key={idx} className="flex-1 min-w-[8px] flex flex-col justify-end group relative">
                  <div
                    className={`w-full transition-all rounded-t ${
                      day.avg >= 7 ? 'bg-red-500' : day.avg >= 5 ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-950 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {day.avg.toFixed(1)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>-30 dagar</span>
            <span>Idag</span>
          </div>
        </div>
      )}

      {/* Trigger Analysis */}
      {triggerStats.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold mb-2">Trigger-analys</h3>
          <p className="text-sm text-gray-400 mb-4">
            Hur ofta triggers förekom på dåliga dagar (intensitet ≥7) vs bra dagar (≤4)
          </p>
          <div className="space-y-3">
            {triggerStats.slice(0, 6).map((trigger) => (
              <div key={trigger.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{trigger.name}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-red-400">
                      {trigger.high}/{trigger.total} på dåliga dagar
                    </span>
                    <span className={trigger.highPercent >= 60 ? 'text-red-400 font-semibold' : 'text-gray-400'}>
                      {trigger.highPercent.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      trigger.highPercent >= 60 ? 'bg-red-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${trigger.highPercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          {triggerStats.length > 0 && triggerStats[0].highPercent >= 60 && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-sm text-red-300">
                💡 <strong>{triggerStats[0].name}</strong> förekom i {triggerStats[0].highPercent.toFixed(0)}% av dina värsta dagar senaste månaden
              </p>
            </div>
          )}
        </div>
      )}

      {/* Exercise Correlation */}
      {weeks.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold mb-4">Träning & Symtom</h3>
          <div className="space-y-3">
            {weeks.map((week, idx) => {
              const avg = weeklySymptomAvgs[idx];
              const exercises = weeklyData[week].exercises;
              
              return (
                <div key={week} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">Vecka {week.split('-W')[1]}</span>
                    <span className="text-sm">
                      💪 {exercises} träningspass
                    </span>
                  </div>
                  <div className={`text-sm font-semibold ${
                    avg >= 7 ? 'text-red-400' : avg >= 5 ? 'text-orange-400' : 'text-green-400'
                  }`}>
                    ø {avg > 0 ? avg.toFixed(1) : '-'} symtom
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No data message */}
      {entries.length === 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
          <p className="text-gray-400">Börja logga inlägg för att se insikter och mönster</p>
        </div>
      )}
    </div>
  );
}

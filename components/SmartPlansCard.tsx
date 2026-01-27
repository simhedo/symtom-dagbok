'use client';

import { useEffect, useState } from 'react';
import { Target, Check, X, ChevronDown, ChevronUp, AlertTriangle, Circle, CheckCircle2, Trash2 } from 'lucide-react';
import { Entry, PlanRule, PlanViolation } from '@/types';

interface SmartPlan {
  id: number;
  title: string;
  rules: PlanRule[];
  startDate: string;
  endDate: string | null;
  adherence: Record<string, { 
    passed: boolean; 
    violations: PlanViolation[];
    manualChecks: Record<string, boolean>;
  }>;
}

interface SmartPlansCardProps {
  entries: Entry[];
}

export default function SmartPlansCard({ entries }: SmartPlansCardProps) {
  const [plans, setPlans] = useState<SmartPlan[]>([]);
  const [expandedPlan, setExpandedPlan] = useState<number | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    loadAndCheckPlans();
  }, [entries]);

  const loadAndCheckPlans = () => {
    const savedPlans = JSON.parse(localStorage.getItem('smart_plans') || '[]');
    
    const updatedPlans = savedPlans.map((plan: SmartPlan) => {
      // Filtrera dagens entries
      const todayEntries = entries.filter(e => 
        e.createdAt.startsWith(today) && e.analysis?.type === 'FOOD'
      );
      
      // Kolla automatiska regler mot entries
      const violations = checkAutoRules(plan.rules, todayEntries);
      
      // Behall befintliga manuella checks
      const existingAdherence = plan.adherence[today] || { manualChecks: {} };
      
      // Kolla om alla manuella regler ar checkade
      const manualRules = plan.rules.filter(r => r.type === 'manual_habit');
      const allManualChecked = manualRules.length === 0 || 
        manualRules.every(r => existingAdherence.manualChecks[r.id]);
      
      const passed = violations.length === 0 && allManualChecked;
      
      return {
        ...plan,
        adherence: {
          ...plan.adherence,
          [today]: {
            passed,
            violations,
            manualChecks: existingAdherence.manualChecks || {}
          }
        }
      };
    });
    
    localStorage.setItem('smart_plans', JSON.stringify(updatedPlans));
    setPlans(updatedPlans);
  };

  const checkAutoRules = (rules: PlanRule[], dayEntries: Entry[]): PlanViolation[] => {
    const violations: PlanViolation[] = [];
    
    for (const entry of dayEntries) {
      const analysis = entry.analysis;
      if (!analysis) continue;
      
      const entryText = entry.text.toLowerCase();
      const ingredients = analysis.ingredients || [];
      const triggers = analysis.triggers || [];
      const tags = analysis.tags || [];
      
      for (const rule of rules) {
        // Hoppa over manuella regler
        if (rule.type === 'manual_habit') continue;
        
        if (rule.type === 'avoid_category') {
          const target = rule.target.toLowerCase();
          
          if (entryText.includes(target) || 
              tags.some(t => t.toLowerCase().includes(target))) {
            violations.push({
              ruleId: rule.id,
              entryId: entry.id,
              entryText: entry.text,
              reason: `Inneholl ${target}`
            });
          }
        } else if (rule.type === 'avoid_trigger') {
          const target = rule.target.toLowerCase();
          
          // Kolla top-level triggers
          if (triggers.some(t => t.name.toLowerCase().includes(target))) {
            violations.push({
              ruleId: rule.id,
              entryId: entry.id,
              entryText: entry.text,
              reason: `Trigger: ${target}`
            });
            continue;
          }
          
          // Kolla ingrediens-triggers
          for (const ing of ingredients) {
            if (ing.triggers?.some(t => t.name.toLowerCase().includes(target))) {
              violations.push({
                ruleId: rule.id,
                entryId: entry.id,
                entryText: entry.text,
                reason: `${ing.name} innehaller ${target}`
              });
              break;
            }
          }
        } else if (rule.type === 'max_amount' && rule.target === 'fett') {
          const fatContent = analysis.gastricEmptying?.fatContent;
          if (fatContent && rule.value && fatContent > rule.value) {
            violations.push({
              ruleId: rule.id,
              entryId: entry.id,
              entryText: entry.text,
              reason: `Fett: ${fatContent}g (max ${rule.value}g)`
            });
          }
        } else if (rule.type === 'no_late_eating' && rule.timeValue) {
          const entryTime = new Date(entry.createdAt);
          const [limitHour, limitMin] = rule.timeValue.split(':').map(Number);
          const entryHour = entryTime.getHours();
          const entryMin = entryTime.getMinutes();
          
          if (entryHour > limitHour || (entryHour === limitHour && entryMin > limitMin)) {
            violations.push({
              ruleId: rule.id,
              entryId: entry.id,
              entryText: entry.text,
              reason: `At efter ${rule.timeValue}`
            });
          }
        }
      }
    }
    
    // Kolla maltidsmellanrum
    const spacingRules = rules.filter(r => r.type === 'meal_spacing');
    if (spacingRules.length > 0 && dayEntries.length > 1) {
      const sortedEntries = [...dayEntries].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      for (let i = 1; i < sortedEntries.length; i++) {
        const prev = new Date(sortedEntries[i - 1].createdAt);
        const curr = new Date(sortedEntries[i].createdAt);
        const hoursDiff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60);
        
        for (const rule of spacingRules) {
          if (rule.value && hoursDiff < rule.value) {
            violations.push({
              ruleId: rule.id,
              entryId: sortedEntries[i].id,
              entryText: `${sortedEntries[i - 1].text.slice(0, 20)}... -> ${sortedEntries[i].text.slice(0, 20)}...`,
              reason: `Endast ${hoursDiff.toFixed(1)}h mellan maltider (min ${rule.value}h)`
            });
          }
        }
      }
    }
    
    // Ta bort dubbletter
    const unique = violations.filter((v, i, arr) => 
      arr.findIndex(x => x.ruleId === v.ruleId && x.entryId === v.entryId) === i
    );
    
    return unique;
  };

  const toggleManualCheck = (planId: number, ruleId: string) => {
    setPlans(prev => {
      const updated = prev.map(plan => {
        if (plan.id !== planId) return plan;
        
        const todayAdherence = plan.adherence[today] || { violations: [], manualChecks: {} };
        const newManualChecks = {
          ...todayAdherence.manualChecks,
          [ruleId]: !todayAdherence.manualChecks[ruleId]
        };
        
        // Rekalkulera passed
        const manualRules = plan.rules.filter(r => r.type === 'manual_habit');
        const allManualChecked = manualRules.every(r => newManualChecks[r.id]);
        const passed = todayAdherence.violations.length === 0 && allManualChecked;
        
        return {
          ...plan,
          adherence: {
            ...plan.adherence,
            [today]: {
              ...todayAdherence,
              manualChecks: newManualChecks,
              passed
            }
          }
        };
      });
      
      localStorage.setItem('smart_plans', JSON.stringify(updated));
      return updated;
    });
  };

  const deletePlan = (planId: number) => {
    if (!confirm('Ta bort denna plan?')) return;
    
    setPlans(prev => {
      const updated = prev.filter(p => p.id !== planId);
      localStorage.setItem('smart_plans', JSON.stringify(updated));
      return updated;
    });
  };

  const getWeekStats = (plan: SmartPlan) => {
    const days: { date: string; passed: boolean | null; day: string }[] = [];
    const dayNames = ['S', 'M', 'T', 'O', 'T', 'F', 'L'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const inPeriod = dateStr >= plan.startDate && (!plan.endDate || dateStr <= plan.endDate);
      
      days.push({
        date: dateStr,
        passed: inPeriod ? (plan.adherence[dateStr]?.passed ?? null) : null,
        day: dayNames[d.getDay()]
      });
    }
    
    return days;
  };

  const calculateStreak = (plan: SmartPlan): number => {
    let streak = 0;
    const d = new Date();
    
    while (true) {
      const dateStr = d.toISOString().slice(0, 10);
      if (plan.adherence[dateStr]?.passed) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  if (plans.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {plans.map(plan => {
        const todayAdherence = plan.adherence[today];
        const streak = calculateStreak(plan);
        const weekStats = getWeekStats(plan);
        const isExpanded = expandedPlan === plan.id;
        const manualRules = plan.rules.filter(r => r.type === 'manual_habit');
        const autoRules = plan.rules.filter(r => r.type !== 'manual_habit');
        const checkedCount = manualRules.filter(r => todayAdherence?.manualChecks[r.id]).length;
        
        return (
          <div
            key={plan.id}
            className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden"
          >
            {/* Header */}
            <button
              onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  todayAdherence?.passed === false 
                    ? 'bg-red-900/50' 
                    : todayAdherence?.passed 
                      ? 'bg-green-900/50' 
                      : 'bg-gray-800'
                }`}>
                  {todayAdherence?.passed === false ? (
                    <X className="w-5 h-5 text-red-400" />
                  ) : todayAdherence?.passed ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Target className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-gray-100">{plan.title}</h3>
                  <p className="text-xs text-gray-500">
                    {plan.rules.length} regler
                    {manualRules.length > 0 && ` (${checkedCount}/${manualRules.length} idag)`}
                    {streak > 0 && ` - ${streak} dagar`}
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            
            {/* Week overview */}
            <div className="px-4 pb-3 flex gap-1 justify-center">
              {weekStats.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] text-gray-600">{day.day}</span>
                  <div
                    className={`w-7 h-7 rounded flex items-center justify-center ${
                      day.passed === null
                        ? 'bg-gray-800/50 text-gray-700'
                        : day.passed
                          ? 'bg-green-900/50 text-green-400'
                          : 'bg-red-900/50 text-red-400'
                    }`}
                  >
                    {day.passed === null ? (
                      <span className="text-xs">-</span>
                    ) : day.passed ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Expanded content */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-gray-800 pt-3 space-y-4">
                
                {/* Manual habits - checkboxes */}
                {manualRules.length > 0 && (
                  <div>
                    <h4 className="text-xs text-gray-500 mb-2">Dagliga vanor (checka av)</h4>
                    <div className="space-y-1">
                      {manualRules.map(rule => {
                        const isChecked = todayAdherence?.manualChecks[rule.id];
                        return (
                          <button
                            key={rule.id}
                            onClick={() => toggleManualCheck(plan.id, rule.id)}
                            className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                              isChecked 
                                ? 'bg-green-900/30 border border-green-800' 
                                : 'bg-gray-800 border border-gray-700 hover:bg-gray-750'
                            }`}
                          >
                            {isChecked ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-500 flex-shrink-0" />
                            )}
                            <span className={`text-sm ${isChecked ? 'text-green-300' : 'text-gray-300'}`}>
                              {rule.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Auto rules */}
                {autoRules.length > 0 && (
                  <div>
                    <h4 className="text-xs text-gray-500 mb-2">Automatiska regler</h4>
                    <div className="space-y-1">
                      {autoRules.map(rule => {
                        const hasViolation = todayAdherence?.violations.some(v => v.ruleId === rule.id);
                        return (
                          <div
                            key={rule.id}
                            className={`flex items-center gap-2 text-sm p-2 rounded ${
                              hasViolation ? 'bg-red-900/20 text-red-300' : 'text-gray-400'
                            }`}
                          >
                            {hasViolation ? (
                              <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                            ) : (
                              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            )}
                            {rule.description}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Violations */}
                {todayAdherence?.violations && todayAdherence.violations.length > 0 && (
                  <div>
                    <h4 className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                      Avvikelser idag
                    </h4>
                    <div className="space-y-1.5">
                      {todayAdherence.violations.map((v, i) => (
                        <div
                          key={i}
                          className="bg-red-900/20 border border-red-900/50 rounded-lg p-2 text-sm"
                        >
                          <p className="text-red-300">{v.reason}</p>
                          {v.entryText && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{v.entryText}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Delete button */}
                <button
                  onClick={() => deletePlan(plan.id)}
                  className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Ta bort plan
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

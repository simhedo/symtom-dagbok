'use client';

import { useEffect, useState } from 'react';
import { Target, Check, X, ChevronRight, AlertTriangle } from 'lucide-react';
import { Entry, PlanRule, PlanViolation } from '@/types';

interface SmartPlan {
  id: number;
  title: string;
  rules: PlanRule[];
  startDate: string;
  endDate: string | null;
  adherence: Record<string, { passed: boolean; violations: PlanViolation[] }>;
}

interface SmartPlansCardProps {
  entries: Entry[];
}

export default function SmartPlansCard({ entries }: SmartPlansCardProps) {
  const [plans, setPlans] = useState<SmartPlan[]>([]);
  const [expandedPlan, setExpandedPlan] = useState<number | null>(null);

  useEffect(() => {
    // Ladda planer fran localStorage
    const savedPlans = JSON.parse(localStorage.getItem('smart_plans') || '[]');
    
    // Kolla adherence for idag
    const today = new Date().toISOString().slice(0, 10);
    const updatedPlans = savedPlans.map((plan: SmartPlan) => {
      // Filtrera dagens entries
      const todayEntries = entries.filter(e => 
        e.createdAt.startsWith(today) && e.analysis?.type === 'FOOD'
      );
      
      // Kolla regler mot entries
      const violations = checkRules(plan.rules, todayEntries);
      
      return {
        ...plan,
        adherence: {
          ...plan.adherence,
          [today]: {
            passed: violations.length === 0,
            violations
          }
        }
      };
    });
    
    // Spara uppdaterad adherence
    localStorage.setItem('smart_plans', JSON.stringify(updatedPlans));
    setPlans(updatedPlans);
  }, [entries]);

  // Kolla regler mot entries
  const checkRules = (rules: PlanRule[], dayEntries: Entry[]): PlanViolation[] => {
    const violations: PlanViolation[] = [];
    
    for (const entry of dayEntries) {
      const analysis = entry.analysis;
      if (!analysis) continue;
      
      const entryText = entry.text.toLowerCase();
      const ingredients = analysis.ingredients || [];
      const triggers = analysis.triggers || [];
      const tags = analysis.tags || [];
      
      for (const rule of rules) {
        if (rule.type === 'avoid_category') {
          // Kolla om entry-texten eller tags matchar kategorin
          const target = rule.target.toLowerCase();
          
          // Direkt match i text
          if (entryText.includes(target)) {
            violations.push({
              ruleId: rule.id,
              entryId: entry.id,
              entryText: entry.text,
              reason: `Inneholl ${target}`
            });
            continue;
          }
          
          // Kolla tags
          if (tags.some(t => t.toLowerCase().includes(target))) {
            violations.push({
              ruleId: rule.id,
              entryId: entry.id,
              entryText: entry.text,
              reason: `Taggad som ${target}`
            });
          }
        } else if (rule.type === 'avoid_trigger') {
          // Kolla triggers
          const target = rule.target.toLowerCase();
          const foundTrigger = triggers.find(t => 
            t.name.toLowerCase().includes(target)
          );
          
          if (foundTrigger) {
            violations.push({
              ruleId: rule.id,
              entryId: entry.id,
              entryText: entry.text,
              reason: `Inneholl ${foundTrigger.name}`
            });
          }
          
          // Kolla ingredienser
          for (const ing of ingredients) {
            const ingTrigger = ing.triggers?.find(t => 
              t.name.toLowerCase().includes(target)
            );
            if (ingTrigger) {
              violations.push({
                ruleId: rule.id,
                entryId: entry.id,
                entryText: entry.text,
                reason: `${ing.name} innehaller ${ingTrigger.name}`
              });
              break;
            }
          }
        } else if (rule.type === 'max_amount' && rule.target === 'fett') {
          // Kolla fettmangd
          const fatContent = analysis.gastricEmptying?.fatContent;
          if (fatContent && rule.value && fatContent > rule.value) {
            violations.push({
              ruleId: rule.id,
              entryId: entry.id,
              entryText: entry.text,
              reason: `Fett: ${fatContent}g (max ${rule.value}g)`
            });
          }
        }
      }
    }
    
    // Ta bort dubbletter (samma regel + samma entry)
    const unique = violations.filter((v, i, arr) => 
      arr.findIndex(x => x.ruleId === v.ruleId && x.entryId === v.entryId) === i
    );
    
    return unique;
  };

  // Berakna streak (antal dagar i rad med adherence)
  const calculateStreak = (plan: SmartPlan): number => {
    const dates = Object.keys(plan.adherence).sort().reverse();
    let streak = 0;
    
    for (const date of dates) {
      if (plan.adherence[date]?.passed) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Berakna veckostatistik
  const getWeekStats = (plan: SmartPlan) => {
    const today = new Date();
    const weekDays: { date: string; passed: boolean | null }[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      
      // Kolla om datum ar inom planens period
      const inPeriod = dateStr >= plan.startDate && 
        (!plan.endDate || dateStr <= plan.endDate);
      
      weekDays.push({
        date: dateStr,
        passed: inPeriod ? (plan.adherence[dateStr]?.passed ?? null) : null
      });
    }
    
    return weekDays;
  };

  if (plans.length === 0) {
    return null;
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-3">
      {plans.map(plan => {
        const todayAdherence = plan.adherence[today];
        const streak = calculateStreak(plan);
        const weekStats = getWeekStats(plan);
        const isExpanded = expandedPlan === plan.id;
        
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
                    {streak > 0 && ` • ${streak} dagar i rad`}
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
            
            {/* Week overview */}
            <div className="px-4 pb-3 flex gap-1 justify-center">
              {weekStats.map((day, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded flex items-center justify-center text-xs ${
                    day.passed === null
                      ? 'bg-gray-800 text-gray-600'
                      : day.passed
                        ? 'bg-green-900/50 text-green-400'
                        : 'bg-red-900/50 text-red-400'
                  }`}
                  title={day.date}
                >
                  {day.passed === null ? '-' : day.passed ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </div>
              ))}
            </div>
            
            {/* Expanded content */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-gray-800 pt-3 space-y-3">
                {/* Rules */}
                <div>
                  <h4 className="text-xs text-gray-500 mb-2">Regler</h4>
                  <div className="space-y-1">
                    {plan.rules.map(rule => (
                      <div
                        key={rule.id}
                        className="flex items-center gap-2 text-sm text-gray-400"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                        {rule.description}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Today's violations */}
                {todayAdherence?.violations && todayAdherence.violations.length > 0 && (
                  <div>
                    <h4 className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                      Dagens avvikelser
                    </h4>
                    <div className="space-y-2">
                      {todayAdherence.violations.map((v, i) => (
                        <div
                          key={i}
                          className="bg-red-900/20 border border-red-900/50 rounded-lg p-2 text-sm"
                        >
                          <p className="text-red-300">{v.reason}</p>
                          <p className="text-xs text-gray-500 mt-1">{v.entryText}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

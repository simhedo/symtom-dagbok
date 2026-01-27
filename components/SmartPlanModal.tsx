'use client';

import { useState } from 'react';
import { 
  X, Plus, Trash2, Target, ShieldX, CheckCircle, 
  Clock, Dumbbell, Heart
} from 'lucide-react';
import { PlanRule } from '@/types';

interface SmartPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (planId: number) => void;
}

type RuleCategory = 'avoid' | 'timing' | 'activity' | 'wellness';

const RULE_CATEGORIES = [
  { id: 'avoid' as RuleCategory, label: 'Undvik', icon: ShieldX, color: '#dc2626' },
  { id: 'timing' as RuleCategory, label: 'Maltider', icon: Clock, color: '#2563eb' },
  { id: 'activity' as RuleCategory, label: 'Aktivitet', icon: Dumbbell, color: '#16a34a' },
  { id: 'wellness' as RuleCategory, label: 'Valbefinnande', icon: Heart, color: '#9333ea' },
];

const PRESET_RULES: Record<RuleCategory, { label: string; rule: Partial<PlanRule> }[]> = {
  avoid: [
    { label: 'Godis', rule: { type: 'avoid_category', target: 'godis' } },
    { label: 'Kakor', rule: { type: 'avoid_category', target: 'kakor' } },
    { label: 'Chips/Snacks', rule: { type: 'avoid_category', target: 'chips' } },
    { label: 'Lask/Soda', rule: { type: 'avoid_category', target: 'lask' } },
    { label: 'Alkohol', rule: { type: 'avoid_category', target: 'alkohol' } },
    { label: 'Fast food', rule: { type: 'avoid_category', target: 'fast food' } },
    { label: 'Gluten', rule: { type: 'avoid_trigger', target: 'gluten' } },
    { label: 'Laktos', rule: { type: 'avoid_trigger', target: 'laktos' } },
    { label: 'Lok/Vitlok', rule: { type: 'avoid_trigger', target: 'lok' } },
    { label: 'FODMAP', rule: { type: 'avoid_trigger', target: 'fodmap' } },
    { label: 'Max 15g fett/maltid', rule: { type: 'max_amount', target: 'fett', value: 15, unit: 'g' } },
    { label: 'Max 20g fett/maltid', rule: { type: 'max_amount', target: 'fett', value: 20, unit: 'g' } },
  ],
  timing: [
    { label: '3h mellan maltider', rule: { type: 'meal_spacing', target: 'maltid', value: 3, unit: 'h' } },
    { label: '4h mellan maltider', rule: { type: 'meal_spacing', target: 'maltid', value: 4, unit: 'h' } },
    { label: 'Inte ata efter 20:00', rule: { type: 'no_late_eating', target: 'mat', timeValue: '20:00' } },
    { label: 'Inte ata efter 21:00', rule: { type: 'no_late_eating', target: 'mat', timeValue: '21:00' } },
    { label: 'Fasteperiod 16:8', rule: { type: 'eating_window', target: 'mat', timeValue: '12:00-20:00' } },
    { label: 'Regelbundna maltider', rule: { type: 'manual_habit', target: 'regelbundna-maltider' } },
  ],
  activity: [
    { label: 'Promenad 30 min/dag', rule: { type: 'daily_movement', target: 'promenad', value: 30, unit: 'min' } },
    { label: 'Rorelse 20 min/dag', rule: { type: 'daily_movement', target: 'rorelse', value: 20, unit: 'min' } },
    { label: 'Promenad efter maltid', rule: { type: 'manual_habit', target: 'promenad-maltid' } },
    { label: 'Yoga/stretching', rule: { type: 'manual_habit', target: 'yoga' } },
    { label: 'Styrketraning', rule: { type: 'manual_habit', target: 'styrka' } },
  ],
  wellness: [
    { label: 'Tugga ordentligt (30ggr)', rule: { type: 'manual_habit', target: 'tugga' } },
    { label: 'At i lugn och ro', rule: { type: 'manual_habit', target: 'lugn-maltid' } },
    { label: 'Mindfulness/meditation', rule: { type: 'manual_habit', target: 'mindfulness' } },
    { label: 'Djupandning fore mat', rule: { type: 'manual_habit', target: 'andning' } },
    { label: 'Somn 7-8 timmar', rule: { type: 'manual_habit', target: 'somn' } },
    { label: 'Drick 2L vatten', rule: { type: 'manual_habit', target: 'vatten' } },
    { label: 'Stresshantering', rule: { type: 'manual_habit', target: 'stress' } },
    { label: 'Ingen skarm 1h fore somn', rule: { type: 'manual_habit', target: 'skarm' } },
    { label: 'Ta probiotika', rule: { type: 'manual_habit', target: 'probiotika' } },
    { label: 'Magmassage', rule: { type: 'manual_habit', target: 'magmassage' } },
    { label: 'Dagbok/reflektion', rule: { type: 'manual_habit', target: 'dagbok' } },
    { label: 'Tacksamhetsokning', rule: { type: 'manual_habit', target: 'tacksamhet' } },
  ],
};

export default function SmartPlanModal({ isOpen, onClose, onCreated }: SmartPlanModalProps) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [rules, setRules] = useState<PlanRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<RuleCategory>('avoid');
  const [customRuleText, setCustomRuleText] = useState('');

  if (!isOpen) return null;

  const addPresetRule = (preset: { label: string; rule: Partial<PlanRule> }) => {
    const exists = rules.some(r => 
      r.type === preset.rule.type && r.target === preset.rule.target
    );
    if (exists) return;

    const newRule: PlanRule = {
      id: `${preset.rule.type}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: preset.rule.type as PlanRule['type'],
      target: preset.rule.target || '',
      value: preset.rule.value,
      unit: preset.rule.unit,
      timeValue: preset.rule.timeValue,
      description: preset.label,
      category: activeCategory,
    };
    setRules(prev => [...prev, newRule]);
  };

  const addCustomRule = () => {
    if (!customRuleText.trim()) return;
    const newRule: PlanRule = {
      id: `custom_${Date.now()}`,
      type: 'manual_habit',
      target: customRuleText.toLowerCase().replace(/\s+/g, '-'),
      description: customRuleText.trim(),
      category: 'wellness',
    };
    setRules(prev => [...prev, newRule]);
    setCustomRuleText('');
  };

  const removeRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const isRuleSelected = (preset: { label: string; rule: Partial<PlanRule> }) => {
    return rules.some(r => r.type === preset.rule.type && r.target === preset.rule.target);
  };

  const getCategoryColor = (cat?: string) => {
    const category = RULE_CATEGORIES.find(c => c.id === cat);
    return category?.color || '#6b7280';
  };

  const createPlan = async () => {
    if (!title.trim() || rules.length === 0) return;
    setLoading(true);
    
    try {
      const token = localStorage.getItem('gut_tracker_token') || '';
      
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title,
          description: JSON.stringify({ rules }),
          startDate,
          endDate: endDate || null,
          habits: rules.map(r => ({ name: r.description, notes: JSON.stringify(r) }))
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kunde inte skapa plan');
      
      const existingPlans = JSON.parse(localStorage.getItem('smart_plans') || '[]');
      existingPlans.push({
        id: data.planId,
        title,
        rules,
        startDate,
        endDate: endDate || null,
        adherence: {}
      });
      localStorage.setItem('smart_plans', JSON.stringify(existingPlans));
      
      onCreated?.(data.planId);
      onClose();
    } catch (e) {
      console.error(e);
      alert('Fel vid skapande av plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-gray-900 w-full sm:max-w-lg sm:rounded-xl rounded-t-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            <h2 className="font-medium text-gray-100">Ny Smart Plan</h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Plannamn</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="T.ex. Battre matvanor januari"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-100"
            />
          </div>
          
          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Start</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-gray-100"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Slut (valfritt)</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-gray-100"
              />
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-1 bg-gray-800 p-1 rounded-lg">
            {RULE_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded text-xs font-medium transition-colors ${
                    isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                  }`}
                  style={isActive ? { backgroundColor: cat.color } : {}}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Preset rules */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">
              {RULE_CATEGORIES.find(c => c.id === activeCategory)?.label} - valj regler
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_RULES[activeCategory].map((preset, i) => {
                const selected = isRuleSelected(preset);
                return (
                  <button
                    key={i}
                    onClick={() => !selected && addPresetRule(preset)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      selected
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    {selected && <span className="mr-1 text-green-400">+</span>}
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom rule */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Egen regel/vana</label>
            <div className="flex gap-2">
              <input
                value={customRuleText}
                onChange={e => setCustomRuleText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomRule()}
                placeholder="T.ex. Skriv dagbok varje kvall..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100"
              />
              <button
                onClick={addCustomRule}
                disabled={!customRuleText.trim()}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Selected rules */}
          {rules.length > 0 && (
            <div>
              <label className="text-xs text-gray-500 mb-2 block">
                Valda regler ({rules.length})
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {rules.map(rule => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getCategoryColor(rule.category) }}
                      />
                      <span className="text-sm text-gray-200">{rule.description}</span>
                      {rule.type === 'manual_habit' && (
                        <span className="text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">check</span>
                      )}
                    </div>
                    <button
                      onClick={() => removeRule(rule.id)}
                      className="p-1 text-gray-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={createPlan}
            disabled={loading || !title.trim() || rules.length === 0}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            {loading ? 'Skapar...' : `Skapa plan (${rules.length} regler)`}
          </button>
        </div>
      </div>
    </div>
  );
}

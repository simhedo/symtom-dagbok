'use client';

import { useState } from 'react';
import { X, Plus, Trash2, Target, ShieldX, Scale, CheckCircle } from 'lucide-react';
import { PlanRule } from '@/types';

interface SmartPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (planId: number) => void;
}

const COMMON_AVOID_CATEGORIES = [
  'Godis',
  'Kakor',
  'Chips',
  'Snacks',
  'Lask/Soda',
  'Alkohol',
  'Fast food',
  'Friterad mat',
  'Processad mat',
];

const COMMON_TRIGGERS = [
  'Gluten',
  'Laktos',
  'FODMAP-fruktan',
  'FODMAP-GOS',
  'Koffein',
  'Alkohol',
  'Fet mat',
  'Stark mat',
  'Lok',
  'Vitlok',
];

type RuleType = 'avoid_category' | 'avoid_trigger' | 'max_fat' | 'custom';

export default function SmartPlanModal({ isOpen, onClose, onCreated }: SmartPlanModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [rules, setRules] = useState<PlanRule[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Rule builder state
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [ruleType, setRuleType] = useState<RuleType>('avoid_category');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [maxFat, setMaxFat] = useState(20);
  const [customRule, setCustomRule] = useState('');

  if (!isOpen) return null;

  const addRule = () => {
    const newRules: PlanRule[] = [];
    
    if (ruleType === 'avoid_category' && selectedCategories.length > 0) {
      selectedCategories.forEach(cat => {
        newRules.push({
          id: `cat_${Date.now()}_${cat}`,
          type: 'avoid_category',
          target: cat.toLowerCase(),
          description: `Undvik ${cat.toLowerCase()}`
        });
      });
    } else if (ruleType === 'avoid_trigger' && selectedTriggers.length > 0) {
      selectedTriggers.forEach(trigger => {
        newRules.push({
          id: `trig_${Date.now()}_${trigger}`,
          type: 'avoid_trigger',
          target: trigger.toLowerCase(),
          description: `Undvik ${trigger.toLowerCase()}`
        });
      });
    } else if (ruleType === 'max_fat') {
      newRules.push({
        id: `fat_${Date.now()}`,
        type: 'max_amount',
        target: 'fett',
        value: maxFat,
        unit: 'g',
        description: `Max ${maxFat}g fett per maltid`
      });
    } else if (ruleType === 'custom' && customRule.trim()) {
      newRules.push({
        id: `custom_${Date.now()}`,
        type: 'avoid_category',
        target: customRule.toLowerCase(),
        description: `Undvik ${customRule.toLowerCase()}`
      });
    }
    
    setRules(prev => [...prev, ...newRules]);
    setSelectedCategories([]);
    setSelectedTriggers([]);
    setCustomRule('');
    setShowRuleBuilder(false);
  };

  const removeRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers(prev => 
      prev.includes(trigger) ? prev.filter(t => t !== trigger) : [...prev, trigger]
    );
  };

  const createPlan = async () => {
    if (!title.trim() || rules.length === 0) return;
    setLoading(true);
    
    try {
      const token = localStorage.getItem('gut_tracker_token') || '';
      
      // Skapa plan med regler (habits sparas som JSON i notes)
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title,
          description: JSON.stringify({ rules, description }), // Spara regler i description som JSON
          startDate,
          endDate: endDate || null,
          habits: rules.map(r => ({ name: r.description, notes: JSON.stringify(r) }))
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kunde inte skapa plan');
      
      // Spara reglerna lokalt for snabb adherence-check
      const existingPlans = JSON.parse(localStorage.getItem('smart_plans') || '[]');
      existingPlans.push({
        id: data.planId,
        title,
        rules,
        startDate,
        endDate: endDate || null,
        adherence: {} // { "2026-01-27": { passed: true, violations: [] } }
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
            <h2 className="font-medium text-gray-100">Smart Plan</h2>
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
              placeholder="T.ex. Undvik snacks i januari"
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
          
          {/* Rules */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-300">Regler</label>
              <button
                onClick={() => setShowRuleBuilder(true)}
                className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
              >
                <Plus className="w-4 h-4" />
                Lagg till regel
              </button>
            </div>
            
            {rules.length === 0 ? (
              <div className="bg-gray-800/50 border border-dashed border-gray-700 rounded-lg p-4 text-center text-gray-500 text-sm">
                Inga regler annu. Lagg till regler som AI:n ska kolla mot.
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map(rule => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldX className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-gray-200">{rule.description}</span>
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
            )}
          </div>
          
          {/* Rule Builder Modal */}
          {showRuleBuilder && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-200">Lagg till regel</h3>
                <button onClick={() => setShowRuleBuilder(false)} className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Rule type selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setRuleType('avoid_category')}
                  className={`p-2 rounded-lg text-sm text-left ${
                    ruleType === 'avoid_category' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <ShieldX className="w-4 h-4 mb-1" />
                  Undvik kategori
                </button>
                <button
                  onClick={() => setRuleType('avoid_trigger')}
                  className={`p-2 rounded-lg text-sm text-left ${
                    ruleType === 'avoid_trigger' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <ShieldX className="w-4 h-4 mb-1" />
                  Undvik trigger
                </button>
                <button
                  onClick={() => setRuleType('max_fat')}
                  className={`p-2 rounded-lg text-sm text-left ${
                    ruleType === 'max_fat' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Scale className="w-4 h-4 mb-1" />
                  Max fett
                </button>
                <button
                  onClick={() => setRuleType('custom')}
                  className={`p-2 rounded-lg text-sm text-left ${
                    ruleType === 'custom' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Plus className="w-4 h-4 mb-1" />
                  Egen regel
                </button>
              </div>
              
              {/* Rule options */}
              {ruleType === 'avoid_category' && (
                <div className="flex flex-wrap gap-2">
                  {COMMON_AVOID_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-sm ${
                        selectedCategories.includes(cat)
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
              
              {ruleType === 'avoid_trigger' && (
                <div className="flex flex-wrap gap-2">
                  {COMMON_TRIGGERS.map(trigger => (
                    <button
                      key={trigger}
                      onClick={() => toggleTrigger(trigger)}
                      className={`px-3 py-1.5 rounded-full text-sm ${
                        selectedTriggers.includes(trigger)
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {trigger}
                    </button>
                  ))}
                </div>
              )}
              
              {ruleType === 'max_fat' && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">Max</span>
                  <input
                    type="number"
                    value={maxFat}
                    onChange={e => setMaxFat(Number(e.target.value))}
                    className="w-20 bg-gray-700 border border-gray-600 rounded-lg p-2 text-center text-gray-100"
                  />
                  <span className="text-sm text-gray-400">gram fett per maltid</span>
                </div>
              )}
              
              {ruleType === 'custom' && (
                <input
                  value={customRule}
                  onChange={e => setCustomRule(e.target.value)}
                  placeholder="Skriv vad du vill undvika..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-gray-100"
                />
              )}
              
              <button
                onClick={addRule}
                disabled={
                  (ruleType === 'avoid_category' && selectedCategories.length === 0) ||
                  (ruleType === 'avoid_trigger' && selectedTriggers.length === 0) ||
                  (ruleType === 'custom' && !customRule.trim())
                }
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-2 rounded-lg"
              >
                Lagg till
              </button>
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
            {loading ? 'Skapar...' : 'Skapa plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface HabitInput { name: string; notes?: string; targetPerDay?: number }

interface PlanBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (planId: number) => void;
}

export default function PlanBuilderModal({ isOpen, onClose, onCreated }: PlanBuilderModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [endDate, setEndDate] = useState<string>("");
  const [habits, setHabits] = useState<HabitInput[]>([]);
  const [newHabit, setNewHabit] = useState<string>("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const addHabit = () => {
    if (!newHabit.trim()) return;
    setHabits(prev => [...prev, { name: newHabit.trim(), targetPerDay: 1 }]);
    setNewHabit("");
  };

  const removeHabit = (idx: number) => {
    setHabits(prev => prev.filter((_, i) => i !== idx));
  };

  const createPlan = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('gut_tracker_token') || ""; // JWT stored by saveUser
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ title, description, startDate, endDate: endDate || null, habits })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kunde inte skapa plan');
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
      <div className="bg-gray-900 w-full sm:max-w-md sm:rounded-xl rounded-t-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="font-medium text-gray-100">Ny plan</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto">
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Titel (t.ex. Probiotika + tugga väl)" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-100"/>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Beskrivning (valfritt)" className="w-full h-20 bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-100"/>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400">Startdatum</label>
              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-gray-100"/>
            </div>
            <div>
              <label className="text-xs text-gray-400">Slutdatum</label>
              <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-gray-100"/>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-300">Vanor</label>
            <div className="flex gap-2 mt-2">
              <input value={newHabit} onChange={e=>setNewHabit(e.target.value)} placeholder="Lägg till vana..." className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100"/>
              <button onClick={addHabit} className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg border border-gray-700"><Plus className="w-4 h-4"/></button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {habits.map((h, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-full px-3 py-1.5">
                  <span>{h.name}</span>
                  <button onClick={()=>removeHabit(i)} className="text-gray-400 hover:text-gray-200">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-800">
          <button onClick={createPlan} disabled={loading || !title.trim()} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-lg">
            {loading ? 'Skapar...' : 'Skapa plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

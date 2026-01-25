"use client";

import { useEffect, useState } from 'react';

interface Habit { id: number; name: string }
interface Plan { id: number; title: string; startDate: string; endDate?: string; status: string; habits: Habit[] }

export default function PlansCard() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [today, setToday] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token') || "";
        const res = await fetch('/api/plans', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Kunde inte hämta planer');
        setPlans(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const toggleHabit = async (planId: number, habitId: number, done: boolean) => {
    try {
      const token = localStorage.getItem('auth_token') || "";
      await fetch('/api/adherence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId, habitId, date: today, done })
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-gray-100 font-medium">Mina planer</h3>
        {loading && <span className="text-xs text-gray-500">Laddar...</span>}
      </div>
      {plans.length === 0 && (
        <p className="text-sm text-gray-400">Inga aktiva planer ännu.</p>
      )}
      <div className="space-y-4">
        {plans.map(plan => (
          <div key={plan.id} className="bg-gray-850 rounded-lg border border-gray-800 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-100 font-medium">{plan.title}</div>
                <div className="text-xs text-gray-500">{plan.startDate} → {plan.endDate || '–'}</div>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-300">{plan.status}</span>
            </div>
            {plan.habits.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {plan.habits.map(h => (
                  <button key={h.id}
                    onClick={() => toggleHabit(plan.id, h.id, true)}
                    className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-750 text-gray-200 text-sm">
                    ✅ {h.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, User, Heart, Pill, Target, FileText, Apple } from 'lucide-react';
import { UserProfile } from '@/types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
}

const COMMON_DIAGNOSES = [
  'IBS-D (diarré-dominant)',
  'IBS-C (förstoppning-dominant)',
  'IBS-M (blandad)',
  'SIBO',
  'Gastropares',
  'Laktosintolerans',
  'Fruktosmalabsorption',
  'Celiaki',
  'Glutenkänslighet (NCGS)',
  'Crohns sjukdom',
  'Ulcerös kolit',
  'GERD/Reflux',
  'Funktionell dyspepsi',
  'Histaminintolerans'
];

const COMMON_TRIGGERS = [
  'Gluten',
  'Laktos',
  'Lök',
  'Vitlök',
  'Bönor/Linser',
  'Äpplen',
  'Päron',
  'Mjölkprodukter',
  'Kaffe',
  'Alkohol',
  'Fet mat',
  'Stark mat',
  'Socker',
  'Sötningsmedel',
  'Fullkorn'
];

const DIET_OPTIONS = [
  { value: 'normal', label: 'Normal kost' },
  { value: 'lowFODMAP', label: 'Låg-FODMAP' },
  { value: 'glutenfri', label: 'Glutenfri' },
  { value: 'laktosfri', label: 'Laktosfri' },
  { value: 'vegan', label: 'Vegansk' },
  { value: 'vegetarian', label: 'Vegetarisk' },
  { value: 'annat', label: 'Annat' }
];

export default function ProfileModal({ isOpen, onClose, profile, onSave }: ProfileModalProps) {
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [newTrigger, setNewTrigger] = useState('');
  const [newSafeFood, setNewSafeFood] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newGoal, setNewGoal] = useState('');

  useEffect(() => {
    setEditedProfile(profile);
  }, [profile, isOpen]);

  const toggleDiagnosis = (diagnosis: string) => {
    setEditedProfile(prev => ({
      ...prev,
      diagnoses: prev.diagnoses.includes(diagnosis)
        ? prev.diagnoses.filter(d => d !== diagnosis)
        : [...prev.diagnoses, diagnosis]
    }));
  };

  const toggleTrigger = (trigger: string) => {
    setEditedProfile(prev => ({
      ...prev,
      confirmedTriggers: prev.confirmedTriggers.includes(trigger)
        ? prev.confirmedTriggers.filter(t => t !== trigger)
        : [...prev.confirmedTriggers, trigger]
    }));
  };

  const addCustomTrigger = () => {
    if (newTrigger.trim() && !editedProfile.confirmedTriggers.includes(newTrigger.trim())) {
      setEditedProfile(prev => ({
        ...prev,
        confirmedTriggers: [...prev.confirmedTriggers, newTrigger.trim()]
      }));
      setNewTrigger('');
    }
  };

  const addSafeFood = () => {
    if (newSafeFood.trim() && !editedProfile.safeFoods.includes(newSafeFood.trim())) {
      setEditedProfile(prev => ({
        ...prev,
        safeFoods: [...prev.safeFoods, newSafeFood.trim()]
      }));
      setNewSafeFood('');
    }
  };

  const removeSafeFood = (food: string) => {
    setEditedProfile(prev => ({
      ...prev,
      safeFoods: prev.safeFoods.filter(f => f !== food)
    }));
  };

  const addMedication = () => {
    if (newMedication.trim() && !editedProfile.regularMedications.includes(newMedication.trim())) {
      setEditedProfile(prev => ({
        ...prev,
        regularMedications: [...prev.regularMedications, newMedication.trim()]
      }));
      setNewMedication('');
    }
  };

  const removeMedication = (med: string) => {
    setEditedProfile(prev => ({
      ...prev,
      regularMedications: prev.regularMedications.filter(m => m !== med)
    }));
  };

  const addGoal = () => {
    if (newGoal.trim() && !(editedProfile.goals || []).includes(newGoal.trim())) {
      setEditedProfile(prev => ({
        ...prev,
        goals: [...(prev.goals || []), newGoal.trim()]
      }));
      setNewGoal('');
    }
  };

  const removeGoal = (goal: string) => {
    setEditedProfile(prev => ({
      ...prev,
      goals: (prev.goals || []).filter(g => g !== goal)
    }));
  };

  const handleSave = () => {
    onSave({
      ...editedProfile,
      updatedAt: new Date().toISOString()
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 w-full h-full sm:w-[600px] sm:h-[85vh] sm:max-h-[800px] sm:rounded-2xl flex flex-col border border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-900/50 to-teal-900/50 border-b border-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Min Profil</h2>
              <p className="text-xs text-gray-400">Anpassa AI-rådgivningen efter dig</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Diagnoser */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <Heart className="w-4 h-4 text-red-400" />
              Diagnoser / Tillstånd
            </h3>
            <div className="flex flex-wrap gap-2">
              {COMMON_DIAGNOSES.map(diagnosis => (
                <button
                  key={diagnosis}
                  onClick={() => toggleDiagnosis(diagnosis)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    editedProfile.diagnoses.includes(diagnosis)
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {diagnosis}
                </button>
              ))}
            </div>
          </section>

          {/* Bekräftade triggers */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <span className="text-yellow-400">⚠️</span>
              Bekräftade Triggers
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_TRIGGERS.map(trigger => (
                <button
                  key={trigger}
                  onClick={() => toggleTrigger(trigger)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    editedProfile.confirmedTriggers.includes(trigger)
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {trigger}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomTrigger()}
                placeholder="Lägg till egen trigger..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={addCustomTrigger}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* Säkra livsmedel */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <Apple className="w-4 h-4 text-green-400" />
              Säkra Livsmedel
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {editedProfile.safeFoods.map(food => (
                <span
                  key={food}
                  className="px-3 py-1.5 rounded-full text-sm bg-green-900/50 text-green-300 flex items-center gap-2"
                >
                  {food}
                  <button onClick={() => removeSafeFood(food)}>
                    <Trash2 className="w-3 h-3 hover:text-red-400" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSafeFood}
                onChange={(e) => setNewSafeFood(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSafeFood()}
                placeholder="Lägg till säkert livsmedel..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={addSafeFood}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* Mediciner */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <Pill className="w-4 h-4 text-blue-400" />
              Regelbundna Mediciner
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {editedProfile.regularMedications.map(med => (
                <span
                  key={med}
                  className="px-3 py-1.5 rounded-full text-sm bg-blue-900/50 text-blue-300 flex items-center gap-2"
                >
                  {med}
                  <button onClick={() => removeMedication(med)}>
                    <Trash2 className="w-3 h-3 hover:text-red-400" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addMedication()}
                placeholder="Lägg till medicin..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={addMedication}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* Kosthållning */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              🥗 Kosthållning
            </h3>
            <select
              value={editedProfile.diet || 'normal'}
              onChange={(e) => setEditedProfile(prev => ({ ...prev, diet: e.target.value as UserProfile['diet'] }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            >
              {DIET_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </section>

          {/* Mål */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <Target className="w-4 h-4 text-purple-400" />
              Mina Mål
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {(editedProfile.goals || []).map(goal => (
                <span
                  key={goal}
                  className="px-3 py-1.5 rounded-full text-sm bg-purple-900/50 text-purple-300 flex items-center gap-2"
                >
                  {goal}
                  <button onClick={() => removeGoal(goal)}>
                    <Trash2 className="w-3 h-3 hover:text-red-400" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                placeholder="Lägg till mål (t.ex. 'Identifiera triggers')..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={addGoal}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* Anteckningar */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <FileText className="w-4 h-4 text-gray-400" />
              Övriga Anteckningar
            </h3>
            <textarea
              value={editedProfile.notes || ''}
              onChange={(e) => setEditedProfile(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Skriv annan viktig information som AI:n bör veta om..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm min-h-[100px] resize-none"
            />
          </section>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-900">
          <button
            onClick={handleSave}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Spara Profil
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Entry, EntryType, Trigger, Ingredient, SymptomData } from '@/types';
import { getAllTriggers, getAllIngredients } from '@/lib/storage';

interface EditEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: Entry;
  onSave: (updatedEntry: Entry) => void;
  onDelete: (id: string) => void;
}

const modalTitles = {
  FOOD: '🍽️ Redigera Mat',
  SYMPTOM: '🤢 Redigera Symtom',
  EXERCISE: '💪 Redigera Träning',
  MOOD: '🧠 Redigera Mående',
};

export default function EditEntryModal({ isOpen, onClose, entry, onSave, onDelete }: EditEntryModalProps) {
  const [text, setText] = useState(entry.text);
  const [type, setType] = useState<EntryType>(entry.analysis?.type || 'FOOD');
  const [ingredients, setIngredients] = useState<Ingredient[]>(entry.analysis?.ingredients || []);
  const [tags, setTags] = useState<string[]>(entry.analysis?.tags || []);
  const [symptomData, setSymptomData] = useState<SymptomData | undefined>(entry.analysis?.symptomData);
  const [entryDate, setEntryDate] = useState(new Date(entry.createdAt));
  const [newIngredient, setNewIngredient] = useState('');
  const [newTag, setNewTag] = useState('');
  const [availableTriggers, setAvailableTriggers] = useState<string[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAvailableTriggers(getAllTriggers());
      setAvailableIngredients(getAllIngredients());
      setText(entry.text);
      setType(entry.analysis?.type || 'FOOD');
      setIngredients(entry.analysis?.ingredients || []);
      setTags(entry.analysis?.tags || []);
      setSymptomData(entry.analysis?.symptomData);
      setEntryDate(new Date(entry.createdAt));
      setShowDeleteConfirm(false);
    }
  }, [isOpen, entry]);

  if (!isOpen) return null;

  const handleSave = () => {
    const updatedEntry: Entry = {
      ...entry,
      text,
      createdAt: entryDate.toISOString(),
      analysis: {
        ...entry.analysis,
        type,
        ingredients: type === 'FOOD' ? ingredients : undefined,
        symptomData: type === 'SYMPTOM' ? symptomData : undefined,
        tags: type !== 'FOOD' && type !== 'SYMPTOM' ? tags : entry.analysis?.tags,
        summary: entry.analysis?.summary,
      } as any,
    };
    onSave(updatedEntry);
    onClose();
  };

  const handleDelete = () => {
    onDelete(entry.id);
    onClose();
  };

  const addIngredient = () => {
    if (!newIngredient.trim()) return;
    const ingredient: Ingredient = {
      name: newIngredient.trim(),
      amount: '',
      triggers: [],
    };
    setIngredients([...ingredients, ingredient]);
    setNewIngredient('');
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const addTriggerToIngredient = (ingredientIndex: number, triggerName: string) => {
    const updated = [...ingredients];
    const trigger: Trigger = { name: triggerName };
    if (!updated[ingredientIndex].triggers.find(t => t.name === triggerName)) {
      updated[ingredientIndex].triggers.push(trigger);
      setIngredients(updated);
    }
  };

  const removeTriggerFromIngredient = (ingredientIndex: number, triggerName: string) => {
    const updated = [...ingredients];
    updated[ingredientIndex].triggers = updated[ingredientIndex].triggers.filter(t => t.name !== triggerName);
    setIngredients(updated);
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    if (!tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
    }
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-gray-900 w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl border border-gray-800 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold">{modalTitles[type]}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {/* Type Selector */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Kategori</label>
            <div className="grid grid-cols-2 gap-2">
              {(['FOOD', 'SYMPTOM', 'EXERCISE', 'MOOD'] as EntryType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`p-3 rounded-lg border transition-colors ${
                    type === t
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750'
                  }`}
                >
                  {t === 'FOOD' ? '🍽️ Mat' : t === 'SYMPTOM' ? '🤢 Symtom' : t === 'EXERCISE' ? '💪 Träning' : '🧠 Mående'}
                </button>
              ))}
            </div>
          </div>

          {/* Text */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-24 bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-100 resize-none focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Datum</label>
              <input
                type="date"
                value={entryDate.toISOString().split('T')[0]}
                onChange={(e) => {
                  const [year, month, day] = e.target.value.split('-').map(Number);
                  const newDate = new Date(entryDate);
                  newDate.setFullYear(year, month - 1, day);
                  setEntryDate(newDate);
                }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Tid</label>
              <input
                type="time"
                value={entryDate.toTimeString().slice(0, 5)}
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(':').map(Number);
                  const newDate = new Date(entryDate);
                  newDate.setHours(hours, minutes);
                  setEntryDate(newDate);
                }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Ingredients (only for FOOD) */}
          {type === 'FOOD' && (
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Ingredienser</label>
              
              {/* Add ingredient */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                  placeholder="Ny ingrediens..."
                  list="ingredient-suggestions"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
                />
                <datalist id="ingredient-suggestions">
                  {availableIngredients.map(ing => (
                    <option key={ing} value={ing} />
                  ))}
                </datalist>
                <button
                  onClick={addIngredient}
                  className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Ingredient list */}
              <div className="space-y-3">
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="bg-gray-800 rounded-lg p-3">
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={ing.name}
                        onChange={(e) => {
                          const updated = [...ingredients];
                          updated[idx].name = e.target.value;
                          setIngredients(updated);
                        }}
                        className="flex-1 bg-gray-700 border border-gray-600 rounded p-2 text-sm"
                      />
                      <button
                        onClick={() => removeIngredient(idx)}
                        className="text-red-400 hover:text-red-300 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Amount */}
                    <input
                      type="text"
                      value={ing.amount || ''}
                      onChange={(e) => {
                        const updated = [...ingredients];
                        updated[idx].amount = e.target.value;
                        setIngredients(updated);
                      }}
                      placeholder="Mängd (t.ex. 100g, 1 portion)"
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-xs mb-2"
                    />
                    
                    {/* Triggers */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {ing.triggers.map((trigger, tidx) => (
                        <button
                          key={tidx}
                          onClick={() => removeTriggerFromIngredient(idx, trigger.name)}
                          className="px-2 py-1 bg-red-900/30 text-red-300 text-xs rounded-full border border-red-800 hover:bg-red-900/50"
                        >
                          {trigger.name} ×
                        </button>
                      ))}
                    </div>

                    {/* Add trigger */}
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addTriggerToIngredient(idx, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-xs"
                    >
                      <option value="">+ Lägg till trigger</option>
                      {availableTriggers.map(trigger => (
                        <option key={trigger} value={trigger}>{trigger}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Symptom Data (only for SYMPTOM) */}
          {type === 'SYMPTOM' && (
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Symtomdetaljer</label>
              
              <div className="space-y-3 bg-gray-800 rounded-lg p-3">
                {/* Type */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Typ</label>
                  <select
                    value={symptomData?.type || 'Annan'}
                    onChange={(e) => setSymptomData({
                      ...symptomData,
                      type: e.target.value as any,
                      intensity: symptomData?.intensity || 5,
                    })}
                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm"
                  >
                    <option value="Gas">Gas</option>
                    <option value="Smärta">Smärta</option>
                    <option value="Avföring">Avföring</option>
                    <option value="Annan">Annan</option>
                  </select>
                </div>

                {/* Intensity */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Intensitet: {symptomData?.intensity || 5}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={symptomData?.intensity || 5}
                    onChange={(e) => setSymptomData({
                      ...symptomData,
                      type: symptomData?.type || 'Annan',
                      intensity: parseInt(e.target.value),
                    })}
                    className="w-full"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Beskrivning</label>
                  <input
                    type="text"
                    value={symptomData?.description || ''}
                    onChange={(e) => setSymptomData({
                      ...symptomData,
                      type: symptomData?.type || 'Annan',
                      intensity: symptomData?.intensity || 5,
                      description: e.target.value,
                    })}
                    placeholder="Beskriv symtomet..."
                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tags (for EXERCISE and MOOD) */}
          {type !== 'FOOD' && type !== 'SYMPTOM' && (
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Taggar</label>
              
              {/* Add tag */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  placeholder="Ny tagg..."
                  list="tag-suggestions"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
                />
                <datalist id="tag-suggestions">
                  {availableTriggers.map(tag => (
                    <option key={tag} value={tag} />
                  ))}
                </datalist>
                <button
                  onClick={addTag}
                  className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Tag list */}
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
                  <button
                    key={idx}
                    onClick={() => removeTag(tag)}
                    className="px-3 py-1 bg-blue-900/30 text-blue-300 text-sm rounded-full border border-blue-800 hover:bg-blue-900/50"
                  >
                    {tag} ×
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <button
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors"
          >
            Spara ändringar
          </button>
          
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-gray-800 hover:bg-gray-700 text-red-400 font-medium py-3 rounded-xl transition-colors"
            >
              Ta bort inlägg
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-xl transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl transition-colors"
              >
                Bekräfta radering
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, getTodayEntries, getEntries, saveEntry, updateEntry, deleteEntry } from '@/lib/storage';
import { Entry, EntryType, User } from '@/types';
import EntryCard from '@/components/EntryCard';
import ActionBar from '@/components/ActionBar';
import EntryModal from '@/components/EntryModal';
import EditEntryModal from '@/components/EditEntryModal';
import Calendar from '@/components/Calendar';
import { CalendarDays, List, Rows3, BarChart3 } from 'lucide-react';
import CompactEntryCard from '@/components/CompactEntryCard';
import Insights from '@/components/Insights';

type ViewMode = 'list' | 'compact' | 'calendar' | 'insights';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [selectedType, setSelectedType] = useState<EntryType>('FOOD');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const router = useRouter();

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      router.push('/');
    } else {
      setUser(currentUser);
      loadEntries();
    }
  }, [router]);

  const loadEntries = () => {
    const todayEntries = getTodayEntries();
    setEntries(todayEntries);
    const all = getEntries();
    setAllEntries(all);
  };

  const getEntriesForDate = (date: Date) => {
    return allEntries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      return entryDate.toDateString() === date.toDateString();
    });
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const dateEntries = getEntriesForDate(date);
    setEntries(dateEntries);
  };

  const handleAction = (type: EntryType) => {
    setSelectedType(type);
    setModalOpen(true);
  };

  const handleSave = async (text: string, type: EntryType) => {
    if (!user) return;

    // Call API to analyze
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, type }),
    });

    const analysis = await response.json();

    // Use selected date if not today, otherwise use current time
    const isToday = selectedDate.toDateString() === new Date().toDateString();
    const entryDate = isToday ? new Date() : new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      new Date().getHours(),
      new Date().getMinutes()
    );

    const newEntry: Entry = {
      id: Date.now().toString(),
      text,
      createdAt: entryDate.toISOString(),
      analysis,
      userName: user.name,
    };

    saveEntry(newEntry);
    loadEntries();
    // Update entries for selected date
    const dateEntries = getEntriesForDate(selectedDate);
    setEntries(dateEntries);
  };

  const handleEdit = (entry: Entry) => {
    setSelectedEntry(entry);
    setEditModalOpen(true);
  };

  const handleUpdate = (updatedEntry: Entry) => {
    updateEntry(updatedEntry.id, updatedEntry);
    loadEntries();
  };

  const handleDelete = (id: string) => {
    deleteEntry(id);
    loadEntries();
  };

  const displayDate = selectedDate.toLocaleDateString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-950 pb-32">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-sm text-gray-400">Hej {user?.name}! 👋</h1>
              <h2 className="text-xl font-semibold capitalize">{displayDate}</h2>
            </div>
            
            {/* View Toggle */}
            <div className="flex gap-1 bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'compact'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Rows3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <CalendarDays className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('insights')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'insights'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4">
        {viewMode === 'insights' ? (
          <Insights entries={allEntries} />
        ) : viewMode === 'calendar' ? (
          <div className="mb-6">
            <Calendar
              entries={allEntries}
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
            />
          </div>
        ) : null}

        {/* Entries List */}
        {entries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">
              {viewMode === 'calendar' ? 'Inga inlägg detta datum' : 'Inga inlägg idag ännu'}
            </p>
            <p className="text-sm">Tryck på en knapp nedan för att börja</p>
          </div>
        ) : (
          <div>
            {viewMode === 'compact' ? (
              entries.map((entry) => (
                <CompactEntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={handleEdit}
                />
              ))
            ) : (
              entries.map((entry) => (
                <EntryCard 
                  key={entry.id} 
                  entry={entry}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <ActionBar onAction={handleAction} />

      {/* Entry Modal */}
      <EntryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={selectedType}
        onSave={handleSave}
      />

      {/* Edit Entry Modal */}
      {selectedEntry && (
        <EditEntryModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedEntry(null);
          }}
          entry={selectedEntry}
          onSave={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, getTodayEntries, getEntries, saveEntry, updateEntry, deleteEntry } from '@/lib/storage';
import { Entry, EntryType, User, UserProfile } from '@/types';
import EntryCard from '@/components/EntryCard';
import ActionBar from '@/components/ActionBar';
import EntryModal from '@/components/EntryModal';
import PlansCard from '@/components/PlansCard';
import SmartPlansCard from '@/components/SmartPlansCard';
import SmartPlanModal from '@/components/SmartPlanModal';
import EditEntryModal from '@/components/EditEntryModal';
import Calendar from '@/components/Calendar';
import InfiniteCalendar from '@/components/InfiniteCalendar';
import { CalendarDays, List, Rows3, BarChart3, LogOut, Clock, MessageCircle, User as UserIcon, Target } from 'lucide-react';
import CompactEntryCard from '@/components/CompactEntryCard';
import Insights from '@/components/Insights';
import TimelineView from '@/components/TimelineView';
import AIChatModal from '@/components/AIChatModal';
import ProfileModal from '@/components/ProfileModal';

const DEFAULT_PROFILE: UserProfile = {
  diagnoses: [],
  confirmedTriggers: [],
  safeFoods: [],
  regularMedications: [],
  diet: 'normal',
  goals: [],
  notes: '',
};

type ViewMode = 'timeline' | 'list' | 'calendar' | 'insights';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [selectedType, setSelectedType] = useState<EntryType>('FOOD');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const router = useRouter();

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      router.push('/');
    } else {
      setUser(currentUser);
      loadEntries();
      loadProfile();
    }
  }, [router]);

  const loadProfile = () => {
    const savedProfile = localStorage.getItem('gut_tracker_profile');
    if (savedProfile) {
      try {
        setUserProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error('Failed to load profile:', e);
      }
    }
  };

  const saveProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('gut_tracker_profile', JSON.stringify(profile));
  };

  const loadEntries = async () => {
    const todayEntries = await getTodayEntries();
    setEntries(todayEntries);
    const all = await getEntries();
    setAllEntries(all);
    return all; // Returnera för att kunna använda i handleSave
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

  const handleSave = async (text: string, type: EntryType, timestamp: Date, meta?: { gasLevel?: number }) => {
    if (!user) return;

    try {
      // Call API to analyze
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, type }),
      });

      if (!response.ok) {
        console.error('API error:', response.status);
        throw new Error('Failed to analyze entry');
      }

      const analysis = await response.json();

      // Check if response is an error
      if (analysis.error) {
        console.error('Analysis error:', analysis.error, analysis.details);
        // Use fallback analysis
        analysis.type = type;
        analysis.summary = text;
      }

      // Använd AI:ns timestamp om den finns, annars användarens valda tid
      let finalTimestamp = timestamp;
      if (analysis.timestamp) {
        const aiTime = new Date(analysis.timestamp);
        // Endast använd AI:ns tid om den verkar rimlig (inom samma dag eller igår)
        const daysDiff = Math.abs(aiTime.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff <= 1 && !isNaN(aiTime.getTime())) {
          finalTimestamp = aiTime;
        }
      }

      // Lägg till gasnivå om användaren valt (endast symptom)
      if (type === 'SYMPTOM' && typeof meta?.gasLevel === 'number') {
        const gasLevel = meta.gasLevel;
        analysis.symptomData = {
          ...(analysis.symptomData || { type: 'Gas', intensity: 5 }),
          gasLevel,
        };
        if (gasLevel > 0) {
          const tagSet = new Set<string>(analysis.tags || []);
          tagSet.add('gas');
          tagSet.add(`gas_${gasLevel}`);
          analysis.tags = Array.from(tagSet);
        }
      }

      const newEntry: Entry = {
        id: Date.now().toString(),
        text,
        createdAt: finalTimestamp.toISOString(),
        analysis,
        userId: user.id,
      };

      await saveEntry(newEntry);
      
      // Reload entries - använd den nya datan direkt
      const updatedAll = await loadEntries();
      
      // Filtrera för valt datum (använd ny data, inte closure)
      const dateEntries = updatedAll.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        return entryDate.toDateString() === selectedDate.toDateString();
      });
      setEntries(dateEntries);
      
      setModalOpen(false);
    } catch (error) {
      console.error('Failed to save entry:', error);
      alert('Kunde inte spara inlägg. Försök igen.');
    }
  };

  const handleEdit = (entry: Entry) => {
    setSelectedEntry(entry);
    setEditModalOpen(true);
  };

  const handleUpdate = async (updatedEntry: Entry) => {
    await updateEntry(updatedEntry.id, updatedEntry);
    const updatedAll = await loadEntries();
    const dateEntries = updatedAll.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      return entryDate.toDateString() === selectedDate.toDateString();
    });
    setEntries(dateEntries);
    setEditModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteEntry(id);
    const updatedAll = await loadEntries();
    const dateEntries = updatedAll.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      return entryDate.toDateString() === selectedDate.toDateString();
    });
    setEntries(dateEntries);
    setEditModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('gut_tracker_user');
    router.push('/auth');
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
      <div className="bg-gray-900 border-b border-gray-800 p-4 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4">
          {/* Top row: greeting + actions */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-sm text-gray-400">Hej {user?.name}!</h1>
              <h2 className="text-lg sm:text-xl font-semibold capitalize">{displayDate}</h2>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setChatModalOpen(true)}
                className="p-2 text-gray-400 hover:text-green-400 hover:bg-gray-800 rounded-lg transition-colors"
                title="AI Radgivare"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => setProfileModalOpen(true)}
                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition-colors"
                title="Min Profil"
              >
                <UserIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPlanModalOpen(true)}
                className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-800 rounded-lg transition-colors"
                title="Planer"
              >
                <Target className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                title="Logga ut"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* View Toggle */}
          <div className="flex gap-1 bg-gray-800 p-1 rounded-lg w-fit">
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Tidslinje"
            >
              <Clock className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Lista"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Kalender"
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
              title="Insikter"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4">
        {/* Smart Plans with auto-tracking */}
        <div className="mb-4">
          <SmartPlansCard entries={allEntries} />
        </div>
        {viewMode === 'insights' ? (
          <Insights entries={allEntries} />
        ) : viewMode === 'calendar' ? (
          <div className="mb-6 space-y-4">
            <InfiniteCalendar
              entries={allEntries}
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
            />
          </div>
        ) : viewMode === 'timeline' ? (
          <TimelineView entries={entries} onEdit={handleEdit} />
        ) : null}

        {/* Entries List - bara för list-vy */}
        {viewMode === 'list' && (
          entries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">Inga inlägg idag ännu</p>
              <p className="text-sm">Tryck på en knapp nedan för att börja</p>
            </div>
          ) : (
            <div>
              {entries.map((entry) => (
                <EntryCard 
                  key={entry.id} 
                  entry={entry}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )
        )}

        {/* Kalender datum-entries */}
        {viewMode === 'calendar' && (
          entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg mb-2">Inga inlägg detta datum</p>
              <p className="text-sm">Välj ett datum eller lägg till nytt</p>
            </div>
          ) : (
            <div>
              {entries.map((entry) => (
                <EntryCard 
                  key={entry.id} 
                  entry={entry}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )
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
        selectedDate={selectedDate}
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

      {/* Smart Plan Modal */}
      <SmartPlanModal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        onCreated={() => {
          setPlanModalOpen(false);
          loadEntries(); // Reload to trigger adherence check
        }}
      />

      {/* AI Chat Modal */}
      <AIChatModal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        profile={userProfile}
        onOpenProfile={() => {
          setChatModalOpen(false);
          setProfileModalOpen(true);
        }}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profile={userProfile}
        onSave={saveProfile}
      />
    </div>
  );
}

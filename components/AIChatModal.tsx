'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, Calendar, UserCircle, Sparkles } from 'lucide-react';
import { ChatMessage, UserProfile } from '@/types';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: UserProfile;
  onOpenProfile: () => void;
}

export default function AIChatModal({ isOpen, onClose, profile, onOpenProfile }: AIChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [daysBack, setDaysBack] = useState(7);
  const [entriesAnalyzed, setEntriesAnalyzed] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Välkomstmeddelande
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Hej! 👋 Jag är Dr. GutMind, din AI-rådgivare för maghälsa.

Jag har tillgång till din loggade data och kan hjälpa dig att:
• 🔍 Hitta mönster mellan mat och symptom
• 📊 Analysera trender i din data
• 💡 Ge personliga tips och råd
• ❓ Svara på frågor om din maghälsa

**Några exempel på vad du kan fråga:**
- "Varför hade jag ont i magen igår?"
- "Vilka triggers ser du i min data?"
- "Hur har min Bristol-skala sett ut senaste veckan?"
- "Vad borde jag undvika baserat på min historik?"

${!profile?.diagnoses?.length ? '\n💡 **Tips:** Fyll i din profil för bättre anpassade råd!' : ''}

Vad kan jag hjälpa dig med idag?`,
        timestamp: new Date().toISOString()
      }]);
    }
  }, [isOpen, messages.length, profile]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('gut_tracker_token');
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.filter(m => m.id !== 'welcome').map(m => ({
            role: m.role,
            content: m.content
          })),
          profile,
          daysBack
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      setEntriesAnalyzed(data.entriesAnalyzed);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Ursäkta, något gick fel. Försök igen om en stund.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setEntriesAnalyzed(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 w-full h-full sm:w-[600px] sm:h-[80vh] sm:max-h-[700px] sm:rounded-2xl flex flex-col border border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-b border-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Dr. GutMind</h2>
              <p className="text-xs text-gray-400">Din AI-rådgivare för maghälsa</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenProfile}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="Min profil"
            >
              <UserCircle className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings bar */}
        <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-400">Analyserar:</span>
            <select
              value={daysBack}
              onChange={(e) => setDaysBack(Number(e.target.value))}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
            >
              <option value={3}>3 dagar</option>
              <option value={7}>7 dagar</option>
              <option value={14}>14 dagar</option>
              <option value={30}>30 dagar</option>
              <option value={90}>90 dagar</option>
            </select>
          </div>
          {entriesAnalyzed !== null && (
            <span className="text-gray-500 text-xs">
              {entriesAnalyzed} registreringar
            </span>
          )}
          {messages.length > 1 && (
            <button
              onClick={clearChat}
              className="text-gray-500 hover:text-gray-300 text-xs"
            >
              Rensa chatt
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-blue-600' 
                  : 'bg-purple-600'
              }`}>
                {message.role === 'user' 
                  ? <User className="w-4 h-4" />
                  : <Bot className="w-4 h-4" />
                }
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-100'
              }`}>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>
                      {line.startsWith('**') && line.endsWith('**') 
                        ? <strong>{line.slice(2, -2)}</strong>
                        : line.startsWith('• ') 
                          ? <span className="block ml-2">{line}</span>
                          : line
                      }
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-gray-800 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Analyserar din data...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-800 bg-gray-900">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ställ en fråga om din maghälsa..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none min-h-[48px] max-h-[120px]"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white p-3 rounded-xl transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            AI-rådgivning ersätter inte medicinsk vård. Kontakta läkare vid allvarliga symptom.
          </p>
        </div>
      </div>
    </div>
  );
}

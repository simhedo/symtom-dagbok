# Smart Gut Tracker - Copilot Instructions

## Project Overview
A mobile-optimized MVP for tracking gut health with AI-powered analysis.

## Tech Stack
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Lucide React (icons)
- OpenAI API (för AI-analys)
- localStorage for persistence (structured for future Supabase migration)

## Development Guidelines

### 🔍 Error Checking - VIKTIGT!
- **ALLTID** använd `get_errors` verktyget INNAN du gör ändringar
- **ALLTID** kör `get_errors` EFTER du gjort ändringar för att verifiera
- Fixa alla kompileringsfel omedelbart
- Vänta INTE på att användaren rapporterar fel

### 📱 Design Principles
- Mobile-first design med dark theme
- Large, touch-friendly buttons (minst 44x44px)
- Swipe-gester för redigering på mobil
- Smooth animationer och övergångar

### 🤖 AI Integration
- Alla inlägg analyseras via OpenAI API
- AI extraherar triggers, ingredienser, och kategoriserar
- JSON-format för strukturerad data
- Fallback-hantering om AI inte returnerar valid JSON

### 💾 Data Storage
- localStorage för MVP
- Strukturerad för framtida Supabase-migration
- Alla triggers och ingredienser sparas för autocomplete
- Använd helper-funktioner i `lib/storage.ts`

### ✏️ Edit Functionality
- Swipe-gester på mobil (swipa vänster för att visa actions)
- Click/tap för desktop
- Kan ändra kategori, text, ingredienser, triggers
- Radera med bekräftelse-dialog

### 📝 Code Style
- TypeScript strict mode
- Functional components med hooks
- Props interfaces för alla components
- Beskrivande variabelnamn på svenska för UI-text

## Project Status
- [x] Create copilot-instructions.md file
- [x] Get Next.js project setup info
- [x] Scaffold Next.js project with dependencies
- [x] Create app structure and components
- [x] Implement localStorage utilities
- [x] Create API route for OpenAI analysis
- [x] Install dependencies and compile
- [x] Create development task
- [x] Add calendar view with month navigation
- [x] Add edit/delete functionality with swipe gestures
- [x] Implement smart autocomplete for triggers and ingredients

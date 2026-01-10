# Anna's App - Implementation Plan

## Overview

A personal life-tracking web app that connects directly to Garmin Connect to pull your health data (sleep, steps, heart rate), combined with habit tracking, mood logging, and rich visualizations.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              ANNA'S APP                                     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     FRONTEND (Next.js 14 App Router)                │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐           │   │
│  │  │ Dashboard │ │  Habits   │ │   Mood    │ │  Health   │           │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘           │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐                         │   │
│  │  │ Insights  │ │  History  │ │ Settings  │                         │   │
│  │  └───────────┘ └───────────┘ └───────────┘                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     BACKEND (Next.js API Routes)                    │   │
│  │  /api/habits    /api/moods    /api/entries    /api/garmin/sync      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          │                    │                             │
│                          ▼                    ▼                             │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐        │
│  │     SUPABASE (PostgreSQL)    │  │      GARMIN CONNECT          │        │
│  │  • habits, completions       │  │   (via garmin-connect pkg)   │        │
│  │  • moods                     │  │  • Sleep data                │        │
│  │  • health_data               │  │  • Steps                     │        │
│  │  • daily_entries             │  │  • Heart rate                │        │
│  │  • garmin_tokens (encrypted) │  │  • Activities                │        │
│  └──────────────────────────────┘  └──────────────────────────────┘        │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Next.js 14 (App Router) | Full-stack React framework |
| **Language** | TypeScript | Type safety |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Components** | shadcn/ui | Beautiful, accessible UI components |
| **Database** | Supabase (PostgreSQL) | Cloud database + auth |
| **Garmin** | `garmin-connect` | Unofficial Garmin API client |
| **Charts** | Recharts | React charting library |
| **Heatmaps** | Custom + react-activity-calendar | GitHub-style contribution graphs |
| **Date Utils** | date-fns | Date manipulation |
| **Auth** | Supabase Auth | Simple email/password auth |
| **Hosting** | Vercel | Deployment platform |

---

## Database Schema

```sql
-- Users (handled by Supabase Auth, but we extend it)
create table profiles (
  id uuid references auth.users primary key,
  display_name text,
  timezone text default 'America/Los_Angeles',
  created_at timestamptz default now()
);

-- Garmin tokens (encrypted)
create table garmin_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  oauth1_token jsonb, -- encrypted
  oauth2_token jsonb, -- encrypted
  last_sync_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Habits
create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  icon text default '✓',
  color text default '#3b82f6',
  frequency text default 'daily', -- daily, weekly, custom
  target_per_week int default 7,
  archived boolean default false,
  created_at timestamptz default now()
);

-- Habit completions
create table habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits on delete cascade not null,
  user_id uuid references auth.users not null,
  date date not null,
  completed boolean default true,
  notes text,
  created_at timestamptz default now(),
  unique(habit_id, date)
);

-- Mood entries
create table moods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date date not null,
  mood int check (mood >= 1 and mood <= 5), -- 1=awful, 5=great
  energy int check (energy >= 1 and energy <= 5),
  stress int check (stress >= 1 and stress <= 5),
  notes text,
  tags text[], -- ['productive', 'anxious', 'social']
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- Health data (from Garmin)
create table health_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date date not null,
  -- Sleep
  sleep_start timestamptz,
  sleep_end timestamptz,
  sleep_duration_seconds int,
  deep_sleep_seconds int,
  light_sleep_seconds int,
  rem_sleep_seconds int,
  awake_seconds int,
  -- Activity
  steps int,
  distance_meters int,
  active_calories int,
  total_calories int,
  floors_climbed int,
  -- Heart
  resting_heart_rate int,
  min_heart_rate int,
  max_heart_rate int,
  avg_heart_rate int,
  -- Stress (if available)
  avg_stress_level int,
  -- Raw data for future use
  raw_sleep_data jsonb,
  raw_heart_data jsonb,
  -- Meta
  synced_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- Daily journal entries
create table daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date date not null,
  journal text,
  gratitude text[],
  highlights text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

-- Indexes for performance
create index idx_habit_completions_date on habit_completions(date);
create index idx_moods_date on moods(date);
create index idx_health_data_date on health_data(date);
create index idx_daily_entries_date on daily_entries(date);
```

---

## Pages & Features

### 1. Dashboard (`/`)
- Today's snapshot: mood, habits completed, sleep score, steps
- Quick-add mood and habit buttons
- Weekly trends mini-charts
- Streak counters

### 2. Habits (`/habits`)
- List of habits with today's status
- Add/edit/delete habits
- Weekly view (7-day grid)
- Streak tracking
- Completion rate stats

### 3. Mood (`/mood`)
- Quick mood logger (emoji scale + sliders)
- Mood calendar (heatmap by month)
- Mood trends over time
- Tag analysis ("when do I feel best?")

### 4. Health (`/health`)
- Sleep dashboard (duration, stages, trends)
- Steps & activity
- Heart rate trends
- Correlations (sleep vs mood, steps vs energy)

### 5. Insights (`/insights`)
- Correlation analysis (sleep <-> mood, exercise <-> energy)
- Weekly/monthly reports
- Best days analysis
- Pattern detection

### 6. History (`/history`)
- Calendar view of all data
- Click any day to see full details
- Export data (CSV/JSON)

### 7. Settings (`/settings`)
- Manage habits
- Garmin connection (connect/disconnect/re-auth)
- Theme (dark/light)
- Data backup/export

---

## Visualizations

| Type | Library | Use Case |
|------|---------|----------|
| **Line Chart** | Recharts | Sleep duration, HR, steps over time |
| **Bar Chart** | Recharts | Weekly habit completion |
| **Area Chart** | Recharts | Sleep stages stacked |
| **Heatmap** | Custom/react-activity-calendar | Year view of mood/habits |
| **Radar Chart** | Recharts | Daily wellness score |
| **Scatter Plot** | Recharts | Sleep vs mood correlation |
| **Sparklines** | Recharts | Mini trends in cards |
| **Progress Ring** | Custom SVG | Daily habit progress |

---

## Garmin Sync Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      GARMIN SYNC FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. INITIAL SETUP (one-time)                                    │
│     ┌─────────┐      ┌─────────┐      ┌─────────┐              │
│     │  User   │ ───▶ │ Enter   │ ───▶ │  Login  │              │
│     │ clicks  │      │ Garmin  │      │   via   │              │
│     │ Connect │      │ creds   │      │ library │              │
│     └─────────┘      └─────────┘      └────┬────┘              │
│                                            │                    │
│                                            ▼                    │
│                                   ┌─────────────────┐          │
│                                   │ Save OAuth1/2   │          │
│                                   │ tokens to DB    │          │
│                                   │ (encrypted)     │          │
│                                   └─────────────────┘          │
│                                                                 │
│  2. DAILY SYNC (automatic or manual)                           │
│     ┌─────────┐      ┌─────────┐      ┌─────────┐              │
│     │  Cron   │ ───▶ │  Load   │ ───▶ │  Fetch  │              │
│     │  job    │      │ tokens  │      │  data   │              │
│     │ or btn  │      │ from DB │      │ from GC │              │
│     └─────────┘      └─────────┘      └────┬────┘              │
│                                            │                    │
│                      ┌─────────────────────┘                    │
│                      ▼                                          │
│              ┌───────────────┐                                  │
│              │ getSleepData()│                                  │
│              │ getSteps()    │───▶ Store in health_data table  │
│              │ getHeartRate()│                                  │
│              └───────────────┘                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
annas-app/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # Sidebar layout
│   │   │   ├── page.tsx                # Dashboard home
│   │   │   ├── habits/page.tsx
│   │   │   ├── mood/page.tsx
│   │   │   ├── health/page.tsx
│   │   │   ├── insights/page.tsx
│   │   │   ├── history/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/
│   │   │   ├── habits/route.ts
│   │   │   ├── habits/[id]/route.ts
│   │   │   ├── moods/route.ts
│   │   │   ├── health/route.ts
│   │   │   ├── entries/route.ts
│   │   │   ├── garmin/
│   │   │   │   ├── connect/route.ts    # Initial Garmin auth
│   │   │   │   ├── sync/route.ts       # Fetch & store data
│   │   │   │   └── status/route.ts     # Connection status
│   │   │   └── insights/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                         # shadcn components
│   │   ├── dashboard/
│   │   │   ├── stat-card.tsx
│   │   │   ├── habit-toggle.tsx
│   │   │   ├── mood-picker.tsx
│   │   │   └── weekly-chart.tsx
│   │   ├── charts/
│   │   │   ├── line-chart.tsx
│   │   │   ├── heatmap.tsx
│   │   │   ├── sleep-stages.tsx
│   │   │   └── correlation-scatter.tsx
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── mobile-nav.tsx
│   │   └── forms/
│   │       ├── habit-form.tsx
│   │       ├── mood-form.tsx
│   │       └── garmin-connect-form.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser client
│   │   │   ├── server.ts               # Server client
│   │   │   └── middleware.ts
│   │   ├── garmin/
│   │   │   ├── client.ts               # Garmin Connect wrapper
│   │   │   ├── sync.ts                 # Sync logic
│   │   │   └── types.ts
│   │   └── utils/
│   │       ├── dates.ts
│   │       ├── calculations.ts         # Streaks, correlations
│   │       └── encryption.ts           # For Garmin creds
│   ├── hooks/
│   │   ├── use-habits.ts
│   │   ├── use-moods.ts
│   │   └── use-health-data.ts
│   └── types/
│       ├── database.ts                 # Supabase generated types
│       ├── habits.ts
│       ├── moods.ts
│       └── health.ts
├── public/
│   └── icons/
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .env.local                          # Environment variables
├── tailwind.config.ts
├── next.config.js
└── package.json
```

---

## Implementation Phases

### Phase 1: Project Setup (Foundation)
- [x] Initialize Next.js 14 with TypeScript
- [ ] Install and configure Tailwind CSS
- [ ] Install and set up shadcn/ui components
- [ ] Install core dependencies (garmin-connect, recharts, date-fns, etc.)
- [ ] Create Supabase client configuration
- [ ] Create database schema SQL file
- [ ] Build sidebar layout with navigation
- [ ] Create auth pages (login/signup)
- [ ] Create dashboard page skeleton
- [ ] Create placeholder pages (habits, mood, health, insights, history, settings)

### Phase 2: Habit Tracking
- [ ] Habits CRUD API routes
- [ ] Habit list component with today's toggles
- [ ] Add/edit habit modal
- [ ] Weekly grid view
- [ ] Streak calculation logic
- [ ] Habit completion statistics

### Phase 3: Mood Tracking
- [ ] Mood entry API routes
- [ ] Mood picker component (emoji + sliders)
- [ ] Mood list/history view
- [ ] Basic mood line chart

### Phase 4: Garmin Integration
- [ ] Install & configure `garmin-connect`
- [ ] Garmin credentials form (secure input)
- [ ] Token storage with encryption
- [ ] Sync API route (fetch sleep, steps, HR)
- [ ] Health data display components
- [ ] Manual sync button
- [ ] Auto-sync setup (daily cron via Vercel)

### Phase 5: Dashboard
- [ ] Stat cards (mood, sleep, steps, HR)
- [ ] Today's habits quick view
- [ ] Weekly trends mini-chart
- [ ] Quick mood entry

### Phase 6: Visualizations
- [ ] Sleep duration trend chart
- [ ] Sleep stages stacked area chart
- [ ] Steps bar chart
- [ ] Heart rate line chart
- [ ] Mood heatmap (year view)
- [ ] Habit heatmap
- [ ] Correlation scatter plots

### Phase 7: Insights & Polish
- [ ] Insights calculations (correlations)
- [ ] Insights page with cards
- [ ] History calendar view
- [ ] Data export (CSV/JSON)
- [ ] Dark mode
- [ ] Mobile responsiveness
- [ ] Loading states & error handling

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Encryption (for Garmin credentials)
ENCRYPTION_KEY=32-byte-random-string-here
```

---

## Security Considerations

1. **Garmin Credentials:**
   - Stored encrypted in database using AES-256
   - Only decrypted server-side when syncing
   - Never exposed to client

2. **Auth:**
   - Supabase handles auth securely
   - Row Level Security (RLS) on all tables
   - Each user can only access their own data

---

## Estimated Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1: Setup | ~2 hours | 2 hours |
| Phase 2: Habits | ~3 hours | 5 hours |
| Phase 3: Moods | ~2 hours | 7 hours |
| Phase 4: Garmin | ~4 hours | 11 hours |
| Phase 5: Dashboard | ~2 hours | 13 hours |
| Phase 6: Visualizations | ~4 hours | 17 hours |
| Phase 7: Polish | ~3 hours | 20 hours |

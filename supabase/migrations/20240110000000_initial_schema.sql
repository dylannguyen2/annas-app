-- Anna's App Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends Supabase auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  timezone text default 'Australia/Sydney',
  created_at timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Garmin credentials (encrypted tokens)
create table if not exists garmin_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  oauth1_token jsonb,
  oauth2_token jsonb,
  last_sync_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Enable RLS
alter table garmin_credentials enable row level security;

-- Garmin credentials policies
create policy "Users can view own garmin credentials"
  on garmin_credentials for select
  using (auth.uid() = user_id);

create policy "Users can insert own garmin credentials"
  on garmin_credentials for insert
  with check (auth.uid() = user_id);

create policy "Users can update own garmin credentials"
  on garmin_credentials for update
  using (auth.uid() = user_id);

create policy "Users can delete own garmin credentials"
  on garmin_credentials for delete
  using (auth.uid() = user_id);

-- Habits
create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  icon text default '✓',
  color text default '#3b82f6',
  frequency text default 'daily',
  target_per_week int default 7,
  archived boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table habits enable row level security;

-- Habits policies
create policy "Users can view own habits"
  on habits for select
  using (auth.uid() = user_id);

create policy "Users can insert own habits"
  on habits for insert
  with check (auth.uid() = user_id);

create policy "Users can update own habits"
  on habits for update
  using (auth.uid() = user_id);

create policy "Users can delete own habits"
  on habits for delete
  using (auth.uid() = user_id);

-- Habit completions
create table if not exists habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  completed boolean default true,
  notes text,
  created_at timestamptz default now(),
  unique(habit_id, date)
);

-- Enable RLS
alter table habit_completions enable row level security;

-- Habit completions policies
create policy "Users can view own habit completions"
  on habit_completions for select
  using (auth.uid() = user_id);

create policy "Users can insert own habit completions"
  on habit_completions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own habit completions"
  on habit_completions for update
  using (auth.uid() = user_id);

create policy "Users can delete own habit completions"
  on habit_completions for delete
  using (auth.uid() = user_id);

-- Moods
create table if not exists moods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  mood int check (mood >= 1 and mood <= 5),
  energy int check (energy >= 1 and energy <= 5),
  stress int check (stress >= 1 and stress <= 5),
  notes text,
  tags text[],
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- Enable RLS
alter table moods enable row level security;

-- Moods policies
create policy "Users can view own moods"
  on moods for select
  using (auth.uid() = user_id);

create policy "Users can insert own moods"
  on moods for insert
  with check (auth.uid() = user_id);

create policy "Users can update own moods"
  on moods for update
  using (auth.uid() = user_id);

create policy "Users can delete own moods"
  on moods for delete
  using (auth.uid() = user_id);

-- Health data (from Garmin)
create table if not exists health_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
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
  -- Stress
  avg_stress_level int,
  -- Raw data
  raw_sleep_data jsonb,
  raw_heart_data jsonb,
  -- Meta
  synced_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- Enable RLS
alter table health_data enable row level security;

-- Health data policies
create policy "Users can view own health data"
  on health_data for select
  using (auth.uid() = user_id);

create policy "Users can insert own health data"
  on health_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update own health data"
  on health_data for update
  using (auth.uid() = user_id);

create policy "Users can delete own health data"
  on health_data for delete
  using (auth.uid() = user_id);

-- Daily entries (journal)
create table if not exists daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  journal text,
  gratitude text[],
  highlights text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

-- Enable RLS
alter table daily_entries enable row level security;

-- Daily entries policies
create policy "Users can view own daily entries"
  on daily_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own daily entries"
  on daily_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own daily entries"
  on daily_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete own daily entries"
  on daily_entries for delete
  using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists idx_habits_user_id on habits(user_id);
create index if not exists idx_habit_completions_date on habit_completions(date);
create index if not exists idx_habit_completions_habit_id on habit_completions(habit_id);
create index if not exists idx_moods_date on moods(date);
create index if not exists idx_moods_user_id on moods(user_id);
create index if not exists idx_health_data_date on health_data(date);
create index if not exists idx_health_data_user_id on health_data(user_id);
create index if not exists idx_daily_entries_date on daily_entries(date);

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

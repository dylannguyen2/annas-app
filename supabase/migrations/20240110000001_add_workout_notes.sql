create table if not exists workout_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  workout_type text not null,
  duration_minutes int,
  intensity text check (intensity in ('light', 'moderate', 'hard', 'intense')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table workout_notes enable row level security;

create policy "Users can view own workout notes"
  on workout_notes for select
  using (auth.uid() = user_id);

create policy "Users can insert own workout notes"
  on workout_notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own workout notes"
  on workout_notes for update
  using (auth.uid() = user_id);

create policy "Users can delete own workout notes"
  on workout_notes for delete
  using (auth.uid() = user_id);

create index if not exists idx_workout_notes_date on workout_notes(date);
create index if not exists idx_workout_notes_user_id on workout_notes(user_id);

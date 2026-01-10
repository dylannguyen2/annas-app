-- Activities table (from Garmin)
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  garmin_activity_id bigint not null,
  activity_name text,
  activity_type text,
  activity_type_id int,
  start_time timestamptz,
  duration_seconds numeric,
  moving_duration_seconds numeric,
  elapsed_duration_seconds numeric,
  distance_meters numeric,
  calories int,
  avg_heart_rate int,
  max_heart_rate int,
  avg_speed numeric,
  max_speed numeric,
  elevation_gain numeric,
  elevation_loss numeric,
  steps int,
  avg_cadence numeric,
  max_cadence numeric,
  avg_power numeric,
  max_power numeric,
  total_sets int,
  total_reps int,
  location_name text,
  start_latitude numeric,
  start_longitude numeric,
  has_polyline boolean default false,
  favorite boolean default false,
  raw_data jsonb,
  synced_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(user_id, garmin_activity_id)
);

-- Enable RLS
alter table activities enable row level security;

-- Activities policies
create policy "Users can view own activities"
  on activities for select
  using (auth.uid() = user_id);

create policy "Users can insert own activities"
  on activities for insert
  with check (auth.uid() = user_id);

create policy "Users can update own activities"
  on activities for update
  using (auth.uid() = user_id);

create policy "Users can delete own activities"
  on activities for delete
  using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists idx_activities_user_id on activities(user_id);
create index if not exists idx_activities_start_time on activities(start_time);
create index if not exists idx_activities_garmin_id on activities(garmin_activity_id);
create index if not exists idx_activities_type on activities(activity_type);

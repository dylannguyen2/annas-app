create table if not exists media (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  tmdb_id int not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  poster_url text,
  backdrop_url text,
  overview text,
  release_date text,
  runtime int,
  vote_average numeric(3,1),
  genres text[],
  status text default 'want_to_watch' check (status in ('want_to_watch', 'watching', 'finished')),
  rating int check (rating >= 1 and rating <= 5),
  notes text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now() not null,
  unique(user_id, tmdb_id, media_type)
);

alter table media enable row level security;

create policy "Users can view their own media"
  on media for select
  using (auth.uid() = user_id);

create policy "Users can insert their own media"
  on media for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own media"
  on media for update
  using (auth.uid() = user_id);

create policy "Users can delete their own media"
  on media for delete
  using (auth.uid() = user_id);

create index media_user_id_idx on media(user_id);
create index media_status_idx on media(status);
create index media_type_idx on media(media_type);

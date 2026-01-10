create table if not exists books (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  open_library_key text,
  title text not null,
  author text,
  cover_url text,
  isbn text,
  page_count int,
  status text default 'want_to_read' check (status in ('want_to_read', 'reading', 'finished')),
  rating int check (rating >= 1 and rating <= 5),
  notes text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now() not null
);

alter table books enable row level security;

create policy "Users can view their own books"
  on books for select
  using (auth.uid() = user_id);

create policy "Users can insert their own books"
  on books for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own books"
  on books for update
  using (auth.uid() = user_id);

create policy "Users can delete their own books"
  on books for delete
  using (auth.uid() = user_id);

create index books_user_id_idx on books(user_id);
create index books_status_idx on books(status);

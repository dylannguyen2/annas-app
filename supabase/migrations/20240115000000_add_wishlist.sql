create table if not exists wishlist_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  url text not null,
  title text not null,
  image_url text,
  price text,
  currency text,
  site_name text,
  notes text,
  purchased boolean default false,
  created_at timestamptz default now() not null
);

alter table wishlist_items enable row level security;

create policy "Users can view their own wishlist items"
  on wishlist_items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own wishlist items"
  on wishlist_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own wishlist items"
  on wishlist_items for update
  using (auth.uid() = user_id);

create policy "Users can delete their own wishlist items"
  on wishlist_items for delete
  using (auth.uid() = user_id);

create index wishlist_items_user_id_idx on wishlist_items(user_id);
create index wishlist_items_purchased_idx on wishlist_items(purchased);

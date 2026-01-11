-- Budget Tracker Schema

-- Budget categories (user-customizable)
create table if not exists budget_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  icon text default '📦',
  color text default '#6b7280',
  type text check (type in ('expense', 'income')) default 'expense',
  archived boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Enable RLS
alter table budget_categories enable row level security;

drop policy if exists "Users can view own budget categories" on budget_categories;
create policy "Users can view own budget categories"
  on budget_categories for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own budget categories" on budget_categories;
create policy "Users can insert own budget categories"
  on budget_categories for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own budget categories" on budget_categories;
create policy "Users can update own budget categories"
  on budget_categories for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own budget categories" on budget_categories;
create policy "Users can delete own budget categories"
  on budget_categories for delete
  using (auth.uid() = user_id);

-- Monthly budgets (limits per category per month)
create table if not exists monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  category_id uuid references budget_categories on delete cascade not null,
  month date not null, -- First day of month (e.g., 2024-01-01)
  amount decimal(12,2) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, category_id, month)
);

-- Enable RLS
alter table monthly_budgets enable row level security;

drop policy if exists "Users can view own monthly budgets" on monthly_budgets;
create policy "Users can view own monthly budgets"
  on monthly_budgets for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own monthly budgets" on monthly_budgets;
create policy "Users can insert own monthly budgets"
  on monthly_budgets for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own monthly budgets" on monthly_budgets;
create policy "Users can update own monthly budgets"
  on monthly_budgets for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own monthly budgets" on monthly_budgets;
create policy "Users can delete own monthly budgets"
  on monthly_budgets for delete
  using (auth.uid() = user_id);

-- Transactions (individual income/expense entries)
create table if not exists budget_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  category_id uuid references budget_categories on delete set null,
  type text check (type in ('expense', 'income')) not null,
  amount decimal(12,2) not null,
  description text,
  date date not null,
  notes text,
  recurring_id uuid, -- Links to recurring_transactions if auto-generated
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table budget_transactions enable row level security;

drop policy if exists "Users can view own budget transactions" on budget_transactions;
create policy "Users can view own budget transactions"
  on budget_transactions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own budget transactions" on budget_transactions;
create policy "Users can insert own budget transactions"
  on budget_transactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own budget transactions" on budget_transactions;
create policy "Users can update own budget transactions"
  on budget_transactions for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own budget transactions" on budget_transactions;
create policy "Users can delete own budget transactions"
  on budget_transactions for delete
  using (auth.uid() = user_id);

-- Recurring transactions (templates for auto-generation)
create table if not exists recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  category_id uuid references budget_categories on delete set null,
  type text check (type in ('expense', 'income')) not null,
  amount decimal(12,2) not null,
  description text not null,
  frequency text check (frequency in ('daily', 'weekly', 'fortnightly', 'monthly', 'yearly')) not null,
  start_date date not null,
  end_date date, -- null = no end
  day_of_month int, -- For monthly: which day (1-31)
  day_of_week int, -- For weekly: which day (0=Sun, 6=Sat)
  last_generated_date date, -- Track when we last created a transaction
  active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table recurring_transactions enable row level security;

drop policy if exists "Users can view own recurring transactions" on recurring_transactions;
create policy "Users can view own recurring transactions"
  on recurring_transactions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own recurring transactions" on recurring_transactions;
create policy "Users can insert own recurring transactions"
  on recurring_transactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own recurring transactions" on recurring_transactions;
create policy "Users can update own recurring transactions"
  on recurring_transactions for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own recurring transactions" on recurring_transactions;
create policy "Users can delete own recurring transactions"
  on recurring_transactions for delete
  using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists idx_budget_categories_user_id on budget_categories(user_id);
create index if not exists idx_monthly_budgets_user_id on monthly_budgets(user_id);
create index if not exists idx_monthly_budgets_month on monthly_budgets(month);
create index if not exists idx_budget_transactions_user_id on budget_transactions(user_id);
create index if not exists idx_budget_transactions_date on budget_transactions(date);
create index if not exists idx_budget_transactions_category_id on budget_transactions(category_id);
create index if not exists idx_recurring_transactions_user_id on recurring_transactions(user_id);

-- Insert default categories for new users (trigger function)
create or replace function public.create_default_budget_categories()
returns trigger as $$
begin
  insert into public.budget_categories (user_id, name, icon, color, type, sort_order) values
    (new.id, 'Salary', '💰', '#22c55e', 'income', 0),
    (new.id, 'Freelance', '💻', '#3b82f6', 'income', 1),
    (new.id, 'Investments', '📈', '#8b5cf6', 'income', 2),
    (new.id, 'Other Income', '💵', '#6b7280', 'income', 3),
    (new.id, 'Food & Dining', '🍔', '#f97316', 'expense', 10),
    (new.id, 'Groceries', '🛒', '#84cc16', 'expense', 11),
    (new.id, 'Transport', '🚗', '#06b6d4', 'expense', 12),
    (new.id, 'Shopping', '🛍️', '#ec4899', 'expense', 13),
    (new.id, 'Entertainment', '🎬', '#a855f7', 'expense', 14),
    (new.id, 'Bills & Utilities', '📱', '#eab308', 'expense', 15),
    (new.id, 'Health', '💊', '#ef4444', 'expense', 16),
    (new.id, 'Travel', '✈️', '#14b8a6', 'expense', 17),
    (new.id, 'Subscriptions', '📺', '#6366f1', 'expense', 18),
    (new.id, 'Other', '📦', '#6b7280', 'expense', 99);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup (add default categories)
drop trigger if exists on_auth_user_created_budget on auth.users;
create trigger on_auth_user_created_budget
  after insert on auth.users
  for each row execute procedure public.create_default_budget_categories();

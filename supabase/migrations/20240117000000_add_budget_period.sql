-- Add period column to monthly_budgets to support weekly/monthly budgets
alter table monthly_budgets add column if not exists period text check (period in ('weekly', 'monthly')) default 'monthly';

-- Create index for faster lookups
create index if not exists idx_monthly_budgets_period on monthly_budgets(period);

-- Comment for clarity
comment on column monthly_budgets.period is 'Budget period: weekly or monthly';

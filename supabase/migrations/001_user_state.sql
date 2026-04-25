-- Études — user_state table
-- Run this in the Supabase SQL editor before enabling sync.

create table if not exists public.user_state (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null unique,
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- Row Level Security: each user can only read/write their own row
alter table public.user_state enable row level security;

create policy "Users can manage own state"
  on public.user_state
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Create Starter Database - v1.0

/* 
Purpose:
Paste the contents of this file into the SQL Editor in Supabase to 
create a DayBack events table and default row level security policy
*/

-- Create table (dbk_events) and standard DayBack fields
create table if not exists dbk_events (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  all_day bool,
  start_timestamp timestamptz,
  end_timestamp timestamptz,
  location text,
  resource json,
  status json,
  geocode_lat float8,
  geocode_lng float8,
  unscheduled bool
);

-- Basic row level security policy
alter table dbk_events enable row level security;

create policy "Authenticated User"
on "public"."dbk_events"
as permissive
for all
to authenticated
using (
  -- Rules for rows that already exist (edit, delete)
  true
    -- You can change true to a rule. For example if you add a user_id field you could have a rule like:
  -- (auth.uid() = user_id)
) with check (
  -- Rules for rows that don't exist (create)
  true

);

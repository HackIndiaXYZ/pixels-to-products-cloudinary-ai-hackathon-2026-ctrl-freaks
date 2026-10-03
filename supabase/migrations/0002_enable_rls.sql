-- RAW → REUSE: lock down the public schema.
-- All reads/writes go through server routes using the service-role key, which
-- bypasses RLS. Enabling RLS with NO policies denies the anon key entirely, so
-- NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be used to read or write business data.
-- Run after supabase/schema.sql. Add explicit policies when Supabase Auth is introduced.

alter table projects            enable row level security;
alter table media_assets        enable row level security;
alter table materials           enable row level security;
alter table reuse_requests      enable row level security;
alter table reuse_matches       enable row level security;
alter table generated_concepts  enable row level security;

-- SI Réactivation — schéma de référence
-- La banque de questions n'est pas stockée dans GitHub.
-- Ce fichier décrit uniquement la structure et les règles RLS.

create schema if not exists private;

create table if not exists public.reactivation_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('student','teacher')),
  track text check (track in ('TSMA','MMCM','BAC_PRO','CAP')),
  display_name text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reactivation_questions (
  id text not null,
  track text not null check (track in ('TSMA','MMCM','BAC_PRO','CAP')),
  sequence text,
  theme text,
  notion text,
  type text,
  question text not null,
  answer text not null,
  difficulty text,
  origin text,
  status text,
  source text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (id, track)
);

create table if not exists public.reactivation_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  track text not null,
  stage text not null default 'J0' check (stage in ('J0','J+2','J+7','J+21','J+45','J+90')),
  due_at timestamptz not null default now(),
  successes integer not null default 0,
  failures integer not null default 0,
  last_result text check (last_result is null or last_result in ('correct','fragile','wrong')),
  last_seen_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id, track),
  foreign key (question_id, track) references public.reactivation_questions(id, track) on delete cascade
);

create table if not exists public.reactivation_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  track text not null,
  result text not null check (result in ('correct','fragile','wrong')),
  stage_before text,
  stage_after text,
  attempted_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  foreign key (question_id, track) references public.reactivation_questions(id, track) on delete cascade
);

create or replace function private.is_reactivation_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.reactivation_profiles
    where user_id = (select auth.uid())
      and role = 'teacher'
      and active = true
  );
$$;

alter table public.reactivation_profiles enable row level security;
alter table public.reactivation_questions enable row level security;
alter table public.reactivation_state enable row level security;
alter table public.reactivation_attempts enable row level security;

drop policy if exists "profile own or teacher select" on public.reactivation_profiles;
create policy "profile own or teacher select"
on public.reactivation_profiles for select to authenticated
using ((select auth.uid()) = user_id or private.is_reactivation_teacher());

drop policy if exists "questions track select" on public.reactivation_questions;
create policy "questions track select"
on public.reactivation_questions for select to authenticated
using (
  active = true and (
    private.is_reactivation_teacher()
    or exists (
      select 1 from public.reactivation_profiles p
      where p.user_id = (select auth.uid())
        and p.active = true
        and p.track = reactivation_questions.track
    )
  )
);

drop policy if exists "state own select" on public.reactivation_state;
create policy "state own select"
on public.reactivation_state for select to authenticated
using ((select auth.uid()) = user_id or private.is_reactivation_teacher());

drop policy if exists "state own insert" on public.reactivation_state;
create policy "state own insert"
on public.reactivation_state for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.reactivation_profiles p
    where p.user_id = (select auth.uid())
      and p.active = true
      and p.track = reactivation_state.track
  )
);

drop policy if exists "state own update" on public.reactivation_state;
create policy "state own update"
on public.reactivation_state for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.reactivation_profiles p
    where p.user_id = (select auth.uid())
      and p.active = true
      and p.track = reactivation_state.track
  )
);

drop policy if exists "attempt own select" on public.reactivation_attempts;
create policy "attempt own select"
on public.reactivation_attempts for select to authenticated
using ((select auth.uid()) = user_id or private.is_reactivation_teacher());

drop policy if exists "attempt own insert" on public.reactivation_attempts;
create policy "attempt own insert"
on public.reactivation_attempts for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.reactivation_profiles p
    where p.user_id = (select auth.uid())
      and p.active = true
      and p.track = reactivation_attempts.track
  )
);

create index if not exists reactivation_state_due_idx
  on public.reactivation_state(user_id, track, due_at);

create index if not exists reactivation_attempts_user_idx
  on public.reactivation_attempts(user_id, attempted_at desc);

create index if not exists reactivation_questions_track_idx
  on public.reactivation_questions(track, active);


-- Séances de classe partagées
create table if not exists public.reactivation_sessions (
  id uuid primary key default gen_random_uuid(),
  track text not null check (track in ('TSMA','MMCM','BAC_PRO','CAP')),
  title text not null,
  session_date date not null default current_date,
  reflection_minutes integer not null default 5 check (reflection_minutes between 1 and 30),
  correction_minutes integer not null default 10 check (correction_minutes between 1 and 60),
  status text not null default 'draft' check (status in ('draft','reflection','correction','closed')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reactivation_session_questions (
  session_id uuid not null references public.reactivation_sessions(id) on delete cascade,
  position integer not null check (position between 1 and 20),
  question_id text not null,
  track text not null,
  primary key (session_id, position),
  unique(session_id, question_id),
  foreign key (question_id, track)
    references public.reactivation_questions(id, track) on delete cascade
);

alter table public.reactivation_sessions enable row level security;
alter table public.reactivation_session_questions enable row level security;

create policy "sessions authenticated select"
on public.reactivation_sessions for select to authenticated
using (
  private.is_reactivation_teacher()
  or exists (
    select 1 from public.reactivation_profiles p
    where p.user_id = (select auth.uid())
      and p.active = true
      and p.track = reactivation_sessions.track
  )
);

create policy "sessions teacher insert"
on public.reactivation_sessions for insert to authenticated
with check (private.is_reactivation_teacher() and created_by = (select auth.uid()));

create policy "sessions teacher update"
on public.reactivation_sessions for update to authenticated
using (private.is_reactivation_teacher())
with check (private.is_reactivation_teacher());

create policy "sessions teacher delete"
on public.reactivation_sessions for delete to authenticated
using (private.is_reactivation_teacher());

create policy "session questions authenticated select"
on public.reactivation_session_questions for select to authenticated
using (
  private.is_reactivation_teacher()
  or exists (
    select 1
    from public.reactivation_sessions s
    join public.reactivation_profiles p
      on p.user_id = (select auth.uid())
     and p.active = true
     and p.track = s.track
    where s.id = reactivation_session_questions.session_id
  )
);

create policy "session questions teacher insert"
on public.reactivation_session_questions for insert to authenticated
with check (private.is_reactivation_teacher());

create policy "session questions teacher delete"
on public.reactivation_session_questions for delete to authenticated
using (private.is_reactivation_teacher());

create index if not exists reactivation_sessions_track_date_idx
  on public.reactivation_sessions(track, session_date desc);

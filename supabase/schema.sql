-- Schéma de départ pour synchroniser les cours et les progrès avec Supabase.
-- À exécuter dans Supabase > SQL Editor quand le projet sera créé.
create table if not exists public.lessons (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 title text not null,
 lesson_number integer,
 created_at timestamptz not null default now()
);
create table if not exists public.lesson_items (
 id uuid primary key default gen_random_uuid(),
 lesson_id uuid not null references public.lessons(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade,
 item_type text not null default 'vocabulary',
 japanese text not null,
 romaji text,
 french text not null,
 notes text,
 sort_order integer not null default 0
);
create table if not exists public.review_progress (
 owner_id uuid not null references auth.users(id) on delete cascade,
 item_id uuid not null references public.lesson_items(id) on delete cascade,
 attempts integer not null default 0,
 correct integer not null default 0,
 next_review_at timestamptz,
 updated_at timestamptz not null default now(),
 primary key(owner_id,item_id)
);
alter table public.lessons enable row level security;
alter table public.lesson_items enable row level security;
alter table public.review_progress enable row level security;
create policy "Own lessons" on public.lessons for all to authenticated
 using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "Own lesson items" on public.lesson_items for all to authenticated
 using (owner_id = (select auth.uid())) with check (
 owner_id = (select auth.uid()) and exists (
 select 1 from public.lessons l where l.id = lesson_id and l.owner_id = (select auth.uid())
 ));
create policy "Own review progress" on public.review_progress for all to authenticated
 using (owner_id = (select auth.uid())) with check (
 owner_id = (select auth.uid()) and exists (
 select 1 from public.lesson_items i where i.id = item_id and i.owner_id = (select auth.uid())
 ));

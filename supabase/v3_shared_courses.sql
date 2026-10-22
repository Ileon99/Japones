-- V3 : cours partagés, progrès individuels, classement volontaire.
-- Exécuter une seule fois dans SQL Editor après schema.sql.
-- Le créateur des cours existants conserve les droits sur ses cours.
create table if not exists public.course_editors (
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.course_editors enable row level security;
drop policy if exists "Read own editor flag" on public.course_editors;
create policy "Read own editor flag" on public.course_editors for select to authenticated using (user_id=auth.uid());
-- L'administrateur doit être ajouté manuellement par SQL Editor,
-- jamais depuis l'application publique :
-- insert into public.course_editors(user_id) values ('UUID-DU-COMPTE');
drop policy if exists "Own lessons" on public.lessons;
drop policy if exists "Own lesson items" on public.lesson_items;
drop policy if exists "Own review progress" on public.review_progress;
create policy "Read shared lessons" on public.lessons for select to authenticated using (true);
create policy "Editor insert lessons" on public.lessons for insert to authenticated with check (
 owner_id=auth.uid() and exists(select 1 from public.course_editors e where e.user_id=auth.uid())
);
create policy "Editor update lessons" on public.lessons for update to authenticated using (
 exists(select 1 from public.course_editors e where e.user_id=auth.uid())
) with check (
 exists(select 1 from public.course_editors e where e.user_id=auth.uid())
);
create policy "Editor delete lessons" on public.lessons for delete to authenticated using (
 exists(select 1 from public.course_editors e where e.user_id=auth.uid())
);
create policy "Read shared items" on public.lesson_items for select to authenticated using (true);
create policy "Editor insert items" on public.lesson_items for insert to authenticated with check (
 owner_id=auth.uid() and exists(select 1 from public.course_editors e where e.user_id=auth.uid())
 and exists(select 1 from public.lessons l where l.id=lesson_id)
);
create policy "Editor update items" on public.lesson_items for update to authenticated using (
 exists(select 1 from public.course_editors e where e.user_id=auth.uid())
) with check(exists(select 1 from public.course_editors e where e.user_id=auth.uid()));
create policy "Editor delete items" on public.lesson_items for delete to authenticated using (
 exists(select 1 from public.course_editors e where e.user_id=auth.uid())
);
create policy "Own progress select" on public.review_progress for select to authenticated using (owner_id=auth.uid());
create policy "Own progress insert" on public.review_progress for insert to authenticated with check (owner_id=auth.uid());
create policy "Own progress update" on public.review_progress for update to authenticated using (owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy "Own progress delete" on public.review_progress for delete to authenticated using(owner_id=auth.uid());
create table if not exists public.student_profiles(
 user_id uuid primary key references auth.users(id) on delete cascade,
 nickname text not null check (char_length(nickname) between 2 and 30),
 leaderboard_opt_in boolean not null default false
);
alter table public.student_profiles enable row level security;
create policy "Own profile read" on public.student_profiles for select to authenticated using(user_id=auth.uid());
create policy "Own profile insert" on public.student_profiles for insert to authenticated with check(user_id=auth.uid());
create policy "Own profile update" on public.student_profiles for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
-- Estadísticas solo de quienes han aceptado aparecer, sin emails.
create or replace function public.get_learning_leaderboard()
returns table (nickname text, accuracy_percent numeric, attempts bigint)
language sql stable security definer set search_path=''
as $$
 select p.nickname,
 round(100.0*sum(r.correct)::numeric/nullif(sum(r.attempts),0),1) accuracy_percent,
 sum(r.attempts)::bigint attempts
 from public.student_profiles p
 join public.review_progress r on r.owner_id=p.user_id
 where auth.uid() is not null and p.leaderboard_opt_in=true
 group by p.user_id,p.nickname
 having sum(r.attempts)>=10
 order by accuracy_percent desc, attempts desc
 limit 50;
$$;
revoke all on function public.get_learning_leaderboard() from public;
grant execute on function public.get_learning_leaderboard() to authenticated;

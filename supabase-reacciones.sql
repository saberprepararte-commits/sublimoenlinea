-- Ejecuta este SQL en Supabase > SQL Editor para activar el contador de reacciones.

create table if not exists public.reaction_counts (
  reaction text primary key check (reaction in ('like', 'love')),
  total integer not null default 0,
  updated_at timestamptz not null default now()
);

create or replace function public.increment_reaction_count(reaction_name text)
returns table (reaction text, total integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  if reaction_name not in ('like', 'love') then
    raise exception 'Invalid reaction';
  end if;

  insert into public.reaction_counts (reaction, total)
  values (reaction_name, 1)
  on conflict on constraint reaction_counts_pkey do update
  set total = public.reaction_counts.total + 1,
      updated_at = now();

  return query
    select rc.reaction, rc.total
    from public.reaction_counts rc
    where rc.reaction = reaction_name;
end;
$$;

alter table public.reaction_counts enable row level security;

grant select on public.reaction_counts to anon, authenticated;
grant execute on function public.increment_reaction_count(text) to anon, authenticated;

drop policy if exists "Anyone can read reaction counts" on public.reaction_counts;
create policy "Anyone can read reaction counts"
on public.reaction_counts
for select
to anon, authenticated
using (true);

insert into public.reaction_counts (reaction, total)
values
  ('like', 350),
  ('love', 420)
on conflict (reaction) do nothing;

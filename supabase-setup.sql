-- Ejecuta este SQL en Supabase > SQL Editor.
-- Luego crea tu usuario desde Authentication > Users.
-- Finalmente reemplaza TU_USER_ID_AQUI por el id de tu usuario y ejecuta el INSERT final.

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  price text not null,
  status text not null default 'Disponible',
  image text not null,
  description text not null,
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id text primary key default 'main',
  name text not null default 'Sublimo Shop',
  tagline text not null default 'Productos seleccionados',
  whatsapp text not null default '573126611414',
  updated_at timestamptz not null default now(),
  constraint store_settings_single_row check (id = 'main')
);

create table if not exists public.reaction_counts (
  reaction text primary key check (reaction in ('like', 'love')),
  total integer not null default 0,
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins
    where user_id = auth.uid()
  );
$$;

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
  on conflict (reaction) do update
  set total = public.reaction_counts.total + 1,
      updated_at = now();

  return query
    select rc.reaction, rc.total
    from public.reaction_counts rc
    where rc.reaction = reaction_name;
end;
$$;

grant select on public.reaction_counts to anon, authenticated;
grant execute on function public.increment_reaction_count(text) to anon, authenticated;

alter table public.admins enable row level security;
alter table public.products enable row level security;
alter table public.store_settings enable row level security;
alter table public.reaction_counts enable row level security;

drop policy if exists "Admins can see own admin row" on public.admins;
create policy "Admins can see own admin row"
on public.admins
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Anyone can read products" on public.products;
create policy "Anyone can read products"
on public.products
for select
to anon, authenticated
using (true);

drop policy if exists "Only admins can insert products" on public.products;
create policy "Only admins can insert products"
on public.products
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Only admins can update products" on public.products;
create policy "Only admins can update products"
on public.products
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Only admins can delete products" on public.products;
create policy "Only admins can delete products"
on public.products
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Anyone can read store settings" on public.store_settings;
create policy "Anyone can read store settings"
on public.store_settings
for select
to anon, authenticated
using (true);

drop policy if exists "Only admins can insert store settings" on public.store_settings;
create policy "Only admins can insert store settings"
on public.store_settings
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Only admins can update store settings" on public.store_settings;
create policy "Only admins can update store settings"
on public.store_settings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Anyone can read reaction counts" on public.reaction_counts;
create policy "Anyone can read reaction counts"
on public.reaction_counts
for select
to anon, authenticated
using (true);

insert into public.store_settings (id, name, tagline, whatsapp)
values ('main', 'Sublimo Shop', 'Productos seleccionados', '573126611414')
on conflict (id) do update
set whatsapp = excluded.whatsapp;

insert into public.reaction_counts (reaction, total)
values
  ('like', 350),
  ('love', 420)
on conflict (reaction) do nothing;

insert into public.products (name, category, price, status, image, description, featured, sort_order)
values
  ('Camiseta básica Sublimo', 'Camiseta', '$ 45.000', 'Disponible', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80', 'Camiseta básica para estampados personalizados, cómoda y de alta calidad.', true, 10),
  ('Camiseta estampada Dallas', 'Camiseta', '$ 58.000', 'Disponible', 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?auto=format&fit=crop&w=900&q=80', 'Diseño estampado sobre camiseta blanca, ideal para un look urbano.', true, 20),
  ('Set cerámica Nube', 'Hogar', '$ 120.000', 'Disponible', 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=80', 'Piezas esmaltadas para mesa, disponibles en tonos claros y acabado mate.', false, 30),
  ('Camisa lino Oliva', 'Ropa', '$ 145.000', 'Por encargo', 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80', 'Camisa fresca de corte relajado, ideal para clima cálido y uso diario.', false, 40),
  ('Vela Botánica', 'Decoración', '$ 42.000', 'Disponible', 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=80', 'Aroma suave con notas herbales, vaso reutilizable y cera vegetal.', false, 50)
on conflict do nothing;

-- Ejecuta esto solo después de crear tu usuario en Authentication > Users:
-- insert into public.admins (user_id) values ('TU_USER_ID_AQUI');

create table if not exists public.store_settings (
  id boolean primary key default true check (id),
  store_name text not null default 'Açaí 24 horas',
  is_open boolean not null default true,
  opening_hours jsonb not null default '{"tue_sun":"12:00-23:59","mon":"closed"}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  price_cents integer not null check (price_cents >= 0),
  description text not null default '',
  image_url text,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  delivery_address text not null,
  items jsonb not null,
  total_cents integer not null check (total_cents >= 0),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  fulfillment_status text not null default 'new' check (fulfillment_status in ('new','preparing','delivery','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.store_settings enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

create policy "public can view available products" on public.products for select to anon, authenticated using (is_available = true);
create policy "public can view store settings" on public.store_settings for select to anon, authenticated using (true);

create policy "admin manages store settings" on public.store_settings for all to authenticated
using ((select auth.uid()) = 'bd6c3942-4ecf-45b4-a438-8e5002aa110a'::uuid)
with check ((select auth.uid()) = 'bd6c3942-4ecf-45b4-a438-8e5002aa110a'::uuid);

create policy "admin manages products" on public.products for all to authenticated
using ((select auth.uid()) = 'bd6c3942-4ecf-45b4-a438-8e5002aa110a'::uuid)
with check ((select auth.uid()) = 'bd6c3942-4ecf-45b4-a438-8e5002aa110a'::uuid);

create policy "admin manages orders" on public.orders for all to authenticated
using ((select auth.uid()) = 'bd6c3942-4ecf-45b4-a438-8e5002aa110a'::uuid)
with check ((select auth.uid()) = 'bd6c3942-4ecf-45b4-a438-8e5002aa110a'::uuid);

-- Orders are deliberately server-only. Use the service role exclusively in API routes.
grant select on public.products, public.store_settings to anon, authenticated;

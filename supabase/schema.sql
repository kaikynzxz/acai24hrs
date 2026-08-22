-- =============================================================
-- AÇAÍ 24 HORAS — Schema Supabase
-- Execute no SQL Editor do Supabase Dashboard
-- =============================================================

-- ── store_settings ───────────────────────────────────────────
create table if not exists public.store_settings (
  id boolean primary key default true check (id),
  store_name text not null default 'Açaí 24 horas',
  is_open boolean not null default true,
  opening_hours jsonb not null default '{"tue_sun":"12:00-23:59","mon":"closed"}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Garante que sempre exista uma linha
insert into public.store_settings (id) values (true) on conflict (id) do nothing;

-- ── products ─────────────────────────────────────────────────
create table if not exists public.products (
  id text primary key,
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

-- ── orders ───────────────────────────────────────────────────
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text,
  customer_name text not null,
  customer_phone text not null,
  delivery_address text not null,
  items jsonb not null,
  total_cents integer not null check (total_cents >= 0),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  fulfillment_status text not null default 'new' check (fulfillment_status in ('new','preparing','delivery','completed','cancelled')),
  privacy_accepted boolean not null default false,
  marketing_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_orders_stripe_session_id on public.orders (stripe_session_id) where stripe_session_id is not null;
create index if not exists idx_orders_status_created_at on public.orders (fulfillment_status, created_at desc);

-- ── privacy_requests ─────────────────────────────────────────
create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  request_type text not null,
  requester_name text not null,
  contact text not null,
  details text not null,
  status text not null default 'received' check (status in ('received','in_progress','completed','rejected')),
  created_at timestamptz not null default now(),
  retention_until timestamptz not null default (now() + interval '5 years')
);

create index if not exists idx_privacy_requests_status on public.privacy_requests (status, created_at desc);

-- ── RLS ──────────────────────────────────────────────────────
alter table public.store_settings enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.privacy_requests enable row level security;

-- Leitura pública de produtos disponíveis e configurações
create policy if not exists "public can view available products"
  on public.products for select to anon, authenticated
  using (is_available = true);

create policy if not exists "public can view store settings"
  on public.store_settings for select to anon, authenticated
  using (true);

-- Admin (UID fixo) gerencia tudo
create policy if not exists "admin manages store settings"
  on public.store_settings for all to authenticated
  using ((select auth.uid()) = 'bd6c3942-4ecf-45b4-a438-8e5002aa110a'::uuid)
  with check ((select auth.uid()) = 'bd6c3942-4ecf-45b4-a438-8e5002aa110a'::uuid);

create policy if not exists "admin manages products"
  on public.products for all to authenticated
  using ((select auth.uid()) = 'bd6c3942-4ecf-45b4-a438-8e5002aa110a'::uuid)
  with check ((select auth.uid()) = 'bd6c3942-4ecf-45b4-a438-8e5002aa110a'::uuid);

create policy if not exists "admin manages orders"
  on public.orders for all to authenticated
  using ((select auth.uid()) = 'bd6c3942-4ecf-45b4-a438-8e5002aa110a'::uuid)
  with check ((select auth.uid()) = 'bd6c3942-4ecf-45b4-a438-8e5002aa110a'::uuid);

-- Grants
grant select on public.products, public.store_settings to anon, authenticated;

-- =============================================================
-- SEED — produtos do cardápio
-- =============================================================
insert into public.products (id, name, category, price_cents, description, image_url, sort_order) values
  ('550',              'Açaí 550ml',                'Açaí',        2400, 'Até 8 adicionais grátis',                                        'https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202504031504_715X_blob', 1),
  ('330',              'Açaí 330ml',                'Açaí',        1800, 'Até 8 adicionais grátis',                                        'https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202504031434_H811_blob', 2),
  ('440',              'Açaí 440ml',                'Açaí',        2200, 'Até 8 adicionais grátis',                                        'https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202504031501_219T_blob', 3),
  ('770',              'Açaí 770ml',                'Açaí',        3200, 'Até 8 adicionais grátis',                                        'https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202504031509_ULFD_blob', 4),
  ('1l',               'Açaí 1 litro',              'Açaí',        4800, 'Tamanho família, adicionais grátis',                             'https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202505102323_XQB1_blob', 5),
  ('combo-amigo',      'Combo amigo • 2× 500ml',    'Combos',      3960, 'Leite condensado e leite em pó. Não permite troca dos adicionais.','https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202608041757_882C_iblob', 6),
  ('combo-kids',       'Combo Kids • 2× 300ml',     'Combos',      2999, 'Os dois copos devem ser exatamente iguais.',                     'https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202607161211_L0SF_iblob', 7),
  ('casal',            'Combo casal • 2× 550ml',    'Combos',      4048, 'Os dois copos devem ser exatamente iguais.',                     'https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202504031513_80HQ_blob', 8),
  ('sorvete-ferrero',  'Sorvete Ferrero Rocher',    'Sorvetes',    1700, '300ml, 3 bolas. Escolha sua cobertura.',                         'https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202604141629_1KF1_iblob', 9),
  ('sorvete-ovomaltine','Sorvete Ovomaltine',        'Sorvetes',    1700, '300ml, 3 bolas. Escolha sua cobertura.',                         'https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202604141626_68D0_iblob', 10),
  ('sorvete-baunilha', 'Sorvete de Baunilha Branca','Sorvetes',    1700, '300ml, 3 bolas. Escolha sua cobertura.',                         'https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202605292039_6353_iblob', 11),
  ('sorvete-morango',  'Sorvete de Morango',        'Sorvetes',    1700, '300ml, 3 bolas. Escolha sua cobertura.',                         'https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202604141632_NFK8_iblob', 12),
  ('shake-ferrero',    'Milk-shake Ferrero Rocher', 'Milk-shakes', 2250, '500ml cremoso e refrescante. Escolha sua cobertura.',            'https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202604141715_LB07_iblob', 13),
  ('shake-morango',    'Milk-shake de Morango',     'Milk-shakes', 2250, '500ml cremoso e refrescante. Escolha sua cobertura.',            'https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202604162102_YNUM_blob', 14),
  ('shake-baunilha',   'Milk-shake de Baunilha',    'Milk-shakes', 2250, '500ml cremoso e refrescante. Escolha sua cobertura.',            'https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202605292042_6U5J_iblob', 15),
  ('shake-ovomaltine', 'Milk-shake Ovomaltine',     'Milk-shakes', 2250, '500ml cremoso e refrescante. Escolha sua cobertura.',            'https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202604141716_X737_iblob', 16),
  ('vitamina-300',     'Vitamina de Açaí 300ml',    'Vitaminas',   1500, 'Cremosa, nutritiva e refrescante.',                              'https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202509061444_ORUW_blob', 17),
  ('vitamina-500',     'Vitamina de Açaí 500ml',    'Vitaminas',   2000, 'Cremosa, nutritiva e refrescante.',                              'https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202604141621_D813_iblob', 18),
  ('especial',         'Especial Nutella + Ninho',  'Copos prontos',3500, '550ml com Nutella e creme de Ninho',                           'https://client-assets.anota.ai/produtos/6876f462629ff00019fb2856/202506111947_0054_blob', 19)
on conflict (id) do nothing;

-- =============================================================
-- MIGRATION — se as tabelas já existem, execute estas linhas:
-- alter table public.orders add column if not exists stripe_session_id text;
-- alter table public.orders add column if not exists privacy_accepted boolean not null default false;
-- alter table public.orders add column if not exists marketing_consent boolean not null default false;
-- alter table public.products alter column id type text;
-- =============================================================

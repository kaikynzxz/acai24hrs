-- Execute uma vez no SQL Editor do Supabase.
create table if not exists public.delivery_settings (
  id boolean primary key default true check (id = true),
  pickup_enabled boolean not null default true,
  minimum_order_cents integer not null default 1400 check (minimum_order_cents >= 0),
  default_fee_cents integer not null default 500 check (default_fee_cents >= 0),
  zones jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.delivery_settings enable row level security;

-- A aplicação usa o servidor para consultar/gravar. Não exponha essa tabela ao navegador.
revoke all on table public.delivery_settings from anon, authenticated;

insert into public.delivery_settings (id, pickup_enabled, minimum_order_cents, default_fee_cents, zones)
values (true, true, 1400, 500, '[]'::jsonb)
on conflict (id) do nothing;

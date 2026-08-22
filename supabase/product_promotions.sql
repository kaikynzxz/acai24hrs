-- Execute uma vez no SQL Editor do Supabase.
alter table public.products
  add column if not exists sale_price_cents integer,
  add column if not exists discount_percent integer;

alter table public.products
  drop constraint if exists products_sale_price_cents_check,
  add constraint products_sale_price_cents_check check (sale_price_cents is null or sale_price_cents >= 0),
  drop constraint if exists products_discount_percent_check,
  add constraint products_discount_percent_check check (discount_percent is null or (discount_percent >= 0 and discount_percent <= 100));

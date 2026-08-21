# Supabase

Configure these server-side variables in Vercel (never prefix the service key with `NEXT_PUBLIC_`):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Run `schema.sql` in the Supabase SQL Editor after rotating the service-role key. The public API can read only products currently available and store settings; orders remain accessible only from server API routes using the service-role key.

The UID `bd6c3942-4ecf-45b4-a438-8e5002aa110a` is configured as the store administrator in the RLS policies.

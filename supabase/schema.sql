-- AgryX Studio OS — full schema
-- Run this in the Supabase SQL editor.

create extension if not exists "uuid-ossp";

-- ============ CORE ============

create table if not exists studios (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) not null,
  name text not null,
  slug text unique not null,
  google_review_url text,
  logo_url text,
  brand_color text default '#B5652F',
  created_at timestamptz default now()
);

create table if not exists clients (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid references studios(id) not null,
  name text not null,
  email text,
  phone text,
  source text, -- referral, instagram, website, ambassador, google
  referred_by_ambassador_id uuid,
  notes text,
  created_at timestamptz default now()
);

-- ============ PHASE 2: CRM / LEADS ============

create table if not exists leads (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid references studios(id) not null,
  client_id uuid references clients(id) not null,
  shoot_type text not null, -- wedding, senior, commercial, real_estate, event, branding
  status text not null default 'new', -- new, contacted, quoted, booked, shot, delivered, paid, lost
  inquiry_date timestamptz default now(),
  event_date date,
  message text,
  ai_followup_sent_at timestamptz,
  ai_followup_draft text,
  last_activity_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_leads_studio_status on leads(studio_id, status);

-- ============ PHASE 1: AI QUOTES ============

create table if not exists quotes (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid references studios(id) not null,
  lead_id uuid references leads(id) not null,
  package_name text,
  package_details jsonb default '[]'::jsonb, -- ai generated line items
  price numeric(10,2),
  pdf_url text,
  status text default 'draft', -- draft, sent, accepted, declined
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- ============ BOOKINGS ============

create table if not exists bookings (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid references studios(id) not null,
  lead_id uuid references leads(id) not null,
  quote_id uuid references quotes(id),
  shoot_date date not null,
  location text,
  package_name text,
  price numeric(10,2),
  deposit_amount numeric(10,2),
  deposit_paid boolean default false,
  contract_signed boolean default false,
  contract_url text,
  created_at timestamptz default now()
);

-- ============ PHASE 3: GALLERIES / CLIENT PORTAL ============

create table if not exists galleries (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid references studios(id) not null,
  booking_id uuid references bookings(id) not null,
  photo_urls jsonb default '[]'::jsonb,
  ai_flagged_best jsonb default '[]'::jsonb, -- ai culling output: indices/urls of top shots
  client_favorites jsonb default '[]'::jsonb,
  portal_token text unique default uuid_generate_v4()::text,
  delivered_at timestamptz,
  created_at timestamptz default now()
);

-- ============ INVOICES ============

create table if not exists invoices (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid references studios(id) not null,
  booking_id uuid references bookings(id) not null,
  line_items jsonb default '[]'::jsonb,
  total numeric(10,2),
  status text default 'unpaid', -- unpaid, paid, overdue
  pdf_url text,
  due_date date,
  created_at timestamptz default now()
);

-- ============ PHASE 1: REVIEWS ============

create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid references studios(id) not null,
  client_id uuid references clients(id) not null,
  booking_id uuid references bookings(id),
  requested_at timestamptz,
  channel text, -- sms, email, nfc_scan
  review_left boolean default false,
  review_confirmed_at timestamptz,
  created_at timestamptz default now()
);

-- ============ AMBASSADORS ============

create table if not exists ambassadors (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid references studios(id) not null,
  name text not null,
  tier text default 'junior', -- junior, senior, brand
  referral_code text unique not null,
  clients_referred integer default 0,
  bookings_generated integer default 0,
  commission_owed numeric(10,2) default 0,
  created_at timestamptz default now()
);

-- ============ PHASE 4: LANDING PAGES ============

create table if not exists landing_pages (
  id uuid primary key default uuid_generate_v4(),
  studio_id uuid references studios(id) not null,
  slug text unique not null,
  service_type text not null,
  target_keyword text,
  ai_generated_content jsonb default '{}'::jsonb,
  published boolean default false,
  created_at timestamptz default now()
);

-- ============ RLS ============

alter table studios enable row level security;
alter table clients enable row level security;
alter table leads enable row level security;
alter table quotes enable row level security;
alter table bookings enable row level security;
alter table galleries enable row level security;
alter table invoices enable row level security;
alter table reviews enable row level security;
alter table ambassadors enable row level security;
alter table landing_pages enable row level security;

-- Owner-only access, scoped through studios.owner_id
create policy "owner can manage own studio" on studios
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "owner can manage own clients" on clients
  for all using (studio_id in (select id from studios where owner_id = auth.uid()))
  with check (studio_id in (select id from studios where owner_id = auth.uid()));

create policy "owner can manage own leads" on leads
  for all using (studio_id in (select id from studios where owner_id = auth.uid()))
  with check (studio_id in (select id from studios where owner_id = auth.uid()));

create policy "owner can manage own quotes" on quotes
  for all using (studio_id in (select id from studios where owner_id = auth.uid()))
  with check (studio_id in (select id from studios where owner_id = auth.uid()));

create policy "owner can manage own bookings" on bookings
  for all using (studio_id in (select id from studios where owner_id = auth.uid()))
  with check (studio_id in (select id from studios where owner_id = auth.uid()));

create policy "owner can manage own galleries" on galleries
  for all using (studio_id in (select id from studios where owner_id = auth.uid()))
  with check (studio_id in (select id from studios where owner_id = auth.uid()));

create policy "owner can manage own invoices" on invoices
  for all using (studio_id in (select id from studios where owner_id = auth.uid()))
  with check (studio_id in (select id from studios where owner_id = auth.uid()));

create policy "owner can manage own reviews" on reviews
  for all using (studio_id in (select id from studios where owner_id = auth.uid()))
  with check (studio_id in (select id from studios where owner_id = auth.uid()));

create policy "owner can manage own ambassadors" on ambassadors
  for all using (studio_id in (select id from studios where owner_id = auth.uid()))
  with check (studio_id in (select id from studios where owner_id = auth.uid()));

create policy "owner can manage own landing pages" on landing_pages
  for all using (studio_id in (select id from studios where owner_id = auth.uid()))
  with check (studio_id in (select id from studios where owner_id = auth.uid()));

-- ============ STORAGE ============
-- Run this AFTER creating the "galleries" and "documents" buckets (both
-- public) in Supabase Storage. Public buckets serve reads without needing an
-- RLS policy — these policies only govern uploads.

create policy "authenticated users can upload galleries" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'galleries');

create policy "authenticated users can upload documents" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents');

create policy "service role can upload documents" on storage.objects
  for insert to service_role
  with check (bucket_id = 'documents');

-- Note: the client-facing gallery portal (app/portal/[token]) and the
-- inquiry form (app/api/inquiries) both read/write through the service-role
-- client server-side, scoped explicitly by portal_token or studio lookup —
-- they intentionally do NOT rely on anon-key RLS policies, since a portal
-- link should only expose that one gallery, not every row in the table.

create policy "public can read published landing pages" on landing_pages
  for select using (published = true);

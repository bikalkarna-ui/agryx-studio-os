# AgryX Studio OS

A lead-to-review operating system for photography studios (built for Hampton
Moments Photography). Public inquiry form (or manual entry) → AI quote →
accept & auto-create booking → gallery delivery with AI culling and a client
favorites portal → invoice → automated review request. Plus AI-generated SEO
landing pages.

## Stack
Next.js 14 (App Router) · Supabase (Auth, DB, Storage) · OpenRouter (Claude
Haiku, including vision) · Resend (email) · Twilio (SMS) · Tailwind CSS.

## Auth notes (read this first)
Login uses a 6-8 digit email code (not just a clickable link) specifically to
avoid corporate/Gmail link-scanners silently burning magic links before a
real click. The code length is controlled by your Supabase project's OTP
settings — check Authentication → Providers → Email if you need to confirm
or change it; the login page currently accepts up to 8 digits.

Whichever way someone logs in (code or link), `/api/ensure-studio` and
`/auth/callback` both auto-create a `studios` row on first login, so nothing
manual is needed in SQL after signup.

## App structure
Authenticated pages (dashboard, leads, quotes, bookings, galleries, invoices,
reviews, landing-pages, settings) live inside `app/(app)/` — a route group
that adds the sidebar layout without affecting the URL (still `/dashboard`,
not `/(app)/dashboard`). Public pages — the landing page at `/`, `/login`,
`/inquire`, `/portal/[token]`, `/lp/[slug]` — sit outside that group and
render without the sidebar.

## Everything that's built and wired

- **Auth** — Supabase email-code login (`/login`), cookie-based sessions via
  `@supabase/ssr`, middleware-protected app, auto-creates a studio on first
  sign-in regardless of login method.
- **Public inquiry form** (`/inquire`) — creates the client + lead, sends an
  AI-drafted confirmation email automatically.
- **Lead CRM** (`/leads`) — kanban pipeline, **manual "+ Add lead" form** for
  phone/DM/walk-in inquiries, flags leads gone cold 3+ days, one-click
  AI-drafted follow-up sent via SMS/email.
- **AI quotes** (`/quotes`) — generates a priced package, a real **"Send to
  client"** button that emails the quote (was previously a dead link), and a
  real **"Accept & create booking"** button that converts an accepted quote
  into an actual booking row and advances the lead to "booked".
- **Bookings** (`/bookings`) — confirmed shoots, deposits, contract status.
- **Galleries** (`/galleries`, `/galleries/new`) — real photo upload to
  Supabase Storage, real AI photo culling (vision model), public client
  portal (`/portal/[token]`) — no login required for clients.
- **Invoices** (`/invoices`) — real PDF generation, uploaded to Storage.
- **Reviews** (`/reviews`) — AI-drafted review requests actually sent via
  SMS/email, conversion tracking, central Google review link.
- **Landing pages** (`/landing-pages`, public at `/lp/[slug]`) — AI-generated
  SEO copy, publish/unpublish toggle.
- **Settings** (`/settings`) — studio name, review link, brand color, sign out.

## Setup

1. **Create a Supabase project** at supabase.com.
2. **Run the schema**: SQL editor → paste `supabase/schema.sql` → run.
3. **Create two storage buckets**, both **public**: `galleries` and `documents`.
4. **Set up custom SMTP** (Authentication → Emails → SMTP Settings) using
   Resend, so login emails don't hit Supabase's very low built-in rate limit:
   - Host: `smtp.resend.com`, Port: `465`, Username: `resend`, Password: your
     Resend API key, Sender: a verified address (or `onboarding@resend.dev`
     for testing).
5. **URL Configuration** (Authentication → URL Configuration):
   - Site URL: `https://<your-app>.vercel.app`
   - Redirect URLs: add both `https://<your-app>.vercel.app/auth/callback`
     and `https://<your-app>.vercel.app/**`
6. **Copy `.env.example` to `.env.local`** and fill in Supabase, OpenRouter,
   Resend, and (optionally) Twilio credentials.
7. **Install and run locally**:
   ```bash
   npm install
   npm run dev
   ```
8. Sign in at `/login`, then visit `/settings` to set your real studio name
   and Google review link.

## Deploying to Vercel
1. Push to GitHub, import in Vercel.
2. Add every variable from `.env.local` in Vercel → Settings → Environment
   Variables.
3. Deploy. Point your site's inquiry/booking button at `/inquire`.

## The one manual step left
**The physical NFC card / QR code** for reviews — this app gives you the
review link (`/settings`); the card itself is a one-time purchase from any
NFC card printer, programmed to open your `google_review_url`.

## If you want to extend it further
- Multi-studio support: `/inquire` and a couple of routes assume one studio
  per deployment (`limit(1)`/first-match lookups). Add a `?studio=slug` param
  if you ever run this for a second studio brand.
- Stripe for deposit/invoice payments (currently manual "mark paid").
- SMS opt-in/compliance (A2P 10DLC registration) before sending Twilio SMS at
  volume — required by carriers for business texting.

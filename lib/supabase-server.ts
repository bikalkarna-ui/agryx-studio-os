import { createClient } from '@supabase/supabase-js';

// Service-role client — server-side only (API routes). Never import this in
// client components. Used for portal pages, webhooks, and AI actions that
// need to bypass RLS in a controlled way.
export function supabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

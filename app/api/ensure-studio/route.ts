import { NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase-ssr';
import { supabaseAdmin } from '@/lib/supabase-server';

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Called right after any successful login (link or code). Creates a studio
// row for the user if one doesn't exist yet — covers the OTP-code login path,
// which (unlike the link flow) never passes through /auth/callback.
export async function POST() {
  const authedClient = supabaseServerClient();
  const {
    data: { user },
  } = await authedClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const db = supabaseAdmin();
  const { data: existing } = await db.from('studios').select('id').eq('owner_id', user.id).maybeSingle();

  if (existing) {
    return NextResponse.json({ studioId: existing.id, created: false });
  }

  const baseName = user.email?.split('@')[0] || 'my-studio';
  const { data: created, error } = await db
    .from('studios')
    .insert({
      owner_id: user.id,
      name: 'My Studio',
      slug: `${slugify(baseName)}-${user.id.slice(0, 6)}`,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ studioId: created.id, created: true });
}

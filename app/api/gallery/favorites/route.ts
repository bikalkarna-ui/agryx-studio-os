import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// Public endpoint — a client viewing their gallery via portal_token (no login)
// needs to save favorites, but RLS only allows the studio owner to write to
// `galleries`. This route uses the service role, scoped strictly by token, so
// a client can only ever touch their own gallery's favorites.

export async function POST(req: NextRequest) {
  const { token, favorites } = await req.json();

  if (!token || !Array.isArray(favorites)) {
    return NextResponse.json({ error: 'token and favorites[] are required' }, { status: 400 });
  }

  const db = supabaseAdmin();

  const { data: gallery, error: findError } = await db
    .from('galleries')
    .select('id')
    .eq('portal_token', token)
    .single();

  if (findError || !gallery) {
    return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
  }

  const { error } = await db.from('galleries').update({ client_favorites: favorites }).eq('id', gallery.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

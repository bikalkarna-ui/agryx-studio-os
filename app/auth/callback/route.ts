import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-server';

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      }
    );

    const { data } = await supabase.auth.exchangeCodeForSession(code);
    const user = data.user;

    if (user) {
      const db = supabaseAdmin();
      const { data: existing } = await db.from('studios').select('id').eq('owner_id', user.id).maybeSingle();

      if (!existing) {
        const baseName = user.email?.split('@')[0] || 'my-studio';
        await db.from('studios').insert({
          owner_id: user.id,
          name: 'My Studio',
          slug: `${slugify(baseName)}-${user.id.slice(0, 6)}`,
        });
      }
    }
  }

  return NextResponse.redirect(new URL('/dashboard', req.url));
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { supabaseServerClient } from '@/lib/supabase-ssr';
import { aiCompleteJSON } from '@/lib/ai';

type PageContent = {
  headline: string;
  subheadline: string;
  body_sections: { heading: string; text: string }[];
  cta: string;
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function POST(req: NextRequest) {
  const { serviceType, keyword } = await req.json();

  const authedClient = supabaseServerClient();
  const {
    data: { user },
  } = await authedClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const db = supabaseAdmin();
  const { data: studio } = await db.from('studios').select('id').eq('owner_id', user.id).maybeSingle();

  if (!studio) {
    return NextResponse.json({ error: 'No studio found for this account' }, { status: 404 });
  }

  const content = await aiCompleteJSON<PageContent>(
    `You write local SEO landing page copy for a boutique East Texas photography studio (Hampton Moments style). Warm, specific, not generic marketing fluff. Return JSON: {"headline": string, "subheadline": string, "body_sections": [{"heading": string, "text": string}], "cta": string}`,
    `Service type: ${serviceType}\nTarget keyword to naturally work in: ${keyword}\n\nWrite headline, subheadline, 3 body sections, and a call-to-action.`
  );

  const slug = `${slugify(serviceType)}-${slugify(keyword)}`.slice(0, 60);

  await db.from('landing_pages').insert({
    studio_id: studio.id,
    slug,
    service_type: serviceType,
    target_keyword: keyword,
    ai_generated_content: content,
    published: false,
  });

  return NextResponse.json({ slug, content });
}

import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

type PageContent = {
  headline: string;
  subheadline: string;
  body_sections: { heading: string; text: string }[];
  cta: string;
};

async function getPage(slug: string) {
  const db = supabaseAdmin();
  const { data } = await db
    .from('landing_pages')
    .select('slug, service_type, ai_generated_content, studios(name, google_review_url)')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
  return data;
}

export default async function LandingPage({ params }: { params: { slug: string } }) {
  const page = await getPage(params.slug);

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <p className="text-ink/50">This page isn't published yet.</p>
      </div>
    );
  }

  const content = page.ai_generated_content as PageContent;
  const studioName = (page as any).studios?.name ?? 'Our Studio';

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <div className="text-xs uppercase tracking-wide text-clay font-semibold mb-3">{studioName}</div>
        <h1 className="text-4xl font-serif font-bold leading-tight mb-4">{content.headline}</h1>
        <p className="text-lg text-ink/70 mb-10">{content.subheadline}</p>

        <div className="space-y-8 mb-12">
          {content.body_sections?.map((s, i) => (
            <div key={i}>
              <h2 className="font-serif font-bold text-xl mb-2">{s.heading}</h2>
              <p className="text-ink/70 leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>

        <a href="/portal" className="inline-block bg-clay text-white px-6 py-3 rounded-lg font-medium">
          {content.cta}
        </a>
      </div>
    </div>
  );
}

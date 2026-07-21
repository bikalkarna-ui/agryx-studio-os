import { supabaseAdmin } from '@/lib/supabase-server';
import FavoritesPicker from '@/components/FavoritesPicker';

export const dynamic = 'force-dynamic';

async function getGallery(token: string) {
  const db = supabaseAdmin();
  const { data } = await db
    .from('galleries')
    .select('id, photo_urls, ai_flagged_best, client_favorites, bookings(price, leads(clients(name), shoot_type))')
    .eq('portal_token', token)
    .single();
  return data;
}

export default async function PortalPage({ params }: { params: { token: string } }) {
  const gallery = await getGallery(params.token);

  if (!gallery) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink/50">This gallery link isn't valid or has expired.</p>
      </div>
    );
  }

  const clientName = (gallery as any).bookings?.leads?.clients?.name ?? 'there';

  return (
    <div className="min-h-screen bg-paper p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-wide text-clay font-semibold">Hampton Moments</div>
          <h1 className="text-3xl font-serif font-bold mt-1">Hi {clientName}, your gallery is ready</h1>
          <p className="text-ink/60 mt-2">Tap your favorites below — we'll prioritize those for editing.</p>
        </div>

        <FavoritesPicker
          portalToken={params.token}
          photos={(gallery as any).photo_urls || []}
          bestShots={(gallery as any).ai_flagged_best || []}
          initialFavorites={(gallery as any).client_favorites || []}
        />
      </div>
    </div>
  );
}

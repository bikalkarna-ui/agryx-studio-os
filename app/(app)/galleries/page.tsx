'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Gallery = {
  id: string;
  portal_token: string;
  delivered_at: string | null;
  photo_urls: string[];
  ai_flagged_best: string[];
  client_favorites: string[];
  bookings: { leads: { clients: { name: string } | null } | null } | null;
};

export default function GalleriesPage() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [culling, setCulling] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from('galleries')
      .select('id, portal_token, delivered_at, photo_urls, ai_flagged_best, client_favorites, bookings(leads(clients(name)))')
      .order('created_at', { ascending: false });
    setGalleries((data as any) || []);
  }

  async function runCulling(galleryId: string) {
    setCulling(galleryId);
    try {
      await fetch('/api/gallery/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ galleryId, action: 'cull' }),
      });
      load();
    } finally {
      setCulling(null);
    }
  }

  async function markDelivered(galleryId: string) {
    await supabase.from('galleries').update({ delivered_at: new Date().toISOString() }).eq('id', galleryId);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-serif font-bold">Galleries</h1>
        <a href="/galleries/new" className="text-xs bg-clay text-white px-3 py-1.5 rounded-lg">+ New gallery</a>
      </div>
      <p className="text-ink/60 mb-6">
        AI flags the strongest shots first, then clients pick favorites through their own portal link.
      </p>

      <div className="space-y-4">
        {galleries.map((g) => (
          <div key={g.id} className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-medium">{g.bookings?.leads?.clients?.name ?? 'Unknown client'}</div>
              <div className="text-xs text-ink/50">
                {g.photo_urls?.length ?? 0} photos · {g.ai_flagged_best?.length ?? 0} AI-flagged best shots · {g.client_favorites?.length ?? 0} client favorites
              </div>
              <div className="text-xs mt-1">
                {g.delivered_at ? (
                  <span className="text-moss">Delivered {new Date(g.delivered_at).toLocaleDateString()}</span>
                ) : (
                  <span className="text-clay">Not yet delivered</span>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => runCulling(g.id)}
                disabled={culling === g.id}
                className="text-xs border border-sand px-3 py-1.5 rounded-lg disabled:opacity-50"
              >
                {culling === g.id ? 'Running AI culling…' : 'Run AI culling'}
              </button>
              <a
                href={`/portal/${g.portal_token}`}
                target="_blank"
                className="text-xs bg-ink text-white px-3 py-1.5 rounded-lg"
              >
                View client portal
              </a>
              {!g.delivered_at && (
                <button
                  onClick={() => markDelivered(g.id)}
                  className="text-xs bg-clay text-white px-3 py-1.5 rounded-lg"
                >
                  Mark delivered
                </button>
              )}
            </div>
          </div>
        ))}
        {galleries.length === 0 && (
          <div className="card p-8 text-center text-sm text-ink/40">
            No galleries yet — create one from a booking once photos are uploaded to storage.
          </div>
        )}
      </div>
    </div>
  );
}

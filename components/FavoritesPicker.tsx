'use client';

import { useState } from 'react';
import { Heart, Sparkles } from 'lucide-react';

export default function FavoritesPicker({
  portalToken,
  photos,
  bestShots,
  initialFavorites,
}: {
  portalToken: string;
  photos: string[];
  bestShots: string[];
  initialFavorites: string[];
}) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set(initialFavorites));
  const [saving, setSaving] = useState(false);

  async function toggle(url: string) {
    const next = new Set(favorites);
    next.has(url) ? next.delete(url) : next.add(url);
    setFavorites(next);
    setSaving(true);
    await fetch('/api/gallery/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: portalToken, favorites: Array.from(next) }),
    });
    setSaving(false);
  }

  if (photos.length === 0) {
    return <p className="text-sm text-ink/40">Photos haven't been uploaded to this gallery yet.</p>;
  }

  return (
    <div>
      <div className="text-xs text-ink/40 mb-3">
        {favorites.size} favorite{favorites.size === 1 ? '' : 's'} selected {saving && '· saving…'}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((url) => {
          const isFav = favorites.has(url);
          const isBest = bestShots.includes(url);
          return (
            <div key={url} className="relative rounded-lg overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full aspect-square object-cover" />
              {isBest && (
                <div className="absolute top-2 left-2 bg-white/90 text-clay text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles size={10} /> Studio pick
                </div>
              )}
              <button
                onClick={() => toggle(url)}
                className={`absolute top-2 right-2 rounded-full p-1.5 transition ${
                  isFav ? 'bg-clay text-white' : 'bg-white/90 text-ink/50'
                }`}
              >
                <Heart size={14} fill={isFav ? 'currentColor' : 'none'} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

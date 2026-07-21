'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const [studio, setStudio] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('studios').select('*').eq('owner_id', user.id).maybeSingle();
    setStudio(data);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    await supabase
      .from('studios')
      .update({
        name: studio.name,
        google_review_url: studio.google_review_url,
        brand_color: studio.brand_color,
      })
      .eq('id', studio.id);
    setSaving(false);
    setSaved(true);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  if (!studio) return <div className="text-sm text-ink/40">Loading…</div>;

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold mb-1">Settings</h1>
      <p className="text-ink/60 mb-6">Studio name and the link everything (NFC card, texts, emails) points to.</p>

      <div className="card p-6 max-w-lg space-y-4">
        <div>
          <label className="text-xs font-semibold text-ink/50">Studio name</label>
          <input
            className="w-full border border-sand rounded px-3 py-2 mt-1 text-sm"
            value={studio.name || ''}
            onChange={(e) => setStudio({ ...studio, name: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink/50">Google review link</label>
          <input
            className="w-full border border-sand rounded px-3 py-2 mt-1 text-sm"
            placeholder="https://g.page/r/..."
            value={studio.google_review_url || ''}
            onChange={(e) => setStudio({ ...studio, google_review_url: e.target.value })}
          />
          <p className="text-xs text-ink/40 mt-1">
            Get this from Google Business Profile → Ask for reviews → Copy link.
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold text-ink/50">Brand color</label>
          <input
            type="color"
            className="w-16 h-9 mt-1 border border-sand rounded"
            value={studio.brand_color || '#B5652F'}
            onChange={(e) => setStudio({ ...studio, brand_color: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving} className="bg-clay text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {saved && <span className="text-xs text-moss">Saved</span>}
        </div>
      </div>

      <button onClick={signOut} className="mt-8 text-xs text-ink/40 hover:text-ink/70 underline">
        Sign out
      </button>
    </div>
  );
}

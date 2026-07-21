'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type LandingPage = {
  id: string;
  slug: string;
  service_type: string;
  target_keyword: string;
  published: boolean;
};

export default function LandingPagesPage() {
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [serviceType, setServiceType] = useState('senior');
  const [keyword, setKeyword] = useState('Tyler TX senior photos 2026');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from('landing_pages').select('id, slug, service_type, target_keyword, published').order('created_at', { ascending: false });
    setPages((data as any) || []);
  }

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch('/api/landing-pages/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceType, keyword }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Could not generate this page.');
      }
      load();
    } finally {
      setLoading(false);
    }
  }

  async function togglePublish(id: string, published: boolean) {
    await supabase.from('landing_pages').update({ published: !published }).eq('id', id);
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold mb-1">Landing Pages</h1>
      <p className="text-ink/60 mb-6">Spin up an SEO-targeted page per service/season without hiring a designer each time.</p>

      <div className="card p-6 mb-8 flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label className="text-xs font-semibold text-ink/50">Service type</label>
          <select className="w-full border border-sand rounded px-3 py-2 mt-1 text-sm" value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
            {['wedding', 'senior', 'commercial', 'real_estate', 'event', 'branding'].map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-semibold text-ink/50">Target keyword</label>
          <input className="w-full border border-sand rounded px-3 py-2 mt-1 text-sm" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </div>
        <button onClick={generate} disabled={loading} className="bg-clay text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50 h-fit">
          {loading ? 'Generating…' : 'Generate page'}
        </button>
      </div>

      <div className="space-y-3">
        {pages.map((p) => (
          <div key={p.id} className="card p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">/{p.slug}</div>
              <div className="text-xs text-ink/50">{p.service_type} · targeting "{p.target_keyword}"</div>
            </div>
            <div className="flex items-center gap-2">
              {p.published && (
                <a href={`/lp/${p.slug}`} target="_blank" className="text-xs text-clay hover:underline">
                  View live →
                </a>
              )}
              <button
                onClick={() => togglePublish(p.id, p.published)}
                className={`text-xs px-2 py-0.5 rounded-full ${p.published ? 'bg-moss/10 text-moss' : 'bg-sand text-ink/50'}`}
              >
                {p.published ? 'Published' : 'Draft — publish'}
              </button>
            </div>
          </div>
        ))}
        {pages.length === 0 && <div className="card p-8 text-center text-sm text-ink/40">No landing pages generated yet.</div>}
      </div>
    </div>
  );
}

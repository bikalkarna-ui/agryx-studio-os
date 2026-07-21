'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type ReviewRow = {
  id: string;
  requested_at: string | null;
  channel: string | null;
  review_left: boolean;
  clients: { name: string; email: string; phone: string } | null;
};

export default function ReviewsPage() {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [reviewUrl, setReviewUrl] = useState('');
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from('reviews')
      .select('id, requested_at, channel, review_left, clients(name, email, phone)')
      .order('created_at', { ascending: false });
    setRows((data as any) || []);

    const { data: studio } = await supabase.from('studios').select('google_review_url').limit(1).single();
    if (studio?.google_review_url) setReviewUrl(studio.google_review_url);
  }

  async function sendRequest(reviewId: string) {
    setSending(reviewId);
    try {
      const res = await fetch('/api/reviews/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId }),
      });
      const data = await res.json();
      if (!data.sent) {
        alert(`Drafted but not sent — ${data.note || 'no SMS/email provider configured yet'}.\n\nMessage:\n${data.message}`);
      }
      load();
    } finally {
      setSending(null);
    }
  }

  const pending = rows.filter((r) => !r.requested_at);
  const leftCount = rows.filter((r) => r.review_left).length;
  const rate = rows.length ? Math.round((leftCount / rows.length) * 100) : 0;

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold mb-1">Reviews</h1>
      <p className="text-ink/60 mb-6">Every delivered gallery should turn into a Google review, automatically.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <div className="text-sm text-ink/50">Requests sent</div>
          <div className="text-3xl font-serif font-bold">{rows.filter((r) => r.requested_at).length}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-ink/50">Reviews confirmed</div>
          <div className="text-3xl font-serif font-bold">{leftCount}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-ink/50">Conversion rate</div>
          <div className="text-3xl font-serif font-bold">{rate}%</div>
        </div>
      </div>

      <div className="card p-6 mb-8">
        <h2 className="font-serif font-bold mb-2">Your review link (NFC card / QR points here)</h2>
        <p className="text-xs text-ink/50 mb-2">
          Set this once in Supabase (`studios.google_review_url`) — it's what the physical card, QR code, and
          text/email requests all link to.
        </p>
        <code className="text-xs bg-sand/40 px-3 py-2 rounded block break-all">
          {reviewUrl || 'Not set yet — add your Google review link in the studios table.'}
        </code>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sand/40 text-left text-xs uppercase text-ink/50">
            <tr>
              <th className="p-3">Client</th>
              <th className="p-3">Requested</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-sand">
                <td className="p-3 font-medium">{r.clients?.name ?? '—'}</td>
                <td className="p-3 text-ink/60">{r.requested_at ? new Date(r.requested_at).toLocaleDateString() : 'Not sent'}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.review_left ? 'bg-moss/10 text-moss' : 'bg-clay/10 text-clay'}`}>
                    {r.review_left ? 'Left review' : 'Waiting'}
                  </span>
                </td>
                <td className="p-3">
                  {!r.requested_at && (
                    <button
                      onClick={() => sendRequest(r.id)}
                      disabled={sending === r.id}
                      className="text-xs bg-clay text-white px-2 py-1 rounded disabled:opacity-50"
                    >
                      {sending === r.id ? 'Sending…' : 'Send request'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-ink/40">No review requests yet — these are created automatically when a gallery is delivered.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

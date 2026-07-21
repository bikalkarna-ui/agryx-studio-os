'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Lead = { id: string; shoot_type: string; clients: { name: string } | null };
type QuoteResult = {
  package_name: string;
  price: number;
  line_items: { item: string; note: string }[];
};

export default function QuotesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadId, setLeadId] = useState('');
  const [shootType, setShootType] = useState('senior');
  const [hours, setHours] = useState(2);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [shootDate, setShootDate] = useState('');
  const [location, setLocation] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    const { data } = await supabase
      .from('leads')
      .select('id, shoot_type, clients(name)')
      .in('status', ['new', 'contacted'])
      .order('inquiry_date', { ascending: false });
    setLeads((data as any) || []);
  }

  async function generate() {
    setLoading(true);
    setResult(null);
    setQuoteId(null);
    setAccepted(false);
    setSent(false);
    try {
      const res = await fetch('/api/quotes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: leadId || null, shootType, hours, notes }),
      });
      const data = await res.json();
      setResult(data.quote);
      setQuoteId(data.quoteId);
    } catch (e) {
      alert('Could not generate a quote right now.');
    } finally {
      setLoading(false);
    }
  }

  async function sendQuote() {
    if (!quoteId) {
      alert('This quote isn\'t linked to a lead, so there\'s no client to send it to. Generate a quote with a lead selected first.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/quotes/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not send the quote.');
      setSent(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  }

  async function acceptQuote() {
    if (!quoteId) {
      alert('This quote isn\'t linked to a lead, so it can\'t become a booking. Generate a quote with a lead selected first.');
      return;
    }
    setAccepting(true);
    try {
      const res = await fetch('/api/quotes/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId, shootDate, location }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Could not create the booking.');
      }
      setAccepted(true);
      loadLeads();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold mb-1">AI Quotes</h1>
      <p className="text-ink/60 mb-6">Turn an inquiry into a priced, ready-to-send package in seconds.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-ink/50">Link to existing lead (optional, required to create a booking later)</label>
            <select
              className="w-full border border-sand rounded px-3 py-2 mt-1 text-sm"
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
            >
              <option value="">— none —</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>{l.clients?.name ?? 'Unknown'} — {l.shoot_type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink/50">Shoot type</label>
            <select
              className="w-full border border-sand rounded px-3 py-2 mt-1 text-sm"
              value={shootType}
              onChange={(e) => setShootType(e.target.value)}
            >
              {['wedding', 'senior', 'commercial', 'real_estate', 'event', 'branding'].map((t) => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink/50">Estimated hours needed</label>
            <input
              type="number"
              className="w-full border border-sand rounded px-3 py-2 mt-1 text-sm"
              value={hours}
              min={1}
              onChange={(e) => setHours(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink/50">Anything else to factor in</label>
            <textarea
              className="w-full border border-sand rounded px-3 py-2 mt-1 text-sm"
              rows={3}
              placeholder="e.g. outdoor + studio combo, 2 outfit changes, drone footage requested"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="bg-clay text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Generating…' : 'Generate quote'}
          </button>
        </div>

        <div className="card p-6">
          <h2 className="font-serif font-bold mb-3">Preview</h2>
          {!result && <p className="text-sm text-ink/40">Fill out the form and generate a quote to see it here.</p>}
          {result && (
            <div className="space-y-3">
              <div className="text-lg font-serif font-bold">{result.package_name}</div>
              <div className="text-2xl font-bold text-clay">${result.price}</div>
              <ul className="text-sm space-y-2 mt-2">
                {result.line_items?.map((li, i) => (
                  <li key={i} className="border-b border-sand pb-2">
                    <div className="font-medium">{li.item}</div>
                    <div className="text-ink/50 text-xs">{li.note}</div>
                  </li>
                ))}
              </ul>

              {accepted ? (
                <div className="text-sm text-moss font-medium mt-3">✓ Booking created — check the Bookings tab.</div>
              ) : (
                <>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={sendQuote}
                      disabled={sending || sent}
                      className="flex-1 border border-clay text-clay text-sm px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      {sent ? '✓ Sent to client' : sending ? 'Sending…' : 'Send to client'}
                    </button>
                  </div>
                  <div className="mt-4 space-y-2 border-t border-sand pt-3">
                    <div className="text-xs font-semibold text-ink/50">Client accepted? Turn this into a booking:</div>
                    <input
                      type="date"
                      className="w-full border border-sand rounded px-3 py-2 text-sm"
                      value={shootDate}
                      onChange={(e) => setShootDate(e.target.value)}
                    />
                    <input
                      placeholder="Location (optional)"
                      className="w-full border border-sand rounded px-3 py-2 text-sm"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                    <button
                      onClick={acceptQuote}
                      disabled={accepting}
                      className="w-full bg-moss text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      {accepting ? 'Creating booking…' : 'Accept & create booking'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

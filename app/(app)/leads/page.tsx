'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const STAGES = ['new', 'contacted', 'quoted', 'booked', 'shot', 'delivered', 'paid', 'lost'];
const SHOOT_TYPES = ['wedding', 'senior', 'commercial', 'real_estate', 'event', 'branding'];

type Lead = {
  id: string;
  status: string;
  shoot_type: string;
  inquiry_date: string;
  last_activity_at: string;
  clients: { name: string; email: string } | null;
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftingId, setDraftingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', shootType: 'senior', eventDate: '', message: '', source: 'phone',
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('leads')
      .select('id, status, shoot_type, inquiry_date, last_activity_at, clients(name, email)')
      .order('inquiry_date', { ascending: false });
    setLeads((data as any) || []);
    setLoading(false);
  }

  async function moveStage(id: string, status: string) {
    await supabase.from('leads').update({ status, last_activity_at: new Date().toISOString() }).eq('id', id);
    load();
  }

  async function draftFollowup(leadId: string) {
    setDraftingId(leadId);
    try {
      const res = await fetch('/api/leads/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json();
      const status = data.sent ? 'Sent ✅' : `Drafted but not sent (${data.note || 'no provider configured'})`;
      alert(`${status}\n\n${data.draft}`);
    } catch (e) {
      alert('Could not generate a follow-up right now.');
    } finally {
      setDraftingId(null);
    }
  }

  async function addLeadManually(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      const { data: studio } = await supabase.from('studios').select('id').eq('owner_id', user.id).maybeSingle();
      if (!studio) throw new Error('No studio found for this account');

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({ studio_id: studio.id, name: form.name, email: form.email, phone: form.phone, source: form.source })
        .select('id')
        .single();
      if (clientError) throw clientError;

      const { error: leadError } = await supabase.from('leads').insert({
        studio_id: studio.id,
        client_id: client.id,
        shoot_type: form.shootType,
        event_date: form.eventDate || null,
        message: form.message,
        status: 'new',
      });
      if (leadError) throw leadError;

      setForm({ name: '', email: '', phone: '', shootType: 'senior', eventDate: '', message: '', source: 'phone' });
      setShowAddForm(false);
      load();
    } catch (err: any) {
      alert(err.message || 'Could not add this lead.');
    } finally {
      setSaving(false);
    }
  }

  const coldLeads = leads.filter((l) => {
    const daysSince = (Date.now() - new Date(l.last_activity_at).getTime()) / 86400000;
    return ['new', 'contacted', 'quoted'].includes(l.status) && daysSince > 3;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-serif font-bold">Leads</h1>
        <button onClick={() => setShowAddForm(!showAddForm)} className="text-xs bg-clay text-white px-3 py-1.5 rounded-lg">
          {showAddForm ? 'Cancel' : '+ Add lead manually'}
        </button>
      </div>
      <p className="text-ink/60 mb-6">Drag conversations through the pipeline. Nothing goes cold silently.</p>

      {showAddForm && (
        <form onSubmit={addLeadManually} className="card p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input required placeholder="Client name" className="border border-sand rounded px-3 py-2 text-sm"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input type="email" placeholder="Email" className="border border-sand rounded px-3 py-2 text-sm"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Phone" className="border border-sand rounded px-3 py-2 text-sm"
            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <select className="border border-sand rounded px-3 py-2 text-sm"
            value={form.shootType} onChange={(e) => setForm({ ...form, shootType: e.target.value })}>
            {SHOOT_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
          <input type="date" className="border border-sand rounded px-3 py-2 text-sm"
            value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
          <select className="border border-sand rounded px-3 py-2 text-sm"
            value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
            {['phone', 'instagram', 'referral', 'walk_in', 'other'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <textarea placeholder="Notes" rows={2} className="border border-sand rounded px-3 py-2 text-sm sm:col-span-2"
            value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <button type="submit" disabled={saving} className="bg-clay text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50 sm:col-span-2">
            {saving ? 'Adding…' : 'Add lead'}
          </button>
        </form>
      )}

      {coldLeads.length > 0 && (
        <div className="card p-4 mb-6 border-clay/40 bg-clay/5">
          <div className="font-semibold text-sm mb-2">{coldLeads.length} lead(s) have gone quiet for 3+ days</div>
          <div className="flex flex-wrap gap-2">
            {coldLeads.map((l) => (
              <button
                key={l.id}
                onClick={() => draftFollowup(l.id)}
                disabled={draftingId === l.id}
                className="text-xs bg-clay text-white px-3 py-1.5 rounded-full disabled:opacity-50"
              >
                {draftingId === l.id ? 'Drafting…' : `Draft follow-up: ${l.clients?.name ?? 'lead'}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-ink/40 text-sm">Loading…</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <div key={stage} className="min-w-[240px] flex-shrink-0">
              <div className="text-xs font-semibold uppercase text-ink/40 mb-2">{stage}</div>
              <div className="space-y-2">
                {leads.filter((l) => l.status === stage).map((l) => (
                  <div key={l.id} className="card p-3">
                    <div className="font-medium text-sm">{l.clients?.name ?? 'Unknown'}</div>
                    <div className="text-xs text-ink/50">{l.shoot_type}</div>
                    <select
                      className="mt-2 text-xs border border-sand rounded px-2 py-1 w-full"
                      value={l.status}
                      onChange={(e) => moveStage(l.id, e.target.value)}
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

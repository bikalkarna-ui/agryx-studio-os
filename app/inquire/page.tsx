'use client';

import { useState } from 'react';

export default function InquirePage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    shootType: 'senior',
    eventDate: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-serif font-bold mb-2">Got it — thank you!</h1>
          <p className="text-ink/60">We'll be in touch shortly with a custom quote.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper p-6 md:p-12">
      <div className="max-w-lg mx-auto">
        <div className="text-xs uppercase tracking-wide text-clay font-semibold mb-2">Hampton Moments</div>
        <h1 className="text-3xl font-serif font-bold mb-2">Let's plan your shoot</h1>
        <p className="text-ink/60 mb-8">Tell us a bit about what you have in mind and we'll follow up with a custom quote.</p>

        <form onSubmit={submit} className="space-y-4">
          <input
            required
            placeholder="Your name"
            className="w-full border border-sand rounded px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            required
            type="email"
            placeholder="Email"
            className="w-full border border-sand rounded px-3 py-2 text-sm"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            placeholder="Phone (optional)"
            className="w-full border border-sand rounded px-3 py-2 text-sm"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <select
            className="w-full border border-sand rounded px-3 py-2 text-sm"
            value={form.shootType}
            onChange={(e) => setForm({ ...form, shootType: e.target.value })}
          >
            {['wedding', 'senior', 'commercial', 'real_estate', 'event', 'branding'].map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
          <input
            type="date"
            className="w-full border border-sand rounded px-3 py-2 text-sm"
            value={form.eventDate}
            onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
          />
          <textarea
            rows={4}
            placeholder="Tell us more — location ideas, vibe, anything else"
            className="w-full border border-sand rounded px-3 py-2 text-sm"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
          <button
            type="submit"
            disabled={status === 'sending'}
            className="bg-clay text-white text-sm px-5 py-2.5 rounded-lg disabled:opacity-50"
          >
            {status === 'sending' ? 'Sending…' : 'Send inquiry'}
          </button>
          {status === 'error' && <p className="text-xs text-red-600">Something went wrong — please try again.</p>}
        </form>
      </div>
    </div>
  );
}

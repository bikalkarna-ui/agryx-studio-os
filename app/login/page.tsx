'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setError('');
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });
    setVerifying(false);
    if (error) {
      setError(error.message);
    } else {
      await fetch('/api/ensure-studio', { method: 'POST' });
      window.location.href = '/dashboard';
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper p-6">
      <div className="w-full max-w-sm card p-8">
        <div className="text-xs uppercase tracking-wide text-clay font-semibold mb-1">AgryX</div>
        <h1 className="text-2xl font-serif font-bold mb-6">Studio OS</h1>

        {!sent ? (
          <form onSubmit={sendLink} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-ink/50">Email</label>
              <input
                type="email"
                required
                className="w-full border border-sand rounded px-3 py-2 mt-1 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.com"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-clay text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send code'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-4">
            <p className="text-sm text-ink/70">
              Check <strong>{email}</strong> — enter the code from the email below (skip the link, type the code).
            </p>
            <input
              required
              inputMode="numeric"
              maxLength={8}
              className="w-full border border-sand rounded px-3 py-2 text-sm text-center tracking-widest text-lg"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="12345678"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={verifying}
              className="w-full bg-clay text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {verifying ? 'Verifying…' : 'Verify & sign in'}
            </button>
            <button
              type="button"
              onClick={() => { setSent(false); setCode(''); setError(''); }}
              className="w-full text-xs text-ink/40 underline"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

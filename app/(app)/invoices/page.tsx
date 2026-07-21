'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Invoice = {
  id: string;
  total: number;
  status: string;
  due_date: string;
  pdf_url: string | null;
  bookings: { leads: { clients: { name: string } | null } | null } | null;
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from('invoices')
      .select('id, total, status, due_date, pdf_url, bookings(leads(clients(name)))')
      .order('created_at', { ascending: false });
    setInvoices((data as any) || []);
  }

  async function generatePdf(invoiceId: string) {
    setGenerating(invoiceId);
    try {
      const res = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      });
      const data = await res.json();
      if (data.pdf_url) window.open(data.pdf_url, '_blank');
      load();
    } finally {
      setGenerating(null);
    }
  }

  async function markPaid(invoiceId: string) {
    await supabase.from('invoices').update({ status: 'paid' }).eq('id', invoiceId);
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold mb-1">Invoices</h1>
      <p className="text-ink/60 mb-6">Generate a PDF, send it, mark it paid — that's the whole flow.</p>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sand/40 text-left text-xs uppercase text-ink/50">
            <tr>
              <th className="p-3">Client</th>
              <th className="p-3">Total</th>
              <th className="p-3">Due</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t border-sand">
                <td className="p-3 font-medium">{inv.bookings?.leads?.clients?.name ?? '—'}</td>
                <td className="p-3">${Number(inv.total ?? 0).toFixed(2)}</td>
                <td className="p-3 text-ink/60">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${inv.status === 'paid' ? 'bg-moss/10 text-moss' : 'bg-clay/10 text-clay'}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => generatePdf(inv.id)}
                    disabled={generating === inv.id}
                    className="text-xs border border-sand px-2 py-1 rounded disabled:opacity-50"
                  >
                    {generating === inv.id ? 'Generating…' : inv.pdf_url ? 'View PDF' : 'Generate PDF'}
                  </button>
                  {inv.status !== 'paid' && (
                    <button onClick={() => markPaid(inv.id)} className="text-xs bg-moss text-white px-2 py-1 rounded">
                      Mark paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-ink/40">No invoices yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

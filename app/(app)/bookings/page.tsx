'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

type Booking = {
  id: string;
  shoot_date: string;
  location: string;
  package_name: string;
  price: number;
  deposit_paid: boolean;
  contract_signed: boolean;
  leads: { clients: { name: string } | null; shoot_type: string } | null;
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('bookings')
      .select('id, shoot_date, location, package_name, price, deposit_paid, contract_signed, leads(clients(name), shoot_type)')
      .order('shoot_date', { ascending: true })
      .then(({ data }) => {
        setBookings((data as any) || []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold mb-1">Bookings</h1>
      <p className="text-ink/60 mb-6">Confirmed shoots, deposits, and contract status.</p>

      {loading ? (
        <div className="text-sm text-ink/40">Loading…</div>
      ) : bookings.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink/40">
          No bookings yet — they'll appear here once a quote is accepted.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-sand/40 text-left text-xs uppercase text-ink/50">
              <tr>
                <th className="p-3">Client</th>
                <th className="p-3">Type</th>
                <th className="p-3">Date</th>
                <th className="p-3">Location</th>
                <th className="p-3">Price</th>
                <th className="p-3">Deposit</th>
                <th className="p-3">Contract</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-t border-sand">
                  <td className="p-3 font-medium">{b.leads?.clients?.name ?? '—'}</td>
                  <td className="p-3 text-ink/60">{b.leads?.shoot_type}</td>
                  <td className="p-3">{format(new Date(b.shoot_date), 'MMM d, yyyy')}</td>
                  <td className="p-3 text-ink/60">{b.location ?? '—'}</td>
                  <td className="p-3">${Number(b.price ?? 0).toFixed(2)}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${b.deposit_paid ? 'bg-moss/10 text-moss' : 'bg-clay/10 text-clay'}`}>
                      {b.deposit_paid ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${b.contract_signed ? 'bg-moss/10 text-moss' : 'bg-clay/10 text-clay'}`}>
                      {b.contract_signed ? 'Signed' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

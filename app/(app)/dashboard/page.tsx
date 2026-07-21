import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

async function getStats() {
  const db = supabaseAdmin();
  const [leads, bookings, invoices, reviews] = await Promise.all([
    db.from('leads').select('id, status'),
    db.from('bookings').select('id, price, shoot_date'),
    db.from('invoices').select('id, total, status'),
    db.from('reviews').select('id, review_left'),
  ]);

  const openLeads = (leads.data || []).filter((l) => !['delivered', 'paid', 'lost'].includes(l.status)).length;
  const upcomingShoots = (bookings.data || []).filter((b) => new Date(b.shoot_date) >= new Date()).length;
  const unpaidTotal = (invoices.data || [])
    .filter((i) => i.status !== 'paid')
    .reduce((sum, i) => sum + Number(i.total || 0), 0);
  const reviewRate = reviews.data?.length
    ? Math.round(((reviews.data.filter((r) => r.review_left).length) / reviews.data.length) * 100)
    : 0;

  return { openLeads, upcomingShoots, unpaidTotal, reviewRate };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: 'Open leads', value: stats.openLeads, hint: 'in the pipeline right now' },
    { label: 'Upcoming shoots', value: stats.upcomingShoots, hint: 'booked and scheduled' },
    { label: 'Unpaid invoices', value: `$${stats.unpaidTotal.toFixed(2)}`, hint: 'outstanding balance' },
    { label: 'Review conversion', value: `${stats.reviewRate}%`, hint: 'of requests turn into reviews' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold mb-1">Studio overview</h1>
      <p className="text-ink/60 mb-8">Everything happening across leads, bookings, and reviews.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="text-sm text-ink/50">{c.label}</div>
            <div className="text-3xl font-serif font-bold mt-1">{c.value}</div>
            <div className="text-xs text-ink/40 mt-1">{c.hint}</div>
          </div>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-serif font-bold mb-2">Quick actions</h2>
          <ul className="space-y-2 text-sm">
            <li><a className="text-clay hover:underline" href="/leads">Review the lead pipeline →</a></li>
            <li><a className="text-clay hover:underline" href="/quotes">Generate a new AI quote →</a></li>
            <li><a className="text-clay hover:underline" href="/reviews">Send pending review requests →</a></li>
            <li><a className="text-clay hover:underline" href="/landing-pages">Publish a new landing page →</a></li>
          </ul>
        </div>
        <div className="card p-6">
          <h2 className="font-serif font-bold mb-2">How this connects</h2>
          <p className="text-sm text-ink/60 leading-relaxed">
            A lead comes in → you send an AI-drafted quote → it becomes a booking → you deliver
            the gallery through the client portal → an invoice gets paid → a review request goes
            out automatically. Every stage feeds the next.
          </p>
        </div>
      </div>
    </div>
  );
}

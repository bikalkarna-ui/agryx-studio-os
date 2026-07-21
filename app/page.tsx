import Link from 'next/link';
import { Sparkles, Users, FileText, ImageIcon, Star, Receipt, Megaphone, CheckCircle2 } from 'lucide-react';

const FEATURES = [
  { icon: Users, title: 'Lead CRM', text: 'Every inquiry lands in one pipeline — nothing goes cold silently.' },
  { icon: FileText, title: 'AI Quotes', text: 'Turn a shoot type and a few notes into a priced package in seconds.' },
  { icon: ImageIcon, title: 'Client Galleries', text: 'AI flags the best shots, clients pick favorites from their own link.' },
  { icon: Receipt, title: 'Invoicing', text: 'Generate a professional PDF invoice and track paid vs. outstanding.' },
  { icon: Star, title: 'Review Requests', text: 'Every delivered gallery quietly turns into a Google review.' },
  { icon: Megaphone, title: 'SEO Landing Pages', text: 'Spin up a page per service or season without hiring a designer.' },
];

const STEPS = [
  'A client submits an inquiry (or you add one manually)',
  'AI drafts a priced quote in seconds',
  'Client accepts — it becomes a booking automatically',
  'You deliver the gallery through their private link',
  'Invoice gets paid, review request goes out on its own',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper">
      <nav className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-clay font-semibold">AgryX</div>
          <div className="font-serif font-bold text-lg -mt-1">Studio OS</div>
        </div>
        <Link href="/login" className="text-sm bg-clay text-white px-4 py-2 rounded-lg hover:opacity-90 transition">
          Log in
        </Link>
      </nav>

      <section className="max-w-3xl mx-auto px-6 pt-16 pb-14 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs text-clay bg-clay/10 px-3 py-1 rounded-full mb-6">
          <Sparkles size={12} /> Built for photography studios
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight mb-4">
          Run your studio from inquiry to five-star review
        </h1>
        <p className="text-lg text-ink/60 mb-8 max-w-xl mx-auto">
          One place for leads, AI-priced quotes, bookings, client galleries, invoices, and the
          review requests that actually get sent.
        </p>
        <Link
          href="/login"
          className="inline-block bg-clay text-white text-base font-medium px-7 py-3.5 rounded-xl hover:opacity-90 transition"
        >
          Launch Studio OS →
        </Link>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-5">
              <Icon className="text-clay mb-3" size={20} />
              <div className="font-serif font-bold mb-1">{title}</div>
              <div className="text-sm text-ink/60">{text}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border-y border-sand">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-serif font-bold text-center mb-10">How it flows</h2>
          <div className="space-y-4">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="text-moss flex-shrink-0 mt-0.5" size={18} />
                <span className="text-sm text-ink/70">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="max-w-5xl mx-auto px-6 py-10 text-center text-xs text-ink/40">
        AgryX Studio OS
      </footer>
    </div>
  );
}

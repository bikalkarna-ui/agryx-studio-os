import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// Converts an accepted quote into a real booking, and advances the lead.
export async function POST(req: NextRequest) {
  const { quoteId, shootDate, location } = await req.json();
  const db = supabaseAdmin();

  const { data: quote, error } = await db
    .from('quotes')
    .select('id, studio_id, lead_id, package_name, price')
    .eq('id', quoteId)
    .single();

  if (error || !quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }

  const { data: booking, error: bookingError } = await db
    .from('bookings')
    .insert({
      studio_id: quote.studio_id,
      lead_id: quote.lead_id,
      quote_id: quote.id,
      shoot_date: shootDate || new Date().toISOString().slice(0, 10),
      location: location || null,
      package_name: quote.package_name,
      price: quote.price,
      deposit_amount: quote.price ? Number(quote.price) * 0.3 : 0,
    })
    .select('id')
    .single();

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }

  await db.from('quotes').update({ status: 'accepted' }).eq('id', quoteId);
  await db.from('leads').update({ status: 'booked', last_activity_at: new Date().toISOString() }).eq('id', quote.lead_id);

  return NextResponse.json({ bookingId: booking.id });
}

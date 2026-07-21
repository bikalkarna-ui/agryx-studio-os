import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { sendEmail } from '@/lib/notify';

// Actually emails the quote to the client — this was previously a dead
// "Send to client →" link that did nothing.
export async function POST(req: NextRequest) {
  const { quoteId } = await req.json();
  const db = supabaseAdmin();

  const { data: quote, error } = await db
    .from('quotes')
    .select('id, package_name, price, package_details, leads(clients(name, email))')
    .eq('id', quoteId)
    .single();

  if (error || !quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }

  const client = (quote as any).leads?.clients as { name: string; email: string } | null;

  if (!client?.email) {
    return NextResponse.json({ error: 'No email on file for this client' }, { status: 400 });
  }

  const lineItems = (quote.package_details as { item: string; note: string }[]) || [];
  const body = [
    `Hi ${client.name},`,
    ``,
    `Here's your custom package: ${quote.package_name}`,
    ``,
    ...lineItems.map((li) => `• ${li.item} — ${li.note}`),
    ``,
    `Total: $${Number(quote.price).toFixed(2)}`,
    ``,
    `Let us know if you'd like to move forward and we'll get you booked!`,
  ].join('\n');

  const result = await sendEmail(client.email, `Your custom package: ${quote.package_name}`, body);

  if (!result.sent) {
    return NextResponse.json({ error: result.reason }, { status: 500 });
  }

  await db.from('quotes').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', quoteId);

  return NextResponse.json({ sent: true });
}

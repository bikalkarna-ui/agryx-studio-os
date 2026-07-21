import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { aiComplete } from '@/lib/ai';
import { sendEmail } from '@/lib/notify';

export async function POST(req: NextRequest) {
  const { name, email, phone, shootType, eventDate, message } = await req.json();

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
  }

  const db = supabaseAdmin();

  // Single-tenant assumption: this deploy serves one studio. If you later
  // support multiple studios on one deployment, pass a studio slug in the
  // form URL (e.g. /inquire?studio=hampton-moments) and look it up here
  // instead of grabbing the first row.
  const { data: studio } = await db.from('studios').select('id, name').limit(1).maybeSingle();

  if (!studio) {
    return NextResponse.json({ error: 'Studio not configured yet' }, { status: 500 });
  }

  const { data: client, error: clientError } = await db
    .from('clients')
    .insert({ studio_id: studio.id, name, email, phone, source: 'website' })
    .select('id')
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: clientError?.message || 'Could not save client' }, { status: 500 });
  }

  const { data: lead, error: leadError } = await db
    .from('leads')
    .insert({
      studio_id: studio.id,
      client_id: client.id,
      shoot_type: shootType,
      event_date: eventDate || null,
      message,
      status: 'new',
    })
    .select('id')
    .single();

  if (leadError) {
    return NextResponse.json({ error: leadError.message }, { status: 500 });
  }

  // AI auto-reply — best-effort, don't fail the inquiry if this errors
  try {
    const reply = await aiComplete(
      `You write a warm, brief auto-reply confirming a photography inquiry was received. Under 80 words. Sign off as "the ${studio.name} team".`,
      `Client name: ${name}\nShoot type: ${shootType}\nMessage: ${message || '(none)'}\n\nWrite the confirmation email.`
    );
    await sendEmail(email, `We got your inquiry, ${name}!`, reply);
  } catch {
    // non-fatal
  }

  return NextResponse.json({ leadId: lead.id });
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { aiComplete } from '@/lib/ai';
import { sendBestChannel } from '@/lib/notify';

export async function POST(req: NextRequest) {
  const { leadId } = await req.json();
  const db = supabaseAdmin();

  const { data: lead, error } = await db
    .from('leads')
    .select('id, shoot_type, message, event_date, clients(name, email, phone)')
    .eq('id', leadId)
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const client = (lead as any).clients as { name: string; email: string; phone: string } | null;
  const clientName = client?.name ?? 'there';

  const draft = await aiComplete(
    `You write warm, low-pressure follow-up emails for a boutique photography studio (Hampton Moments style — East Texas, weddings/senior/commercial/real estate/events). Keep it short, human, and never pushy. No corporate tone, no excessive exclamation points. Sign off as "the team".`,
    `Client name: ${clientName}\nShoot type: ${lead.shoot_type}\nOriginal inquiry message: ${lead.message ?? '(none provided)'}\nEvent date if given: ${lead.event_date ?? 'not specified'}\n\nWrite a short follow-up email (under 120 words) checking back in since we haven't heard from them in a few days.`
  );

  const result = client
    ? await sendBestChannel(client, `Still thinking it over?`, draft)
    : { sent: false, reason: 'No client contact info on file.', channel: 'email' as const };

  await db
    .from('leads')
    .update({ ai_followup_draft: draft, ai_followup_sent_at: new Date().toISOString() })
    .eq('id', leadId);

  return NextResponse.json({ draft, sent: result.sent, note: result.sent ? undefined : result.reason });
}

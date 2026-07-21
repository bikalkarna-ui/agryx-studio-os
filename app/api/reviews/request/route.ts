import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { aiComplete } from '@/lib/ai';
import { sendBestChannel } from '@/lib/notify';

export async function POST(req: NextRequest) {
  const { reviewId } = await req.json();
  const db = supabaseAdmin();

  const { data: review, error } = await db
    .from('reviews')
    .select('id, studio_id, clients(name, email, phone)')
    .eq('id', reviewId)
    .single();

  if (error || !review) {
    return NextResponse.json({ error: 'Review record not found' }, { status: 404 });
  }

  const { data: studio } = await db
    .from('studios')
    .select('name, google_review_url')
    .eq('id', review.studio_id)
    .single();

  const client = (review as any).clients as { name: string; email: string; phone: string } | null;
  const clientName = client?.name ?? 'there';

  const message = await aiComplete(
    `You write short, warm review-request texts for a photography studio. Under 40 words. Casual, grateful, never guilt-trippy. Include a placeholder [REVIEW_LINK] for the Google review URL.`,
    `Client name: ${clientName}\nStudio: ${studio?.name ?? 'the studio'}\n\nWrite the message.`
  );

  const finalMessage = message.replace('[REVIEW_LINK]', studio?.google_review_url ?? '');

  const result = client
    ? await sendBestChannel(client, `A quick favor from ${studio?.name ?? 'us'}`, finalMessage)
    : { sent: false, reason: 'No client contact info on file.', channel: 'email' as const };

  await db
    .from('reviews')
    .update({ requested_at: new Date().toISOString(), channel: result.channel })
    .eq('id', reviewId);

  return NextResponse.json({ message: finalMessage, sent: result.sent, note: result.sent ? undefined : result.reason });
}

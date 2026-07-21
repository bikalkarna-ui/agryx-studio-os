import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { aiCompleteJSON } from '@/lib/ai';

type QuoteJSON = {
  package_name: string;
  price: number;
  line_items: { item: string; note: string }[];
};

export async function POST(req: NextRequest) {
  const { leadId, shootType, hours, notes } = await req.json();

  const quote = await aiCompleteJSON<QuoteJSON>(
    `You are a pricing assistant for a boutique East Texas photography studio (senior portraits, weddings, commercial/branding, real estate/drone, events). Price fairly for the East Texas market — not big-city rates. Return JSON exactly in this shape: {"package_name": string, "price": number, "line_items": [{"item": string, "note": string}]}`,
    `Shoot type: ${shootType}\nEstimated hours: ${hours}\nAdditional context: ${notes || 'none'}\n\nGenerate a single custom package with 3-5 line items and a total price.`
  );

  let quoteId: string | null = null;

  if (leadId) {
    const db = supabaseAdmin();
    const { data: lead } = await db.from('leads').select('studio_id').eq('id', leadId).single();
    if (lead) {
      const { data: inserted } = await db.from('quotes').insert({
        studio_id: lead.studio_id,
        lead_id: leadId,
        package_name: quote.package_name,
        package_details: quote.line_items,
        price: quote.price,
        status: 'draft',
      }).select('id').single();
      quoteId = inserted?.id ?? null;
      await db.from('leads').update({ status: 'quoted', last_activity_at: new Date().toISOString() }).eq('id', leadId);
    }
  }

  return NextResponse.json({ quote, quoteId, leadId });
}

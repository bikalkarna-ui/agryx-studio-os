import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { createElement as h } from 'react';

// Note: this file must stay .ts (not .tsx) because Next.js App Router only
// recognizes route.ts/route.js as API route handlers — so we build the PDF
// tree with React.createElement instead of JSX.

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica' },
  header: { fontSize: 20, marginBottom: 4 },
  sub: { fontSize: 10, color: '#666', marginBottom: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 6 },
  total: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, fontSize: 14 },
});

function InvoiceDoc({ clientName, lineItems, total, dueDate }: any) {
  return h(
    Document,
    null,
    h(
      Page,
      { size: 'A4', style: styles.page },
      h(Text, { style: styles.header }, 'Hampton Moments Photography'),
      h(Text, { style: styles.sub }, `Invoice for ${clientName} · Due ${dueDate}`),
      ...lineItems.map((li: any, i: number) =>
        h(
          View,
          { key: i, style: styles.row },
          h(Text, null, li.item),
          h(Text, null, `$${Number(li.amount ?? 0).toFixed(2)}`)
        )
      ),
      h(
        View,
        { style: styles.total },
        h(Text, null, 'Total'),
        h(Text, null, `$${Number(total).toFixed(2)}`)
      )
    )
  );
}

export async function POST(req: NextRequest) {
  const { invoiceId } = await req.json();
  const db = supabaseAdmin();

  const { data: invoice, error } = await db
    .from('invoices')
    .select('id, line_items, total, due_date, bookings(leads(clients(name)))')
    .eq('id', invoiceId)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const clientName = (invoice as any).bookings?.leads?.clients?.name ?? 'Client';
  const lineItems = invoice.line_items?.length ? invoice.line_items : [{ item: 'Photography session', amount: invoice.total }];

  const buffer = await renderToBuffer(
    InvoiceDoc({
      clientName,
      lineItems,
      total: invoice.total,
      dueDate: invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Upon receipt',
    }) as any
  );

  const path = `invoices/${invoiceId}.pdf`;
  const { error: uploadError } = await db.storage.from('documents').upload(path, buffer, {
    contentType: 'application/pdf',
    upsert: true,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrl } = db.storage.from('documents').getPublicUrl(path);

  await db.from('invoices').update({ pdf_url: publicUrl.publicUrl }).eq('id', invoiceId);

  return NextResponse.json({ pdf_url: publicUrl.publicUrl });
}

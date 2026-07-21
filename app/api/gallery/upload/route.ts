import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { aiVisionCompleteJSON } from '@/lib/ai';

// AI culling: sends batches of photo URLs to a vision-capable Claude model
// via OpenRouter and asks it to score sharpness, composition, and expression
// for each. Batched at 8 images per call to keep requests fast and reliable —
// OpenRouter/Claude can technically take more, but smaller batches score more
// consistently and fail more gracefully if one image URL is bad.

const BATCH_SIZE = 8;

type ScoreResult = { scores: { index: number; score: number; reason: string }[] };

async function scoreBatch(urls: string[]): Promise<{ index: number; score: number }[]> {
  try {
    const result = await aiVisionCompleteJSON<ScoreResult>(
      `You are a professional photo editor culling a client gallery for a portrait/wedding/event studio. Score each image 1-10 on sharpness/focus, composition, and subject expression combined into one overall quality score. Be genuinely selective — most casual shots should score 4-6, only the strongest frames score 8+.`,
      `Score these ${urls.length} images in order (index 0 to ${urls.length - 1}). Return JSON: {"scores": [{"index": number, "score": number, "reason": string}]}`,
      urls
    );
    return result.scores.map((s) => ({ index: s.index, score: s.score }));
  } catch {
    // If vision scoring fails for this batch (bad URL, API hiccup), don't
    // crash the whole cull — just skip flagging this batch as "best".
    return urls.map((_, i) => ({ index: i, score: 0 }));
  }
}

export async function POST(req: NextRequest) {
  const { galleryId, action } = await req.json();
  const db = supabaseAdmin();

  if (action !== 'cull') {
    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  }

  const { data: gallery, error } = await db
    .from('galleries')
    .select('id, photo_urls')
    .eq('id', galleryId)
    .single();

  if (error || !gallery) {
    return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
  }

  const photos: string[] = gallery.photo_urls || [];
  if (photos.length === 0) {
    return NextResponse.json({ flagged: [] });
  }

  const scored: { url: string; score: number }[] = [];

  for (let i = 0; i < photos.length; i += BATCH_SIZE) {
    const batch = photos.slice(i, i + BATCH_SIZE);
    const batchScores = await scoreBatch(batch);
    for (const { index, score } of batchScores) {
      if (batch[index]) scored.push({ url: batch[index], score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const keepCount = Math.max(1, Math.round(photos.length * 0.3));
  const flagged = scored.slice(0, keepCount).map((s) => s.url);

  await db.from('galleries').update({ ai_flagged_best: flagged }).eq('id', galleryId);

  return NextResponse.json({ flagged });
}

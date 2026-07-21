// Thin wrapper around OpenRouter, same pattern used in RYXSOR AI.
// Set OPENROUTER_API_KEY in your environment.

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'anthropic/claude-haiku-4.5';

export async function aiComplete(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// Vision-capable completion — sends image URLs alongside a text prompt.
// OpenRouter's Claude models accept image_url content blocks the same way
// OpenAI's vision API does.
export async function aiVisionComplete(systemPrompt: string, userPrompt: string, imageUrls: string[]): Promise<string> {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            ...imageUrls.map((url) => ({ type: 'image_url', image_url: { url } })),
          ],
        },
      ],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter vision error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

export async function aiVisionCompleteJSON<T = any>(systemPrompt: string, userPrompt: string, imageUrls: string[]): Promise<T> {
  const raw = await aiVisionComplete(
    `${systemPrompt}\n\nRespond with ONLY valid JSON. No markdown fences, no preamble, no commentary.`,
    userPrompt,
    imageUrls
  );
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned) as T;
}

// Helper for endpoints that need strict JSON back from the model.
export async function aiCompleteJSON<T = any>(systemPrompt: string, userPrompt: string): Promise<T> {
  const raw = await aiComplete(
    `${systemPrompt}\n\nRespond with ONLY valid JSON. No markdown fences, no preamble, no commentary.`,
    userPrompt
  );
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned) as T;
}

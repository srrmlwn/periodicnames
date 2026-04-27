import type { VercelRequest, VercelResponse } from '@vercel/node';

const PRINTFUL_BASE = 'https://api.printful.com';
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 15;

interface PrintfulMockup {
  variant_ids: number[];
  mockup_url: string;
}

interface PrintfulTaskResult {
  status: 'completed' | 'failed' | 'pending';
  mockups?: PrintfulMockup[];
}

interface PrintfulResponse<T> {
  result: T;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { productId, variantIds, designUrl } = req.body as {
    productId?: unknown;
    variantIds?: unknown;
    designUrl?: unknown;
  };

  const authHeader = `Bearer ${process.env.PRINTFUL_API_KEY}`;

  const createRes = await fetch(`${PRINTFUL_BASE}/mockup-generator/create-task/${productId}`, {
    method: 'POST',
    headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      variant_ids: variantIds,
      files: [{ placement: 'front', url: designUrl }],
    }),
  });

  const createData = (await createRes.json()) as PrintfulResponse<{ task_key: string }>;
  const taskKey = createData.result.task_key;

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise<void>((r) => setTimeout(r, POLL_INTERVAL_MS));

    const pollRes = await fetch(
      `${PRINTFUL_BASE}/mockup-generator/task?task_key=${encodeURIComponent(taskKey)}`,
      { headers: { Authorization: authHeader } },
    );

    const pollData = (await pollRes.json()) as PrintfulResponse<PrintfulTaskResult>;
    const { status, mockups } = pollData.result;

    if (status === 'completed' && mockups) {
      const result = mockups.map((m) => ({
        variantId: m.variant_ids[0],
        mockupUrl: m.mockup_url,
      }));
      res.status(200).json({ mockups: result });
      return;
    }

    if (status === 'failed') {
      res.status(502).json({ error: 'Mockup generation failed' });
      return;
    }
  }

  res.status(504).json({ error: 'Mockup generation timed out' });
}

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

function log(label: string, data?: unknown) {
  console.log(`[mockup] ${label}`, data !== undefined ? JSON.stringify(data) : '');
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

  log('request', { productId, variantIds, designUrl });

  const authHeader = `Bearer ${process.env.PRINTFUL_API_KEY}`;
  const taskBody = {
    variant_ids: variantIds,
    files: [{ placement: 'front', url: designUrl }],
    format: 'jpg',
  };

  log('create-task →', { url: `${PRINTFUL_BASE}/mockup-generator/create-task/${productId}`, body: taskBody });

  const createRes = await fetch(`${PRINTFUL_BASE}/mockup-generator/create-task/${productId}`, {
    method: 'POST',
    headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify(taskBody),
  });

  const createRaw = await createRes.text();
  log('create-task ←', { status: createRes.status, body: createRaw });

  if (!createRes.ok) {
    res.status(502).json({ error: 'Mockup task creation failed', detail: createRaw });
    return;
  }

  const createData = JSON.parse(createRaw) as PrintfulResponse<{ task_key: string }>;
  const taskKey = createData.result?.task_key;

  if (!taskKey) {
    log('no task_key in response');
    res.status(502).json({ error: 'No task key returned from Printful', detail: createRaw });
    return;
  }

  log('polling task_key', taskKey);

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise<void>((r) => setTimeout(r, POLL_INTERVAL_MS));

    const pollRes = await fetch(
      `${PRINTFUL_BASE}/mockup-generator/task?task_key=${encodeURIComponent(taskKey)}`,
      { headers: { Authorization: authHeader } },
    );

    const pollRaw = await pollRes.text();
    log(`poll attempt ${attempt + 1} ←`, { status: pollRes.status, body: pollRaw });

    if (!pollRes.ok) {
      res.status(502).json({ error: 'Mockup poll failed', detail: pollRaw });
      return;
    }

    const pollData = JSON.parse(pollRaw) as PrintfulResponse<PrintfulTaskResult>;
    const { status, mockups } = pollData.result;

    if (status === 'completed' && mockups) {
      log('completed', { mockupCount: mockups.length });
      const result = mockups.map((m) => ({
        variantId: m.variant_ids[0],
        mockupUrl: m.mockup_url,
      }));
      res.status(200).json({ mockups: result });
      return;
    }

    if (status === 'failed') {
      log('task failed');
      res.status(502).json({ error: 'Mockup generation failed', detail: pollRaw });
      return;
    }

    log(`status: ${status}, waiting…`);
  }

  log('timed out after max attempts');
  res.status(504).json({ error: 'Mockup generation timed out' });
}

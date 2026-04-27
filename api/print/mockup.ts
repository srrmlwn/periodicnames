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
  code: number;
  result: T;
}

interface PrintfilePlacement {
  width: number;
  height: number;
}

function log(label: string, data?: unknown) {
  console.log(`[mockup] ${label}`, data !== undefined ? JSON.stringify(data) : '');
}

async function printfulGet<T>(path: string, authHeader: string): Promise<T> {
  const res = await fetch(`${PRINTFUL_BASE}${path}`, { headers: { Authorization: authHeader } });
  const raw = await res.text();
  log(`GET ${path} ←`, { status: res.status, body: raw });
  if (!res.ok) throw new Error(`Printful GET ${path} failed: ${raw}`);
  return (JSON.parse(raw) as PrintfulResponse<T>).result;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { productId, variantIds, designUrl, placement = 'front' } = req.body as {
    productId?: unknown;
    variantIds?: unknown;
    designUrl?: unknown;
    placement?: string;
  };

  log('request', { productId, variantIds, designUrl, placement });

  const authHeader = `Bearer ${process.env.PRINTFUL_API_KEY}`;

  // Fetch print area dimensions for this product so we can populate position correctly
  let areaWidth = 1800;
  let areaHeight = 2400;
  try {
    const variantId = Array.isArray(variantIds) ? variantIds[0] : variantIds;
    const printfiles = await printfulGet<{ available_placements: Record<string, PrintfilePlacement> }>(
      `/mockup-generator/printfiles/${productId}?variant_ids[]=${variantId}`,
      authHeader,
    );
    const area = printfiles.available_placements?.[placement as string];
    if (area) {
      areaWidth = area.width;
      areaHeight = area.height;
      log('print area', { placement, areaWidth, areaHeight });
    } else {
      log('placement not found in printfiles, using defaults', { available: Object.keys(printfiles.available_placements ?? {}) });
    }
  } catch (err) {
    log('printfiles fetch failed, using defaults', String(err));
  }

  const taskBody = {
    variant_ids: variantIds,
    files: [{
      placement,
      url: designUrl,
      position: {
        area_width: areaWidth,
        area_height: areaHeight,
        width: areaWidth,
        height: areaHeight,
        top: 0,
        left: 0,
      },
    }],
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
      res.status(200).json({
        mockups: mockups.map((m) => ({ variantId: m.variant_ids[0], mockupUrl: m.mockup_url })),
      });
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

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

interface Printfile {
  printfile_id: number;
  width: number;
  height: number;
}

interface VariantPrintfile {
  variant_id: number;
  placements: Record<string, number>;
}

interface PrintfilesResult {
  printfiles: Printfile[];
  variant_printfiles: VariantPrintfile[];
}

function log(label: string, data?: unknown) {
  console.log(`[mockup] ${label}`, data !== undefined ? JSON.stringify(data) : '');
}

async function printfulGet<T>(path: string, authHeader: string): Promise<T> {
  const res = await fetch(`${PRINTFUL_BASE}${path}`, { headers: { Authorization: authHeader } });
  const raw = await res.text();
  log(`GET ${path} ←`, { status: res.status, body: raw });
  if (!res.ok) throw new Error(`Printful GET ${path} failed: ${raw}`);
  let parsed: PrintfulResponse<T>;
  try {
    parsed = JSON.parse(raw) as PrintfulResponse<T>;
  } catch {
    throw new Error(`Printful GET ${path} returned non-JSON: ${raw}`);
  }
  return parsed.result;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  log('request received', { method: req.method });

  if (req.method !== 'POST') {
    log('rejected: wrong method', req.method);
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  log('env check', { has_printful_key: !!process.env.PRINTFUL_API_KEY });

  const { productId, variantIds, designUrl, placement = 'front' } = req.body as {
    productId?: unknown;
    variantIds?: unknown;
    designUrl?: unknown;
    placement?: string;
  };

  log('request', { productId, variantIds, designUrl, placement });

  if (!productId || !variantIds || !designUrl) {
    log('rejected: missing required fields', { productId: !!productId, variantIds: !!variantIds, designUrl: !!designUrl });
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const authHeader = `Bearer ${process.env.PRINTFUL_API_KEY}`;

  let areaWidth = 1800;
  let areaHeight = 2400;
  try {
    const variantId = Array.isArray(variantIds) ? variantIds[0] : variantIds;
    const pf = await printfulGet<PrintfilesResult>(
      `/mockup-generator/printfiles/${productId}?variant_ids[]=${variantId}`,
      authHeader,
    );
    const variantEntry = pf.variant_printfiles?.find(vp => vp.variant_id === variantId);
    const printfileId = variantEntry?.placements?.[placement as string];
    const printfile = pf.printfiles?.find(p => p.printfile_id === printfileId);
    if (printfile) {
      areaWidth = printfile.width;
      areaHeight = printfile.height;
      log('print area resolved', { placement, printfileId, areaWidth, areaHeight });
    } else {
      log('WARN: placement printfile not found, using defaults', { variantEntry, printfileId, areaWidth, areaHeight });
    }
  } catch (err) {
    log('WARN: printfiles fetch failed, using defaults', { error: String(err), areaWidth, areaHeight });
  }

  const taskBody = {
    variant_ids: variantIds,
    files: [{
      placement,
      url: designUrl,
      position: { area_width: areaWidth, area_height: areaHeight, width: areaWidth, height: areaHeight, top: 0, left: 0 },
    }],
    format: 'jpg',
  };

  log('create-task →', { url: `${PRINTFUL_BASE}/mockup-generator/create-task/${productId}`, body: taskBody });

  let createRes: Response;
  let createRaw: string;
  try {
    createRes = await fetch(`${PRINTFUL_BASE}/mockup-generator/create-task/${productId}`, {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify(taskBody),
    });
    createRaw = await createRes.text();
  } catch (err) {
    log('create-task network error', String(err));
    res.status(502).json({ error: 'Mockup task creation failed', detail: String(err) });
    return;
  }

  log('create-task ←', { status: createRes.status, body: createRaw });

  if (!createRes.ok) {
    res.status(502).json({ error: 'Mockup task creation failed', detail: createRaw });
    return;
  }

  let createData: PrintfulResponse<{ task_key: string }>;
  try {
    createData = JSON.parse(createRaw) as PrintfulResponse<{ task_key: string }>;
  } catch {
    log('create-task response parse error', createRaw);
    res.status(502).json({ error: 'Mockup task response unparseable', detail: createRaw });
    return;
  }

  const taskKey = createData.result?.task_key;
  if (!taskKey) {
    log('no task_key in response', createRaw);
    res.status(502).json({ error: 'No task key returned from Printful', detail: createRaw });
    return;
  }

  log('polling task', { taskKey, maxAttempts: MAX_POLL_ATTEMPTS, intervalMs: POLL_INTERVAL_MS });

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise<void>((r) => setTimeout(r, POLL_INTERVAL_MS));

    let pollRes: Response;
    let pollRaw: string;
    try {
      pollRes = await fetch(
        `${PRINTFUL_BASE}/mockup-generator/task?task_key=${encodeURIComponent(taskKey)}`,
        { headers: { Authorization: authHeader } },
      );
      pollRaw = await pollRes.text();
    } catch (err) {
      log(`poll attempt ${attempt + 1} network error`, String(err));
      res.status(502).json({ error: 'Mockup poll failed', detail: String(err) });
      return;
    }

    log(`poll attempt ${attempt + 1} ←`, { status: pollRes.status, body: pollRaw });

    if (!pollRes.ok) {
      res.status(502).json({ error: 'Mockup poll failed', detail: pollRaw });
      return;
    }

    let pollData: PrintfulResponse<PrintfulTaskResult>;
    try {
      pollData = JSON.parse(pollRaw) as PrintfulResponse<PrintfulTaskResult>;
    } catch {
      log(`poll attempt ${attempt + 1} parse error`, pollRaw);
      res.status(502).json({ error: 'Mockup poll response unparseable', detail: pollRaw });
      return;
    }

    const { status, mockups } = pollData.result;
    log(`poll attempt ${attempt + 1} status`, { status, mockupCount: mockups?.length ?? 0 });

    if (status === 'completed' && mockups) {
      log('task completed', { mockupCount: mockups.length, urls: mockups.map(m => m.mockup_url) });
      res.status(200).json({
        mockups: mockups.map((m) => ({ variantId: m.variant_ids[0], mockupUrl: m.mockup_url })),
      });
      return;
    }

    if (status === 'failed') {
      log('task failed', pollRaw);
      res.status(502).json({ error: 'Mockup generation failed', detail: pollRaw });
      return;
    }
  }

  log('timed out', { taskKey, attempts: MAX_POLL_ATTEMPTS });
  res.status(504).json({ error: 'Mockup generation timed out' });
}

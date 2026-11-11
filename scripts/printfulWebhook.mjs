// Registers (or shows) the Printful webhook that drives shipping emails and owner alerts.
// Usage:
//   PRINTFUL_API_KEY=... PRINTFUL_STORE_ID=... node scripts/printfulWebhook.mjs show
//   PRINTFUL_API_KEY=... PRINTFUL_STORE_ID=... PRINTFUL_WEBHOOK_SECRET=... node scripts/printfulWebhook.mjs register
// Printful allows one webhook URL per store; register replaces any existing one.

const EVENTS = ['package_shipped', 'package_returned', 'order_failed', 'order_canceled', 'order_put_hold'];
const URL_BASE = 'https://periodicnames.com/api/printful/webhook';

const { PRINTFUL_API_KEY, PRINTFUL_STORE_ID, PRINTFUL_WEBHOOK_SECRET } = process.env;
if (!PRINTFUL_API_KEY || !PRINTFUL_STORE_ID) {
  console.error('Set PRINTFUL_API_KEY and PRINTFUL_STORE_ID');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${PRINTFUL_API_KEY}`,
  'X-PF-Store-Id': PRINTFUL_STORE_ID,
  'Content-Type': 'application/json',
};

const redact = config => ({ ...config, url: config.url?.replace(/token=[^&]+/, 'token=***') });

async function call(method, body) {
  const res = await fetch('https://api.printful.com/webhooks', { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json();
  if (!res.ok) {
    console.error(`Printful ${method} /webhooks failed (${res.status})`, json);
    process.exit(1);
  }
  return json.result;
}

const command = process.argv[2] ?? 'show';
if (command === 'show') {
  console.log(redact(await call('GET')));
} else if (command === 'register') {
  if (!PRINTFUL_WEBHOOK_SECRET) {
    console.error('Set PRINTFUL_WEBHOOK_SECRET (same value as the Vercel env var)');
    process.exit(1);
  }
  const result = await call('POST', { url: `${URL_BASE}?token=${encodeURIComponent(PRINTFUL_WEBHOOK_SECRET)}`, types: EVENTS });
  console.log('Registered:', redact(result));
} else {
  console.error('Unknown command. Use "show" or "register".');
  process.exit(1);
}

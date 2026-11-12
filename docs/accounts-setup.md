# Accounts & Setup — Periodic Names

All third-party accounts for Periodic Names are logged in with **hello.afterhoursapps@gmail.com** (After Hours Apps brand Google account). Redone Oct 2026; older accounts under other emails are retired.

No secrets in this file — keys live only in Vercel env vars.

## Stripe (payments)

- Account: separate Stripe account for Periodic Names (one Stripe account per product) under the hello.afterhoursapps login
- Checkout: Stripe-hosted page, inline `price_data` (no catalog product needed); price set server-side in `api/_lib/catalog.ts` ($29.99)
- Branding: icon + wordmark from the brand assets; support email hello.afterhoursapps@gmail.com
- API key: restricted key (Checkout Sessions write, Products/Prices write) → `STRIPE_SECRET_KEY`
- Webhook: `checkout.session.completed` → `https://periodicnames.com/api/stripe/webhook`; signing secret → `STRIPE_WEBHOOK_SECRET`
- Customer emails (Settings → Business → Customer emails, live mode): **Successful payments** and **Refunds** on. Receipts come from stripe.com; replies go to the support email
- Settings → Billing (subscriptions/invoices) is unused — one-time payments only
- Refunds: manual in Payments → Refund. Stripe keeps its processing fee. A refund does not touch Printful — cancel/delete the Printful order separately

## Printful (printing + shipping)

- Store: Manual order platform / API store under the hello.afterhoursapps login
- Private token scopes: manage orders, manage files, manage webhooks → `PRINTFUL_API_KEY`; store id → `PRINTFUL_STORE_ID`
- Billing card on file (charged only when an order is confirmed)
- Branding: packing-slip thank-you message, tracking-page logo
- Customer notifications: Printful does **not** email customers for API/manual stores. We send the shipping email ourselves from Printful webhooks (below)
- Webhook: `package_shipped`, `package_returned`, `order_failed`, `order_canceled`, `order_put_hold` → `https://periodicnames.com/api/printful/webhook?token=<PRINTFUL_WEBHOOK_SECRET>`. Printful webhooks aren't signed, so the token in the URL is the auth, and the handler re-fetches the order from Printful instead of trusting the payload. Register/inspect with `node scripts/printfulWebhook.mjs register|show` (needs `PRINTFUL_API_KEY`, `PRINTFUL_STORE_ID`, `PRINTFUL_WEBHOOK_SECRET` in the shell). One webhook URL per store — `register` replaces it
- `PRINTFUL_DRAFT_ONLY=true` leaves orders as unconfirmed drafts (testing only — remove for launch)

## Resend (email)

- Account under hello.afterhoursapps@gmail.com; domain **periodicnames.com** added for **sending only** (receiving off — it would take the root MX and Resend has no inbox)
- API key: sending access → `RESEND_API_KEY`
- Sends: customer order confirmation (`api/_lib/orderEmail.ts`), customer shipping email with tracking (`api/_lib/shippedEmail.ts`), and owner alerts (`api/_lib/alert.ts`): paid order can't be placed; Printful order failed / on hold / canceled / package returned; shipped order with no email or a failed send; orders stuck 7+ days
- From: `EMAIL_FROM` (default `Periodic Names <hello@periodicnames.com>` — needs the domain Verified); reply-to: `EMAIL_REPLY_TO` (default hello.afterhoursapps@gmail.com)

## PostHog (analytics)

- Organization "srrmlwn" (personal login, not yet the brand email); one project per app — "Grade this" (643800) and "Periodic Names" (702937)
- Periodic Names project: cookieless (stateful server hash), IPs anonymised, autocapture off, session recording off, timezone America/Los_Angeles
- Project API key is public by design and lives in code (`src/utils/analytics.ts`, `api/_lib/analytics.ts`) — no env var
- Names are never sent: every URL property is rewritten to `/[name]` before sending

## Vercel env vars (Production)

| Name | Type | Purpose |
|---|---|---|
| `STRIPE_SECRET_KEY` | Sensitive | Stripe restricted key |
| `STRIPE_WEBHOOK_SECRET` | Sensitive | Verifies webhook calls |
| `PRINTFUL_API_KEY` | Sensitive | Printful private token |
| `PRINTFUL_STORE_ID` | Sensitive | Printful store |
| `BLOB_READ_WRITE_TOKEN` | (make Sensitive) | Design uploads |
| `RESEND_API_KEY` | Sensitive | Emails |
| `ALERT_EMAIL` | — | hello.afterhoursapps@gmail.com, owner alerts |
| `VITE_TEES_ENABLED` | Config (public) | `true` shows the tee flow on production |
| `PRINTFUL_DRAFT_ONLY` | — | `true` only while testing |
| `EMAIL_FROM` / `EMAIL_REPLY_TO` | optional | override sender / reply-to |
| `PRINTFUL_WEBHOOK_SECRET` | Sensitive | Random string; the `?token=` on the Printful webhook URL |
| `ORDER_LINK_SECRET` | Sensitive | Random string; signs `/order?id=…&key=…` links (no links in emails without it) |
| `CRON_SECRET` | Sensitive | Random string; Vercel sends it to the daily `/api/printful/reconcile` cron |

`VITE_PRICE_OVERRIDE_USD` must not exist in Production (ignored there anyway). The project has "Automatically expose System Environment Variables" on (`VERCEL_ENV` is used for the price guard).

## Customer email journey

1. Payment → Stripe receipt
2. Printful order created → our "headed to the printer" confirmation (Resend)
3. Shipped → our "has shipped" email with carrier, tracking link and order page (Resend, from the Printful `package_shipped` webhook). Sent once per shipment: a marker blob `order-emails/shipped-<shipmentId>.json` records it, plus Resend Idempotency-Key `order-shipped/<shipmentId>`
4. Any time → order page `periodicnames.com/order?id=<payment intent>&key=<hmac>` (linked from both emails) shows Received → Printing → Shipped and tracking, read live from Printful (`api/order/status.ts`)

Safety net: Vercel cron `/api/printful/reconcile` (daily 16:17 UTC) re-checks fulfilled/partial orders that shipped in the last 2 days and sends any shipping email a missed webhook should have sent (2 days, not longer, so a catch-up email never arrives after the package — a 10-day window emailed the first real order after delivery); it also alerts the owner about orders still pending/in process/on hold/failed after 7 days (repeats daily until resolved).

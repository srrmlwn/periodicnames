# Security Review — Oct 31, 2026

Scope: everything in the repo (React client, `api/` serverless functions, Vercel config, dependencies, git history) plus the account setup in docs/accounts-setup.md. Done before launching paid tee orders.

## Fixed in this review

| # | Severity | Finding | Fix |
|---|---|---|---|
| 1 | High | `/api/print/mockup` put the request's `productId` straight into the Printful URL path and passed `variantIds`/`placement` through unchecked. With our Printful token, a crafted `productId` (e.g. `../../orders/<id>/confirm`) could reach other Printful endpoints | `productId` must be the t-shirt product, `variantIds` must be catalog IDs (max 4), placement fixed to `front` |
| 2 | Medium | Uploaded designs were stored at `print-designs/<timestamp>.png`, so URLs (and the names on people's shirts) were guessable | `addRandomSuffix: true` (earlier commit today) |
| 3 | Medium | `/api/print/upload` accepted any bytes labelled as PNG, up to 50MB | PNG signature check; 4MB cap |
| 4 | Medium | Unused `/api/print/draft-order` (places Printful orders behind a shared secret, non-constant-time compare, unvalidated design URL) and `/api/print/order` (410 stub) were still deployed | Deleted |
| 5 | Low | No security headers (site could be framed for clickjacking, no nosniff) | `vercel.json`: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `Referrer-Policy`, `Permissions-Policy` |
| 6 | Low | Mockup endpoint returned raw Printful error bodies to the browser | Errors no longer include Printful's response (still logged) |
| 7 | High (advisory) / Low (real) | `undici` (via `@vercel/blob`) had published advisories; it's only used to call Vercel Blob, so exposure was low | Updated to 6.29.1 (`npm audit --omit=dev`: 0 vulnerabilities) |

## Checked and fine

- **Payments:** price is set only on the server; product/variant validated against the catalog; design URL must be our own Blob upload; name/caption re-checked by the content filter. The client can't change what is charged or printed.
- **Webhook:** Stripe signature verified on the raw body; only `checkout.session.completed` with `payment_status: paid` is acted on; order data comes from metadata our server wrote; Printful `external_id` = payment intent so retries never duplicate orders; confirmation email has an idempotency key.
- **Secrets:** none in the repo or git history; server keys have no `VITE_` prefix so they never reach the browser; the only public variable is `VITE_TEES_ENABLED`.
- **XSS:** no `dangerouslySetInnerHTML`/`eval`; names from the URL are rendered as React text; the order email HTML-escapes every customer value.
- **CORS:** API routes send no CORS headers, so other websites can't call them from a visitor's browser.
- **Preview deployments** are behind Vercel login (SSO), so the non-production price override isn't publicly reachable.

## Open items (not code — your accounts)

1. **Rate limiting.** Upload, mockup and checkout are public and unthrottled. Abuse costs storage, Printful mockup quota (could block real customers' "See it on a model") and log noise. Add a Vercel Firewall rate-limit rule on `/api/print/*` and `/api/stripe/checkout` (e.g. 20 requests/minute per IP) once on Pro.
2. **Preview environment** has the real Printful key but `PRINTFUL_DRAFT_ONLY` is Production-only. Set `PRINTFUL_DRAFT_ONLY=true` for Preview too (or remove the Printful key from Preview) so a test on a preview link can never print and charge.
3. **Stripe restricted key** only needs Checkout Sessions (write). Drop Products/Prices write next time you rotate it.
4. **Old accounts:** delete the old Stripe webhook/keys and old Printful token; delete the April Stripe keys from Vercel Preview.
5. **`BLOB_READ_WRITE_TOKEN`** is stored as a readable (non-sensitive) variable; re-add it as Sensitive.
6. **2FA** on the hello.afterhoursapps Google account, Stripe, Printful, Resend and Vercel — that Google login now controls all of them.
7. **Abandoned uploads** (designs from "See it on a model" or checkouts that weren't finished) stay in Blob forever. Consider a periodic clean-up of files older than ~90 days with no order.

## Accepted / low risk

- `mockupUrl` passed to checkout can be any https image; it only appears on that visitor's own Stripe page.
- Order logs include customer name, email and address (needed for support); Vercel keeps them ≤1 day and the Privacy page says so.
- The `?order=success` banner can be shown by anyone who adds the parameter; it reveals nothing.
- No full Content-Security-Policy yet (only `frame-ancestors`); a strict CSP needs care around canvas/blob URLs and Google Fonts. Worth adding later.

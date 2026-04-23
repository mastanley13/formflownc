# FormFlowNC — Phase 2 Audit Report

**Date:** 2026-04-22
**Scope:** Post-bugfix audit (commits 7ed354d, 6c5f46f) covering PDF generation refactor, proxy rename, SMTP config, security, CSRF, data integrity, and schema consistency.

---

## CRITICAL

### C-1 · Webhook endpoint blocked by proxy — DocuSeal callbacks will fail

**File:** `proxy.ts` line 5
**Detail:** `PUBLIC_PATHS` does not include `/api/webhooks`. The DocuSeal webhook (`POST /api/webhooks/docuseal`) arrives without a session cookie, so the proxy redirects it to `/login` with a 302. DocuSeal's HTTP client likely won't follow that redirect, causing all `submission.completed` and `submitter.completed` events to silently fail. Packages will never transition from `signing` → `completed`, and completion emails will never send.

**Fix:** Add `'/api/webhooks'` to the `PUBLIC_PATHS` array.

---

### C-2 · Form 170 intake field IDs do not match seed canonical keys — client disclosure answers won't fill PDFs

**Files:** `lib/intake-questions.ts` (Form 170 section IDs) vs `prisma/seed.ts` (Form 170 `fieldMappings` values)
**Detail:** The intake UI collects client answers keyed by IDs like `disc_foundation_problems`, `disc_electrical_problems`, `disc_roof_problems`, etc. But the PDF field mapping in seed.ts maps AcroForm fields to different canonical keys: `disc_foundation_defects`, `disc_electrical_defects`, `disc_roof_defects`, etc. When `generatePackagePdfs` merges `agentData` + `clientData` and passes the result through `fillPdf`, the disclosure values never match the expected canonical keys and are silently dropped.

Mismatched pairs (intake → seed canonical):

| Intake question ID | Seed canonical key | Match? |
|---|---|---|
| `disc_foundation_problems` | `disc_foundation_defects` | NO |
| `disc_electrical_problems` | `disc_electrical_defects` | NO |
| `disc_plumbing_problems` | `disc_plumbing_defects` | NO |
| `disc_roof_problems` | `disc_roof_defects` | NO |
| `disc_termite_damage` | `disc_pest_damage` | NO |
| `disc_heating_problems` / `disc_cooling_problems` | `disc_hvac_defects` | NO |
| `disc_environmental_hazards` | `disc_env_hazards` | NO |
| `disc_zoning_violations` | `disc_code_violations` | NO |
| `disc_encroachments` | `disc_boundary_disputes` | NO |
| `disc_pending_legal` | `disc_pending_lawsuits` | NO |
| `disc_hoa_exists` | `disc_hoa_exists` | YES |
| `disc_flood_zone` | `disc_flood_zone` | YES |

Additionally, the seed defines canonical keys (`disc_well`, `disc_septic`, `disc_wetlands`, `disc_lead_paint`, `disc_mineral_rights`) that have no corresponding intake questions at all. These PDF fields can never be filled via client intake.

**Fix:** Align intake question IDs with the canonical keys defined in seed.ts, or add a mapping layer in `generatePackagePdfs`. Whichever set is "canonical" should be the single source of truth.

---

## HIGH

### H-1 · `generate-pdfs` route missing CSRF verification for session-authenticated requests

**File:** `app/api/packages/[id]/generate-pdfs/route.ts` lines 19–23
**Detail:** When authenticated via session (not internal token), the POST handler does not call `verifyCsrfToken`. Every other mutating dashboard API (`/api/packages`, `/api/forms`, `/api/forms/[id]`, `/api/forms/upload`, `/api/admin/purge`, `/api/auth/me`) correctly verifies the CSRF token. This endpoint is the exception. An attacker could craft a cross-origin POST from a malicious page that triggers PDF generation for any package the victim agent owns.

**Fix:** Add CSRF verification after the `if (!isInternal && !session)` check, matching the pattern used in the other route handlers.

---

### H-2 · `INTERNAL_API_TOKEN` comparison uses `===` — timing side-channel

**File:** `app/api/packages/[id]/generate-pdfs/route.ts` line 21
**Detail:** `internalToken === INTERNAL_API_TOKEN` is a standard string comparison that can leak token length/content via timing. The codebase already uses `crypto.timingSafeEqual` in both `lib/csrf.ts` and `app/api/webhooks/docuseal/route.ts`, so the pattern is established.

**Fix:** Replace with `crypto.timingSafeEqual(Buffer.from(internalToken), Buffer.from(INTERNAL_API_TOKEN))` after validating both are the same length.

---

### H-3 · `/api/pdf/test-form` has no authentication check

**File:** `app/api/pdf/test-form/route.ts` lines 35–70
**Detail:** Neither `GET` nor `POST` call `getSession()`. The proxy edge guard catches unauthenticated browser requests (redirects to `/login`), but direct API calls (e.g., via `curl` or Postman) that include any value in the `ffnc_session` cookie will bypass the proxy's cookie-presence check and reach the endpoint. The endpoint creates and returns PDFs with sample data, which is low-risk data, but it also accepts arbitrary `data` payloads that get written into PDFs.

**Fix:** Add `getSession()` auth checks to both handlers, consistent with `/api/pdf/fill` and `/api/pdf/detect-fields`.

---

## MEDIUM

### M-1 · `INTERNAL_API_TOKEN` is now vestigial in the intake flow — orphaned security surface

**Files:** `app/api/intake/[token]/route.ts`, `app/api/packages/[id]/generate-pdfs/route.ts`
**Detail:** The intake POST handler now calls `generatePackagePdfs()` directly (the whole point of the shared-lib refactor). It no longer performs an HTTP self-fetch with `x-internal-token`. The only remaining consumer of the internal token is the dashboard's manual "regenerate PDFs" trigger. The `.env.example` still documents `INTERNAL_API_TOKEN` as required for "intake → generate-pdfs" server-to-server calls (line 18–22), which is misleading.

**Fix:** Update `.env.example` comment to say the token is used for dashboard manual triggers only. Consider removing the internal-token auth path entirely and relying solely on session auth + CSRF for the generate-pdfs route.

---

### M-2 · Proxy cookie check is presence-only — no JWT verification at edge

**File:** `proxy.ts` lines 13–17
**Detail:** The proxy only checks `request.cookies.get(COOKIE_NAME)?.value` for truthiness. An expired or malformed JWT passes the proxy. The actual `verifyToken()` check happens in individual route handlers via `getSession()`. This is defense-in-depth (the route check catches it), but it means an expired-session user can navigate the full dashboard UI, see the layout/chrome, and only gets 401s on data fetches — which creates a confusing UX.

**Fix:** Consider calling `verifyToken()` in the proxy, or accept the current behavior and document it as intentional.

---

### M-3 · `proxy.ts` exports `proxy` function but Next.js 16 expects specific export name

**File:** `proxy.ts` line 7
**Detail:** The function is exported as `export function proxy(...)`. Verify the Next.js 16 docs confirm this is the correct named export (historically `middleware` was the expected name from `middleware.ts`). If Next.js 16 expects `export default` or a different function name from `proxy.ts`, the auth guard won't execute at all — every route would be unprotected.

**Fix:** Confirm against `node_modules/next/dist/docs/` that the export signature matches what the framework expects. This is a deployment-blocking item if wrong.

---

### M-4 · Rate-limiter state lives in-memory — lost on restart, not shared across workers

**File:** `app/api/auth/login/route.ts` lines 7–22
**Detail:** The `attempts` Map resets on every server restart or cold start. In a multi-worker deployment (e.g., serverless or cluster mode), each worker has its own map, so an attacker can distribute attempts. This is acceptable for a single-process SQLite app but will not scale.

**Fix:** Acceptable for current deployment model. Add a comment noting the limitation.

---

### M-5 · Seed script hardcodes demo credentials

**File:** `prisma/seed.ts` line 205
**Detail:** `formflow2024!` is the demo agent password. This is appropriate for development seeding, but the password and email are printed to stdout on line 265. If seed is accidentally run in production, this creates a known-credential account.

**Fix:** Add a guard: skip demo agent creation when `NODE_ENV=production`, or prompt for credentials interactively.

---

## LOW

### L-1 · `generate-package-pdfs.ts` silently skips forms on fill error

**File:** `lib/generate-package-pdfs.ts` lines 68–72
**Detail:** When `fillPdf` throws for a specific template, the form is added to `fillResults` as `status: 'skipped'` with only a `console.warn`. The API response includes this info, but neither the client intake flow nor the dashboard UI surfaces which forms were skipped or why.

**Fix:** Consider adding a `warnings` array to `GenerateResult` that includes the error messages for skipped forms, so the dashboard can display them.

---

### L-2 · `lib/email.ts` hardcodes `contentType: 'application/pdf'` for all attachments

**File:** `lib/email.ts` line 52
**Detail:** The `send` function's attachment mapping forces `contentType: 'application/pdf'` regardless of actual file type. Currently all attachments are PDFs, so this is correct, but it's fragile if other file types are ever attached.

**Fix:** Infer content type from filename or accept it as a parameter.

---

### L-3 · Missing `.env.example` entry for `ALLOW_REGISTRATION`

**File:** `.env.example`
**Detail:** `app/api/auth/register/route.ts` checks `process.env.ALLOW_REGISTRATION === 'true'`. This variable isn't documented in `.env.example`, so deployers may not know how to open registration after the first agent is created.

**Fix:** Add `ALLOW_REGISTRATION="false"` with a comment explaining behavior.

---

### L-4 · `proxy.ts` PUBLIC_PATHS doesn't include `/api/csrf`

**File:** `proxy.ts` line 5
**Detail:** The CSRF token endpoint `GET /api/csrf` requires an authenticated session (it calls `getSession()`), so not being in PUBLIC_PATHS is correct. However, the proxy checks cookie presence first. If the session cookie is expired, the proxy lets it through (presence check only), and `/api/csrf` returns 401. This is fine — just noting for completeness.

---

### L-5 · `middleware.ts` removed from project root — confirmed clean

**Files:** Glob results
**Detail:** `middleware.ts` only exists inside `.claude/worktrees/` directories (stale git worktrees from previous development). The project root correctly uses `proxy.ts` only. No conflict.

---

### L-6 · Security headers and CSP are well-configured

**File:** `next.config.ts`
**Detail:** CSP blocks unsafe-inline/unsafe-eval in production, sets frame-ancestors to 'none', enables HSTS with preload. Permissions-Policy disables camera/mic/geo. Good.

---

## Summary Scorecard

| Severity | Count | Items |
|---|---|---|
| CRITICAL | 2 | C-1 (webhook blocked), C-2 (field ID mismatch) |
| HIGH | 3 | H-1 (CSRF gap), H-2 (timing attack), H-3 (test-form no auth) |
| MEDIUM | 5 | M-1–M-5 |
| LOW | 6 | L-1–L-6 |

### What's Working Well

- **`lib/generate-package-pdfs.ts`** — clean extraction; correctly imported by both the intake POST handler and the dashboard generate-pdfs route; per-form error isolation prevents one bad template from blocking the rest; DocuSeal failure is non-fatal.
- **`lib/email.ts`** — graceful SMTP fallback (console.log in dev), never throws, properly escapes HTML in templates.
- **CSRF wiring** — all dashboard-facing mutating endpoints (packages, forms, forms/[id], forms/upload, admin/purge, auth/me) correctly verify CSRF tokens via `verifyCsrfToken`. Frontend pages (settings, new package, forms list, nav) all import and use `getCsrfToken` / `csrfHeaders`.
- **Auth flow** — login has rate limiting, passwords are bcrypt-12, JWTs are httpOnly/secure/sameSite-lax, registration is gated.
- **Prisma schema** — consistent with seed.ts; all models have proper relations, cascading deletes on PackageSigner, unique constraints on email and clientLinkToken.
- **No hardcoded secrets** — no API keys or passwords in source (seed demo password is intentional fixture data).

---

*Generated by automated codebase audit. Verify findings before applying fixes.*

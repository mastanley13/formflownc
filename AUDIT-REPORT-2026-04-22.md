# FormFlowNC Codebase Audit Report

**Date:** April 22, 2026  
**Scope:** Full codebase — security, data integrity, runtime errors, integration gaps, build health, PDF engine correctness  
**Auditor:** Claude (read-only audit, no changes made)  
**Codebase state:** Post Phase 4 + 3 prior audits + recent commit (6 test PDFs, field mapping updates, seed fixes)

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 2     |
| HIGH     | 4     |
| MEDIUM   | 7     |
| LOW      | 5     |
| **Total** | **18** |

**Build health:** TypeScript compiles cleanly (`npx tsc --noEmit` exits 0, no errors). Full `next build` timed out in sandbox but no type errors detected.

---

## CRITICAL Findings

### C-1. Middleware is non-functional — no route-level auth protection

**File:** `proxy.ts` (project root)  
**Severity:** CRITICAL

Next.js requires a file named `middleware.ts` (or `.js`) at the project root exporting a function named `middleware`. The project has `proxy.ts` exporting a function named `proxy`. Next.js ignores this file entirely.

**Impact:** There is zero middleware-level auth protection. All dashboard routes (`/dashboard/*`, `/dashboard/settings`, `/dashboard/packages/*`, `/dashboard/forms/*`) serve their HTML shells to unauthenticated users. The API routes check auth individually so data won't leak through APIs, but the page components render before client-side auth redirects kick in, exposing the app structure and potentially causing hydration-related issues.

**Evidence:**
```ts
// proxy.ts line 7 — wrong function name
export function proxy(request: NextRequest) { ... }
// Should be: export function middleware(request: NextRequest) { ... }
// File should be named: middleware.ts
```

A working `middleware.ts` exists in worktree `elated-dhawan-d8e5de` but was never merged to the main branch.

---

### C-2. Environment variable name mismatch breaks production PDF generation

**File:** `app/api/intake/[token]/route.ts` line 96  
**Severity:** CRITICAL

The intake POST handler triggers PDF generation via an internal fetch using `NEXT_PUBLIC_BASE_URL`, but the `.env` and `.env.example` only define `NEXT_PUBLIC_APP_URL`. These are different variable names.

```ts
// intake route.ts line 96
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
```

```env
# .env — defines a DIFFERENT variable
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Impact:** In production, `NEXT_PUBLIC_BASE_URL` will be `undefined`, causing the internal fetch to always hit `http://localhost:3000`. The intake-to-PDF-generation pipeline will silently fail in any deployment where the app isn't at localhost:3000. Client data gets saved but PDFs never generate.

---

## HIGH Findings

### H-1. CSRF protection missing on most state-changing endpoints

**Files:** `app/api/packages/route.ts`, `app/api/forms/route.ts`, `app/api/forms/[id]/route.ts`, `app/api/forms/upload/route.ts`, `app/api/admin/purge/route.ts`  
**Severity:** HIGH

Only `PATCH /api/auth/me` validates a CSRF token. All other state-changing endpoints (POST, PATCH, DELETE) skip CSRF verification entirely:

- `POST /api/packages` — creates packages (no CSRF)
- `POST /api/forms` — creates/upserts form templates (no CSRF)
- `PATCH /api/forms/[id]` — updates templates (no CSRF)
- `DELETE /api/forms/[id]` — deletes templates (no CSRF)
- `POST /api/forms/upload` — uploads PDFs to the server filesystem (no CSRF)
- `POST /api/admin/purge` — deletes packages and PII (no CSRF)

**Impact:** An attacker can craft a page that submits cross-origin requests to these endpoints. Since auth is cookie-based with `sameSite: 'lax'`, POST requests from cross-origin forms would include the session cookie.

**Mitigating factor:** `sameSite: 'lax'` blocks cookies on cross-origin POST via `fetch()` or XHR, but allows them on top-level form submissions. Risk is moderate but real.

---

### H-2. No role-based authorization on form template management

**Files:** `app/api/forms/route.ts`, `app/api/forms/[id]/route.ts`, `app/api/forms/upload/route.ts`  
**Severity:** HIGH

Any authenticated agent can create, update, and delete ANY form template in the system. There is no admin role, no ownership check, and no permission model. A single compromised agent account could delete all form templates or upload malicious PDFs, affecting all agents.

```ts
// forms/route.ts — only checks session exists, not role
export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Not authenticated.' }, { status: 401 })
  // ... proceeds to upsert any form template
}
```

---

### H-3. PDF utility endpoints have no authentication

**Files:** `app/api/pdf/fill/route.ts`, `app/api/pdf/detect-fields/route.ts`  
**Severity:** HIGH

Both `/api/pdf/fill` and `/api/pdf/detect-fields` accept requests from anyone — no session check. An unauthenticated user can upload arbitrary PDFs for field detection or fill arbitrary PDFs with arbitrary data.

**Impact:** These endpoints could be abused as a free PDF manipulation service. While there's no direct data exposure, it consumes server resources and the fill endpoint could potentially be used for PDF injection attacks if the output is trusted downstream.

---

### H-4. Weak hardcoded internal API token

**File:** `.env` line 12  
**Severity:** HIGH

```env
INTERNAL_API_TOKEN="dev-internal-token"
```

This token gates the server-to-server `generate-pdfs` endpoint. The value is trivially guessable. If an attacker discovers this token (e.g., through a log leak or error message), they can trigger PDF generation for any package by calling `POST /api/packages/[id]/generate-pdfs` with the `x-internal-token` header, bypassing session auth entirely.

**Mitigating factor:** `.env` is in `.gitignore` and should not be committed. But the `.env.example` template doesn't emphasize rotating this value strongly enough.

---

## MEDIUM Findings

### M-1. `field-mappings.ts` FORM_4_MAPPING has wrong field name

**File:** `lib/pdf-engine/field-mappings.ts` line 65  
**Severity:** MEDIUM

```ts
// field-mappings.ts — uses "UnpermittedRenovations"
'UnpermittedRenovations': 'disc_renovations',

// But the actual PDF (createForm170Pdf) creates field named "UnpermittedWork"
// And the seed correctly maps "UnpermittedWork" → "disc_renovations"
```

The static `FORM_4_MAPPING` would fail to fill the "unpermitted renovations" field if used directly. Currently not exploited at runtime because the seed stores the correct mappings in the database, but the static mapping is wrong and would cause bugs if referenced by future code or the test-form endpoint.

---

### M-2. `FORM_MAPPINGS` registry is incomplete — missing 4 of 6 forms

**File:** `lib/pdf-engine/field-mappings.ts` lines 69-73  
**Severity:** MEDIUM

```ts
export const FORM_MAPPINGS: Record<string, PdfFieldMap> = {
  '101': FORM_101_MAPPING,
  '2-T': FORM_2T_MAPPING,   // No PDF generator exists for 2-T
  '4': FORM_4_MAPPING,       // Mismatch with Form 170 (form number != '4')
}
```

Missing: `'161'`, `'140'`, `'141'`, `'110'`, `'170'`. The `getMappingForForm()` function returns `{}` for all of these. Additionally, Form 170 is registered under key `'4'` but the seed uses formNumber `'170'`.

**Impact:** Any code path that uses `getMappingForForm()` with the actual form numbers will get empty mappings. Currently this is mostly dead code since the runtime reads mappings from the database, but it's a latent bug.

---

### M-3. 12+ Form 170 PDF fields have no mapping in seed data

**File:** `prisma/seed.ts` (Form 170 entry), `lib/pdf-engine/create-test-pdf.ts`  
**Severity:** MEDIUM

The Form 170 PDF generator creates fields for structural defects, mechanical systems, and legal disclosures on Page 2, but the seed mapping omits all of them:

**Unmapped fields:** `EnvHazards`, `Wetlands`, `FoundationDefects`, `RoofDefects`, `PestDamage`, `HVACDefects`, `PlumbingDefects`, `ElectricalDefects`, `CodeViolations`, `BoundaryDisputes`, `PendingLawsuits`, `AdditionalDefects`

**Impact:** These fields will always be blank in generated PDFs, even if the client provides the data. The intake form also doesn't collect this data (only 7 basic disclosure questions), so there's a gap in the data collection flow for Form 170 compliance.

---

### M-4. Form 101 `LegalDescription` field unmapped

**File:** `prisma/seed.ts` (Form 101 entry)  
**Severity:** MEDIUM

The Form 101 PDF generator creates a `LegalDescription` field (line 108 of create-test-pdf.ts), but the seed's fieldMappings for Form 101 does not include it. This field will always be blank.

---

### M-5. In-memory login rate limiter won't survive restarts or scale

**File:** `app/api/auth/login/route.ts` lines 8-22  
**Severity:** MEDIUM

The rate limiter uses an in-memory `Map`. In serverless deployments (Vercel, AWS Lambda), each cold start gets a fresh map, making rate limiting ineffective. In multi-instance deployments, each instance has its own map. The map also grows unbounded — no cleanup of expired entries.

---

### M-6. Intake POST endpoint has no rate limiting

**File:** `app/api/intake/[token]/route.ts`  
**Severity:** MEDIUM

The intake POST endpoint accepts submissions from unauthenticated users (by design — clients use it). However, there's no rate limiting, allowing an attacker who discovers a valid token to submit data repeatedly or spam the PDF generation pipeline.

---

### M-7. `dotenv` / `dotenv-cli` not in package.json dependencies

**Files:** `package.json`, `prisma.config.ts`, `prisma/seed.ts`  
**Severity:** MEDIUM

- `prisma.config.ts` imports `"dotenv/config"` but `dotenv` is not in `dependencies` or `devDependencies`.
- `db:seed` script uses `dotenv -e .env --` which requires `dotenv-cli` — also not in dependencies.
- The prisma seed config `"seed": "npx tsx prisma/seed.ts"` bypasses the dotenv wrapper entirely, so seed may not receive env vars in some environments.

**Impact:** Fresh `npm install` may fail to run seeds or prisma config. Works only if `dotenv` is installed globally or cached from a prior install.

---

## LOW Findings

### L-1. `FORM_2T_MAPPING` is dead code

**File:** `lib/pdf-engine/field-mappings.ts` lines 32-48  
**Severity:** LOW

A complete field mapping exists for "NC Offer to Purchase (Form 2-T)" but there is no corresponding PDF generator function and no seed entry. This mapping is exported and registered in `FORM_MAPPINGS` but can never be used. Should be removed or a generator should be built.

---

### L-2. Download endpoint doesn't verify package status

**File:** `app/api/packages/[id]/download/route.ts`  
**Severity:** LOW

The download route checks ownership but not package status. An agent could download PDFs from packages still in `link_sent` or `client_opened` status (before PDFs are generated), which would produce an empty zip file. Not a security issue but a poor UX.

---

### L-3. Seed uses hardcoded weak password

**File:** `prisma/seed.ts` line 203  
**Severity:** LOW

```ts
const passwordHash = await bcrypt.hash('formflow2024!', 12)
```

The seed credentials (`chris@buyingnewbern.com` / `formflow2024!`) are printed to console and hardcoded. If someone deploys without changing them, this is a default credential vulnerability. The `.env.example` should note that seed credentials must be changed after first deploy.

---

### L-4. Duplicate `HOAName` and `HOADues` fields in Form 101 PDF

**File:** `lib/pdf-engine/create-test-pdf.ts` lines 194-213  
**Severity:** LOW

In `createForm101Pdf`, Page 2 creates `HOAName` and `HOADues` fields inside a conditional block of the disclosure rows. However, `HOAName` already appears as part of the `discRows` array and is created twice when `extraField` is present. pdf-lib may silently handle duplicate field names, but the behavior is undefined and could cause fill issues.

---

### L-5. `next-env.d.ts` and `tsconfig.tsbuildinfo` tracked in some worktrees

**Files:** Various worktree directories  
**Severity:** LOW

These auto-generated files appear in some worktrees. The `.gitignore` excludes them from the main repo, but the worktrees may have committed them. Not a functional issue but clutters history.

---

## Positive Observations

The codebase has several well-implemented security measures worth noting:

1. **Password hashing** uses bcrypt with cost factor 12 — solid.
2. **JWT cookies** are `httpOnly`, `secure` in production, `sameSite: lax` — good defaults.
3. **CSRF implementation** (where used) employs timing-safe comparison and HMAC — well done.
4. **CSP headers** are configured with frame-ancestors:none, strict transport security, and permission policy.
5. **DocuSeal webhook verification** uses HMAC-SHA256 with timing-safe comparison.
6. **Path traversal protection** on `pdfFilePath` in the PATCH endpoint validates the prefix.
7. **Intake data filtering** caps field count (100), key length (64), and value length (1024).
8. **PII purge system** properly wipes client data and signer records on expiration.
9. **PDF engine architecture** (canonical keys → reverse mapping → fill) is clean and extensible.
10. **Email HTML** uses proper escaping via the `esc()` helper.

---

## Recommended Priority Order

1. **C-1** — Rename `proxy.ts` → `middleware.ts` and rename the export from `proxy` to `middleware`. Immediate.
2. **C-2** — Change `NEXT_PUBLIC_BASE_URL` to `NEXT_PUBLIC_APP_URL` in intake route.ts line 96. One-line fix.
3. **H-1** — Add CSRF verification to all state-changing POST/PATCH/DELETE endpoints.
4. **H-2** — Add an admin role to the Agent model and gate form template CRUD behind it.
5. **H-3** — Add `getSession()` auth check to `/api/pdf/fill` and `/api/pdf/detect-fields`.
6. **H-4** — Generate a strong random token for `INTERNAL_API_TOKEN` in `.env`.
7. **M-1, M-2** — Fix field-mappings.ts to match actual PDF field names and add missing form entries.
8. **M-3, M-4** — Add missing field mappings in seed for Form 170 and Form 101.
9. **M-7** — Add `dotenv` and `dotenv-cli` to devDependencies.

---

*End of audit report.*

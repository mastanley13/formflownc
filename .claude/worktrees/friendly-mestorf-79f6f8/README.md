# FormFlowNC

NC REALTOR document automation for real estate agents. Agents create transaction packages, generate client intake links, auto-fill NC REALTOR PDF forms from client responses, and route to DocuSeal for e-signatures.

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd formflownc
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set JWT_SECRET, INTERNAL_API_TOKEN (others optional for dev)

# 3. Initialize database and generate test PDFs
npx prisma db push
npm run db:seed

# 4. Start development server
npm run dev
```

Open http://localhost:3000 and log in with the seeded credentials.

**Default dev login:** `chris@buyingnewbern.com` / `formflow2024!`

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values. All variables marked REQUIRED must be set before the app will start.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | SQLite path — `file:./dev.db` for local dev |
| `JWT_SECRET` | Yes | Random string (min 32 chars) for signing JWTs |
| `CSRF_SECRET` | Recommended | Separate secret for CSRF tokens; falls back to JWT_SECRET |
| `INTERNAL_API_TOKEN` | Yes | Token for server-to-server intake → generate-pdfs call |
| `DOCUSEAL_API_URL` | No | Self-hosted DocuSeal base URL (skipped in dev if unset) |
| `DOCUSEAL_API_TOKEN` | No | DocuSeal API token |
| `DOCUSEAL_WEBHOOK_SECRET` | No | Shared secret for verifying DocuSeal webhooks |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | No | SMTP credentials; emails log to console if unset |
| `FROM_EMAIL` | No | Sender address for outgoing emails |
| `NEXT_PUBLIC_APP_URL` | No | Full URL of the app (for email links); defaults to localhost:3000 |

Generate secure random values:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Database

Uses SQLite via Prisma + LibSQL adapter (zero-config for local dev).

```bash
npx prisma db push      # apply schema to dev.db
npm run db:seed         # seed agent + generate all 6 form PDFs
npx prisma studio       # browse data in browser UI
```

The seed script (`prisma/seed.ts`):
- Creates agent **Chris Rayner** with hashed password
- Generates 6 fillable test PDFs using pdf-lib (saved to `uploads/forms/`)
- Creates `FormTemplate` records with field mappings in the database

---

## Form PDFs

Official NC REALTOR forms require a member login at ncrealtors.org. The seed generates realistic **test PDFs** using pdf-lib with proper AcroForm fields matching NC REALTOR form structure.

| Form | Name | Fields |
|---|---|---|
| 101 | Exclusive Right to Sell Listing Agreement | 42 (property, seller, listing terms, disclosures) |
| 161 | Buyer Agency Agreement | 30 (buyer, agent, geographic area, compensation) |
| 140 | Working With Real Estate Agents — Buyer | 14 (buyer, agent, acknowledgment) |
| 141 | Working With Real Estate Agents — Seller | 14 (seller, agent, acknowledgment) |
| 110 | Seller Net Sheet — Estimated Proceeds | 24 (financial calculations, agent) |
| 170 | Residential Property Disclosure Statement | 33 (owner, HOA, environmental, structural) |

To replace test PDFs with official NC REALTOR forms: upload via the admin form template tool at `/dashboard/forms/upload`. The field detection engine reads AcroForm field names and suggests canonical mappings automatically.

---

## Architecture

```
app/
  page.tsx                    # Marketing landing page
  dashboard/                  # Agent portal (auth required)
    new/                      # 4-step package wizard
    packages/[id]/            # Package detail + status timeline
    settings/                 # Agent profile + password change
  intake/[token]/             # Client-facing intake form (public)
  api/
    auth/login|register|me    # JWT auth + CSRF-protected profile
    packages/                 # Package CRUD + generate-pdfs + download
    intake/[token]/           # Client GET (opens link) + POST (submits data)
    forms/                    # Form template CRUD + PDF upload
    webhooks/docuseal/        # Signature completion webhook
    admin/purge               # Expired package cleanup

lib/
  auth.ts                     # JWT sign/verify, bcrypt helpers
  csrf.ts                     # Stateless HMAC CSRF tokens
  db.ts                       # Prisma + LibSQL client
  email.ts                    # nodemailer with dev-mode console fallback
  docuseal.ts                 # DocuSeal API client
  purge.ts                    # Expired package cleanup logic
  pdf-engine/
    create-test-pdf.ts        # Test PDF generators for all 6 forms
    detect-fields.ts          # AcroForm field extraction
    fill-pdf.ts               # Field mapping + PDF fill
    field-mappings.ts         # Canonical field registry
    types.ts                  # Types + CANONICAL_FIELDS constant
```

### Data flow

1. Agent creates **Package** (forms + signers + deal data) → generates 7-day client link
2. **Client** opens intake link → fills personal info + disclosures → submits
3. Intake POST saves `clientData`, calls `generate-pdfs` internally
4. `generate-pdfs` merges agent + client data, fills each PDF via AcroForm field mappings
5. If DocuSeal configured: submits filled PDFs, status → `signing`
6. **DocuSeal webhook** fires on each completion → emails signer + agent
7. All signed: emails agent with PDF attachments, status → `completed`

---

## DocuSeal Setup (optional)

FormFlowNC sends `send_email: false` to DocuSeal and handles all emails itself to avoid duplicates.

```bash
# Run DocuSeal locally via Docker
docker run --rm -p 3001:3000 -v docuseal:/data docuseal/docuseal

# Add to .env
DOCUSEAL_API_URL=http://localhost:3001
DOCUSEAL_API_TOKEN=<token from DocuSeal admin>

# Configure webhook in DocuSeal UI:
# URL: http://your-host/api/webhooks/docuseal
# Events: submitter.completed, submission.completed
# Secret: set DOCUSEAL_WEBHOOK_SECRET to match
```

---

## Security

- **JWT auth**: `httpOnly` cookie, 7-day expiry, throws at startup if `JWT_SECRET` missing
- **CSRF**: stateless HMAC-SHA256 tokens, 5-min windows, separate `CSRF_SECRET`
- **Rate limiting**: 5 login attempts per IP per 15 min (in-memory)
- **CSP**: `unsafe-inline`/`unsafe-eval` gated to `NODE_ENV=development` only
- **HSTS**: `max-age=63072000; includeSubDomains; preload`
- **Path traversal**: `pdfFilePath` validated to `^uploads/forms/` prefix, no `..`
- **Input validation**: client data limited to 100 fields, keys ≤ 64 chars, values ≤ 1024 chars
- **HTML escaping**: all user data escaped in email templates
- **Purge scoping**: expired package cleanup scoped to authenticated agent's packages

---

## Scripts

```bash
npm run dev           # Next.js dev server (Turbopack)
npm run build         # Production build
npm run db:seed       # Seed database + generate test PDFs
npm run db:migrate    # Run Prisma migrations (production)
npm run db:studio     # Prisma Studio data browser
```

# DocuSeal Self-Hosted Setup

FormFlowNC integrates with DocuSeal for e-signature collection. DocuSeal is optional — without it, packages auto-complete after PDF generation (useful for dev/demo). With it, packages enter a `signing` state and complete only after all signers have signed.

---

## 1. Deploy DocuSeal

### Docker (recommended)

```bash
docker run --name docuseal \
  -p 3000:3000 \
  -v docuseal_data:/data \
  docuseal/docuseal:latest
```

Or with Docker Compose:

```yaml
services:
  docuseal:
    image: docuseal/docuseal:latest
    ports:
      - "3000:3000"
    volumes:
      - docuseal_data:/data
    restart: unless-stopped

volumes:
  docuseal_data:
```

Run `docker compose up -d` and navigate to `http://your-server:3000` to complete setup.

---

## 2. Get Your API Token

1. Log in to your DocuSeal admin panel
2. Go to **Settings → API**
3. Create a new API token with full access
4. Copy the token — you'll add it to `.env`

---

## 3. Configure FormFlowNC

Add these variables to your `.env` file:

```env
# DocuSeal (required for e-signature flow)
DOCUSEAL_API_URL=http://your-docuseal-server:3000
DOCUSEAL_API_TOKEN=your_api_token_here

# Webhook signature verification (recommended)
DOCUSEAL_WEBHOOK_SECRET=your_webhook_secret_here

# Used by intake route to call generate-pdfs internally
NEXT_PUBLIC_BASE_URL=https://your-formflownc-domain.com
INTERNAL_API_TOKEN=a_long_random_secret_string
```

Generate a secure `INTERNAL_API_TOKEN`:
```bash
openssl rand -hex 32
```

---

## 4. Configure the Webhook

FormFlowNC needs to receive DocuSeal events to update package status when signers complete.

1. In DocuSeal admin, go to **Settings → Webhooks**
2. Add a new webhook:
   - **URL:** `https://your-formflownc-domain.com/api/webhooks/docuseal`
   - **Events:** `submission.completed`, `submitter.completed`
3. Copy the webhook secret and set `DOCUSEAL_WEBHOOK_SECRET` in `.env`

---

## 5. Status Flow with DocuSeal

```
draft
  └─ link_sent         (agent creates package, sends client link)
       └─ client_opened    (client opens the link)
            └─ client_completed  (client submits intake form)
                 └─ signing       (PDFs filled, sent to DocuSeal)
                      └─ completed  (all signers have signed)
```

Without DocuSeal configured, packages jump directly from `client_completed` → `completed`.

---

## 6. Testing

To verify the integration is working:

1. Create a package with a test signer email you control
2. Complete the client intake form
3. Check DocuSeal admin — a submission should appear
4. Sign the document via the email link
5. Package status in FormFlowNC should update to `completed`

To test the webhook locally, use [ngrok](https://ngrok.com) to expose your local server:

```bash
ngrok http 3000
# Use the ngrok HTTPS URL as your DocuSeal webhook URL
```

---

## 7. Manual Purge

Expired packages can be purged manually:

```bash
curl -X POST https://your-formflownc-domain.com/api/admin/purge \
  -H "Cookie: ffnc_session=<your_session_cookie>"
```

This deletes filled PDF files and wipes client PII from expired packages.

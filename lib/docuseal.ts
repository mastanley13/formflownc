// DocuSeal API client — self-hosted instance
// Configure DOCUSEAL_API_URL and DOCUSEAL_API_TOKEN in .env
//
// If DOCUSEAL_API_URL is not set, all calls are no-ops and packages skip
// straight to "completed" after PDF generation.
//
// DocuSeal self-hosted setup: see DOCUSEAL_SETUP.md

export type DocuSealSigner = {
  name: string
  email: string
  role: string // must match a DocuSeal template submitter role name
  phone?: string
}

export type DocuSealDocument = {
  name: string     // filename shown in DocuSeal UI
  bytes: Buffer    // filled PDF bytes
}

export type DocuSealSubmissionResult = {
  id: number
  submitters: Array<{
    id: number
    email: string
    name: string
    status: string    // pending | opened | completed
    slug: string      // signing URL slug: {DOCUSEAL_URL}/s/{slug}
  }>
  status: string      // pending | completed
  createdAt: string
}

export type DocuSealSubmissionStatus = {
  id: number
  status: string
  completedAt: string | null
  submitters: Array<{ email: string; status: string; completedAt: string | null }>
}

function isConfigured(): boolean {
  return Boolean(process.env.DOCUSEAL_API_URL && process.env.DOCUSEAL_API_TOKEN)
}

function headers(): HeadersInit {
  return {
    'X-Auth-Token': process.env.DOCUSEAL_API_TOKEN!,
    'Content-Type': 'application/json',
  }
}

function baseUrl(): string {
  return process.env.DOCUSEAL_API_URL!.replace(/\/$/, '')
}

// Upload a single filled PDF as a DocuSeal template, then immediately
// create a submission (one-off — no reusable template).
//
// DocuSeal "create_submission_from_documents" endpoint:
// POST /api/submissions/email — creates template + submission in one call
// Body: { documents: [{ name, file }], submitters: [...], send_email: true }
export async function createSubmission(
  documents: DocuSealDocument[],
  signers: DocuSealSigner[],
  message?: string
): Promise<DocuSealSubmissionResult | null> {
  if (!isConfigured()) return null

  // Convert documents to DocuSeal's expected format (base64 PDF)
  const docPayload = documents.map((d) => ({
    name: d.name,
    file: `data:application/pdf;base64,${d.bytes.toString('base64')}`,
  }))

  const submitterPayload = signers.map((s, i) => ({
    name: s.name,
    email: s.email,
    role: s.role || `Party ${i + 1}`,
    phone: s.phone,
    message: message,
  }))

  const res = await fetch(`${baseUrl()}/api/submissions/emails`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      documents: docPayload,
      submitters: submitterPayload,
      send_email: false,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DocuSeal submission failed (${res.status}): ${err}`)
  }

  return res.json() as Promise<DocuSealSubmissionResult>
}

export async function getSubmissionStatus(submissionId: number): Promise<DocuSealSubmissionStatus | null> {
  if (!isConfigured()) return null

  const res = await fetch(`${baseUrl()}/api/submissions/${submissionId}`, {
    headers: { 'X-Auth-Token': process.env.DOCUSEAL_API_TOKEN! },
  })

  if (!res.ok) throw new Error(`DocuSeal GET submission failed (${res.status})`)
  return res.json() as Promise<DocuSealSubmissionStatus>
}

// DocuSeal webhook event shape (subset we care about)
export type DocuSealWebhookEvent = {
  event_type: 'submission.completed' | 'submitter.completed' | string
  timestamp: string
  data: {
    id: number               // submission ID (submission.completed) OR submitter ID (submitter.completed)
    submission_id?: number   // parent submission ID — only present on submitter.completed
    email?: string           // submitter email — present on submitter.completed
    status: string
    submitters: Array<{ email: string; status: string }>
  }
}

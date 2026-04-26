// DocuSeal API client — self-hosted instance
// Configure DOCUSEAL_API_URL, DOCUSEAL_API_TOKEN, and DOCUSEAL_TEMPLATE_ID in .env
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
    status: string    // pending | opened | completed | sent
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

function templateId(): number {
  const id = process.env.DOCUSEAL_TEMPLATE_ID
  if (!id) throw new Error('DOCUSEAL_TEMPLATE_ID is not set')
  return parseInt(id, 10)
}

// Create a submission using a pre-configured DocuSeal template.
//
// The template must be created in the DocuSeal admin UI with signature/date
// fields. Each submission sends the template document to signers for signing.
//
// DocuSeal open-source API:
// POST /api/submissions — creates submission for an existing template
// Body: { template_id, submitters: [...], send_email: true }
export async function createSubmission(
  documents: DocuSealDocument[],
  signers: DocuSealSigner[],
  message?: string
): Promise<DocuSealSubmissionResult | null> {
  if (!isConfigured()) return null

  const submitterPayload = signers.map((s) => ({
    name: s.name,
    email: s.email,
    role: s.role || 'First Party',
    phone: s.phone,
    send_email: true,
    message: message,
  }))

  const res = await fetch(`${baseUrl()}/api/submissions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      template_id: templateId(),
      submitters: submitterPayload,
      send_email: true,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DocuSeal submission failed (${res.status}): ${err}`)
  }

  // The API returns an array of submitter objects; wrap into our result shape
  const submitters = await res.json() as Array<{
    id: number
    email: string
    name: string
    status: string
    slug: string
    submission_id: number
  }>

  if (!submitters.length) {
    throw new Error('DocuSeal returned empty submitters array')
  }

  return {
    id: submitters[0].submission_id,
    submitters: submitters.map((s) => ({
      id: s.id,
      email: s.email,
      name: s.name,
      status: s.status,
      slug: s.slug,
    })),
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
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

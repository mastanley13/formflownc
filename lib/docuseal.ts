// DocuSeal API client — self-hosted instance
// Configure DOCUSEAL_API_URL, DOCUSEAL_API_TOKEN, and DOCUSEAL_TEMPLATE_ID in .env
//
// If DOCUSEAL_API_URL is not set, all calls are no-ops and packages skip
// straight to "completed" after PDF generation.
//
// Flow: update template with filled PDFs → create submission → signer gets email
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

// Step 1: Replace the template's document(s) with the filled PDFs.
// PUT /api/templates/:id — accepts { documents: [{ name, file }] }
// The "file" is a data URI with base64-encoded PDF bytes.
async function updateTemplateDocuments(documents: DocuSealDocument[]): Promise<void> {
  const docPayload = documents.map((d) => ({
    name: d.name,
    file: `data:application/pdf;base64,${d.bytes.toString('base64')}`,
  }))

  const res = await fetch(`${baseUrl()}/api/templates/${templateId()}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({ documents: docPayload }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DocuSeal template update failed (${res.status}): ${err}`)
  }
}

// Step 2: Create a submission against the (now-updated) template.
// POST /api/submissions — { template_id, submitters, send_email }
async function createSubmissionForTemplate(
  signers: DocuSealSigner[],
  message?: string
): Promise<DocuSealSubmissionResult> {
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

  // The API returns an array of submitter objects
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

// Main entry point: update template with filled documents, then create submission.
// This two-step approach works with DocuSeal's open-source edition.
export async function createSubmission(
  documents: DocuSealDocument[],
  signers: DocuSealSigner[],
  message?: string
): Promise<DocuSealSubmissionResult | null> {
  if (!isConfigured()) return null

  // Step 1: Replace template documents with the actual filled PDFs
  console.log(`[docuseal] Updating template ${templateId()} with ${documents.length} filled PDF(s)`)
  await updateTemplateDocuments(documents)

  // Step 2: Create submission — signer gets the real filled documents
  console.log(`[docuseal] Creating submission for ${signers.length} signer(s)`)
  const result = await createSubmissionForTemplate(signers, message)
  console.log(`[docuseal] Submission ${result.id} created, status: ${result.status}`)

  return result
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

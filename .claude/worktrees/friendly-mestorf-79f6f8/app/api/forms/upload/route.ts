// POST /api/forms/upload
// Accepts multipart/form-data: pdf (file), formNumber, formName, category (JSON), version
// Saves PDF to uploads/forms/, runs field detection, returns detected fields.
// Does NOT create the DB record — the client reviews mappings first, then POSTs /api/forms.

import { getSession } from '@/lib/auth'
import { verifyCsrfToken } from '@/lib/csrf'
import { detectPdfFields } from '@/lib/pdf-engine'
import { CANONICAL_FIELDS } from '@/lib/pdf-engine/types'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

function sanitizeFilename(s: string): string {
  return s.replace(/[^a-z0-9-]/gi, '-').toLowerCase().replace(/-+/g, '-')
}

// Simple heuristic: score how well a PDF field name matches a canonical key
function suggestCanonicalKey(pdfFieldName: string): string | null {
  const lower = pdfFieldName.toLowerCase().replace(/[^a-z0-9]/g, '_')
  const scores: [string, number][] = Object.keys(CANONICAL_FIELDS).map((key) => {
    const parts = key.split('_')
    const score = parts.reduce((acc, part) => acc + (lower.includes(part) ? 1 : 0), 0)
    return [key, score]
  })
  const best = scores.filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1])[0]
  return best ? best[0] : null
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Not authenticated.' }, { status: 401 })

  const csrfToken = request.headers.get('x-csrf-token') ?? ''
  if (!verifyCsrfToken(csrfToken, session.agentId)) {
    return Response.json({ error: 'Invalid CSRF token.' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('pdf') as File | null
    const formNumber = (formData.get('formNumber') as string | null)?.trim()
    const formName = (formData.get('formName') as string | null)?.trim()
    const category = (formData.get('category') as string | null) ?? '[]'
    const version = (formData.get('version') as string | null)?.trim() ?? '2024'

    if (!file) return Response.json({ error: 'No PDF file provided.' }, { status: 400 })
    if (file.size > 50 * 1024 * 1024) return Response.json({ error: 'PDF must be under 50 MB.' }, { status: 413 })
    if (!formNumber) return Response.json({ error: 'formNumber is required.' }, { status: 400 })
    if (!formName) return Response.json({ error: 'formName is required.' }, { status: 400 })

    // Validate category is valid JSON array
    try { JSON.parse(category) } catch {
      return Response.json({ error: 'category must be a JSON array string.' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const pdfBytes = new Uint8Array(arrayBuffer)

    // Detect fields first (fail fast if not a valid fillable PDF)
    const fields = await detectPdfFields(pdfBytes)

    // Save PDF to uploads/forms/
    const uploadsDir = path.join(process.cwd(), 'uploads', 'forms')
    await mkdir(uploadsDir, { recursive: true })

    const filename = `${sanitizeFilename(formNumber)}-${sanitizeFilename(formName)}.pdf`
    const filePath = path.join(uploadsDir, filename)
    await writeFile(filePath, Buffer.from(pdfBytes))

    // Attach auto-suggestions for each detected field
    const fieldsWithSuggestions = fields.map((f) => ({
      ...f,
      suggestedCanonical: suggestCanonicalKey(f.name),
    }))

    const relativePath = path.join('uploads', 'forms', filename)

    return Response.json({
      formNumber,
      formName,
      category,
      version,
      pdfFilePath: relativePath.replace(/\\/g, '/'), // normalize to forward slashes
      fieldCount: fields.length,
      fields: fieldsWithSuggestions,
    })
  } catch (err) {
    console.error('[forms/upload] Unexpected error:', err)
    return Response.json({ error: 'Upload failed. Check server logs for details.' }, { status: 500 })
  }
}

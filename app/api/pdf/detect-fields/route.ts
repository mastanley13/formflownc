// POST /api/pdf/detect-fields
// Body: multipart/form-data with 'pdf' file field
// Returns: JSON list of AcroForm fields detected in the PDF

import { getSession } from '@/lib/auth'
import { detectPdfFields } from '@/lib/pdf-engine'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Not authenticated.' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('pdf') as File | null

    if (!file) {
      return Response.json({ error: 'No PDF file provided. Send multipart/form-data with field "pdf".' }, { status: 400 })
    }

    if (!file.name.endsWith('.pdf') && file.type !== 'application/pdf') {
      return Response.json({ error: 'File must be a PDF.' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const pdfBytes = new Uint8Array(arrayBuffer)

    const fields = await detectPdfFields(pdfBytes)

    return Response.json({
      filename: file.name,
      fieldCount: fields.length,
      fields,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: `Failed to parse PDF: ${message}` }, { status: 500 })
  }
}

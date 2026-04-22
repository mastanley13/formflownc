// POST /api/pdf/fill
// Body: multipart/form-data with:
//   'pdf'      - PDF file
//   'mapping'  - JSON string: { pdfFieldName: canonicalKey }
//   'data'     - JSON string: { canonicalKey: value }
//   'flatten'  - optional 'true' to flatten form fields
// Returns: filled PDF binary (application/pdf)

import { fillPdf } from '@/lib/pdf-engine'
import type { PdfFieldMap, CollectedData } from '@/lib/pdf-engine'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('pdf') as File | null
    const mappingJson = formData.get('mapping') as string | null
    const dataJson = formData.get('data') as string | null
    const flattenStr = formData.get('flatten') as string | null

    if (!file) {
      return Response.json({ error: 'Missing "pdf" file field.' }, { status: 400 })
    }
    if (!mappingJson) {
      return Response.json({ error: 'Missing "mapping" JSON field.' }, { status: 400 })
    }
    if (!dataJson) {
      return Response.json({ error: 'Missing "data" JSON field.' }, { status: 400 })
    }

    let mapping: PdfFieldMap
    let data: CollectedData

    try {
      mapping = JSON.parse(mappingJson)
    } catch {
      return Response.json({ error: 'Invalid JSON in "mapping" field.' }, { status: 400 })
    }

    try {
      data = JSON.parse(dataJson)
    } catch {
      return Response.json({ error: 'Invalid JSON in "data" field.' }, { status: 400 })
    }

    const pdfBytes = new Uint8Array(await file.arrayBuffer())
    const flatten = flattenStr === 'true'

    const { pdfBytes: filledBytes, unfilledFields, filledCount } = await fillPdf(pdfBytes, mapping, data, flatten)

    return new Response(Buffer.from(filledBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="filled-${file.name}"`,
        'X-Filled-Count': String(filledCount),
        'X-Unfilled-Fields': unfilledFields.join(','),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: `Failed to fill PDF: ${message}` }, { status: 500 })
  }
}

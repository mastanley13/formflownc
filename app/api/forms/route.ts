import { getSession } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Not authenticated.' }, { status: 401 })

  const forms = await prisma.formTemplate.findMany({
    orderBy: { formNumber: 'asc' },
    select: {
      id: true, formNumber: true, formName: true, category: true,
      version: true, isActive: true, pdfFilePath: true, uploadedAt: true,
    },
  })

  return Response.json({ forms })
}

// Create or upsert a form template (called after user reviews field mappings)
export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Not authenticated.' }, { status: 401 })

  try {
    const body = await request.json()
    const { formNumber, formName, category, version, pdfFilePath, fieldMappings } = body

    if (!formNumber || !formName || !pdfFilePath || !fieldMappings) {
      return Response.json({ error: 'formNumber, formName, pdfFilePath, and fieldMappings are required.' }, { status: 400 })
    }

    const form = await prisma.formTemplate.upsert({
      where: { formNumber },
      update: {
        formName,
        category: typeof category === 'string' ? category : JSON.stringify(category),
        version: version ?? '2024',
        pdfFilePath,
        fieldMappings: typeof fieldMappings === 'string' ? fieldMappings : JSON.stringify(fieldMappings),
        isActive: true,
        uploadedAt: new Date(),
      },
      create: {
        formNumber,
        formName,
        category: typeof category === 'string' ? category : JSON.stringify(category),
        version: version ?? '2024',
        pdfFilePath,
        fieldMappings: typeof fieldMappings === 'string' ? fieldMappings : JSON.stringify(fieldMappings),
        isActive: true,
      },
    })

    return Response.json({ form }, { status: 201 })
  } catch (err) {
    console.error('[forms POST] Unexpected error:', err)
    return Response.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

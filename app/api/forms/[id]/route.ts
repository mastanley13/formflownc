import { getSession } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(_req: Request, ctx: RouteContext<'/api/forms/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Not authenticated.' }, { status: 401 })

  const { id } = await ctx.params
  const form = await prisma.formTemplate.findUnique({ where: { id } })
  if (!form) return Response.json({ error: 'Form not found.' }, { status: 404 })

  return Response.json({ form })
}

// PATCH: update name, category, version, fieldMappings, or toggle isActive
export async function PATCH(request: Request, ctx: RouteContext<'/api/forms/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Not authenticated.' }, { status: 401 })

  const { id } = await ctx.params
  const body = await request.json()

  const updateData: Record<string, unknown> = {}
  if (body.formName !== undefined) updateData.formName = body.formName
  if (body.category !== undefined) updateData.category = typeof body.category === 'string' ? body.category : JSON.stringify(body.category)
  if (body.version !== undefined) updateData.version = body.version
  if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive)
  if (body.fieldMappings !== undefined) {
    updateData.fieldMappings = typeof body.fieldMappings === 'string'
      ? body.fieldMappings
      : JSON.stringify(body.fieldMappings)
  }
  if (body.pdfFilePath !== undefined) {
    const p = String(body.pdfFilePath)
    if (p.includes('..') || p.startsWith('/') || p.startsWith('\\') || !/^uploads[\\/]forms[\\/]/.test(p)) {
      return Response.json({ error: 'Invalid pdfFilePath.' }, { status: 400 })
    }
    updateData.pdfFilePath = p
  }

  try {
    const form = await prisma.formTemplate.update({ where: { id }, data: updateData })
    return Response.json({ form })
  } catch {
    return Response.json({ error: 'Form not found or update failed.' }, { status: 404 })
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/forms/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Not authenticated.' }, { status: 401 })

  const { id } = await ctx.params
  try {
    await prisma.formTemplate.delete({ where: { id } })
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Form not found.' }, { status: 404 })
  }
}

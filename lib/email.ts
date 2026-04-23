import nodemailer from 'nodemailer'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function isConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  })
}

const FROM = process.env.FROM_EMAIL ?? 'FormFlowNC <noreply@formflownc.com>'

type Attachment = { filename: string; content: Buffer }

async function send(options: {
  to: string | string[]
  subject: string
  html: string
  attachments?: Attachment[]
}) {
  if (!isConfigured()) {
    console.log('[email:dev] Would send email:')
    console.log('  To:', Array.isArray(options.to) ? options.to.join(', ') : options.to)
    console.log('  Subject:', options.subject)
    if (options.attachments?.length) {
      console.log('  Attachments:', options.attachments.map((a) => a.filename).join(', '))
    }
    return
  }
  try {
    const transport = createTransport()
    await transport.sendMail({
      from: FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: 'application/pdf',
      })),
    })
    console.log('[email] Sent "' + options.subject + '" to ' + (Array.isArray(options.to) ? options.to.join(', ') : options.to))
  } catch (err) {
    // Log but never throw -- email failure should not crash the calling flow
    console.error('[email] Failed to send "' + options.subject + '":', err instanceof Error ? err.message : err)
  }
}

// Sent to the agent when a new package is created and the client link is ready
export async function sendPackageCreatedEmail(opts: {
  agentEmail: string
  agentName: string
  propertyAddress: string
  clientLink: string
  expiresAt: Date
}) {
  const expires = opts.expiresAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const html = '<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">'
    + '<div style="background:#0f766e;color:#fff;border-radius:12px;padding:20px 24px;margin-bottom:24px">'
    + '<h1 style="margin:0;font-size:20px;font-weight:700">FormFlowNC</h1>'
    + '</div>'
    + '<h2 style="color:#0f172a;margin-bottom:8px">Your client package is ready</h2>'
    + '<p style="color:#475569">Hi ' + esc(opts.agentName) + ',</p>'
    + '<p style="color:#475569">A new package has been created for <strong>' + esc(opts.propertyAddress) + '</strong>. Send the link below to your client to collect their information and disclosures.</p>'
    + '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0">'
    + '<p style="margin:0 0 8px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;font-weight:600">Client Intake Link</p>'
    + '<a href="' + esc(opts.clientLink) + '" style="color:#0f766e;font-weight:600;word-break:break-all">' + esc(opts.clientLink) + '</a>'
    + '<p style="margin:8px 0 0;font-size:12px;color:#94a3b8">Expires ' + expires + '</p>'
    + '</div>'
    + '<p style="color:#94a3b8;font-size:12px;margin-top:32px">FormFlowNC - NC REALTOR Document Automation</p>'
    + '</div>'

  await send({
    to: opts.agentEmail,
    subject: 'Package ready - ' + opts.propertyAddress,
    html,
  })
}

// Sent to the agent when all signatures are collected, with all PDFs attached
export async function sendAgentCompletionEmail(opts: {
  agentEmail: string
  agentName: string
  propertyAddress: string
  attachments: Attachment[]
}) {
  const docCount = opts.attachments.length
  const html = '<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">'
    + '<div style="background:#0f766e;color:#fff;border-radius:12px;padding:20px 24px;margin-bottom:24px">'
    + '<h1 style="margin:0;font-size:20px;font-weight:700">FormFlowNC</h1>'
    + '</div>'
    + '<h2 style="color:#0f172a;margin-bottom:8px">All signatures collected</h2>'
    + '<p style="color:#475569">Hi ' + esc(opts.agentName) + ',</p>'
    + '<p style="color:#475569">All parties have signed the documents for <strong>' + esc(opts.propertyAddress) + '</strong>. The fully executed PDFs are attached to this email.</p>'
    + '<div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:16px;margin:20px 0">'
    + '<p style="margin:0;color:#065f46;font-weight:600">' + docCount + ' signed document' + (docCount !== 1 ? 's' : '') + ' attached</p>'
    + '</div>'
    + '<p style="color:#94a3b8;font-size:12px;margin-top:32px">FormFlowNC - NC REALTOR Document Automation</p>'
    + '</div>'

  await send({
    to: opts.agentEmail,
    subject: 'All signatures complete - ' + opts.propertyAddress,
    html,
    attachments: opts.attachments,
  })
}

// Sent to each signer when their signature is collected
export async function sendSignerCompletionEmail(opts: {
  signerEmail: string
  signerName: string
  propertyAddress: string
  agentName: string
}) {
  const html = '<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">'
    + '<div style="background:#0f766e;color:#fff;border-radius:12px;padding:20px 24px;margin-bottom:24px">'
    + '<h1 style="margin:0;font-size:20px;font-weight:700">FormFlowNC</h1>'
    + '</div>'
    + '<h2 style="color:#0f172a;margin-bottom:8px">Signature received</h2>'
    + '<p style="color:#475569">Hi ' + esc(opts.signerName) + ',</p>'
    + '<p style="color:#475569">Your signature for the documents related to <strong>' + esc(opts.propertyAddress) + '</strong> has been received. Your agent ' + esc(opts.agentName) + ' will be notified when all parties have signed.</p>'
    + '<p style="color:#94a3b8;font-size:12px;margin-top:32px">FormFlowNC - NC REALTOR Document Automation</p>'
    + '</div>'

  await send({
    to: opts.signerEmail,
    subject: 'Your signature was received - ' + opts.propertyAddress,
    html,
  })
}

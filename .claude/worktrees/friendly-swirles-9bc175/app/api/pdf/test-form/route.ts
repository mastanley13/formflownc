// GET  /api/pdf/test-form          — returns a blank test listing agreement PDF
// POST /api/pdf/test-form          — returns a pre-filled test PDF using sample data or provided body
//
// POST body (JSON, optional): { data: CollectedData }
// If no body or empty data, uses built-in sample data for Chris Rayner.

import { createTestListingAgreementPdf, fillPdf } from '@/lib/pdf-engine'
import { FORM_101_MAPPING } from '@/lib/pdf-engine'

const SAMPLE_DATA = {
  agent_name: 'Chris Rayner',
  agent_license_number: 'NC-123456',
  agent_phone: '(919) 555-0100',
  agent_email: 'chris@raynerrealty.com',
  agent_firm_name: 'Rayner Realty Group',
  agent_firm_license: 'NC-FIRM-7890',
  agent_firm_address: '123 Main Street, Suite 200, Raleigh, NC 27601',
  agent_firm_phone: '(919) 555-0200',
  property_address: '456 Magnolia Lane',
  property_city: 'Cary',
  property_state: 'NC',
  property_zip: '27519',
  property_county: 'Wake',
  seller_name_1: 'John Q. Seller',
  seller_name_2: 'Jane A. Seller',
  seller_phone: '(919) 555-0300',
  seller_email: 'jseller@email.com',
  listing_price: '$485,000',
  listing_begin_date: '05/01/2026',
  listing_end_date: '11/01/2026',
  listing_commission_pct: '3.0',
  selling_commission_pct: '2.5',
}

export async function GET() {
  const pdfBytes = await createTestListingAgreementPdf()
  return new Response(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="test-listing-agreement-blank.pdf"',
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const data = (body.data && Object.keys(body.data).length > 0) ? body.data : SAMPLE_DATA

    const blankPdfBytes = await createTestListingAgreementPdf()
    const { pdfBytes: filledBytes, filledCount, unfilledFields } = await fillPdf(
      blankPdfBytes,
      FORM_101_MAPPING,
      data,
      false
    )

    return new Response(Buffer.from(filledBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test-listing-agreement-filled.pdf"',
        'X-Filled-Count': String(filledCount),
        'X-Unfilled-Fields': unfilledFields.join(','),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: `Test fill failed: ${message}` }, { status: 500 })
  }
}

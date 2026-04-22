import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'

// Creates a fillable test PDF that simulates an NC REALTOR Listing Agreement.
// Used for development until real forms are uploaded.
export async function createTestListingAgreementPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold)
  const page = doc.addPage([612, 792]) // US Letter

  const form = doc.getForm()
  const { height } = page.getSize()

  const gray = rgb(0.4, 0.4, 0.4)
  const black = rgb(0, 0, 0)
  const lineColor = rgb(0.7, 0.7, 0.7)

  function label(text: string, x: number, y: number, size = 8) {
    page.drawText(text, { x, y, size, font: boldFont, color: gray })
  }

  function hLine(y: number, x1 = 40, x2 = 572) {
    page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: 0.5, color: lineColor })
  }

  function addTextField(name: string, x: number, y: number, w: number, h = 16) {
    const field = form.createTextField(name)
    field.addToPage(page, { x, y, width: w, height: h, borderWidth: 0.5 })
  }

  function addCheckBox(name: string, x: number, y: number) {
    const cb = form.createCheckBox(name)
    cb.addToPage(page, { x, y, width: 12, height: 12, borderWidth: 0.5 })
  }

  // Header
  page.drawRectangle({ x: 0, y: height - 60, width: 612, height: 60, color: rgb(0.1, 0.3, 0.6) })
  page.drawText('NORTH CAROLINA ASSOCIATION OF REALTORS®', {
    x: 40, y: height - 25, size: 11, font: boldFont, color: rgb(1, 1, 1),
  })
  page.drawText('EXCLUSIVE RIGHT TO SELL LISTING AGREEMENT (Form 101) — TEST COPY', {
    x: 40, y: height - 42, size: 8, font, color: rgb(0.8, 0.9, 1),
  })

  let y = height - 80

  // Section: Property
  page.drawText('1. PROPERTY', { x: 40, y, size: 9, font: boldFont, color: black })
  y -= 20

  label('Street Address', 40, y)
  addTextField('PropertyAddress', 40, y - 18, 350)
  label('County', 400, y)
  addTextField('PropertyCounty', 400, y - 18, 172)
  y -= 42

  label('City', 40, y)
  addTextField('PropertyCity', 40, y - 18, 200)
  label('State', 250, y)
  addTextField('PropertyState', 250, y - 18, 60)
  label('ZIP', 320, y)
  addTextField('PropertyZip', 320, y - 18, 90)
  label('Tax Parcel ID', 420, y)
  addTextField('TaxParcel', 420, y - 18, 152)
  y -= 42

  hLine(y + 12)
  page.drawText('2. SELLER(S)', { x: 40, y, size: 9, font: boldFont, color: black })
  y -= 20

  label('Seller 1 Full Name', 40, y)
  addTextField('SellerName1', 40, y - 18, 260)
  label('Phone', 310, y)
  addTextField('SellerPhone', 310, y - 18, 140)
  label('Email', 460, y)
  addTextField('SellerEmail', 460, y - 18, 112)
  y -= 42

  label('Seller 2 Full Name (if applicable)', 40, y)
  addTextField('SellerName2', 40, y - 18, 260)
  y -= 42

  hLine(y + 12)
  page.drawText('3. LISTING TERMS', { x: 40, y, size: 9, font: boldFont, color: black })
  y -= 20

  label('Listing Price ($)', 40, y)
  addTextField('ListingPrice', 40, y - 18, 150)
  label('Listing Period Begin', 200, y)
  addTextField('ListingBeginDate', 200, y - 18, 130)
  label('Listing Period End', 340, y)
  addTextField('ListingEndDate', 340, y - 18, 130)
  y -= 42

  label('Listing Commission (%)', 40, y)
  addTextField('ListingCommission', 40, y - 18, 100)
  label('Selling Commission (%)', 150, y)
  addTextField('SellingCommission', 150, y - 18, 100)
  y -= 42

  hLine(y + 12)
  page.drawText('4. LISTING FIRM & AGENT', { x: 40, y, size: 9, font: boldFont, color: black })
  y -= 20

  label('Agent Name', 40, y)
  addTextField('AgentName', 40, y - 18, 200)
  label('NC License #', 250, y)
  addTextField('AgentLicense', 250, y - 18, 100)
  label('Phone', 360, y)
  addTextField('AgentPhone', 360, y - 18, 120)
  label('Email', 490, y)
  addTextField('AgentEmail', 490, y - 18, 82)
  y -= 42

  label('Firm Name', 40, y)
  addTextField('FirmName', 40, y - 18, 200)
  label('Firm License #', 250, y)
  addTextField('FirmLicense', 250, y - 18, 100)
  label('Firm Phone', 360, y)
  addTextField('FirmPhone', 360, y - 18, 120)
  y -= 42

  label('Firm Address', 40, y)
  addTextField('FirmAddress', 40, y - 18, 532)
  y -= 42

  hLine(y + 12)
  page.drawText('5. PROPERTY DISCLOSURES', { x: 40, y, size: 9, font: boldFont, color: black })
  y -= 22

  const checkboxFields: [string, string][] = [
    ['HOAExists', 'HOA / Community Association exists'],
    ['FloodZone', 'Property is in a Flood Zone'],
    ['Septic', 'Property has septic system'],
    ['PrivateWell', 'Property has private well'],
    ['LeadPaint', 'Pre-1978 (Lead paint disclosure required)'],
    ['MineralRights', 'Mineral rights are severed'],
    ['UnpermittedRenovations', 'Unpermitted work / renovations'],
  ]

  for (const [fieldName, labelText] of checkboxFields) {
    addCheckBox(fieldName, 40, y)
    page.drawText(labelText, { x: 58, y: y + 2, size: 8, font, color: black })
    y -= 20
  }

  y -= 10
  hLine(y + 10)
  page.drawText('6. SIGNATURES', { x: 40, y, size: 9, font: boldFont, color: black })
  y -= 20

  label('Seller 1 Signature', 40, y)
  addTextField('Seller1Signature', 40, y - 18, 220)
  label('Date', 270, y)
  addTextField('Seller1SignDate', 270, y - 18, 100)
  y -= 42

  label('Seller 2 Signature', 40, y)
  addTextField('Seller2Signature', 40, y - 18, 220)
  label('Date', 270, y)
  addTextField('Seller2SignDate', 270, y - 18, 100)
  y -= 42

  label('Agent Signature', 40, y)
  addTextField('AgentSignature', 40, y - 18, 220)
  label('Date', 270, y)
  addTextField('AgentSignDate', 270, y - 18, 100)

  // Watermark
  page.drawText('TEST / DEVELOPMENT COPY — NOT FOR USE IN REAL TRANSACTIONS', {
    x: 80, y: 200, size: 14, font: boldFont,
    color: rgb(0.85, 0.2, 0.2),
    opacity: 0.3,
    rotate: degrees(35),
  })

  const pdfBytes = await doc.save()
  return pdfBytes
}

import { PDFDocument, PDFPage, PDFFont, PDFForm, StandardFonts, rgb, degrees } from 'pdf-lib'

// ─── Color palette ────────────────────────────────────────────────────────────
const NAVY   = rgb(0.06, 0.22, 0.46)
const GRAY   = rgb(0.38, 0.38, 0.38)
const BLACK  = rgb(0, 0, 0)
const WHITE  = rgb(1, 1, 1)
const LGRAY  = rgb(0.72, 0.72, 0.72)
const STRIPE = rgb(0.94, 0.94, 0.94)
const WMARK  = rgb(0.85, 0.15, 0.15)

// ─── Per-page context ─────────────────────────────────────────────────────────
interface Ctx {
  doc: PDFDocument
  form: PDFForm
  p: PDFPage
  font: PDFFont
  bold: PDFFont
}

function mk(ctx: Ctx) {
  const { form, p, font, bold } = ctx
  return {
    // AcroForm text field
    f(name: string, x: number, y: number, w: number, h = 15) {
      form.createTextField(name).addToPage(p, { x, y, width: w, height: h, borderWidth: 0.5 })
    },
    // Label above a field
    lbl(text: string, x: number, y: number, sz = 7) {
      p.drawText(text, { x, y, size: sz, font: bold, color: GRAY })
    },
    // Body text (instructions, clauses)
    txt(text: string, x: number, y: number, sz = 8) {
      p.drawText(text, { x, y, size: sz, font, color: BLACK })
    },
    // Section header bar
    sec(title: string, y: number, x = 40) {
      p.drawRectangle({ x: 36, y: y - 2, width: 540, height: 13, color: STRIPE })
      p.drawText(title, { x, y, size: 8, font: bold, color: BLACK })
    },
    // Horizontal rule
    hr(y: number, x1 = 40, x2 = 576) {
      p.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: 0.4, color: LGRAY })
    },
    // Watermark diagonal text
    wm() {
      p.drawText('TEST COPY — NOT FOR USE IN REAL TRANSACTIONS', {
        x: 55, y: 175, size: 15, font: bold, color: WMARK, opacity: 0.22, rotate: degrees(35),
      })
    },
    // NC REALTORS header
    header(formNum: string, formTitle: string) {
      const { width, height } = p.getSize()
      p.drawRectangle({ x: 0, y: height - 54, width, height: 54, color: NAVY })
      p.drawText('NORTH CAROLINA ASSOCIATION OF REALTORS®', {
        x: 40, y: height - 22, size: 10.5, font: bold, color: WHITE,
      })
      p.drawText(`Standard Form ${formNum}  |  ${formTitle}  |  TEST / DEVELOPMENT COPY`, {
        x: 40, y: height - 39, size: 7.5, font, color: rgb(0.78, 0.88, 1),
      })
    },
  }
}

async function newDoc() {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const form = doc.getForm()
  return { doc, font, bold, form }
}

function addPage(doc: PDFDocument, font: PDFFont, bold: PDFFont, form: PDFForm): Ctx {
  const p = doc.addPage([612, 792])
  return { doc, form, p, font, bold }
}

// ─── FORM 101 — Exclusive Right to Sell Listing Agreement ────────────────────
export async function createForm101Pdf(): Promise<Uint8Array> {
  const { doc, font, bold, form } = await newDoc()

  // ── Page 1: Property · Seller · Listing Terms · Firm ─────────────────────
  const c1 = addPage(doc, font, bold, form)
  const h = c1.p.getSize().height
  const t1 = mk(c1)
  t1.header('101', 'Exclusive Right to Sell Listing Agreement')

  let y = h - 68

  t1.sec('1.  PROPERTY', y); y -= 18
  t1.lbl('Street Address', 40, y)
  t1.f('PropertyAddress', 40, y - 16, 340)
  t1.lbl('County', 392, y)
  t1.f('PropertyCounty', 392, y - 16, 184)
  y -= 38
  t1.lbl('City', 40, y)
  t1.f('PropertyCity', 40, y - 16, 180)
  t1.lbl('State', 230, y)
  t1.f('PropertyState', 230, y - 16, 50)
  t1.lbl('ZIP', 292, y)
  t1.f('PropertyZip', 292, y - 16, 80)
  t1.lbl('Tax Parcel / PIN', 384, y)
  t1.f('TaxParcel', 384, y - 16, 192)
  y -= 38
  t1.lbl('Year Built', 40, y)
  t1.f('YearBuilt', 40, y - 16, 80)
  t1.lbl('Legal Description / Subdivision', 134, y)
  t1.f('LegalDescription', 134, y - 16, 442)
  y -= 44

  t1.hr(y + 10)
  t1.sec('2.  SELLER(S)', y); y -= 18
  t1.lbl('Seller 1 Full Legal Name', 40, y)
  t1.f('SellerName1', 40, y - 16, 280)
  t1.lbl('Phone', 332, y)
  t1.f('SellerPhone', 332, y - 16, 130)
  t1.lbl('Email', 474, y)
  t1.f('SellerEmail', 474, y - 16, 102)
  y -= 38
  t1.lbl('Seller 2 Full Legal Name (if applicable)', 40, y)
  t1.f('SellerName2', 40, y - 16, 280)
  t1.lbl('Current Mailing Address', 332, y)
  t1.f('SellerAddress', 332, y - 16, 244)
  y -= 44

  t1.hr(y + 10)
  t1.sec('3.  LISTING PERIOD & PRICE', y); y -= 18
  t1.lbl('Listing Price ($)', 40, y)
  t1.f('ListingPrice', 40, y - 16, 160)
  t1.lbl('Listing Period Begin', 214, y)
  t1.f('ListingBeginDate', 214, y - 16, 140)
  t1.lbl('Listing Period End', 368, y)
  t1.f('ListingEndDate', 368, y - 16, 140)
  y -= 38
  t1.lbl('Listing Commission (%)', 40, y)
  t1.f('ListingCommission', 40, y - 16, 110)
  t1.lbl('Selling/Cooperative Commission (%)', 164, y)
  t1.f('SellingCommission', 164, y - 16, 110)
  t1.txt('Commission rates are negotiable and not set by law.', 290, y - 10, 7.5)
  y -= 44

  t1.hr(y + 10)
  t1.sec('4.  LISTING FIRM & AGENT', y); y -= 18
  t1.lbl('Listing Agent Name', 40, y)
  t1.f('AgentName', 40, y - 16, 200)
  t1.lbl('NC License #', 252, y)
  t1.f('AgentLicense', 252, y - 16, 100)
  t1.lbl('Phone', 364, y)
  t1.f('AgentPhone', 364, y - 16, 110)
  t1.lbl('Email', 486, y)
  t1.f('AgentEmail', 486, y - 16, 90)
  y -= 38
  t1.lbl('Firm / Brokerage Name', 40, y)
  t1.f('FirmName', 40, y - 16, 200)
  t1.lbl('Firm License #', 252, y)
  t1.f('FirmLicense', 252, y - 16, 100)
  t1.lbl('Firm Phone', 364, y)
  t1.f('FirmPhone', 364, y - 16, 110)
  y -= 38
  t1.lbl('Firm Address', 40, y)
  t1.f('FirmAddress', 40, y - 16, 536)
  y -= 44

  t1.hr(y + 10)
  t1.sec('5.  MLS AUTHORIZATION & MARKETING', y); y -= 16
  t1.txt('Seller authorizes the Listing Firm to submit this listing to the applicable Multiple Listing Service (MLS). Seller acknowledges that listing', 40, y, 7.5)
  y -= 12
  t1.txt('information may be disseminated to other participants and the public via the MLS and internet. Additional marketing terms apply per the full agreement.', 40, y, 7.5)
  y -= 22

  t1.hr(y + 10)
  t1.sec('6.  AGENCY RELATIONSHIPS', y); y -= 14
  t1.txt('The Listing Firm acts as the Seller\'s agent. The Seller\'s Agent has the duty of loyalty to the Seller. The Listing Firm may also', 40, y, 7.5)
  y -= 12
  t1.txt('represent buyers in the purchase of other properties. Subagency and dual agency are addressed in the full agreement.', 40, y, 7.5)
  y -= 22

  t1.wm()

  // ── Page 2: Disclosures · Additional Terms · Signatures ──────────────────
  const c2 = addPage(doc, font, bold, form)
  const h2 = c2.p.getSize().height
  const t2 = mk(c2)
  t2.header('101', 'Exclusive Right to Sell Listing Agreement  —  Page 2')

  let y2 = h2 - 68

  t2.sec('7.  PROPERTY CONDITION DISCLOSURES', y2); y2 -= 18
  t2.txt('Indicate the property conditions below. These are required preliminary disclosures. Complete NC Residential Property Disclosure (Form 570) separately.', 40, y2, 7.5)
  y2 -= 18

  const discRows: [string, string, string][] = [
    ['HOAExists',       'HOAName',  'Is subject to HOA / Owners Association'],
    ['FloodZone',       '',         'Located in a FEMA Special Flood Hazard Area'],
    ['Septic',          '',         'Uses a septic / on-site wastewater system'],
    ['PrivateWell',     '',         'Uses a private well for water supply'],
    ['LeadPaint',       '',         'Built before 1978 — lead-based paint disclosure required'],
    ['MineralRights',   '',         'Mineral / oil / gas rights severed from property'],
    ['UnpermittedWork', '',         'Has unpermitted renovations or improvements'],
  ]

  for (const [field, extraField, label] of discRows) {
    t2.lbl('Yes / No / Unknown ->', 40, y2)
    t2.f(field, 128, y2 - 14, 70)
    t2.txt(label, 210, y2 - 9, 8)
    if (extraField) {
      t2.lbl('If Yes, HOA/Association Name:', 292, y2)
      t2.f('HOAName', 292, y2 - 14, 220)
      t2.lbl('Monthly Dues ($):', 522, y2)
      t2.f('HOADues', 522, y2 - 14, 54)
    }
    y2 -= 34
  }

  y2 -= 8
  t2.hr(y2 + 10)
  t2.sec('8.  ADDITIONAL TERMS & CONDITIONS', y2); y2 -= 16
  t2.txt('Seller represents that the property is offered in compliance with fair housing laws and all applicable state and federal regulations.', 40, y2, 7.5)
  y2 -= 12
  t2.txt('This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements.', 40, y2, 7.5)
  y2 -= 28

  t2.hr(y2 + 10)
  t2.sec('9.  SIGNATURES', y2); y2 -= 18
  t2.lbl('Seller 1 Signature', 40, y2)
  t2.f('Seller1Signature', 40, y2 - 16, 230)
  t2.lbl('Date', 284, y2)
  t2.f('Seller1SignDate', 284, y2 - 16, 110)
  y2 -= 38
  t2.lbl('Seller 2 Signature (if applicable)', 40, y2)
  t2.f('Seller2Signature', 40, y2 - 16, 230)
  t2.lbl('Date', 284, y2)
  t2.f('Seller2SignDate', 284, y2 - 16, 110)
  y2 -= 38
  t2.lbl('Listing Agent Signature', 40, y2)
  t2.f('AgentSignature', 40, y2 - 16, 230)
  t2.lbl('Date', 284, y2)
  t2.f('AgentSignDate', 284, y2 - 16, 110)
  y2 -= 38
  t2.lbl('Firm / Brokerage (authorized signatory)', 40, y2)
  t2.f('FirmSignature', 40, y2 - 16, 230)

  t2.wm()

  return doc.save()
}

// ─── FORM 161 — Buyer Agency Agreement ───────────────────────────────────────
export async function createForm161Pdf(): Promise<Uint8Array> {
  const { doc, font, bold, form } = await newDoc()

  // ── Page 1 ─────────────────────────────────────────────────────────────────
  const c1 = addPage(doc, font, bold, form)
  const h = c1.p.getSize().height
  const t = mk(c1)
  t.header('161', 'Buyer Agency Agreement')

  let y = h - 68

  t.sec('1.  PARTIES', y); y -= 18
  t.lbl('Buyer 1 Full Legal Name', 40, y)
  t.f('BuyerName1', 40, y - 16, 280)
  t.lbl('Phone', 332, y)
  t.f('BuyerPhone', 332, y - 16, 120)
  t.lbl('Email', 464, y)
  t.f('BuyerEmail', 464, y - 16, 112)
  y -= 38
  t.lbl('Buyer 2 Full Legal Name (if applicable)', 40, y)
  t.f('BuyerName2', 40, y - 16, 280)
  t.lbl('Mailing Address', 332, y)
  t.f('BuyerAddress', 332, y - 16, 244)
  y -= 38
  t.lbl('City', 40, y)
  t.f('BuyerCity', 40, y - 16, 170)
  t.lbl('State', 222, y)
  t.f('BuyerState', 222, y - 16, 50)
  t.lbl('ZIP', 284, y)
  t.f('BuyerZip', 284, y - 16, 80)
  y -= 44

  t.hr(y + 10)
  t.sec('2.  BUYER\'S AGENT & FIRM', y); y -= 18
  t.lbl('Agent Name', 40, y)
  t.f('AgentName', 40, y - 16, 200)
  t.lbl('NC License #', 252, y)
  t.f('AgentLicense', 252, y - 16, 100)
  t.lbl('Phone', 364, y)
  t.f('AgentPhone', 364, y - 16, 110)
  t.lbl('Email', 486, y)
  t.f('AgentEmail', 486, y - 16, 90)
  y -= 38
  t.lbl('Firm / Brokerage Name', 40, y)
  t.f('FirmName', 40, y - 16, 200)
  t.lbl('Firm License #', 252, y)
  t.f('FirmLicense', 252, y - 16, 100)
  t.lbl('Firm Phone', 364, y)
  t.f('FirmPhone', 364, y - 16, 110)
  y -= 38
  t.lbl('Firm Address', 40, y)
  t.f('FirmAddress', 40, y - 16, 536)
  y -= 44

  t.hr(y + 10)
  t.sec('3.  GEOGRAPHIC AREA OF REPRESENTATION', y); y -= 18
  t.lbl('Geographic Area / County / City', 40, y)
  t.f('PropertyArea', 40, y - 16, 300)
  t.lbl('Property Type(s)', 354, y)
  t.f('PropertyType', 354, y - 16, 222)
  y -= 44

  t.hr(y + 10)
  t.sec('4.  AGENCY PERIOD', y); y -= 18
  t.lbl('Agency Begin Date', 40, y)
  t.f('StartDate', 40, y - 16, 150)
  t.lbl('Agency End Date', 204, y)
  t.f('EndDate', 204, y - 16, 150)
  t.lbl('Target Purchase Price Range ($)', 368, y)
  t.f('PurchasePriceRange', 368, y - 16, 208)
  y -= 44

  t.hr(y + 10)
  t.sec('5.  COMPENSATION', y); y -= 18
  t.lbl('Buyer Agent Compensation (%  or  flat fee)', 40, y)
  t.f('BuyerCommission', 40, y - 16, 200)
  t.txt('This compensation may be paid by Seller, listing firm, or Buyer as negotiated.', 254, y - 9, 7.5)
  y -= 38
  t.lbl('Source of Compensation', 40, y)
  t.f('CompensationSource', 40, y - 16, 300)
  y -= 44

  t.hr(y + 10)
  t.sec('6.  BUYER OBLIGATIONS', y); y -= 14
  t.txt('Buyer agrees to work exclusively with Agent during the agency period within the defined geographic area. Buyer will notify Agent of', 40, y, 7.5)
  y -= 12
  t.txt('any properties of interest found through any source. Buyer agrees to disclose all relevant financial information needed to evaluate properties.', 40, y, 7.5)
  y -= 22

  t.wm()

  // ── Page 2 ─────────────────────────────────────────────────────────────────
  const c2 = addPage(doc, font, bold, form)
  const h2 = c2.p.getSize().height
  const t2 = mk(c2)
  t2.header('161', 'Buyer Agency Agreement  —  Page 2')

  let y2 = h2 - 68

  t2.sec('7.  AGENT DUTIES TO BUYER', y2); y2 -= 14
  t2.txt('Agent owes Buyer the following duties: loyalty, confidentiality, disclosure, obedience to lawful instructions, reasonable care and diligence,', 40, y2, 7.5)
  y2 -= 12
  t2.txt('and accounting for all funds. Agent will use reasonable efforts to locate property meeting Buyer\'s needs and negotiate on Buyer\'s behalf.', 40, y2, 7.5)
  y2 -= 26

  t2.hr(y2 + 10)
  t2.sec('8.  DUAL AGENCY / DESIGNATED AGENCY DISCLOSURE', y2); y2 -= 14
  t2.txt('Buyer acknowledges that Listing Firm may represent both Buyer and Seller in the same transaction. In such case, Buyer consents to dual', 40, y2, 7.5)
  y2 -= 12
  t2.txt('agency or designated agency as permitted by NC law. Agent will not disclose confidential information of either party without consent.', 40, y2, 7.5)
  y2 -= 26

  t2.hr(y2 + 10)
  t2.sec('9.  TERMINATION', y2); y2 -= 14
  t2.txt('Either party may terminate this Agreement with written notice. Buyer may owe compensation if Buyer purchases property identified during', 40, y2, 7.5)
  y2 -= 12
  t2.txt('the agency period within 90 days of termination. See full agreement for complete termination terms.', 40, y2, 7.5)
  y2 -= 30

  t2.hr(y2 + 10)
  t2.sec('10.  ADDITIONAL TERMS', y2); y2 -= 16
  t2.f('AdditionalTerms', 40, y2 - 40, 536, 40)
  y2 -= 60

  t2.hr(y2 + 10)
  t2.sec('11.  SIGNATURES', y2); y2 -= 18
  t2.lbl('Buyer 1 Signature', 40, y2)
  t2.f('Buyer1Signature', 40, y2 - 16, 230)
  t2.lbl('Date', 284, y2)
  t2.f('Buyer1SignDate', 284, y2 - 16, 110)
  y2 -= 38
  t2.lbl('Buyer 2 Signature (if applicable)', 40, y2)
  t2.f('Buyer2Signature', 40, y2 - 16, 230)
  t2.lbl('Date', 284, y2)
  t2.f('Buyer2SignDate', 284, y2 - 16, 110)
  y2 -= 38
  t2.lbl('Agent Signature', 40, y2)
  t2.f('AgentSignature', 40, y2 - 16, 230)
  t2.lbl('Date', 284, y2)
  t2.f('AgentSignDate', 284, y2 - 16, 110)

  t2.wm()

  return doc.save()
}

// ─── FORM 140 — Working With Real Estate Agents (Buyer) ──────────────────────
export async function createForm140Pdf(): Promise<Uint8Array> {
  const { doc, font, bold, form } = await newDoc()

  const c1 = addPage(doc, font, bold, form)
  const h = c1.p.getSize().height
  const t = mk(c1)
  t.header('140', 'Working With Real Estate Agents — Buyer Version')

  let y = h - 68

  t.sec('WORKING WITH REAL ESTATE AGENTS — MANDATORY DISCLOSURE', y); y -= 16
  t.txt('North Carolina law requires real estate agents to provide this disclosure at the FIRST SUBSTANTIAL CONTACT with a prospective buyer.', 40, y, 7.5)
  y -= 12
  t.txt('This is not a contract and does not obligate either party.', 40, y, 7.5)
  y -= 22

  t.hr(y + 10)
  t.sec('TYPES OF AGENCY RELATIONSHIPS IN NORTH CAROLINA', y); y -= 14
  t.txt('SELLER\'S AGENT: Represents the seller\'s interests. Has duties of loyalty, confidentiality, disclosure, obedience, and accounting to SELLER.', 40, y, 7.5)
  y -= 14
  t.txt('BUYER\'S AGENT: Represents the buyer\'s interests. Has duties of loyalty, confidentiality, disclosure, obedience, and accounting to BUYER.', 40, y, 7.5)
  y -= 14
  t.txt('DUAL AGENT: Represents both buyer and seller in the same transaction with reduced duties to each (requires informed consent of both parties).', 40, y, 7.5)
  y -= 14
  t.txt('DESIGNATED AGENT: Within same firm, different agents represent buyer and seller. Each agent owes full duties to their respective party.', 40, y, 7.5)
  y -= 22

  t.hr(y + 10)
  t.sec('BUYER\'S AGENT DUTIES', y); y -= 14
  t.txt('A Buyer\'s Agent owes the following duties EXCLUSIVELY to the Buyer:', 40, y, 7.5)
  y -= 14
  const buyerDuties = [
    'Loyalty — Act in Buyer\'s best interest at all times',
    'Confidentiality — Protect Buyer\'s confidential information',
    'Disclosure — Reveal all known material facts relevant to the transaction',
    'Obedience — Follow all lawful instructions from Buyer',
    'Reasonable Care and Diligence — Use professional skill on Buyer\'s behalf',
    'Accounting — Account for all funds entrusted by Buyer',
  ]
  for (const duty of buyerDuties) {
    t.txt(`•  ${duty}`, 50, y, 7.5)
    y -= 13
  }
  y -= 10

  t.hr(y + 10)
  t.sec('SELLER\'S AGENT DUTIES TO BUYER', y); y -= 14
  t.txt('Even when acting as the Seller\'s Agent, the agent owes the following duties to Buyer: (1) Disclose all material facts about the property', 40, y, 7.5)
  y -= 12
  t.txt('that the agent knows or reasonably should know; (2) Account for all funds received from Buyer; (3) Act honestly and in good faith.', 40, y, 7.5)
  y -= 22

  t.hr(y + 10)
  t.sec('PROPERTY SHOWN / TRANSACTION INFORMATION', y); y -= 18
  t.lbl('Property Address (if known)', 40, y)
  t.f('PropertyAddress', 40, y - 16, 400)
  y -= 38
  t.lbl('Agent Name', 40, y)
  t.f('AgentName', 40, y - 16, 200)
  t.lbl('Agent License #', 252, y)
  t.f('AgentLicense', 252, y - 16, 100)
  t.lbl('Date of Disclosure', 364, y)
  t.f('DateDisclosed', 364, y - 16, 140)
  y -= 38
  t.lbl('Firm / Brokerage Name', 40, y)
  t.f('FirmName', 40, y - 16, 260)
  t.lbl('Firm Address', 312, y)
  t.f('FirmAddress', 312, y - 16, 264)
  y -= 38
  t.lbl('Firm Phone', 40, y)
  t.f('FirmPhone', 40, y - 16, 150)
  y -= 44

  t.hr(y + 10)
  t.sec('BUYER ACKNOWLEDGMENT', y); y -= 14
  t.txt('By signing below, Buyer acknowledges receiving and reading this disclosure of the types of agency relationships available in North Carolina.', 40, y, 7.5)
  y -= 12
  t.txt('This disclosure does NOT create an agency relationship or obligate Buyer to work with this agent or firm.', 40, y, 7.5)
  y -= 24

  t.lbl('Buyer 1 Name', 40, y)
  t.f('BuyerName', 40, y - 16, 230)
  t.lbl('Buyer 1 Phone', 284, y)
  t.f('BuyerPhone', 284, y - 16, 140)
  t.lbl('Email', 436, y)
  t.f('BuyerEmail', 436, y - 16, 140)
  y -= 38
  t.lbl('Buyer 1 Signature', 40, y)
  t.f('BuyerSignature', 40, y - 16, 230)
  t.lbl('Date', 284, y)
  t.f('BuyerSignDate', 284, y - 16, 110)
  y -= 38
  t.lbl('Agent Signature', 40, y)
  t.f('AgentSignature', 40, y - 16, 230)
  t.lbl('Date', 284, y)
  t.f('AgentSignDate', 284, y - 16, 110)

  t.wm()

  return doc.save()
}

// ─── FORM 141 — Working With Real Estate Agents (Seller) ─────────────────────
export async function createForm141Pdf(): Promise<Uint8Array> {
  const { doc, font, bold, form } = await newDoc()

  const c1 = addPage(doc, font, bold, form)
  const h = c1.p.getSize().height
  const t = mk(c1)
  t.header('141', 'Working With Real Estate Agents — Seller Version')

  let y = h - 68

  t.sec('WORKING WITH REAL ESTATE AGENTS — MANDATORY DISCLOSURE', y); y -= 16
  t.txt('North Carolina law requires real estate agents to provide this disclosure at the FIRST SUBSTANTIAL CONTACT with a prospective seller.', 40, y, 7.5)
  y -= 12
  t.txt('This is not a contract and does not obligate either party.', 40, y, 7.5)
  y -= 22

  t.hr(y + 10)
  t.sec('TYPES OF AGENCY RELATIONSHIPS IN NORTH CAROLINA', y); y -= 14
  t.txt('SELLER\'S AGENT: Represents the seller\'s interests exclusively. Owes duties of loyalty, confidentiality, disclosure, obedience, and accounting to SELLER.', 40, y, 7.5)
  y -= 14
  t.txt('BUYER\'S AGENT: Represents the buyer. May show seller\'s property but owes primary duties to buyer, not seller.', 40, y, 7.5)
  y -= 14
  t.txt('DUAL AGENT: With informed consent, may represent both parties. Duties to each are limited — cannot advocate solely for either party.', 40, y, 7.5)
  y -= 14
  t.txt('NON-AGENT / FACILITATOR: Neither party\'s agent. Has limited duties — honesty, accounting, disclosure of material facts.', 40, y, 7.5)
  y -= 22

  t.hr(y + 10)
  t.sec('SELLER\'S AGENT EXCLUSIVE DUTIES', y); y -= 14
  t.txt('A Seller\'s Agent owes the following duties EXCLUSIVELY to the Seller:', 40, y, 7.5)
  y -= 14
  const sellerDuties = [
    'Loyalty — Place Seller\'s interests above all others in the transaction',
    'Confidentiality — Protect Seller\'s confidential information from buyers',
    'Disclosure — Reveal all facts relevant to the transaction to Seller',
    'Obedience — Follow Seller\'s lawful instructions regarding the property',
    'Reasonable Care and Diligence — Use professional skills to serve Seller',
    'Accounting — Account for all funds received related to the transaction',
  ]
  for (const duty of sellerDuties) {
    t.txt(`•  ${duty}`, 50, y, 7.5)
    y -= 13
  }
  y -= 10

  t.hr(y + 10)
  t.sec('DUTIES TO BUYERS (EVEN AS SELLER\'S AGENT)', y); y -= 14
  t.txt('Even when representing Seller, the agent must: (1) Disclose all known material defects about the property; (2) Act honestly; (3) Account', 40, y, 7.5)
  y -= 12
  t.txt('for any funds received from Buyer. Agent does NOT owe loyalty or confidentiality to Buyer when serving as Seller\'s Agent.', 40, y, 7.5)
  y -= 22

  t.hr(y + 10)
  t.sec('PROPERTY & CONTACT INFORMATION', y); y -= 18
  t.lbl('Property Address', 40, y)
  t.f('PropertyAddress', 40, y - 16, 400)
  y -= 38
  t.lbl('Agent Name', 40, y)
  t.f('AgentName', 40, y - 16, 200)
  t.lbl('Agent License #', 252, y)
  t.f('AgentLicense', 252, y - 16, 100)
  t.lbl('Date of Disclosure', 364, y)
  t.f('DateDisclosed', 364, y - 16, 140)
  y -= 38
  t.lbl('Firm / Brokerage Name', 40, y)
  t.f('FirmName', 40, y - 16, 260)
  t.lbl('Firm Address', 312, y)
  t.f('FirmAddress', 312, y - 16, 264)
  y -= 38
  t.lbl('Firm Phone', 40, y)
  t.f('FirmPhone', 40, y - 16, 150)
  y -= 44

  t.hr(y + 10)
  t.sec('SELLER ACKNOWLEDGMENT', y); y -= 14
  t.txt('By signing below, Seller acknowledges receiving and reading this Working With Real Estate Agents disclosure required by NC General Statute.', 40, y, 7.5)
  y -= 12
  t.txt('This signature does NOT establish an agency relationship or listing agreement.', 40, y, 7.5)
  y -= 24

  t.lbl('Seller 1 Full Name', 40, y)
  t.f('SellerName', 40, y - 16, 230)
  t.lbl('Seller Phone', 284, y)
  t.f('SellerPhone', 284, y - 16, 140)
  t.lbl('Email', 436, y)
  t.f('SellerEmail', 436, y - 16, 140)
  y -= 38
  t.lbl('Seller 1 Signature', 40, y)
  t.f('SellerSignature', 40, y - 16, 230)
  t.lbl('Date', 284, y)
  t.f('SellerSignDate', 284, y - 16, 110)
  y -= 38
  t.lbl('Agent Signature', 40, y)
  t.f('AgentSignature', 40, y - 16, 230)
  t.lbl('Date', 284, y)
  t.f('AgentSignDate', 284, y - 16, 110)

  t.wm()

  return doc.save()
}

// ─── FORM 110 — Seller Net Sheet (Estimated Proceeds) ────────────────────────
export async function createForm110Pdf(): Promise<Uint8Array> {
  const { doc, font, bold, form } = await newDoc()

  const c1 = addPage(doc, font, bold, form)
  const h = c1.p.getSize().height
  const t = mk(c1)
  t.header('110', 'Seller Net Sheet — Estimated Proceeds of Sale')

  let y = h - 68

  t.txt('This is an ESTIMATE only. Actual proceeds may vary. Not a guarantee of any specific amount.', 40, y, 7.5)
  y -= 20

  t.sec('PROPERTY & SELLER INFORMATION', y); y -= 18
  t.lbl('Property Address', 40, y)
  t.f('PropertyAddress', 40, y - 16, 340)
  t.lbl('City', 394, y)
  t.f('PropertyCity', 394, y - 16, 110)
  t.lbl('ZIP', 516, y)
  t.f('PropertyZip', 516, y - 16, 60)
  y -= 38
  t.lbl('Seller 1 Name', 40, y)
  t.f('SellerName1', 40, y - 16, 240)
  t.lbl('Seller 2 Name (if applicable)', 294, y)
  t.f('SellerName2', 294, y - 16, 240)
  y -= 38
  t.lbl('Prepared By (Agent Name)', 40, y)
  t.f('AgentName', 40, y - 16, 220)
  t.lbl('Firm Name', 274, y)
  t.f('FirmName', 274, y - 16, 200)
  t.lbl('Date Prepared', 486, y)
  t.f('PreparedDate', 486, y - 16, 90)
  y -= 44

  t.sec('PROJECTED SALE CALCULATIONS', y); y -= 12

  // Table-style layout
  const rows: [string, string, boolean][] = [
    ['Projected Sale / Listing Price', 'SalePrice', false],
    ['Listing-Side Commission (%)', 'ListingCommissionPct', false],
    ['Selling-Side Commission (%)', 'SellingCommissionPct', false],
    ['Estimated Commission Amount ($)', 'CommissionAmt', false],
    ['Mortgage Payoff (est.)', 'MortgagePayoff', false],
    ['Property Taxes / Prorations (est.)', 'TaxProration', false],
    ['HOA Dues / Transfer Fee (est.)', 'HOATransferFee', false],
    ['Attorney / Closing Fees (est.)', 'ClosingFees', false],
    ['Deed Stamps / Excise Tax (est.)', 'ExciseTax', false],
    ['Seller Paid Buyer Closing Costs', 'SellerPaidClosing', false],
    ['Repair Credits / Concessions', 'RepairCredits', false],
    ['Other Costs', 'OtherCosts', false],
  ]

  for (const [label, fieldName, _isTotal] of rows) {
    t.lbl(label, 40, y)
    t.f(fieldName, 390, y - 13, 180)
    t.hr(y - 16, 390, 572)
    y -= 28
  }

  y -= 4
  t.hr(y + 10, 40, 576)
  t.sec('ESTIMATED NET PROCEEDS TO SELLER', y); y -= 18
  t.f('EstimatedNetProceeds', 390, y - 16, 180, 18)
  t.txt('(Total of above credits minus total of above costs)', 40, y - 10, 7.5)
  y -= 44

  t.lbl('Projected Closing Date', 40, y)
  t.f('ClosingDate', 40, y - 16, 150)
  y -= 38

  t.hr(y + 10)
  t.txt('DISCLAIMER: This Seller Net Sheet is prepared for informational purposes only. It is based on estimates and assumptions. Actual net', 40, y, 7)
  y -= 11
  t.txt('proceeds will depend on actual transaction terms, lender payoff amounts, prorations, and closing costs determined at settlement.', 40, y, 7)
  y -= 22

  t.lbl('Seller Acknowledgment of Receipt', 40, y)
  t.f('SellerAckSignature', 40, y - 16, 230)
  t.lbl('Date', 284, y)
  t.f('SellerAckDate', 284, y - 16, 110)

  t.wm()

  return doc.save()
}

// ─── FORM 170 — Residential Property & Owners Association Disclosure ──────────
export async function createForm170Pdf(): Promise<Uint8Array> {
  const { doc, font, bold, form } = await newDoc()

  // ── Page 1 ─────────────────────────────────────────────────────────────────
  const c1 = addPage(doc, font, bold, form)
  const h = c1.p.getSize().height
  const t = mk(c1)
  t.header('170', 'Residential Property & Owners\' Association Disclosure Statement')

  let y = h - 68

  t.txt('NC General Statute §47E requires owners of residential real property to furnish this disclosure statement to prospective buyers.', 40, y, 7.5)
  y -= 12
  t.txt('Answer ALL questions. Check the appropriate response. If "Yes" or "No" does not accurately describe the condition, check "Unknown."', 40, y, 7.5)
  y -= 22

  t.sec('OWNER & PROPERTY INFORMATION', y); y -= 18
  t.lbl('Owner 1 Full Legal Name', 40, y)
  t.f('OwnerName1', 40, y - 16, 270)
  t.lbl('Owner 2 Full Legal Name (if applicable)', 324, y)
  t.f('OwnerName2', 324, y - 16, 252)
  y -= 38
  t.lbl('Property Street Address', 40, y)
  t.f('PropertyAddress', 40, y - 16, 280)
  t.lbl('City', 334, y)
  t.f('PropertyCity', 334, y - 16, 140)
  t.lbl('ZIP', 486, y)
  t.f('PropertyZip', 486, y - 16, 90)
  y -= 38
  t.lbl('County', 40, y)
  t.f('PropertyCounty', 40, y - 16, 120)
  y -= 44

  // Disclosure instruction header
  t.hr(y + 10)
  const instr = '        YES       NO    UNKNOWN'
  t.lbl(instr, 300, y); y -= 8
  t.hr(y + 2); y -= 10

  function discRow(label: string, fieldName: string, subField?: string, subLabel?: string) {
    t.txt(label, 40, y, 7.5)
    t.f(fieldName, 304, y - 12, 60)
    if (subField && subLabel) {
      t.lbl(subLabel, 40, y - 22)
      t.f(subField, 180, y - 34, 240)
      y -= 18
    }
    t.hr(y - 16, 36, 578)
    y -= 32
  }

  t.sec('OWNERS ASSOCIATION / HOA', y); y -= 22
  discRow('Is the property subject to an Owners\' Association / HOA?', 'HOAExists')
  t.lbl('If Yes — HOA / Association Name:', 40, y + 14)
  t.f('HOAName', 220, y + 4, 200)
  t.lbl('Monthly/Annual Dues ($):', 432, y + 14)
  t.f('HOADues', 530, y + 4, 46)
  y -= 14

  t.hr(y + 10)
  t.sec('WATER & SEWER', y); y -= 22
  discRow('Does the property use a private well for water supply?', 'PrivateWell')
  discRow('Does the property use a septic / on-site wastewater system?', 'Septic')

  t.hr(y + 10)
  t.sec('FLOOD / ENVIRONMENTAL', y); y -= 22
  discRow('Is the property located in a FEMA-designated Special Flood Hazard Area (100-year floodplain)?', 'FloodZone')
  discRow('Are there any known environmental hazards on or near the property (landfill, underground tanks, hazardous materials)?', 'EnvHazards')
  discRow('Are there any known wetlands on the property?', 'Wetlands')

  t.hr(y + 10)
  t.sec('LEAD PAINT / AGE', y); y -= 22
  discRow('Was the property (or any portion) built before 1978? (Lead-based paint disclosure required if Yes.)', 'LeadPaint')

  t.hr(y + 10)
  t.sec('MINERAL / OIL / GAS RIGHTS', y); y -= 22
  discRow('Are the mineral, oil, or gas rights for this property severed from the surface rights?', 'MineralRights')

  t.wm()

  // ── Page 2 ─────────────────────────────────────────────────────────────────
  const c2 = addPage(doc, font, bold, form)
  const h2 = c2.p.getSize().height
  const t2 = mk(c2)
  t2.header('170', 'Residential Property Disclosure  —  Page 2')

  let y2 = h2 - 68

  const instr2 = '        YES       NO    UNKNOWN'
  t2.lbl(instr2, 300, y2); y2 -= 8
  t2.hr(y2 + 2); y2 -= 10

  function discRow2(label: string, fieldName: string) {
    t2.txt(label, 40, y2, 7.5)
    t2.f(fieldName, 304, y2 - 12, 60)
    t2.hr(y2 - 16, 36, 578)
    y2 -= 32
  }

  t2.sec('STRUCTURAL / ROOF', y2); y2 -= 22
  discRow2('Are there any known defects with the foundation, basement, or crawl space?', 'FoundationDefects')
  discRow2('Are there any known defects with the roof, gutters, or attic?', 'RoofDefects')
  discRow2('Any known structural damage from termites, wood-boring insects, or moisture?', 'PestDamage')

  t2.hr(y2 + 10)
  t2.sec('MECHANICAL SYSTEMS', y2); y2 -= 22
  discRow2('Are there any known defects with the HVAC (heating / cooling) system?', 'HVACDefects')
  discRow2('Are there any known defects with the plumbing system?', 'PlumbingDefects')
  discRow2('Are there any known defects with the electrical system?', 'ElectricalDefects')

  t2.hr(y2 + 10)
  t2.sec('UNPERMITTED WORK / LEGAL', y2); y2 -= 22
  discRow2('Are there any unpermitted additions, renovations, or improvements?', 'UnpermittedWork')
  discRow2('Are there any current or pending violations, notices, or code enforcement actions?', 'CodeViolations')
  discRow2('Is the property subject to any easements, encroachments, or boundary disputes?', 'BoundaryDisputes')
  discRow2('Are there any pending or threatened lawsuits affecting the property?', 'PendingLawsuits')

  t2.hr(y2 + 10)
  t2.sec('ADDITIONAL KNOWN DEFECTS', y2); y2 -= 18
  t2.lbl('Describe any additional known defects, issues, or material facts about the property:', 40, y2)
  y2 -= 10
  t2.f('AdditionalDefects', 40, y2 - 40, 536, 40)
  y2 -= 60

  t2.hr(y2 + 10)
  t2.sec('OWNER CERTIFICATION & SIGNATURES', y2); y2 -= 16
  t2.txt('Owner(s) certify that, to the best of their knowledge, the information above is accurate and complete as of the date signed. Owner(s)', 40, y2, 7.5)
  y2 -= 12
  t2.txt('acknowledge the duty to supplement this disclosure if additional material defects are discovered before closing.', 40, y2, 7.5)
  y2 -= 24

  t2.lbl('Owner 1 Signature', 40, y2)
  t2.f('Owner1Signature', 40, y2 - 16, 230)
  t2.lbl('Date', 284, y2)
  t2.f('Owner1SignDate', 284, y2 - 16, 110)
  y2 -= 38
  t2.lbl('Owner 2 Signature (if applicable)', 40, y2)
  t2.f('Owner2Signature', 40, y2 - 16, 230)
  t2.lbl('Date', 284, y2)
  t2.f('Owner2SignDate', 284, y2 - 16, 110)
  y2 -= 38
  t2.lbl('Buyer Acknowledgment of Receipt', 40, y2)
  t2.f('BuyerAckSignature', 40, y2 - 16, 230)
  t2.lbl('Date', 284, y2)
  t2.f('BuyerAckDate', 284, y2 - 16, 110)

  t2.wm()

  return doc.save()
}

// Backward compat alias
export const createTestListingAgreementPdf = createForm101Pdf

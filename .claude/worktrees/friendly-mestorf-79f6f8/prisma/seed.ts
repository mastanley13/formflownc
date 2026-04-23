import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'
import { writeFile, mkdir, copyFile, access } from 'fs/promises'
import path from 'path'
import {
  createForm101Pdf,
  createForm161Pdf,
  createForm140Pdf,
  createForm141Pdf,
  createForm110Pdf,
  createForm170Pdf,
} from '../lib/pdf-engine'

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// ─── Form definitions ─────────────────────────────────────────────────────────
// fieldMappings keys = exact AcroForm field names detected in the real PDFs.
// fieldMappings values = canonical keys from lib/pdf-engine/types.ts CANONICAL_FIELDS.
// Real PDFs live in uploads/forms/ — seed uses them if present, generates test ones if not.

const FORMS = [
  {
    formNumber: '101',
    formName: 'Exclusive Right to Sell Listing Agreement',
    category: JSON.stringify(['Seller', 'Listing']),
    version: '2025',
    filename: '101-exclusive-right-to-sell.pdf',
    generate: createForm101Pdf,
    fieldMappings: {
      // Property
      PropertyAddress:   'property_address',
      PropertyCity:      'property_city',
      PropertyState:     'property_state',
      PropertyZip:       'property_zip',
      PropertyCounty:    'property_county',
      TaxParcel:         'property_tax_parcel',
      YearBuilt:         'property_year_built',
      LegalDescription:  'property_legal_description',
      // Seller
      SellerName1:       'seller_name_1',
      SellerName2:       'seller_name_2',
      SellerPhone:       'seller_phone',
      SellerEmail:       'seller_email',
      SellerAddress:     'seller_address',
      // Listing terms
      ListingPrice:      'listing_price',
      ListingBeginDate:  'listing_begin_date',
      ListingEndDate:    'listing_end_date',
      ListingCommission: 'listing_commission_pct',
      SellingCommission: 'selling_commission_pct',
      // Agent / Firm
      AgentName:         'agent_name',
      AgentLicense:      'agent_license_number',
      AgentPhone:        'agent_phone',
      AgentEmail:        'agent_email',
      FirmName:          'agent_firm_name',
      FirmLicense:       'agent_firm_license',
      FirmAddress:       'agent_firm_address',
      FirmPhone:         'agent_firm_phone',
      // Disclosures
      HOAExists:         'disc_hoa_exists',
      HOAName:           'property_hoa_name',
      HOADues:           'property_hoa_dues',
      FloodZone:         'disc_flood_zone',
      Septic:            'disc_septic',
      PrivateWell:       'disc_well',
      LeadPaint:         'disc_lead_paint',
      MineralRights:     'disc_mineral_rights',
      UnpermittedWork:   'disc_renovations',
      // Signatures (e-sign via DocuSeal)
      Seller1Signature:  'seller_1_signature',
      Seller1SignDate:   'seller_1_sign_date',
      Seller2Signature:  'seller_2_signature',
      Seller2SignDate:   'seller_2_sign_date',
      AgentSignature:    'agent_signature',
      AgentSignDate:     'agent_sign_date',
      FirmSignature:     'firm_signature',
    },
  },
  {
    formNumber: '201',
    formName: 'Exclusive Buyer Agency Agreement',
    category: JSON.stringify(['Buyer', 'Agency']),
    version: '2025',
    filename: '161-buyer-agency-agreement.pdf',
    generate: createForm161Pdf,
    fieldMappings: {
      // Buyer
      BuyerName1:         'buyer_name_1',
      BuyerName2:         'buyer_name_2',
      BuyerPhone:         'buyer_phone',
      BuyerEmail:         'buyer_email',
      BuyerAddress:       'buyer_address',
      BuyerCity:          'buyer_city',
      BuyerState:         'buyer_state',
      BuyerZip:           'buyer_zip',
      // Agent / Firm
      AgentName:          'agent_name',
      AgentLicense:       'agent_license_number',
      AgentPhone:         'agent_phone',
      AgentEmail:         'agent_email',
      FirmName:           'agent_firm_name',
      FirmLicense:        'agent_firm_license',
      FirmAddress:        'agent_firm_address',
      FirmPhone:          'agent_firm_phone',
      // Agreement terms
      PropertyArea:       'property_area',
      PropertyType:       'property_type',
      StartDate:          'buyer_agency_start_date',
      EndDate:            'buyer_agency_end_date',
      PurchasePriceRange: 'buyer_price_range',
      BuyerCommission:    'buyer_commission_pct',
      CompensationSource: 'buyer_compensation_source',
      AdditionalTerms:    'additional_terms',
      // Signatures
      Buyer1Signature:    'buyer_1_signature',
      Buyer1SignDate:     'buyer_1_sign_date',
      Buyer2Signature:    'buyer_2_signature',
      Buyer2SignDate:     'buyer_2_sign_date',
      AgentSignature:     'agent_signature',
      AgentSignDate:      'agent_sign_date',
    },
  },
  {
    formNumber: '140',
    formName: 'Working With Real Estate Agents — Buyer',
    category: JSON.stringify(['Buyer', 'Disclosure', 'Agency']),
    version: '2025',
    filename: '140-wwrea-buyer.pdf',
    generate: createForm140Pdf,
    fieldMappings: {
      PropertyAddress: 'property_address',
      AgentName:       'agent_name',
      AgentLicense:    'agent_license_number',
      DateDisclosed:   'contract_date',
      FirmName:        'agent_firm_name',
      FirmAddress:     'agent_firm_address',
      FirmPhone:       'agent_firm_phone',
      BuyerName:       'buyer_name_1',
      BuyerPhone:      'buyer_phone',
      BuyerEmail:      'buyer_email',
      BuyerSignature:  'buyer_1_signature',
      BuyerSignDate:   'buyer_1_sign_date',
      AgentSignature:  'agent_signature',
      AgentSignDate:   'agent_sign_date',
    },
  },
  {
    formNumber: '141',
    formName: 'Working With Real Estate Agents — Seller',
    category: JSON.stringify(['Seller', 'Disclosure', 'Agency']),
    version: '2025',
    filename: '141-wwrea-seller.pdf',
    generate: createForm141Pdf,
    fieldMappings: {
      PropertyAddress: 'property_address',
      AgentName:       'agent_name',
      AgentLicense:    'agent_license_number',
      DateDisclosed:   'contract_date',
      FirmName:        'agent_firm_name',
      FirmAddress:     'agent_firm_address',
      FirmPhone:       'agent_firm_phone',
      SellerName:      'seller_name_1',
      SellerPhone:     'seller_phone',
      SellerEmail:     'seller_email',
      SellerSignature: 'seller_1_signature',
      SellerSignDate:  'seller_1_sign_date',
      AgentSignature:  'agent_signature',
      AgentSignDate:   'agent_sign_date',
    },
  },
  {
    formNumber: '110',
    formName: 'Seller Net Sheet — Estimated Proceeds of Sale',
    category: JSON.stringify(['Seller', 'Financial']),
    version: '2025',
    filename: '110-seller-net-sheet.pdf',
    generate: createForm110Pdf,
    fieldMappings: {
      PropertyAddress:      'property_address',
      PropertyCity:         'property_city',
      PropertyZip:          'property_zip',
      SellerName1:          'seller_name_1',
      SellerName2:          'seller_name_2',
      AgentName:            'agent_name',
      FirmName:             'agent_firm_name',
      PreparedDate:         'net_sheet_prepared_date',
      SalePrice:            'listing_price',
      ListingCommissionPct: 'listing_commission_pct',
      SellingCommissionPct: 'selling_commission_pct',
      CommissionAmt:        'net_commission_total',
      MortgagePayoff:       'net_mortgage_payoff',
      TaxProration:         'net_tax_proration',
      HOATransferFee:       'net_hoa_transfer_fee',
      ClosingFees:          'net_closing_fees',
      ExciseTax:            'net_excise_tax',
      SellerPaidClosing:    'net_seller_paid_closing',
      RepairCredits:        'net_repair_credits',
      OtherCosts:           'net_other_costs',
      EstimatedNetProceeds: 'net_estimated_proceeds',
      ClosingDate:          'closing_date',
      SellerAckSignature:   'seller_1_signature',
      SellerAckDate:        'seller_1_sign_date',
    },
  },
  {
    formNumber: '170',
    formName: 'Residential Property & Owners\' Association Disclosure Statement',
    category: JSON.stringify(['Seller', 'Disclosure']),
    version: '2025',
    filename: '170-residential-property-disclosure.pdf',
    generate: createForm170Pdf,
    fieldMappings: {
      // Property / Owners
      OwnerName1:        'seller_name_1',
      OwnerName2:        'seller_name_2',
      PropertyAddress:   'property_address',
      PropertyCity:      'property_city',
      PropertyZip:       'property_zip',
      PropertyCounty:    'property_county',
      // HOA
      HOAExists:         'disc_hoa_exists',
      HOAName:           'property_hoa_name',
      HOADues:           'property_hoa_dues',
      // Environmental / Systems
      PrivateWell:       'disc_well',
      Septic:            'disc_septic',
      FloodZone:         'disc_flood_zone',
      EnvHazards:        'disc_environmental_hazards',
      Wetlands:          'disc_wetlands',
      LeadPaint:         'disc_lead_paint',
      MineralRights:     'disc_mineral_rights',
      // Structural / Systems
      FoundationDefects: 'disc_foundation_defects',
      RoofDefects:       'disc_roof_defects',
      PestDamage:        'disc_pest_damage',
      HVACDefects:       'disc_hvac_defects',
      PlumbingDefects:   'disc_plumbing_defects',
      ElectricalDefects: 'disc_electrical_defects',
      UnpermittedWork:   'disc_renovations',
      CodeViolations:    'disc_code_violations',
      BoundaryDisputes:  'disc_boundary_disputes',
      PendingLawsuits:   'disc_pending_lawsuits',
      AdditionalDefects: 'disc_additional_defects',
      // Signatures
      Owner1Signature:   'seller_1_signature',
      Owner1SignDate:    'seller_1_sign_date',
      Owner2Signature:   'seller_2_signature',
      Owner2SignDate:    'seller_2_sign_date',
      BuyerAckSignature: 'buyer_1_signature',
      BuyerAckDate:      'buyer_1_sign_date',
    },
  },
]

async function fileExists(p: string): Promise<boolean> {
  try { await access(p); return true } catch { return false }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Seeding FormFlowNC database…\n')

  // 1. Upsert Chris Rayner
  const passwordHash = await bcrypt.hash('formflow2024!', 12)
  const agent = await prisma.agent.upsert({
    where: { email: 'chris@buyingnewbern.com' },
    update: {},
    create: {
      email: 'chris@buyingnewbern.com',
      passwordHash,
      name: 'Chris Rayner',
      phone: '(252) 675-0100',
      licenseNumber: '307456',
      firmName: 'Realty ONE Group Affinity',
      firmLicense: 'C-32419',
      firmAddress: '2809 Neuse Blvd, Suite 101, New Bern, NC 28562',
      firmPhone: '(252) 675-0200',
    },
  })
  console.log(`✅ Agent: ${agent.name} <${agent.email}>`)

  // 2. Ensure uploads/forms/ directory exists
  const formsDir = path.join(process.cwd(), 'uploads', 'forms')
  await mkdir(formsDir, { recursive: true })

  // 3. Register each form template, using real PDFs when present
  for (const form of FORMS) {
    const pdfPath = path.join(formsDir, form.filename)
    let source = 'existing'

    if (!(await fileExists(pdfPath))) {
      // Real PDF not present — generate synthetic test PDF as fallback
      const pdfBytes = await form.generate()
      await writeFile(pdfPath, Buffer.from(pdfBytes))
      source = 'generated (test)'
    }

    const pdfFilePath = `uploads/forms/${form.filename}`
    const fieldMappings = JSON.stringify(form.fieldMappings)

    await prisma.formTemplate.upsert({
      where: { formNumber: form.formNumber },
      update: {
        formName: form.formName,
        category: form.category,
        version: form.version,
        pdfFilePath,
        fieldMappings,
        isActive: true,
      },
      create: {
        formNumber: form.formNumber,
        formName: form.formName,
        category: form.category,
        version: form.version,
        pdfFilePath,
        fieldMappings,
        isActive: true,
      },
    })

    console.log(`✅ Form ${form.formNumber}: ${form.formName}  [${source}]  →  ${pdfFilePath}`)
  }

  console.log('\n✨ Seed complete!')
  console.log('\n📋 Login: chris@buyingnewbern.com / formflow2024!')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })

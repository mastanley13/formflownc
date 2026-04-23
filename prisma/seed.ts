import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'
import { writeFile, mkdir } from 'fs/promises'
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
// fieldMappings keys = exact AcroForm field names in the generated PDFs above.
// fieldMappings values = canonical keys from lib/pdf-engine/types.ts CANONICAL_FIELDS.

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
      // Disclosures (filled with "Yes" / "No" / "Unknown")
      HOAExists:         'disc_hoa_exists',
      HOAName:           'property_hoa_name',
      HOADues:           'property_hoa_dues',
      FloodZone:         'disc_flood_zone',
      Septic:            'disc_septic',
      PrivateWell:       'disc_well',
      LeadPaint:         'disc_lead_paint',
      MineralRights:     'disc_mineral_rights',
      UnpermittedWork:   'disc_renovations',
    },
  },
  {
    formNumber: '161',
    formName: 'Buyer Agency Agreement',
    category: JSON.stringify(['Buyer', 'Agency']),
    version: '2025',
    filename: '161-buyer-agency-agreement.pdf',
    generate: createForm161Pdf,
    fieldMappings: {
      // Buyer
      BuyerName1:       'buyer_name_1',
      BuyerName2:       'buyer_name_2',
      BuyerPhone:       'buyer_phone',
      BuyerEmail:       'buyer_email',
      BuyerAddress:     'buyer_address',
      BuyerCity:        'buyer_city',
      BuyerState:       'buyer_state',
      BuyerZip:         'buyer_zip',
      // Agent / Firm
      AgentName:        'agent_name',
      AgentLicense:     'agent_license_number',
      AgentPhone:       'agent_phone',
      AgentEmail:       'agent_email',
      FirmName:         'agent_firm_name',
      FirmLicense:      'agent_firm_license',
      FirmAddress:      'agent_firm_address',
      FirmPhone:        'agent_firm_phone',
      // Agreement terms
      PropertyArea:     'property_county',
      StartDate:        'listing_begin_date',
      EndDate:          'listing_end_date',
      BuyerCommission:  'selling_commission_pct',
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
      BuyerName:     'buyer_name_1',
      BuyerPhone:    'buyer_phone',
      BuyerEmail:    'buyer_email',
      PropertyAddress: 'property_address',
      AgentName:     'agent_name',
      AgentLicense:  'agent_license_number',
      FirmName:      'agent_firm_name',
      FirmAddress:   'agent_firm_address',
      FirmPhone:     'agent_firm_phone',
      DateDisclosed: 'contract_date',
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
      SellerName:    'seller_name_1',
      SellerPhone:   'seller_phone',
      SellerEmail:   'seller_email',
      PropertyAddress: 'property_address',
      AgentName:     'agent_name',
      AgentLicense:  'agent_license_number',
      FirmName:      'agent_firm_name',
      FirmAddress:   'agent_firm_address',
      FirmPhone:     'agent_firm_phone',
      DateDisclosed: 'contract_date',
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
      PropertyAddress:     'property_address',
      PropertyCity:        'property_city',
      PropertyZip:         'property_zip',
      SellerName1:         'seller_name_1',
      SellerName2:         'seller_name_2',
      AgentName:           'agent_name',
      FirmName:            'agent_firm_name',
      PreparedDate:        'contract_date',
      SalePrice:           'listing_price',
      ListingCommissionPct: 'listing_commission_pct',
      SellingCommissionPct: 'selling_commission_pct',
      ClosingDate:         'closing_date',
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
      // Property
      OwnerName1:      'seller_name_1',
      OwnerName2:      'seller_name_2',
      PropertyAddress: 'property_address',
      PropertyCity:    'property_city',
      PropertyZip:     'property_zip',
      PropertyCounty:  'property_county',
      // HOA
      HOAExists:       'disc_hoa_exists',
      HOAName:         'property_hoa_name',
      HOADues:         'property_hoa_dues',
      // Environmental
      PrivateWell:     'disc_well',
      Septic:          'disc_septic',
      FloodZone:       'disc_flood_zone',
      LeadPaint:       'disc_lead_paint',
      MineralRights:   'disc_mineral_rights',
      UnpermittedWork: 'disc_renovations',
    },
  },
]

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

  // 3. Generate each PDF and upsert form template record
  for (const form of FORMS) {
    const pdfBytes = await form.generate()
    const pdfPath = path.join(formsDir, form.filename)
    await writeFile(pdfPath, Buffer.from(pdfBytes))

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

    console.log(`✅ Form ${form.formNumber}: ${form.formName}  →  ${pdfFilePath}`)
  }

  console.log('\n✨ Seed complete!')
  console.log('\n📋 Login: chris@buyingnewbern.com / formflow2024!')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })

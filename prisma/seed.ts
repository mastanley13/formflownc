import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'
import { existsSync } from 'fs'
import { mkdir } from 'fs/promises'
import path from 'path'

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// Form definitions using real NC REALTOR PDFs in uploads/forms/
// fieldMappings keys = exact AcroForm field names detected in the real PDFs.
// fieldMappings values = canonical keys from lib/pdf-engine/types.ts CANONICAL_FIELDS.

const FORMS = [
  {
    formNumber: '101',
    formName: 'Exclusive Right to Sell Listing Agreement',
    category: JSON.stringify(['Seller', 'Listing']),
    version: '2025',
    filename: '101-exclusive-right-to-sell.pdf',
    fieldMappings: {
      PropertyAddress:   'property_address',
      PropertyCounty:    'property_county',
      PropertyCity:      'property_city',
      PropertyState:     'property_state',
      PropertyZip:       'property_zip',
      TaxParcel:         'property_tax_parcel',
      YearBuilt:         'property_year_built',
      LegalDescription:  'property_legal_description',
      SellerName1:       'seller_name_1',
      SellerName2:       'seller_name_2',
      SellerPhone:       'seller_phone',
      SellerEmail:       'seller_email',
      SellerAddress:     'seller_address',
      ListingPrice:      'listing_price',
      ListingBeginDate:  'listing_begin_date',
      ListingEndDate:    'listing_end_date',
      ListingCommission: 'listing_commission_pct',
      SellingCommission: 'selling_commission_pct',
      AgentName:         'agent_name',
      AgentLicense:      'agent_license_number',
      AgentPhone:        'agent_phone',
      AgentEmail:        'agent_email',
      FirmName:          'agent_firm_name',
      FirmLicense:       'agent_firm_license',
      FirmAddress:       'agent_firm_address',
      FirmPhone:         'agent_firm_phone',
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
    formName: 'Exclusive Buyer Agency Agreement',
    category: JSON.stringify(['Buyer', 'Agency']),
    version: '2025',
    filename: '161-buyer-agency-agreement.pdf',
    fieldMappings: {
      BuyerName1:          'buyer_name_1',
      BuyerName2:          'buyer_name_2',
      BuyerPhone:          'buyer_phone',
      BuyerEmail:          'buyer_email',
      BuyerAddress:        'buyer_address',
      BuyerCity:           'buyer_city',
      BuyerState:          'buyer_state',
      BuyerZip:            'buyer_zip',
      AgentName:           'agent_name',
      AgentLicense:        'agent_license_number',
      AgentPhone:          'agent_phone',
      AgentEmail:          'agent_email',
      FirmName:            'agent_firm_name',
      FirmLicense:         'agent_firm_license',
      FirmPhone:           'agent_firm_phone',
      FirmAddress:         'agent_firm_address',
      PropertyArea:        'property_area',
      PropertyType:        'property_type',
      StartDate:           'listing_begin_date',
      EndDate:             'listing_end_date',
      PurchasePriceRange:  'purchase_price_range',
      BuyerCommission:     'buyer_commission',
      CompensationSource:  'compensation_source',
      AdditionalTerms:     'additional_terms',
    },
  },
  {
    formNumber: '140',
    formName: 'Working With Real Estate Agents - Buyer',
    category: JSON.stringify(['Buyer', 'Disclosure', 'Agency']),
    version: '2025',
    filename: '140-wwrea-buyer.pdf',
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
    },
  },
  {
    formNumber: '141',
    formName: 'Working With Real Estate Agents - Seller',
    category: JSON.stringify(['Seller', 'Disclosure', 'Agency']),
    version: '2025',
    filename: '141-wwrea-seller.pdf',
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
    },
  },
  {
    formNumber: '110',
    formName: 'Seller Net Sheet - Estimated Proceeds of Sale',
    category: JSON.stringify(['Seller', 'Financial']),
    version: '2025',
    filename: '110-seller-net-sheet.pdf',
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
      CommissionAmt:       'commission_amount',
      MortgagePayoff:      'mortgage_payoff',
      TaxProration:        'tax_proration',
      HOATransferFee:      'hoa_transfer_fee',
      ClosingFees:         'closing_fees',
      ExciseTax:           'excise_tax',
      SellerPaidClosing:   'seller_paid_closing',
      RepairCredits:       'repair_credits',
      OtherCosts:          'other_costs',
      EstimatedNetProceeds: 'estimated_net_proceeds',
      ClosingDate:         'closing_date',
    },
  },
  {
    formNumber: '170',
    formName: "Residential Property & Owners' Association Disclosure Statement",
    category: JSON.stringify(['Seller', 'Disclosure']),
    version: '2025',
    filename: '170-residential-property-disclosure.pdf',
    fieldMappings: {
      OwnerName1:        'seller_name_1',
      OwnerName2:        'seller_name_2',
      PropertyAddress:   'property_address',
      PropertyCity:      'property_city',
      PropertyZip:       'property_zip',
      PropertyCounty:    'property_county',
      HOAExists:         'disc_hoa_exists',
      HOAName:           'property_hoa_name',
      HOADues:           'property_hoa_dues',
      PrivateWell:       'disc_well',
      Septic:            'disc_septic',
      FloodZone:         'disc_flood_zone',
      EnvHazards:        'disc_env_hazards',
      Wetlands:          'disc_wetlands',
      LeadPaint:         'disc_lead_paint',
      MineralRights:     'disc_mineral_rights',
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
    },
  },
]

// Main
async function main() {
  console.log('Seeding FormFlowNC database...\n')

  // 1. Upsert demo agent Chris Rayner
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
  console.log(`Agent: ${agent.name} <${agent.email}>`)

  // 2. Ensure uploads/forms/ directory exists
  const formsDir = path.join(process.cwd(), 'uploads', 'forms')
  await mkdir(formsDir, { recursive: true })

  // 3. Register each real PDF form template
  for (const form of FORMS) {
    const pdfFilePath = `uploads/forms/${form.filename}`
    const fullPath = path.join(process.cwd(), pdfFilePath)

    if (!existsSync(fullPath)) {
      console.log(`SKIP Form ${form.formNumber}: PDF not found at ${pdfFilePath}`)
      continue
    }

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

    const mappingCount = Object.keys(form.fieldMappings).length
    console.log(`Form ${form.formNumber}: ${form.formName} (${mappingCount} mapped fields)`)
  }

  console.log('\nSeed complete!')
  console.log('\nLogin: chris@buyingnewbern.com / formflow2024!')
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })

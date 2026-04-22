import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const FORMS = [
  {
    formNumber: '101',
    formName: 'Exclusive Right to Sell Listing Agreement',
    category: JSON.stringify(['Seller', 'Listing']),
    fieldMappings: JSON.stringify({
      SellerName1: 'seller_name_1',
      SellerName2: 'seller_name_2',
      SellerEmail: 'seller_email',
      SellerPhone: 'seller_phone',
      PropertyAddress: 'property_address',
      PropertyCity: 'property_city',
      PropertyState: 'property_state',
      PropertyZip: 'property_zip',
      PropertyCounty: 'property_county',
      ListingPrice: 'listing_price',
      ListingBeginDate: 'listing_begin_date',
      ListingEndDate: 'listing_end_date',
      ListingCommission: 'listing_commission_pct',
      SellingCommission: 'selling_commission_pct',
      AgentName: 'agent_name',
      AgentLicense: 'agent_license_number',
      AgentPhone: 'agent_phone',
      AgentEmail: 'agent_email',
      FirmName: 'agent_firm_name',
      FirmLicense: 'agent_firm_license',
      FirmAddress: 'agent_firm_address',
      FirmPhone: 'agent_firm_phone',
    }),
    pdfFilePath: 'forms/101-exclusive-right-to-sell.pdf',
    version: '2024',
  },
  {
    formNumber: '161',
    formName: 'Buyer Agency Agreement',
    category: JSON.stringify(['Buyer', 'Agency']),
    fieldMappings: JSON.stringify({
      BuyerName1: 'buyer_name_1',
      BuyerName2: 'buyer_name_2',
      BuyerEmail: 'buyer_email',
      BuyerPhone: 'buyer_phone',
      AgentName: 'agent_name',
      AgentLicense: 'agent_license_number',
      FirmName: 'agent_firm_name',
      FirmLicense: 'agent_firm_license',
      FirmAddress: 'agent_firm_address',
      PropertyArea: 'property_county',
      StartDate: 'listing_begin_date',
      EndDate: 'listing_end_date',
      BuyerCommission: 'selling_commission_pct',
    }),
    pdfFilePath: 'forms/161-buyer-agency-agreement.pdf',
    version: '2024',
  },
  {
    formNumber: '140',
    formName: 'Working with Real Estate Agents — Buyer',
    category: JSON.stringify(['Buyer', 'Disclosure']),
    fieldMappings: JSON.stringify({
      BuyerName: 'buyer_name_1',
      AgentName: 'agent_name',
      FirmName: 'agent_firm_name',
      PropertyAddress: 'property_address',
    }),
    pdfFilePath: 'forms/140-wwrea-buyer.pdf',
    version: '2024',
  },
  {
    formNumber: '141',
    formName: 'Working with Real Estate Agents — Seller',
    category: JSON.stringify(['Seller', 'Disclosure']),
    fieldMappings: JSON.stringify({
      SellerName: 'seller_name_1',
      AgentName: 'agent_name',
      FirmName: 'agent_firm_name',
      PropertyAddress: 'property_address',
    }),
    pdfFilePath: 'forms/141-wwrea-seller.pdf',
    version: '2024',
  },
  {
    formNumber: '110',
    formName: 'Residential Property Management Agreement',
    category: JSON.stringify(['Seller', 'Management']),
    fieldMappings: JSON.stringify({
      OwnerName1: 'seller_name_1',
      OwnerName2: 'seller_name_2',
      PropertyAddress: 'property_address',
      PropertyCity: 'property_city',
      PropertyCounty: 'property_county',
      AgentName: 'agent_name',
      FirmName: 'agent_firm_name',
      ManagementFee: 'listing_commission_pct',
    }),
    pdfFilePath: 'forms/110-property-management.pdf',
    version: '2024',
  },
  {
    formNumber: '170',
    formName: 'Residential Property and Owners Association Disclosure Statement',
    category: JSON.stringify(['Seller', 'Disclosure']),
    fieldMappings: JSON.stringify({
      OwnerName1: 'seller_name_1',
      OwnerName2: 'seller_name_2',
      PropertyAddress: 'property_address',
      PropertyCity: 'property_city',
      PropertyZip: 'property_zip',
      PropertyCounty: 'property_county',
      HOAExists: 'disc_hoa_exists',
      HOAName: 'property_hoa_name',
      HOADues: 'property_hoa_dues',
      FloodZone: 'disc_flood_zone',
      Septic: 'disc_septic',
      PrivateWell: 'disc_well',
      LeadPaint: 'disc_lead_paint',
      MineralRights: 'disc_mineral_rights',
      UnpermittedWork: 'disc_renovations',
    }),
    pdfFilePath: 'forms/170-disclosure-statement.pdf',
    version: '2024',
  },
]

async function main() {
  console.log('🌱 Seeding FormFlowNC database…\n')

  // Upsert Chris Rayner
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

  // Upsert form templates
  for (const form of FORMS) {
    await prisma.formTemplate.upsert({
      where: { formNumber: form.formNumber },
      update: { formName: form.formName, category: form.category, fieldMappings: form.fieldMappings, version: form.version },
      create: form,
    })
    console.log(`✅ Form ${form.formNumber}: ${form.formName}`)
  }

  console.log('\n✨ Seed complete!')
  console.log('\n📋 Agent email: chris@buyingnewbern.com')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })

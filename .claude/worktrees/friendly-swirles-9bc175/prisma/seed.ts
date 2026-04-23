import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'

const url = process.env.DATABASE_URL ?? 'file:./dev.db'
const adapter = new PrismaLibSql({ url })
const prisma = new PrismaClient({ adapter })

const FORM_TEMPLATES = [
  {
    formNumber: '101',
    formName: 'Exclusive Right to Sell Listing Agreement',
    category: JSON.stringify(['Seller']),
    pdfFilePath: 'forms/101.pdf',
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
  },
  {
    formNumber: '161',
    formName: 'Working with Real Estate Agents Disclosure',
    category: JSON.stringify(['Agency']),
    pdfFilePath: 'forms/161.pdf',
    fieldMappings: JSON.stringify({
      ClientName: 'seller_name_1',
      PropertyAddress: 'property_address',
      AgentName: 'agent_name',
      AgentLicense: 'agent_license_number',
      FirmName: 'agent_firm_name',
      FirmLicense: 'agent_firm_license',
    }),
  },
  {
    formNumber: '140',
    formName: 'Residential Property and Owners\' Association Disclosure',
    category: JSON.stringify(['Seller']),
    pdfFilePath: 'forms/140.pdf',
    fieldMappings: JSON.stringify({
      OwnerName1: 'seller_name_1',
      OwnerName2: 'seller_name_2',
      PropertyAddress: 'property_address',
      PropertyCity: 'property_city',
      PropertyZip: 'property_zip',
      HOAExists: 'disc_hoa_exists',
      HOAName: 'property_hoa_name',
      HOADues: 'property_hoa_dues',
      FloodZone: 'disc_flood_zone',
      Septic: 'disc_septic',
      PrivateWell: 'disc_well',
      LeadPaint: 'disc_lead_paint',
      UnpermittedRenovations: 'disc_renovations',
    }),
  },
  {
    formNumber: '141',
    formName: 'Mineral and Oil and Gas Rights Mandatory Disclosure',
    category: JSON.stringify(['Seller']),
    pdfFilePath: 'forms/141.pdf',
    fieldMappings: JSON.stringify({
      OwnerName1: 'seller_name_1',
      OwnerName2: 'seller_name_2',
      PropertyAddress: 'property_address',
      MineralRights: 'disc_mineral_rights',
    }),
  },
  {
    formNumber: '110',
    formName: 'Exclusive Buyer Agency Agreement',
    category: JSON.stringify(['Buyer']),
    pdfFilePath: 'forms/110.pdf',
    fieldMappings: JSON.stringify({
      BuyerName1: 'buyer_name_1',
      BuyerName2: 'buyer_name_2',
      BuyerEmail: 'buyer_email',
      BuyerPhone: 'buyer_phone',
      AgentName: 'agent_name',
      AgentLicense: 'agent_license_number',
      FirmName: 'agent_firm_name',
      FirmLicense: 'agent_firm_license',
      SellingCommission: 'selling_commission_pct',
    }),
  },
  {
    formNumber: '170',
    formName: 'Addendum for Back-Up Contract',
    category: JSON.stringify(['Misc']),
    pdfFilePath: 'forms/170.pdf',
    fieldMappings: JSON.stringify({
      BuyerName1: 'buyer_name_1',
      SellerName1: 'seller_name_1',
      PropertyAddress: 'property_address',
      PurchasePrice: 'purchase_price',
    }),
  },
]

async function main() {
  console.log('Seeding database…')

  // Upsert Chris Rayner
  const passwordHash = await bcrypt.hash('formflownc2026!', 12)

  const agent = await prisma.agent.upsert({
    where: { email: 'chris@buyingnewbern.com' },
    update: {},
    create: {
      email: 'chris@buyingnewbern.com',
      passwordHash,
      name: 'Chris Rayner',
      phone: '(252) 671-0100',
      licenseNumber: 'NC-PLACEHOLDER-001',
      firmName: 'Realty ONE Group Affinity',
      firmAddress: '123 Broad St, New Bern, NC 28560',
      firmPhone: '(252) 671-0200',
      firmLicense: 'C-PLACEHOLDER-001',
    },
  })

  console.log(`✓ Agent: ${agent.name} (${agent.email})`)

  // Seed form templates
  for (const template of FORM_TEMPLATES) {
    const t = await prisma.formTemplate.upsert({
      where: { formNumber: template.formNumber },
      update: {},
      create: template,
    })
    console.log(`✓ Form ${t.formNumber}: ${t.formName}`)
  }

  console.log('\nSeed complete!')
  console.log(`\nLogin credentials:`)
  console.log(`  Email:    chris@buyingnewbern.com`)
  console.log(`  Password: formflownc2026!`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

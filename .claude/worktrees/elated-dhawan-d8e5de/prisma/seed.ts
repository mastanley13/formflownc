import 'dotenv/config'
import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const FORMS = [
  {
    formNumber: '101',
    formName: 'Exclusive Right to Sell Listing Agreement',
    category: JSON.stringify(['Seller']),
    pdfFilePath: 'forms/101-exclusive-right-to-sell.pdf',
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
    formNumber: '110',
    formName: 'Offer to Purchase and Contract',
    category: JSON.stringify(['Seller', 'Buyer']),
    pdfFilePath: 'forms/110-offer-to-purchase.pdf',
    fieldMappings: JSON.stringify({
      BuyerName1: 'buyer_name_1',
      BuyerName2: 'buyer_name_2',
      SellerName1: 'seller_name_1',
      SellerName2: 'seller_name_2',
      PropertyAddress: 'property_address',
      PurchasePrice: 'purchase_price',
      EarnestMoney: 'earnest_money',
      DueDiligenceFee: 'due_diligence_fee',
      ClosingDate: 'closing_date',
      DueDiligenceDeadline: 'due_diligence_deadline',
    }),
  },
  {
    formNumber: '140',
    formName: 'Working with Real Estate Agents — Acknowledgment',
    category: JSON.stringify(['Seller', 'Buyer']),
    pdfFilePath: 'forms/140-working-with-agents.pdf',
    fieldMappings: JSON.stringify({
      ClientName: 'seller_name_1',
      AgentName: 'agent_name',
      FirmName: 'agent_firm_name',
      Date: 'listing_begin_date',
    }),
  },
  {
    formNumber: '141',
    formName: 'Seller Representation Agreement',
    category: JSON.stringify(['Seller']),
    pdfFilePath: 'forms/141-seller-rep.pdf',
    fieldMappings: JSON.stringify({
      SellerName: 'seller_name_1',
      PropertyAddress: 'property_address',
      AgentName: 'agent_name',
      AgentLicense: 'agent_license_number',
      FirmName: 'agent_firm_name',
      EffectiveDate: 'listing_begin_date',
    }),
  },
  {
    formNumber: '161',
    formName: 'Residential Property Disclosure Statement',
    category: JSON.stringify(['Seller']),
    pdfFilePath: 'forms/161-property-disclosure.pdf',
    fieldMappings: JSON.stringify({
      OwnerName: 'seller_name_1',
      PropertyAddress: 'property_address',
      PropertyCity: 'property_city',
      PropertyZip: 'property_zip',
      HOAExists: 'disc_hoa_exists',
      HOAName: 'property_hoa_name',
      LeadPaint: 'disc_lead_paint',
      FloodZone: 'disc_flood_zone',
      Septic: 'disc_septic',
      PrivateWell: 'disc_well',
      MineralRights: 'disc_mineral_rights',
      UnpermittedRenovations: 'disc_renovations',
    }),
  },
  {
    formNumber: '170',
    formName: 'Listing Extension and/or Modification Agreement',
    category: JSON.stringify(['Seller']),
    pdfFilePath: 'forms/170-listing-extension.pdf',
    fieldMappings: JSON.stringify({
      SellerName: 'seller_name_1',
      PropertyAddress: 'property_address',
      NewEndDate: 'listing_end_date',
      NewListingPrice: 'listing_price',
      AgentName: 'agent_name',
      FirmName: 'agent_firm_name',
    }),
  },
]

async function main() {
  console.log('Seeding database…')

  // Chris Rayner agent
  const passwordHash = await bcrypt.hash('password123', 12)

  const agent = await prisma.agent.upsert({
    where: { email: 'chris@buyingnewbern.com' },
    update: {},
    create: {
      email: 'chris@buyingnewbern.com',
      passwordHash,
      name: 'Chris Rayner',
      phone: '(252) 633-1900',
      licenseNumber: 'NC-288741',
      firmName: 'Realty ONE Group Affinity',
      firmAddress: '2110 Neuse Blvd Ste A, New Bern, NC 28560',
      firmPhone: '(252) 636-3430',
      firmLicense: 'C-27491',
    },
  })

  console.log('✓ Agent:', agent.email)

  // Form templates
  for (const form of FORMS) {
    const created = await prisma.formTemplate.upsert({
      where: { formNumber: form.formNumber },
      update: {},
      create: form,
    })
    console.log(`✓ Form ${created.formNumber}: ${created.formName}`)
  }

  console.log('\nSeed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

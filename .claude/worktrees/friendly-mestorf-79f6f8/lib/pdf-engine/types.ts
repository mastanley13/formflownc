export type PdfFieldType = 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature' | 'unknown'

export interface PdfField {
  name: string
  type: PdfFieldType
  value?: string | boolean
  options?: string[] // for dropdown/radio
  required?: boolean
  maxLength?: number
  rect?: { x: number; y: number; width: number; height: number; page: number }
}

export interface PdfFieldMap {
  [pdfFieldName: string]: string // pdfFieldName -> canonicalKey
}

export interface CollectedData {
  [canonicalKey: string]: string | boolean | number
}

export interface FillResult {
  pdfBytes: Uint8Array
  unfilledFields: string[] // canonical keys with no data
  filledCount: number
}

// Canonical field registry — every field the system understands
export const CANONICAL_FIELDS = {
  // Property
  property_address: 'Property Street Address',
  property_city: 'City',
  property_state: 'State',
  property_zip: 'ZIP Code',
  property_county: 'County',
  property_tax_parcel: 'Tax Parcel ID',
  property_legal_description: 'Legal Description',
  property_type: 'Property Type',
  property_year_built: 'Year Built',
  property_sq_ft: 'Square Footage',
  property_bedrooms: 'Bedrooms',
  property_bathrooms: 'Bathrooms',
  property_hoa_name: 'HOA Name',
  property_hoa_dues: 'HOA Monthly Dues',

  // Financial
  listing_price: 'Listing Price',
  purchase_price: 'Purchase Price',
  earnest_money: 'Earnest Money Deposit',
  due_diligence_fee: 'Due Diligence Fee',
  closing_costs_seller: 'Seller Paid Closing Costs',
  loan_amount: 'Loan Amount',

  // Dates
  listing_begin_date: 'Listing Period Begin',
  listing_end_date: 'Listing Period End',
  closing_date: 'Closing Date',
  due_diligence_deadline: 'Due Diligence Deadline',
  offer_expiration_date: 'Offer Expiration',
  contract_date: 'Contract Date',
  possession_date: 'Possession Date',

  // Commission
  listing_commission_pct: 'Listing Commission %',
  selling_commission_pct: 'Selling Commission %',
  total_commission_pct: 'Total Commission %',

  // Seller
  seller_name_1: 'Seller 1 Full Name',
  seller_name_2: 'Seller 2 Full Name',
  seller_email: 'Seller Email',
  seller_phone: 'Seller Phone',
  seller_address: 'Seller Mailing Address',
  seller_city: 'Seller City',
  seller_state: 'Seller State',
  seller_zip: 'Seller ZIP',

  // Buyer
  buyer_name_1: 'Buyer 1 Full Name',
  buyer_name_2: 'Buyer 2 Full Name',
  buyer_email: 'Buyer Email',
  buyer_phone: 'Buyer Phone',
  buyer_address: 'Buyer Mailing Address',
  buyer_city: 'Buyer City',
  buyer_state: 'Buyer State',
  buyer_zip: 'Buyer ZIP',

  // Listing Agent
  agent_name: 'Agent Name',
  agent_license_number: 'Agent License #',
  agent_email: 'Agent Email',
  agent_phone: 'Agent Phone',
  agent_firm_name: 'Firm Name',
  agent_firm_license: 'Firm License #',
  agent_firm_address: 'Firm Address',
  agent_firm_phone: 'Firm Phone',

  // Selling Agent
  selling_agent_name: 'Selling Agent Name',
  selling_agent_license: 'Selling Agent License #',
  selling_agent_email: 'Selling Agent Email',
  selling_agent_phone: 'Selling Agent Phone',
  selling_agent_firm: 'Selling Agent Firm',

  // Disclosures
  disc_hoa_exists: 'HOA Exists',
  disc_lead_paint: 'Lead Paint Disclosure',
  disc_mineral_rights: 'Mineral Rights Severed',
  disc_flood_zone: 'In Flood Zone',
  disc_septic: 'Has Septic System',
  disc_well: 'Has Private Well',
  disc_renovations: 'Has Unpermitted Renovations',
  disc_environmental_hazards: 'Environmental Hazards',
  disc_wetlands: 'Wetlands',
  disc_foundation_defects: 'Foundation Defects',
  disc_roof_defects: 'Roof Defects',
  disc_pest_damage: 'Pest/Termite Damage',
  disc_hvac_defects: 'HVAC Defects',
  disc_plumbing_defects: 'Plumbing Defects',
  disc_electrical_defects: 'Electrical Defects',
  disc_code_violations: 'Code Violations',
  disc_boundary_disputes: 'Boundary Disputes',
  disc_pending_lawsuits: 'Pending Lawsuits',
  disc_additional_defects: 'Additional Defects (describe)',

  // Seller Net Sheet financial fields
  net_sheet_prepared_date: 'Net Sheet Prepared Date',
  net_mortgage_payoff: 'Mortgage Payoff',
  net_tax_proration: 'Tax Proration',
  net_hoa_transfer_fee: 'HOA Transfer Fee',
  net_closing_fees: 'Closing Fees',
  net_excise_tax: 'Excise Tax',
  net_seller_paid_closing: 'Seller-Paid Closing Costs',
  net_repair_credits: 'Repair Credits',
  net_other_costs: 'Other Costs',
  net_estimated_proceeds: 'Estimated Net Proceeds',
  net_commission_total: 'Total Commission Amount',

  // Buyer Agency Agreement fields
  buyer_agency_start_date: 'Buyer Agency Start Date',
  buyer_agency_end_date: 'Buyer Agency End Date',
  buyer_price_range: 'Target Purchase Price Range',
  buyer_commission_pct: 'Buyer Agent Commission %',
  buyer_compensation_source: 'Compensation Source',
  additional_terms: 'Additional Terms',
  property_area: 'Target Property Area/County',

  // Signature fields (filled by DocuSeal, not by client intake)
  seller_1_signature: 'Seller 1 Signature',
  seller_2_signature: 'Seller 2 Signature',
  buyer_1_signature: 'Buyer 1 Signature',
  buyer_2_signature: 'Buyer 2 Signature',
  agent_signature: 'Agent Signature',
  firm_signature: 'Firm Signature',
  seller_1_sign_date: 'Seller 1 Sign Date',
  seller_2_sign_date: 'Seller 2 Sign Date',
  buyer_1_sign_date: 'Buyer 1 Sign Date',
  buyer_2_sign_date: 'Buyer 2 Sign Date',
  agent_sign_date: 'Agent Sign Date',
} as const

export type CanonicalKey = keyof typeof CANONICAL_FIELDS

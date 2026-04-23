import type { PdfFieldMap } from './types'

// NC Listing Agreement (Form 101) — AcroForm field names mapped to canonical keys
// These are the actual field names from the NC REALTOR standard forms.
// Update when real PDFs are uploaded via the admin form template tool.
export const FORM_101_MAPPING: PdfFieldMap = {
  'SellerName1': 'seller_name_1',
  'SellerName2': 'seller_name_2',
  'SellerEmail': 'seller_email',
  'SellerPhone': 'seller_phone',
  'PropertyAddress': 'property_address',
  'PropertyCity': 'property_city',
  'PropertyState': 'property_state',
  'PropertyZip': 'property_zip',
  'PropertyCounty': 'property_county',
  'ListingPrice': 'listing_price',
  'ListingBeginDate': 'listing_begin_date',
  'ListingEndDate': 'listing_end_date',
  'ListingCommission': 'listing_commission_pct',
  'SellingCommission': 'selling_commission_pct',
  'AgentName': 'agent_name',
  'AgentLicense': 'agent_license_number',
  'AgentPhone': 'agent_phone',
  'AgentEmail': 'agent_email',
  'FirmName': 'agent_firm_name',
  'FirmLicense': 'agent_firm_license',
  'FirmAddress': 'agent_firm_address',
  'FirmPhone': 'agent_firm_phone',
}

// NC Offer to Purchase (Form 2-T)
export const FORM_2T_MAPPING: PdfFieldMap = {
  'BuyerName1': 'buyer_name_1',
  'BuyerName2': 'buyer_name_2',
  'SellerName1': 'seller_name_1',
  'SellerName2': 'seller_name_2',
  'PropertyAddress': 'property_address',
  'PurchasePrice': 'purchase_price',
  'EarnestMoney': 'earnest_money',
  'DueDiligenceFee': 'due_diligence_fee',
  'ClosingDate': 'closing_date',
  'DueDiligenceDeadline': 'due_diligence_deadline',
  'SellingAgentName': 'selling_agent_name',
  'SellingAgentLicense': 'selling_agent_license',
  'SellingAgentFirm': 'selling_agent_firm',
  'ListingAgentName': 'agent_name',
  'ListingAgentLicense': 'agent_license_number',
}

// NC Residential Property Disclosure (Form 4)
export const FORM_4_MAPPING: PdfFieldMap = {
  'OwnerName1': 'seller_name_1',
  'OwnerName2': 'seller_name_2',
  'PropertyAddress': 'property_address',
  'PropertyCity': 'property_city',
  'PropertyZip': 'property_zip',
  'HOAExists': 'disc_hoa_exists',
  'HOAName': 'property_hoa_name',
  'HOADues': 'property_hoa_dues',
  'FloodZone': 'disc_flood_zone',
  'Septic': 'disc_septic',
  'PrivateWell': 'disc_well',
  'LeadPaint': 'disc_lead_paint',
  'MineralRights': 'disc_mineral_rights',
  'UnpermittedRenovations': 'disc_renovations',
}

// Registry of all known form mappings
export const FORM_MAPPINGS: Record<string, PdfFieldMap> = {
  '101': FORM_101_MAPPING,
  '2-T': FORM_2T_MAPPING,
  '4': FORM_4_MAPPING,
}

export function getMappingForForm(formNumber: string): PdfFieldMap {
  return FORM_MAPPINGS[formNumber] ?? {}
}

// Build reverse map: canonical key -> [pdf field names]
export function buildReverseMapping(mapping: PdfFieldMap): Record<string, string[]> {
  const reverse: Record<string, string[]> = {}
  for (const [pdfField, canonical] of Object.entries(mapping)) {
    if (!reverse[canonical]) reverse[canonical] = []
    reverse[canonical].push(pdfField)
  }
  return reverse
}

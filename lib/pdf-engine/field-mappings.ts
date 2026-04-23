import type { PdfFieldMap } from './types'

// NC Listing Agreement (Form 101) -- real PDF AcroForm field names
export const FORM_101_MAPPING: PdfFieldMap = {
  'PropertyAddress': 'property_address',
  'PropertyCounty': 'property_county',
  'PropertyCity': 'property_city',
  'PropertyState': 'property_state',
  'PropertyZip': 'property_zip',
  'TaxParcel': 'property_tax_parcel',
  'YearBuilt': 'property_year_built',
  'LegalDescription': 'property_legal_description',
  'SellerName1': 'seller_name_1',
  'SellerName2': 'seller_name_2',
  'SellerPhone': 'seller_phone',
  'SellerEmail': 'seller_email',
  'SellerAddress': 'seller_address',
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
  'FirmPhone': 'agent_firm_phone',
  'FirmAddress': 'agent_firm_address',
  'HOAExists': 'disc_hoa_exists',
  'HOAName': 'property_hoa_name',
  'HOADues': 'property_hoa_dues',
  'FloodZone': 'disc_flood_zone',
  'Septic': 'disc_septic',
  'PrivateWell': 'disc_well',
  'LeadPaint': 'disc_lead_paint',
  'MineralRights': 'disc_mineral_rights',
  'UnpermittedWork': 'disc_renovations',
}

// Buyer Agency Agreement (Form 161/201)
export const FORM_161_MAPPING: PdfFieldMap = {
  'BuyerName1': 'buyer_name_1',
  'BuyerName2': 'buyer_name_2',
  'BuyerPhone': 'buyer_phone',
  'BuyerEmail': 'buyer_email',
  'BuyerAddress': 'buyer_address',
  'BuyerCity': 'buyer_city',
  'BuyerState': 'buyer_state',
  'BuyerZip': 'buyer_zip',
  'AgentName': 'agent_name',
  'AgentLicense': 'agent_license_number',
  'AgentPhone': 'agent_phone',
  'AgentEmail': 'agent_email',
  'FirmName': 'agent_firm_name',
  'FirmLicense': 'agent_firm_license',
  'FirmPhone': 'agent_firm_phone',
  'FirmAddress': 'agent_firm_address',
  'PropertyArea': 'property_area',
  'PropertyType': 'property_type',
  'StartDate': 'listing_begin_date',
  'EndDate': 'listing_end_date',
  'PurchasePriceRange': 'purchase_price_range',
  'BuyerCommission': 'buyer_commission',
  'CompensationSource': 'compensation_source',
  'AdditionalTerms': 'additional_terms',
}

// Working With Real Estate Agents -- Buyer (Form 140)
export const FORM_140_MAPPING: PdfFieldMap = {
  'PropertyAddress': 'property_address',
  'AgentName': 'agent_name',
  'AgentLicense': 'agent_license_number',
  'DateDisclosed': 'contract_date',
  'FirmName': 'agent_firm_name',
  'FirmAddress': 'agent_firm_address',
  'FirmPhone': 'agent_firm_phone',
  'BuyerName': 'buyer_name_1',
  'BuyerPhone': 'buyer_phone',
  'BuyerEmail': 'buyer_email',
}

// Working With Real Estate Agents -- Seller (Form 141)
export const FORM_141_MAPPING: PdfFieldMap = {
  'PropertyAddress': 'property_address',
  'AgentName': 'agent_name',
  'AgentLicense': 'agent_license_number',
  'DateDisclosed': 'contract_date',
  'FirmName': 'agent_firm_name',
  'FirmAddress': 'agent_firm_address',
  'FirmPhone': 'agent_firm_phone',
  'SellerName': 'seller_name_1',
  'SellerPhone': 'seller_phone',
  'SellerEmail': 'seller_email',
}

// Seller Net Sheet (Form 110)
export const FORM_110_MAPPING: PdfFieldMap = {
  'PropertyAddress': 'property_address',
  'PropertyCity': 'property_city',
  'PropertyZip': 'property_zip',
  'SellerName1': 'seller_name_1',
  'SellerName2': 'seller_name_2',
  'AgentName': 'agent_name',
  'FirmName': 'agent_firm_name',
  'PreparedDate': 'contract_date',
  'SalePrice': 'listing_price',
  'ListingCommissionPct': 'listing_commission_pct',
  'SellingCommissionPct': 'selling_commission_pct',
  'CommissionAmt': 'commission_amount',
  'MortgagePayoff': 'mortgage_payoff',
  'TaxProration': 'tax_proration',
  'HOATransferFee': 'hoa_transfer_fee',
  'ClosingFees': 'closing_fees',
  'ExciseTax': 'excise_tax',
  'SellerPaidClosing': 'seller_paid_closing',
  'RepairCredits': 'repair_credits',
  'OtherCosts': 'other_costs',
  'EstimatedNetProceeds': 'estimated_net_proceeds',
  'ClosingDate': 'closing_date',
}

// Residential Property Disclosure (Form 170)
export const FORM_170_MAPPING: PdfFieldMap = {
  'OwnerName1': 'seller_name_1',
  'OwnerName2': 'seller_name_2',
  'PropertyAddress': 'property_address',
  'PropertyCity': 'property_city',
  'PropertyZip': 'property_zip',
  'PropertyCounty': 'property_county',
  'HOAExists': 'disc_hoa_exists',
  'HOAName': 'property_hoa_name',
  'HOADues': 'property_hoa_dues',
  'PrivateWell': 'disc_well',
  'Septic': 'disc_septic',
  'FloodZone': 'disc_flood_zone',
  'EnvHazards': 'disc_env_hazards',
  'Wetlands': 'disc_wetlands',
  'LeadPaint': 'disc_lead_paint',
  'MineralRights': 'disc_mineral_rights',
  'FoundationDefects': 'disc_foundation_defects',
  'RoofDefects': 'disc_roof_defects',
  'PestDamage': 'disc_pest_damage',
  'HVACDefects': 'disc_hvac_defects',
  'PlumbingDefects': 'disc_plumbing_defects',
  'ElectricalDefects': 'disc_electrical_defects',
  'UnpermittedWork': 'disc_renovations',
  'CodeViolations': 'disc_code_violations',
  'BoundaryDisputes': 'disc_boundary_disputes',
  'PendingLawsuits': 'disc_pending_lawsuits',
  'AdditionalDefects': 'disc_additional_defects',
}

// NC Offer to Purchase (Form 2-T) -- no real PDF yet, mapping kept for future use
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

// Registry of all known form mappings
export const FORM_MAPPINGS: Record<string, PdfFieldMap> = {
  '101': FORM_101_MAPPING,
  '161': FORM_161_MAPPING,
  '140': FORM_140_MAPPING,
  '141': FORM_141_MAPPING,
  '110': FORM_110_MAPPING,
  '170': FORM_170_MAPPING,
  '2-T': FORM_2T_MAPPING,
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

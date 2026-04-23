import type { PdfFieldMap } from './types'

// ── Form 101 — Exclusive Right to Sell Listing Agreement ─────────────────────
// Real PDF: uploads/forms/101-exclusive-right-to-sell.pdf (42 AcroForm fields)
export const FORM_101_MAPPING: PdfFieldMap = {
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
  // Disclosures (Yes / No / Unknown text)
  HOAExists:         'disc_hoa_exists',
  HOAName:           'property_hoa_name',
  HOADues:           'property_hoa_dues',
  FloodZone:         'disc_flood_zone',
  Septic:            'disc_septic',
  PrivateWell:       'disc_well',
  LeadPaint:         'disc_lead_paint',
  MineralRights:     'disc_mineral_rights',
  UnpermittedWork:   'disc_renovations',
  // Signatures (filled by DocuSeal e-sign, not intake)
  Seller1Signature:  'seller_1_signature',
  Seller1SignDate:   'seller_1_sign_date',
  Seller2Signature:  'seller_2_signature',
  Seller2SignDate:   'seller_2_sign_date',
  AgentSignature:    'agent_signature',
  AgentSignDate:     'agent_sign_date',
  FirmSignature:     'firm_signature',
}

// ── Form 201 — Exclusive Buyer Agency Agreement ───────────────────────────────
// Real PDF: uploads/forms/161-buyer-agency-agreement.pdf (30 AcroForm fields)
// (NC REALTOR renumbered from 161 to 201 — form file keeps old name)
export const FORM_201_MAPPING: PdfFieldMap = {
  // Buyer
  BuyerName1:           'buyer_name_1',
  BuyerName2:           'buyer_name_2',
  BuyerPhone:           'buyer_phone',
  BuyerEmail:           'buyer_email',
  BuyerAddress:         'buyer_address',
  BuyerCity:            'buyer_city',
  BuyerState:           'buyer_state',
  BuyerZip:             'buyer_zip',
  // Agent / Firm
  AgentName:            'agent_name',
  AgentLicense:         'agent_license_number',
  AgentPhone:           'agent_phone',
  AgentEmail:           'agent_email',
  FirmName:             'agent_firm_name',
  FirmLicense:          'agent_firm_license',
  FirmAddress:          'agent_firm_address',
  FirmPhone:            'agent_firm_phone',
  // Agreement terms
  PropertyArea:         'property_area',
  PropertyType:         'property_type',
  StartDate:            'buyer_agency_start_date',
  EndDate:              'buyer_agency_end_date',
  PurchasePriceRange:   'buyer_price_range',
  BuyerCommission:      'buyer_commission_pct',
  CompensationSource:   'buyer_compensation_source',
  AdditionalTerms:      'additional_terms',
  // Signatures
  Buyer1Signature:      'buyer_1_signature',
  Buyer1SignDate:       'buyer_1_sign_date',
  Buyer2Signature:      'buyer_2_signature',
  Buyer2SignDate:       'buyer_2_sign_date',
  AgentSignature:       'agent_signature',
  AgentSignDate:        'agent_sign_date',
}

// ── Form 110 — Seller Net Sheet ───────────────────────────────────────────────
// Real PDF: uploads/forms/110-seller-net-sheet.pdf (24 AcroForm fields)
export const FORM_110_MAPPING: PdfFieldMap = {
  // Property / Parties
  PropertyAddress:       'property_address',
  PropertyCity:          'property_city',
  PropertyZip:           'property_zip',
  SellerName1:           'seller_name_1',
  SellerName2:           'seller_name_2',
  AgentName:             'agent_name',
  FirmName:              'agent_firm_name',
  PreparedDate:          'net_sheet_prepared_date',
  // Financial
  SalePrice:             'listing_price',
  ListingCommissionPct:  'listing_commission_pct',
  SellingCommissionPct:  'selling_commission_pct',
  CommissionAmt:         'net_commission_total',
  MortgagePayoff:        'net_mortgage_payoff',
  TaxProration:          'net_tax_proration',
  HOATransferFee:        'net_hoa_transfer_fee',
  ClosingFees:           'net_closing_fees',
  ExciseTax:             'net_excise_tax',
  SellerPaidClosing:     'net_seller_paid_closing',
  RepairCredits:         'net_repair_credits',
  OtherCosts:            'net_other_costs',
  EstimatedNetProceeds:  'net_estimated_proceeds',
  ClosingDate:           'closing_date',
  // Acknowledgment
  SellerAckSignature:    'seller_1_signature',
  SellerAckDate:         'seller_1_sign_date',
}

// ── Form 140 — Working With Real Estate Agents (Buyer) ───────────────────────
// Real PDF: uploads/forms/140-wwrea-buyer.pdf (14 AcroForm fields)
export const FORM_140_MAPPING: PdfFieldMap = {
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
}

// ── Form 141 — Working With Real Estate Agents (Seller) ──────────────────────
// Real PDF: uploads/forms/141-wwrea-seller.pdf (14 AcroForm fields)
export const FORM_141_MAPPING: PdfFieldMap = {
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
}

// ── Form 170 — Residential Property & Owners' Association Disclosure ──────────
// Real PDF: uploads/forms/170-residential-property-disclosure.pdf (33 AcroForm fields)
export const FORM_170_MAPPING: PdfFieldMap = {
  // Property / Owners
  OwnerName1:          'seller_name_1',
  OwnerName2:          'seller_name_2',
  PropertyAddress:     'property_address',
  PropertyCity:        'property_city',
  PropertyZip:         'property_zip',
  PropertyCounty:      'property_county',
  // HOA
  HOAExists:           'disc_hoa_exists',
  HOAName:             'property_hoa_name',
  HOADues:             'property_hoa_dues',
  // Environmental / Systems
  PrivateWell:         'disc_well',
  Septic:              'disc_septic',
  FloodZone:           'disc_flood_zone',
  EnvHazards:          'disc_environmental_hazards',
  Wetlands:            'disc_wetlands',
  LeadPaint:           'disc_lead_paint',
  MineralRights:       'disc_mineral_rights',
  // Structural / Systems
  FoundationDefects:   'disc_foundation_defects',
  RoofDefects:         'disc_roof_defects',
  PestDamage:          'disc_pest_damage',
  HVACDefects:         'disc_hvac_defects',
  PlumbingDefects:     'disc_plumbing_defects',
  ElectricalDefects:   'disc_electrical_defects',
  UnpermittedWork:     'disc_renovations',
  CodeViolations:      'disc_code_violations',
  BoundaryDisputes:    'disc_boundary_disputes',
  PendingLawsuits:     'disc_pending_lawsuits',
  AdditionalDefects:   'disc_additional_defects',
  // Signatures
  Owner1Signature:     'seller_1_signature',
  Owner1SignDate:      'seller_1_sign_date',
  Owner2Signature:     'seller_2_signature',
  Owner2SignDate:      'seller_2_sign_date',
  BuyerAckSignature:   'buyer_1_signature',
  BuyerAckDate:        'buyer_1_sign_date',
}

// Registry of all known form mappings (keyed by formNumber)
export const FORM_MAPPINGS: Record<string, PdfFieldMap> = {
  '101':  FORM_101_MAPPING,
  '110':  FORM_110_MAPPING,
  '140':  FORM_140_MAPPING,
  '141':  FORM_141_MAPPING,
  '170':  FORM_170_MAPPING,
  '201':  FORM_201_MAPPING,
}

export function getMappingForForm(formNumber: string): PdfFieldMap {
  return FORM_MAPPINGS[formNumber] ?? {}
}

export function buildReverseMapping(mapping: PdfFieldMap): Record<string, string[]> {
  const reverse: Record<string, string[]> = {}
  for (const [pdfField, canonical] of Object.entries(mapping)) {
    if (!reverse[canonical]) reverse[canonical] = []
    reverse[canonical].push(pdfField)
  }
  return reverse
}

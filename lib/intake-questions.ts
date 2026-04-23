/**
 * Form-specific intake questions registry.
 *
 * Maps NC REALTOR form numbers to the questions that must be collected
 * from clients during the intake process. Each form defines sections,
 * and each section contains questions with typed inputs.
 *
 * Question types:
 *  - text       : single-line text input
 *  - textarea   : multi-line text input
 *  - date       : date picker
 *  - number     : numeric input
 *  - select     : dropdown (options required)
 *  - yes-no-norep : Yes / No / No Representation with optional explanation
 */

// ─── Types ──────────────────────────────────────────────────────────────

export type QuestionType = 'text' | 'textarea' | 'date' | 'number' | 'select' | 'yes-no-norep'

export interface IntakeQuestion {
  id: string
  label: string
  type: QuestionType
  options?: string[]           // for 'select' type
  required: boolean
  placeholder?: string
  helpText?: string            // hint shown below the input
  showExplanationOn?: string   // for yes-no-norep: show explanation field when this value is selected
}

export interface IntakeSection {
  id: string
  title: string
  description?: string
  questions: IntakeQuestion[]
}

export interface FormIntakeConfig {
  formNumber: string
  formName: string
  sections: IntakeSection[]
}

// ─── Form 170: Residential Property and Owners' Association Disclosure ──

const FORM_170: FormIntakeConfig = {
  formNumber: '170',
  formName: 'Residential Property and Owners\' Association Disclosure Statement',
  sections: [
    {
      id: '170_ownership',
      title: 'Ownership & Title',
      description: 'Questions about property ownership, title, and legal status.',
      questions: [
        {
          id: 'disc_restrictive_covenants',
          label: 'Is the property subject to any restrictive covenants?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_encroachments',
          label: 'Are there any encroachments or boundary disputes?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_survey_available',
          label: 'Is there a survey available?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
      ],
    },
    {
      id: '170_water_sewer',
      title: 'Water & Sewer',
      description: 'Water supply and sewage disposal information.',
      questions: [
        {
          id: 'disc_water_source',
          label: 'What is the water source?',
          type: 'select',
          options: ['Public/City', 'Community', 'Well', 'Other'],
          required: true,
        },
        {
          id: 'disc_water_source_other',
          label: 'If other, please describe the water source:',
          type: 'text',
          required: false,
          placeholder: 'Describe water source',
        },
        {
          id: 'disc_sewage_disposal',
          label: 'What is the sewage disposal?',
          type: 'select',
          options: ['Public/City Sewer', 'Septic Tank', 'Other'],
          required: true,
        },
        {
          id: 'disc_sewage_other',
          label: 'If other, please describe the sewage disposal:',
          type: 'text',
          required: false,
          placeholder: 'Describe sewage disposal',
        },
        {
          id: 'disc_water_problems',
          label: 'Any known problems with water supply?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_sewage_problems',
          label: 'Any known problems with sewage system?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_septic_pumped',
          label: 'Has the septic system been pumped?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_septic_pumped_date',
          label: 'If yes, when was the septic last pumped?',
          type: 'text',
          required: false,
          placeholder: 'e.g., March 2024',
        },
      ],
    },
    {
      id: '170_structural',
      title: 'Structural',
      description: 'Questions about the structure and physical condition of the property.',
      questions: [
        {
          id: 'disc_foundation_problems',
          label: 'Any problems with foundation, slab, or crawl space?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_water_seepage',
          label: 'Any water seepage or leakage in basement or crawl space?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_floors_walls_ceilings',
          label: 'Any problems with floors, walls, or ceilings?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_roof_problems',
          label: 'Any problems with roof or gutters?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_roof_age',
          label: 'Approximate age of the roof:',
          type: 'text',
          required: false,
          placeholder: 'e.g., 8 years',
        },
        {
          id: 'disc_unpermitted_additions',
          label: 'Any additions or structural changes made without permits?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_fireplace_chimney',
          label: 'Any problems with fireplace or chimney?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_windows_doors',
          label: 'Any problems with windows or doors?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_termite_damage',
          label: 'Any termite or wood-boring insect damage?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
      ],
    },
    {
      id: '170_mechanical',
      title: 'Mechanical Systems',
      description: 'Electrical, plumbing, HVAC, and water heater information.',
      questions: [
        {
          id: 'disc_electrical_problems',
          label: 'Any problems with the electrical system?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_plumbing_problems',
          label: 'Any problems with the plumbing system?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_heating_problems',
          label: 'Any problems with the heating system?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_heating_type',
          label: 'Heating system type:',
          type: 'select',
          options: ['Forced Air/Gas', 'Heat Pump', 'Electric Baseboard', 'Oil', 'Propane', 'Other'],
          required: false,
        },
        {
          id: 'disc_heating_age',
          label: 'Approximate age of heating system:',
          type: 'text',
          required: false,
          placeholder: 'e.g., 5 years',
        },
        {
          id: 'disc_cooling_problems',
          label: 'Any problems with the cooling/AC system?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_cooling_type',
          label: 'Cooling system type:',
          type: 'select',
          options: ['Central Air', 'Heat Pump', 'Window Units', 'None', 'Other'],
          required: false,
        },
        {
          id: 'disc_cooling_age',
          label: 'Approximate age of cooling system:',
          type: 'text',
          required: false,
          placeholder: 'e.g., 5 years',
        },
        {
          id: 'disc_water_heater_problems',
          label: 'Any problems with the water heater?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_water_heater_type',
          label: 'Water heater type:',
          type: 'select',
          options: ['Electric Tank', 'Gas Tank', 'Tankless Electric', 'Tankless Gas', 'Solar', 'Other'],
          required: false,
        },
        {
          id: 'disc_water_heater_age',
          label: 'Approximate age of water heater:',
          type: 'text',
          required: false,
          placeholder: 'e.g., 3 years',
        },
      ],
    },
    {
      id: '170_environmental',
      title: 'Environmental',
      description: 'Environmental hazards, testing, and site conditions.',
      questions: [
        {
          id: 'disc_environmental_hazards',
          label: 'Any known environmental hazards (asbestos, lead paint, radon, underground storage tanks, etc.)?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_radon_tested',
          label: 'Has the property been tested for radon?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_soil_problems',
          label: 'Any known soil problems (settling, erosion, fill dirt, etc.)?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_flood_zone',
          label: 'Is the property located in a flood zone?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_drainage_problems',
          label: 'Any known drainage problems?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
      ],
    },
    {
      id: '170_hoa',
      title: 'HOA / Community',
      description: 'Homeowners association and community information.',
      questions: [
        {
          id: 'disc_hoa_exists',
          label: 'Is the property subject to a homeowners association (HOA)?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_hoa_name',
          label: 'HOA name and contact information:',
          type: 'text',
          required: false,
          placeholder: 'e.g., Riverfront HOA — (252) 555-0300',
        },
        {
          id: 'disc_hoa_dues',
          label: 'Monthly or annual HOA dues amount:',
          type: 'text',
          required: false,
          placeholder: 'e.g., $85/month',
        },
        {
          id: 'disc_hoa_special_assessments',
          label: 'Any pending special assessments?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_hoa_litigation',
          label: 'Any pending litigation involving the HOA?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
      ],
    },
    {
      id: '170_other',
      title: 'Other Disclosures',
      description: 'Additional required disclosures.',
      questions: [
        {
          id: 'disc_special_assessments',
          label: 'Any existing or proposed special assessments (other than HOA)?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_zoning_violations',
          label: 'Any zoning violations?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_pending_legal',
          label: 'Any pending legal actions affecting the property?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_deaths',
          label: 'Any deaths on the property within the past 3 years?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_historic',
          label: 'Is the property designated as historic?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_sinkholes',
          label: 'Any sinkholes or land instability?',
          type: 'yes-no-norep',
          required: true,
          showExplanationOn: 'Yes',
        },
        {
          id: 'disc_additional_comments',
          label: 'Any additional material facts or disclosures?',
          type: 'textarea',
          required: false,
          placeholder: 'Describe any other known issues or conditions...',
        },
      ],
    },
  ],
}

// ─── Form 101: Exclusive Right to Sell Listing Agreement ────────────────

const FORM_101: FormIntakeConfig = {
  formNumber: '101',
  formName: 'Exclusive Right to Sell Listing Agreement',
  sections: [
    {
      id: '101_seller',
      title: 'Seller Information',
      description: 'Legal name(s) and property details for the listing agreement.',
      questions: [
        {
          id: 'seller_legal_name',
          label: 'Seller legal name(s) — as it appears on the deed:',
          type: 'text',
          required: true,
          placeholder: 'e.g., Jane A. Smith and John B. Smith',
        },
        {
          id: 'seller_legal_name_2',
          label: 'Additional seller legal name (if applicable):',
          type: 'text',
          required: false,
          placeholder: 'e.g., John B. Smith',
        },
        {
          id: 'listing_property_address',
          label: 'Confirm property address for the listing:',
          type: 'text',
          required: true,
          placeholder: '123 Main St, New Bern, NC 28560',
          helpText: 'Verify this matches the address your agent provided.',
        },
      ],
    },
    {
      id: '101_inclusions',
      title: 'Items Included / Excluded',
      description: 'Specify what stays with the property and what you plan to take.',
      questions: [
        {
          id: 'listing_items_included',
          label: 'Items INCLUDED in the sale (appliances, fixtures, etc.):',
          type: 'textarea',
          required: false,
          placeholder: 'e.g., Refrigerator, washer/dryer, ceiling fans, window blinds, built-in shelving...',
          helpText: 'List appliances, fixtures, and personal property that will convey with the home.',
        },
        {
          id: 'listing_items_excluded',
          label: 'Items EXCLUDED from the sale (items you will take with you):',
          type: 'textarea',
          required: false,
          placeholder: 'e.g., Dining room chandelier, ring doorbell camera, potted plants on patio...',
          helpText: 'List anything currently at the property that will NOT convey.',
        },
      ],
    },
    {
      id: '101_material',
      title: 'Material Facts & Listing Period',
      description: 'Known issues and your preferred listing timeline.',
      questions: [
        {
          id: 'listing_known_defects',
          label: 'Known material facts or defects about the property:',
          type: 'textarea',
          required: false,
          placeholder: 'e.g., Roof replaced 2022, HVAC is 12 years old, minor crack in garage floor...',
          helpText: 'Disclose anything a buyer should know. These will be reviewed by your agent.',
        },
        {
          id: 'listing_period_start',
          label: 'Preferred listing start date:',
          type: 'date',
          required: false,
        },
        {
          id: 'listing_period_end',
          label: 'Preferred listing end date:',
          type: 'date',
          required: false,
          helpText: 'Typical listing agreements run 6–12 months.',
        },
      ],
    },
  ],
}

// ─── Form 141: Working With Real Estate Agents (Seller) ─────────────────

const FORM_141: FormIntakeConfig = {
  formNumber: '141',
  formName: 'Working With Real Estate Agents (Seller)',
  sections: [
    {
      id: '141_acknowledgment',
      title: 'Agency Acknowledgment',
      description: 'Confirm your understanding of the agency relationship.',
      questions: [
        {
          id: 'agency_acknowledged',
          label: 'I acknowledge and understand the agency relationship as explained by my agent:',
          type: 'yes-no-norep',
          required: true,
        },
        {
          id: 'agency_signature_date',
          label: 'Date of acknowledgment:',
          type: 'date',
          required: false,
        },
      ],
    },
  ],
}

// ─── Common personal / property questions (always shown) ────────────────

const COMMON_PERSONAL: FormIntakeConfig = {
  formNumber: '_personal',
  formName: 'Your Information',
  sections: [
    {
      id: 'personal_info',
      title: 'Personal Information',
      description: 'We need your contact details for the transaction documents.',
      questions: [
        {
          id: 'seller_name_1',
          label: 'Your full legal name:',
          type: 'text',
          required: true,
          placeholder: 'Jane A. Smith',
        },
        {
          id: 'seller_email',
          label: 'Email address:',
          type: 'text',
          required: true,
          placeholder: 'jane@email.com',
        },
        {
          id: 'seller_phone',
          label: 'Phone number:',
          type: 'text',
          required: false,
          placeholder: '(252) 555-0100',
        },
        {
          id: 'seller_address',
          label: 'Current mailing address:',
          type: 'text',
          required: false,
          placeholder: '123 Oak St, New Bern, NC 28560',
        },
      ],
    },
  ],
}

const COMMON_PROPERTY: FormIntakeConfig = {
  formNumber: '_property',
  formName: 'Property Details',
  sections: [
    {
      id: 'property_details',
      title: 'Property Details',
      description: 'Basic information about the property.',
      questions: [
        {
          id: 'property_county',
          label: 'County:',
          type: 'text',
          required: false,
          placeholder: 'Craven',
        },
        {
          id: 'property_tax_parcel',
          label: 'Tax parcel / PIN:',
          type: 'text',
          required: false,
          placeholder: '7-001-123',
        },
        {
          id: 'property_year_built',
          label: 'Year built:',
          type: 'text',
          required: false,
          placeholder: '1995',
        },
        {
          id: 'property_sq_ft',
          label: 'Square footage:',
          type: 'text',
          required: false,
          placeholder: '2,100',
        },
        {
          id: 'property_type',
          label: 'Property type:',
          type: 'select',
          options: ['Single Family', 'Townhouse', 'Condo', 'Duplex', 'Multi-Family', 'Manufactured', 'Land/Lot', 'Other'],
          required: false,
        },
      ],
    },
  ],
}

// ─── Registry lookup ────────────────────────────────────────────────────

/** Registry of form-specific intake questions keyed by form number. */
const FORM_REGISTRY: Record<string, FormIntakeConfig> = {
  '170': FORM_170,
  '101': FORM_101,
  '141': FORM_141,
}

/**
 * Given a list of form numbers selected for the package, returns the
 * full ordered list of FormIntakeConfigs to render in the intake UI.
 *
 * Order: personal info → property details → form-specific (sorted by number)
 */
export function getIntakeConfigsForForms(formNumbers: string[]): FormIntakeConfig[] {
  const configs: FormIntakeConfig[] = [COMMON_PERSONAL, COMMON_PROPERTY]

  // Sort form numbers so the intake is deterministic
  const sorted = [...formNumbers].sort((a, b) => {
    const na = parseInt(a, 10)
    const nb = parseInt(b, 10)
    if (!isNaN(na) && !isNaN(nb)) return na - nb
    return a.localeCompare(b)
  })

  for (const num of sorted) {
    const cfg = FORM_REGISTRY[num]
    if (cfg) configs.push(cfg)
  }

  return configs
}

/**
 * Returns the total number of required questions across all configs.
 */
export function countRequiredQuestions(configs: FormIntakeConfig[]): number {
  let count = 0
  for (const cfg of configs) {
    for (const section of cfg.sections) {
      for (const q of section.questions) {
        if (q.required) count++
      }
    }
  }
  return count
}

/**
 * Returns all sections flattened from all configs, in order.
 * Each section is tagged with its parent form name for the UI.
 */
export function flattenSections(configs: FormIntakeConfig[]): (IntakeSection & { formName: string; formNumber: string })[] {
  const result: (IntakeSection & { formName: string; formNumber: string })[] = []
  for (const cfg of configs) {
    for (const section of cfg.sections) {
      result.push({ ...section, formName: cfg.formName, formNumber: cfg.formNumber })
    }
  }
  return result
}

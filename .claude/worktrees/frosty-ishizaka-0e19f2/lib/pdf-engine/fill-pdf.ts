import { PDFDocument, PDFForm } from 'pdf-lib'
import type { CollectedData, PdfFieldMap, FillResult } from './types'
import { buildReverseMapping } from './field-mappings'

function applyFieldValue(form: PDFForm, pdfFieldName: string, value: string | boolean | number): boolean {
  try {
    const field = form.getField(pdfFieldName)
    const fieldType = field.constructor.name

    if (fieldType === 'PDFTextField' || fieldType === 'PDFField') {
      const tf = form.getTextField(pdfFieldName)
      tf.setText(String(value))
      return true
    }
    if (fieldType === 'PDFCheckBox') {
      const cb = form.getCheckBox(pdfFieldName)
      value ? cb.check() : cb.uncheck()
      return true
    }
    if (fieldType === 'PDFDropdown') {
      const dd = form.getDropdown(pdfFieldName)
      dd.select(String(value))
      return true
    }
    if (fieldType === 'PDFRadioGroup') {
      const rg = form.getRadioGroup(pdfFieldName)
      rg.select(String(value))
      return true
    }
    // Attempt text fallback for unknown types
    const tf = form.getTextField(pdfFieldName)
    tf.setText(String(value))
    return true
  } catch {
    return false
  }
}

export async function fillPdf(
  pdfBytes: Uint8Array,
  fieldMapping: PdfFieldMap,
  data: CollectedData,
  flatten = false
): Promise<FillResult> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  const form = doc.getForm()

  const reverseMap = buildReverseMapping(fieldMapping)
  const unfilledFields: string[] = []
  let filledCount = 0

  for (const [canonicalKey, value] of Object.entries(data)) {
    const pdfFields = reverseMap[canonicalKey]
    if (!pdfFields || pdfFields.length === 0) continue

    for (const pdfFieldName of pdfFields) {
      const success = applyFieldValue(form, pdfFieldName, value)
      if (success) filledCount++
    }
  }

  // Track canonical keys that had no data
  for (const canonicalKey of Object.values(fieldMapping)) {
    if (data[canonicalKey] === undefined || data[canonicalKey] === '') {
      if (!unfilledFields.includes(canonicalKey)) {
        unfilledFields.push(canonicalKey)
      }
    }
  }

  if (flatten) form.flatten()

  const filledBytes = await doc.save()
  return { pdfBytes: filledBytes, unfilledFields, filledCount }
}

export async function fillPdfFromBase64(
  base64Pdf: string,
  fieldMapping: PdfFieldMap,
  data: CollectedData,
  flatten = false
): Promise<FillResult & { base64: string }> {
  const pdfBytes = new Uint8Array(Buffer.from(base64Pdf, 'base64'))
  const result = await fillPdf(pdfBytes, fieldMapping, data, flatten)
  return {
    ...result,
    base64: Buffer.from(result.pdfBytes).toString('base64'),
  }
}

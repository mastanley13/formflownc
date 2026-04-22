import { PDFDocument, PDFAcroField, PDFAcroCheckBox, PDFAcroRadioButton, PDFAcroComboBox, PDFAcroListBox, PDFAcroText } from 'pdf-lib'
import type { PdfField, PdfFieldType } from './types'

function classifyField(field: PDFAcroField): PdfFieldType {
  if (field instanceof PDFAcroCheckBox) return 'checkbox'
  if (field instanceof PDFAcroRadioButton) return 'radio'
  if (field instanceof PDFAcroComboBox || field instanceof PDFAcroListBox) return 'dropdown'
  if (field instanceof PDFAcroText) return 'text'
  return 'unknown'
}

function getOptions(field: PDFAcroField): string[] | undefined {
  if (field instanceof PDFAcroComboBox || field instanceof PDFAcroListBox) {
    try {
      return field.getOptions().map((opt) =>
        typeof opt === 'string' ? opt : (opt as { value: { decodeText(): string }; display: { decodeText(): string } }).display?.decodeText?.() ?? String(opt)
      )
    } catch {
      return undefined
    }
  }
  return undefined
}

export async function detectPdfFields(pdfBytes: Uint8Array): Promise<PdfField[]> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  const form = doc.getForm()
  const rawFields = form.getFields()

  return rawFields.map((field) => {
    const type = classifyField(field.acroField)
    const options = getOptions(field.acroField)

    let value: string | boolean | undefined
    try {
      if (type === 'checkbox') {
        value = (field as import('pdf-lib').PDFCheckBox).isChecked()
      } else if (type === 'text') {
        value = (field as import('pdf-lib').PDFTextField).getText() ?? ''
      } else if (type === 'dropdown') {
        const selected = (field as import('pdf-lib').PDFDropdown).getSelected()
        value = selected[0] ?? ''
      }
    } catch {
      value = undefined
    }

    return {
      name: field.getName(),
      type,
      value,
      options,
    } satisfies PdfField
  })
}

export async function detectPdfFieldsFromBase64(base64Pdf: string): Promise<PdfField[]> {
  const binary = Buffer.from(base64Pdf, 'base64')
  return detectPdfFields(new Uint8Array(binary))
}

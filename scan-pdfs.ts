import { readFile, readdir } from 'fs/promises'
import path from 'path'
import { detectPdfFields } from './lib/pdf-engine/detect-fields'

async function main() {
  const dir = path.join(process.cwd(), 'uploads', 'forms')
  const files = await readdir(dir)
  const pdfs = files.filter(f => f.endsWith('.pdf')).sort()
  
  const results: Record<string, { fieldCount: number; fields: { name: string; type: string }[]; error?: string }> = {}
  
  for (const pdf of pdfs) {
    const fullPath = path.join(dir, pdf)
    try {
      const bytes = await readFile(fullPath)
      const fields = await detectPdfFields(new Uint8Array(bytes))
      results[pdf] = {
        fieldCount: fields.length,
        fields: fields.map(f => ({ name: f.name, type: f.type })),
      }
    } catch (err) {
      results[pdf] = {
        fieldCount: 0,
        fields: [],
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }
  
  // Print summary
  for (const [pdf, info] of Object.entries(results)) {
    if (info.error) {
      console.log(`\n=== ${pdf} === ERROR: ${info.error}`)
    } else if (info.fieldCount === 0) {
      console.log(`\n=== ${pdf} === NO FIELDS (flat/scanned)`)
    } else {
      console.log(`\n=== ${pdf} === ${info.fieldCount} fields:`)
      for (const f of info.fields) {
        console.log(`  [${f.type}] ${f.name}`)
      }
    }
  }
}

main().catch(console.error)

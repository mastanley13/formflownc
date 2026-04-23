// Detect AcroForm fields in all real NC REALTOR PDFs from uploads/
import { PDFDocument } from 'pdf-lib'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const uploadsDir = join(__dirname, '../../../../uploads/forms')

const files = readdirSync(uploadsDir)
  .filter(f => f.endsWith('.pdf'))
  .sort()

console.log(`Found ${files.length} PDFs in uploads/\n`)
console.log('='.repeat(70))

const results = []

for (const filename of files) {
  const filepath = join(uploadsDir, filename)
  const bytes = readFileSync(filepath)

  let fields = []
  let error = null
  try {
    const doc = await PDFDocument.load(new Uint8Array(bytes), { ignoreEncryption: true })
    const form = doc.getForm()
    fields = form.getFields().map(f => ({ name: f.getName(), type: f.constructor.name }))
  } catch (e) {
    error = e.message
  }

  const status = error ? 'ERROR' : fields.length === 0 ? 'FLAT/NO-FIELDS' : `FILLABLE (${fields.length} fields)`
  console.log(`\n${filename}`)
  console.log(`  Status: ${status}`)

  if (fields.length > 0) {
    console.log(`  Fields:`)
    for (const f of fields) {
      console.log(`    - "${f.name}" [${f.type.replace('PDF', '').replace('AcroField', 'field')}]`)
    }
  }
  if (error) console.log(`  Error: ${error}`)

  results.push({ filename, fields, error, fillable: fields.length > 0 })
}

console.log('\n' + '='.repeat(70))
console.log('\nSUMMARY:')
const fillable = results.filter(r => r.fillable)
const flat = results.filter(r => !r.fillable && !r.error)
const errors = results.filter(r => r.error)
console.log(`  Fillable: ${fillable.length} files`)
for (const r of fillable) console.log(`    ✓ ${r.filename} (${r.fields.length} fields)`)
console.log(`  Flat/Not fillable: ${flat.length} files`)
for (const r of flat) console.log(`    ✗ ${r.filename}`)
if (errors.length) {
  console.log(`  Errors: ${errors.length} files`)
  for (const r of errors) console.log(`    ! ${r.filename}: ${r.error}`)
}

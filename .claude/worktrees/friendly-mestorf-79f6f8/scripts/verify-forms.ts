import { detectPdfFields } from '../lib/pdf-engine'
import { readFile } from 'fs/promises'
import path from 'path'

const forms = [
  { num: '101', file: '101-exclusive-right-to-sell.pdf' },
  { num: '161', file: '161-buyer-agency-agreement.pdf' },
  { num: '140', file: '140-wwrea-buyer.pdf' },
  { num: '141', file: '141-wwrea-seller.pdf' },
  { num: '110', file: '110-seller-net-sheet.pdf' },
  { num: '170', file: '170-residential-property-disclosure.pdf' },
]

async function main() {
  console.log('Verifying generated PDF forms…\n')
  for (const { num, file } of forms) {
    const p = path.join('uploads', 'forms', file)
    const bytes = new Uint8Array(await readFile(p))
    const fields = await detectPdfFields(bytes)
    const names = fields.map((f) => f.name)
    console.log(`Form ${num}: ${fields.length} AcroForm fields`)
    console.log(`  Fields: ${names.slice(0, 8).join(', ')}${fields.length > 8 ? ` ... (+${fields.length - 8} more)` : ''}`)
    console.log()
  }
  console.log('All forms verified.')
}

main().catch((e) => { console.error(e); process.exit(1) })

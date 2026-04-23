import JSZip from 'jszip'
import { readdir, readFile } from 'fs/promises'
import path from 'path'

// Build a zip from an array of { filename, bytes } entries
export async function buildZipFromBuffers(
  files: Array<{ filename: string; bytes: Buffer | Uint8Array }>
): Promise<Buffer> {
  const zip = new JSZip()
  for (const { filename, bytes } of files) {
    zip.file(filename, bytes)
  }
  const uint8 = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } })
  return Buffer.from(uint8)
}

// Build a zip from all files in a directory
export async function buildZipFromDirectory(dir: string, zipPrefix = ''): Promise<Buffer> {
  const zip = new JSZip()
  let entries: string[] = []
  try {
    entries = await readdir(dir)
  } catch {
    // Directory doesn't exist yet — return empty zip
    return Buffer.from(await zip.generateAsync({ type: 'uint8array' }))
  }

  for (const entry of entries) {
    const bytes = await readFile(path.join(dir, entry))
    zip.file(zipPrefix ? `${zipPrefix}/${entry}` : entry, bytes)
  }

  const uint8 = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } })
  return Buffer.from(uint8)
}

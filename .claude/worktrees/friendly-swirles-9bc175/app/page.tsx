export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-slate-50">
      <main className="w-full max-w-2xl px-8 py-16 text-center">
        <div className="mb-8">
          <span className="inline-block bg-blue-900 text-white text-xs font-semibold px-3 py-1 rounded-full tracking-widest uppercase mb-4">
            FormFlowNC
          </span>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Real Estate Document Automation
          </h1>
          <p className="text-slate-500 text-lg">
            NC REALTOR form automation for Chris Rayner — Rayner Realty Group
          </p>
        </div>

        <div className="grid gap-4 mt-10">
          <StatusCard label="PDF Engine" status="ready" detail="detect-fields · fill · test-form" />
          <StatusCard label="Database" status="ready" detail="SQLite via Prisma v7 + LibSQL adapter" />
          <StatusCard label="Auth" status="ready" detail="JWT session (agent login — coming soon)" />
          <StatusCard label="Client Intake Flow" status="planned" detail="UUID link → form → DocuSeal" />
          <StatusCard label="DocuSeal Integration" status="planned" detail="Self-hosted e-signature API stub" />
        </div>

        <div className="mt-10 text-sm text-slate-400 space-y-1">
          <p>PDF engine test endpoints:</p>
          <code className="block bg-white border border-slate-200 rounded px-3 py-2 text-xs text-left font-mono">
            GET  /api/pdf/test-form       → blank test PDF<br />
            POST /api/pdf/test-form       → filled test PDF (sample data)<br />
            POST /api/pdf/detect-fields   → extract AcroForm fields from uploaded PDF<br />
            POST /api/pdf/fill            → fill uploaded PDF with provided field map + data
          </code>
        </div>
      </main>
    </div>
  )
}

function StatusCard({ label, status, detail }: { label: string; status: 'ready' | 'planned'; detail: string }) {
  return (
    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-5 py-4 text-left shadow-sm">
      <div>
        <p className="font-semibold text-slate-800 text-sm">{label}</p>
        <p className="text-slate-400 text-xs mt-0.5">{detail}</p>
      </div>
      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
        status === 'ready'
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-amber-50 text-amber-700 border border-amber-200'
      }`}>
        {status === 'ready' ? '✓ Ready' : 'Planned'}
      </span>
    </div>
  )
}

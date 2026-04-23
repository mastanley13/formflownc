import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  const session = await getSession()
  if (session) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 text-lg">FormFlowNC</span>
          </div>
          <Link
            href="/login"
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-4 py-20 sm:py-32 bg-gradient-to-b from-slate-50 to-white">
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block bg-teal-50 text-teal-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-teal-200 mb-6 tracking-wide uppercase">
            NC REALTOR® Document Automation
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 leading-tight mb-6 tracking-tight">
            Fill it. Sign it.
            <br />
            <span className="text-teal-600">Send it. Done.</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Auto-fill NC REALTOR forms from client data, send for e-signatures, and close faster. Built for North Carolina agents.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-semibold px-8 py-4 rounded-2xl text-base transition shadow-sm"
            >
              Agent Sign In
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto text-slate-600 hover:text-slate-900 font-medium px-8 py-4 rounded-2xl text-base transition border border-slate-200 hover:border-slate-300 bg-white"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-3">Built for how agents actually work</h2>
          <p className="text-slate-500 text-center mb-12 max-w-2xl mx-auto">No more manual form filling. Send a link to your client, they answer the questions on their phone, and every form comes back auto-filled and ready to sign.</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'Instant auto-fill',
                body: 'Client data flows into every selected NC REALTOR form automatically. No copy-paste, no manual entry.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ),
                title: 'Mobile-first for clients',
                body: 'Your clients complete the intake form on their phone in under 5 minutes. No app download, no login required.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                ),
                title: 'E-signature ready',
                body: 'Integrates with DocuSeal self-hosted e-signatures. Once filled, documents go straight to signing.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'NC REALTOR® forms',
                body: 'Supports the official NC REALTOR AcroForm PDFs: 101, 161, 140, 141, 110, 170 and more.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                ),
                title: 'One-click download',
                body: 'Download a zip of all filled PDFs at any time. Files are retained until the transaction closes.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                title: 'Private by design',
                body: 'Client PII is wiped after transaction expiry. Self-hosted — your data never leaves your server.',
              },
            ].map((f) => (
              <div key={f.title} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:border-teal-200 hover:bg-teal-50/30 transition">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-12">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create a package', body: 'Select your forms, add signers, enter deal terms. Takes 2 minutes.' },
              { step: '02', title: 'Client completes intake', body: 'Send the 7-day link. Client fills out their info on any device.' },
              { step: '03', title: 'Sign and download', body: 'Forms auto-fill and route to DocuSeal. Everyone signs electronically.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-teal-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Ready to save hours per transaction?</h2>
          <p className="text-teal-100 mb-8">Sign in to your agent portal and create your first package today.</p>
          <Link
            href="/login"
            className="inline-block bg-white text-teal-700 hover:bg-teal-50 font-semibold px-8 py-4 rounded-2xl text-base transition shadow-sm"
          >
            Agent Sign In →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-teal-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-semibold text-slate-600">FormFlowNC</span>
          </div>
          <p>NC REALTOR® document automation · New Bern, NC</p>
        </div>
      </footer>
    </div>
  )
}

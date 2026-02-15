import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-[#1A1A1A]">
        <span className="font-display text-[#C5AE79] text-2xl tracking-wider">REMEMBR</span>
        <Link
          href="/login"
          className="text-sm text-[#7A7055] hover:text-[#C5AE79] transition-colors duration-200"
        >
          Sign In →
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="animate-in max-w-3xl">
          <h1 className="font-display text-[#C5AE79] text-7xl md:text-9xl lg:text-[10rem] leading-[0.85] mb-8">
            SAVE IT.<br />FIND IT.
          </h1>
        </div>

        <p className="animate-in delay-1 text-[#7A7055] text-base md:text-lg max-w-md leading-relaxed mb-12 font-light">
          A bookmark manager with auto-fetch, real-time sync, and infinite scroll. Nothing more.
        </p>

        <Link href="/login" className="animate-in delay-2">
          <button className="text-sm font-medium tracking-wide uppercase text-[#0A0A0A] bg-[#C5AE79] px-8 py-3.5 hover:bg-[#B89D68] transition-colors duration-200 active:scale-[0.98]">
            Get Started
          </button>
        </Link>

        <p className="animate-in delay-3 text-xs text-[#3A3A3A] mt-6">
          Free &middot; Google sign-in only
        </p>
      </main>

      {/* Features */}
      <div className="border-t border-[#1A1A1A] grid grid-cols-2 md:grid-cols-4">
        {[
          ['01', 'Auto-fetch', 'Paste a URL, get the title and preview.'],
          ['02', 'Real-time', 'Bookmarks sync across all your tabs.'],
          ['03', 'Drag & Drop', 'Reorder your bookmarks however you want.'],
          ['04', 'Private', 'Row-level security. Your data is yours.'],
        ].map(([num, title, desc]) => (
          <div key={num} className="px-8 py-8 border-r border-[#1A1A1A] last:border-r-0">
            <span className="text-[10px] text-[#3A3A3A] uppercase tracking-widest">{num}</span>
            <h3 className="font-display text-[#C5AE79] text-xl mt-2 mb-2">{title}</h3>
            <p className="text-xs text-[#5A5A5A] leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div className="border-t border-[#1A1A1A] px-8 py-20 md:py-28">
        <div className="max-w-3xl mx-auto">
          <span className="text-[10px] text-[#3A3A3A] uppercase tracking-widest">How it works</span>
          <h2 className="font-display text-[#C5AE79] text-4xl md:text-6xl mt-4 mb-16">THREE STEPS.<br />THAT&apos;S IT.</h2>

          <div className="space-y-16">
            {[
              {
                step: '01',
                title: 'PASTE A URL',
                desc: 'Drop any link into the input field. We automatically fetch the page title, favicon, preview image, and description — no manual entry needed.',
              },
              {
                step: '02',
                title: 'ORGANIZE',
                desc: 'Drag and drop to reorder. Search instantly across all your bookmarks. Everything updates in real-time across all your open tabs.',
              },
              {
                step: '03',
                title: 'ACCESS ANYWHERE',
                desc: 'Your bookmarks are stored securely in the cloud with row-level security. Sign in from any device and pick up right where you left off.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-8 items-start">
                <span className="font-display text-[#C5AE79] text-5xl md:text-7xl leading-none">{step}</span>
                <div className="pt-2 md:pt-4">
                  <h3 className="font-display text-[#C5AE79] text-xl md:text-2xl mb-3">{title}</h3>
                  <p className="text-sm text-[#5A5A5A] leading-relaxed max-w-md">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#1A1A1A] px-8 py-20 md:py-28 text-center">
        <h2 className="font-display text-[#C5AE79] text-6xl md:text-8xl lg:text-9xl mb-6">REMEMBR.</h2>
        <p className="text-sm text-[#5A5A5A]">
          made with love by <a href="https://github.com/aniket0929" target="_blank" rel="noopener noreferrer" className="text-[#C5AE79] hover:scale-110 inline-block transition-transform duration-200">@aniket</a>
        </p>
      </footer>
    </div>
  )
}
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xs">
        {/* Back */}
        <Link
          href="/"
          className="text-xs text-[#3A3A3A] hover:text-[#7A7055] transition-colors duration-200 mb-16 inline-block"
        >
          ← Back
        </Link>

        {/* Brand */}
        <h1 className="font-display text-[#C5AE79] text-5xl mb-3">REMEMBR</h1>
        <p className="text-sm text-[#5A5A5A] mb-12">Sign in to continue</p>

        {/* Sign In */}
        <form action="/auth/google" method="post">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 text-sm font-medium text-[#0A0A0A] bg-[#C5AE79] py-3.5 hover:bg-[#B89D68] transition-colors duration-200 active:scale-[0.98]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#0A0A0A" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#0A0A0A" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#0A0A0A" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#0A0A0A" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        </form>

        <p className="text-[10px] text-[#2A2A2A] mt-8 text-center">
          Your data is protected with row-level security.
        </p>
      </div>
    </div>
  )
}
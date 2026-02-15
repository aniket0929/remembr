/**
 * Auth Callback Route (app/auth/callback/route.ts)
 *
 * This route handles the OAuth callback from Supabase/Google.
 *
 * Flow:
 * 1. After the user authenticates with Google, Supabase redirects here with a `code` param
 * 2. We exchange that code for a user session using supabase.auth.exchangeCodeForSession()
 * 3. This sets the auth cookies so the user is now logged in
 * 4. Finally, we redirect them to the dashboard
 *
 * This route must be registered in Supabase Dashboard → Authentication → Redirect URLs
 * (e.g., https://remembr-rho.vercel.app/auth/callback)
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
        // Exchange the temporary code for a persistent session (sets auth cookies)
        const supabase = await createClient()
        await supabase.auth.exchangeCodeForSession(code)
    }

    // Redirect to dashboard after successful login
    return NextResponse.redirect(new URL('/dashboard', request.url))
}
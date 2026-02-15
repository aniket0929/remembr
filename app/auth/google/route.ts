/**
 * Google OAuth Route (app/auth/google/route.ts)
 *
 * Handles the POST request from the login form's "Continue with Google" button.
 *
 * Flow:
 * 1. Creates a server-side Supabase client
 * 2. Initiates the Google OAuth flow via supabase.auth.signInWithOAuth()
 * 3. Sets the redirectTo URL to /auth/callback (where the session is exchanged)
 * 4. Redirects the user to Google's consent screen (data.url)
 * 5. After Google auth, the user is redirected back to /auth/callback with a code
 *
 * The NEXT_PUBLIC_APP_URL env var must be set correctly in production
 * (e.g., https://remembr-rho.vercel.app) or the redirect will fail.
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function POST() {
    const supabase = await createClient()

    // Initiate Google OAuth — Supabase handles the OAuth dance
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // After Google auth, redirect back to our callback route
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
    })

    if (error) {
        console.error('Error signing in:', error)
        redirect('/login?error=Could not authenticate user')
    }

    // Redirect user to Google's consent screen
    if (data.url) {
        redirect(data.url)
    }
}
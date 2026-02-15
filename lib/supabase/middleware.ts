/**
 * Supabase Middleware Helper (lib/supabase/middleware.ts)
 *
 * Called by the root middleware (middleware.ts) on every request.
 * Its job is to refresh the Supabase auth session by:
 *
 * 1. Creating a Supabase client with access to the request/response cookies
 * 2. Calling `supabase.auth.getUser()` which triggers a token refresh if needed
 * 3. Setting updated cookies on both the request and response
 *
 * Why this is needed:
 * - Supabase auth tokens expire and need periodic refresh
 * - Without this, users would get logged out after the token expires
 * - The middleware runs on every request, ensuring the session stays fresh
 *
 * Cookie handling:
 * - Cookies must be set on BOTH the request (for downstream server components)
 *   AND the response (so the browser gets the updated cookies)
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    // Set cookies on the request (for downstream server components)
                    cookiesToSet.forEach(({ name, value }) => {
                        request.cookies.set(name, value)
                    })
                    // Set cookies on the response (so the browser gets them)
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) => {
                        supabaseResponse.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // This call refreshes the auth token if it's expired
    await supabase.auth.getUser()

    return supabaseResponse
}
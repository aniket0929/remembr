/**
 * Supabase Server Client (lib/supabase/server.ts)
 *
 * Creates a Supabase client for use in Server Components and API Routes.
 * This client runs on the server and uses Next.js cookies for auth session management.
 *
 * Key differences from the browser client:
 * - Uses `createServerClient` from @supabase/ssr (not `createBrowserClient`)
 * - Reads/writes auth cookies via Next.js `cookies()` API
 * - The `setAll` method may throw in Server Components (read-only context),
 *   which is safely caught — the middleware handles session refresh instead.
 *
 * Used in: app/page.tsx, app/login/page.tsx, app/dashboard/page.tsx, auth routes
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                // Read all cookies (for auth session)
                getAll() {
                    return cookieStore.getAll()
                },
                // Write cookies (for session refresh)
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // setAll is called from a Server Component where cookies are read-only.
                        // This is expected — the middleware handles session refresh instead.
                    }
                },
            },
        }
    )
}
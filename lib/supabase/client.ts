/**
 * Supabase Browser Client (lib/supabase/client.ts)
 *
 * Creates a Supabase client for use in Client Components ('use client').
 * This client runs in the browser and uses the public anon key.
 *
 * Usage: Memoize with useMemo() to avoid re-creating on every render.
 *   const supabase = useMemo(() => createClient(), [])
 *
 * Security: The anon key is safe to expose — Row Level Security (RLS)
 * on the database ensures users can only access their own data.
 */

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
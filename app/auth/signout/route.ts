/**
 * Sign Out Route (app/auth/signout/route.ts)
 *
 * Handles the POST request from the dashboard's "Sign Out" button.
 * Clears the Supabase auth session (removes cookies) and redirects to the landing page.
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function POST() {
    const supabase = await createClient()
    await supabase.auth.signOut() // Clear the auth session
    redirect('/') // Send user back to the landing page
}
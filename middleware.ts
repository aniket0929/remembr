/**
 * Root Middleware (middleware.ts)
 *
 * Runs on every matching request before it reaches the page/route.
 * Its sole job is to call `updateSession()` which refreshes the Supabase auth token.
 *
 * Without this middleware, auth sessions would expire and users would be
 * silently logged out. The middleware ensures tokens are refreshed on every request.
 *
 * The matcher config excludes static assets (images, fonts, etc.) to avoid
 * unnecessary processing on non-page requests.
 */

import { type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder assets (svg, png, jpg, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}

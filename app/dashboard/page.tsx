/**
 * Dashboard Page (app/dashboard/page.tsx)
 *
 * The main authenticated view of the app. Displays:
 * - A header with brand name, user email, and sign-out button
 * - The AddBookmarkForm component for adding new bookmarks
 * - The BookmarkList component for displaying, searching, and managing bookmarks
 *
 * Server-side pagination: Only the first PAGE_SIZE bookmarks are fetched initially.
 * The BookmarkList component handles client-side infinite scroll for subsequent pages.
 *
 * This is a Server Component — it fetches data on the server before rendering.
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import AddBookmarkForm from '@/components/AddBookmarkForm'
import BookmarkList from '@/components/BookmarkList'

export default async function DashboardPage() {
  // Create server-side Supabase client and verify authentication
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users to login
  if (!user) {
    redirect('/login')
  }

  // Number of bookmarks to load per page (used for both server and client pagination)
  const PAGE_SIZE = 20

  // Fetch the first page of bookmarks + total count for pagination
  // - `count: 'exact'` tells Supabase to return the total number of rows
  // - `.range(0, PAGE_SIZE - 1)` limits to the first page only
  // - Primary sort: by position (for drag-and-drop ordering)
  // - Secondary sort: by creation date (newest first for bookmarks without a position)
  const { data: bookmarks, count: totalCount } = await supabase
    .from('bookmarks')
    .select('*', { count: 'exact' })
    .order('position', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(0, PAGE_SIZE - 1)

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* ──────────────── Header ──────────────── */}
      <header className="border-b border-[#1A1A1A]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-display text-[#C5AE79] text-xl tracking-wider">REMEMBR</span>
            {/* Show user email on larger screens */}
            <span className="text-[10px] text-[#3A3A3A] uppercase tracking-widest hidden sm:inline">{user.email}</span>
          </div>
          {/* Sign out — POSTs to /auth/signout which clears the session */}
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-xs text-[#5A5A5A] hover:text-[#C5AE79] transition-colors duration-200"
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* ──────────────── Main Content ──────────────── */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Page title with total bookmark count */}
        <div className="mb-10 animate-in">
          <h2 className="font-display text-[#C5AE79] text-4xl md:text-5xl mb-1">BOOKMARKS</h2>
          <p className="text-xs text-[#3A3A3A] uppercase tracking-widest">
            {totalCount ?? 0} saved
          </p>
        </div>

        {/* Add Bookmark Form — client component for adding new bookmarks */}
        <div className="mb-10 animate-in delay-1">
          <AddBookmarkForm userId={user.id} />
        </div>

        {/* Bookmark List — client component with infinite scroll, search, drag-and-drop */}
        <div className="animate-in delay-2">
          <BookmarkList
            initialBookmarks={bookmarks || []}
            userId={user.id}
            totalCount={totalCount ?? 0}
            pageSize={PAGE_SIZE}
          />
        </div>
      </main>
    </div>
  )
}
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import AddBookmarkForm from '@/components/AddBookmarkForm'
import BookmarkList from '@/components/BookmarkList'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const PAGE_SIZE = 20

  const { data: bookmarks, count: totalCount } = await supabase
    .from('bookmarks')
    .select('*', { count: 'exact' })
    .order('position', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(0, PAGE_SIZE - 1)

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-[#1A1A1A]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-display text-[#C5AE79] text-xl tracking-wider">REMEMBR</span>
            <span className="text-[10px] text-[#3A3A3A] uppercase tracking-widest hidden sm:inline">{user.email}</span>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-xs text-[#3A3A3A] hover:text-[#7A7055] transition-colors duration-200"
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Title */}
        <div className="mb-10 animate-in">
          <h2 className="font-display text-[#C5AE79] text-4xl md:text-5xl mb-1">BOOKMARKS</h2>
          <p className="text-xs text-[#3A3A3A] uppercase tracking-widest">
            {totalCount ?? 0} saved
          </p>
        </div>

        {/* Add Form */}
        <div className="mb-10 animate-in delay-1">
          <AddBookmarkForm userId={user.id} />
        </div>

        {/* List */}
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
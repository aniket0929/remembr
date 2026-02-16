/**
 * BookmarkList Component (components/BookmarkList.tsx)
 *
 * The main client-side component for displaying and managing bookmarks.
 *
 * Features:
 * 1. INFINITE SCROLL PAGINATION
 *    - Server provides the first page of bookmarks + total count
 *    - IntersectionObserver watches a sentinel div at the bottom of the list
 *    - When the sentinel is within 200px of the viewport, the next page is fetched
 *    - A fallback "Load more" button is shown in case the observer doesn't trigger
 *    - Deduplication prevents duplicates when realtime inserts overlap with paginated data
 *
 * 2. REAL-TIME UPDATES (Supabase Realtime)
 *    - Subscribes to postgres_changes on the bookmarks table for the current user
 *    - INSERT: Prepends new bookmarks (with dedup check)
 *    - DELETE: Removes deleted bookmarks from the list
 *    - UPDATE: Updates modified bookmarks in-place
 *
 * 3. SEARCH / FILTERING
 *    - Debounced search (300ms) filters bookmarks by title or URL
 *    - Infinite scroll sentinel is hidden during search
 *    - Search results count is displayed
 *
 * 4. DRAG-AND-DROP REORDERING
 *    - Uses native HTML5 drag-and-drop API
 *    - Optimistic update: UI reorders immediately, then persists to DB via upsert
 *    - Rollback on failure: If the API call fails, the previous order is restored
 *    - Disabled during search (drag handle is hidden)
 *
 * 5. OPTIMISTIC DELETE
 *    - Bookmark is removed from UI immediately
 *    - If the DB delete fails, the bookmark is restored and an error toast is shown
 *
 * Props:
 * - initialBookmarks: First page of bookmarks (server-rendered)
 * - userId: Current user's ID (for realtime filter and DB operations)
 * - totalCount: Total number of bookmarks (for pagination math)
 * - pageSize: Number of bookmarks per page (must match server-side PAGE_SIZE)
 */

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'

// ── Type Definitions ──

/** Shape of a bookmark row from the Supabase `bookmarks` table */
interface Bookmark {
  id: string
  title: string
  url: string
  favicon_url: string | null
  og_image: string | null
  og_description: string | null
  created_at: string
  position: number
}

/** Props passed from the Dashboard server component */
interface BookmarkListProps {
  initialBookmarks: Bookmark[]
  userId: string
  totalCount: number
  pageSize: number
}

export default function BookmarkList({ initialBookmarks, userId, totalCount, pageSize }: BookmarkListProps) {
  // ── State ──
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)
  const [searchQuery, setSearchQuery] = useState('')           // Raw search input
  const [debouncedQuery, setDebouncedQuery] = useState('')     // Debounced search (300ms delay)
  const [draggedId, setDraggedId] = useState<string | null>(null)   // ID of bookmark being dragged
  const [dragOverId, setDragOverId] = useState<string | null>(null) // ID of bookmark being hovered over during drag
  const [loadingMore, setLoadingMore] = useState(false)        // True while fetching next page
  const [hasMore, setHasMore] = useState(initialBookmarks.length < totalCount) // Are there more pages?
  const [currentPage, setCurrentPage] = useState(1)            // Current pagination page (1-indexed)
  const loadMoreRef = useRef<HTMLDivElement>(null)              // Ref for the IntersectionObserver sentinel

  // Memoize Supabase client to avoid re-creating on every render
  const supabase = useMemo(() => createClient(), [])

  // ── Debounced Search ──
  // Delays the actual search by 300ms to avoid filtering on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Filter bookmarks by title or URL based on the debounced query
  const filteredBookmarks = useMemo(() => {
    if (!debouncedQuery.trim()) return bookmarks
    const q = debouncedQuery.toLowerCase()
    return bookmarks.filter((b) => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q))
  }, [bookmarks, debouncedQuery])

  // ── Infinite Scroll: Load More ──
  // Fetches the next page of bookmarks from Supabase
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = currentPage + 1
    const from = (nextPage - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .order('position', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      toast.error('Failed to load more')
    } else if (data) {
      // Deduplicate: realtime inserts may already be in the list
      setBookmarks((current) => {
        const ids = new Set(current.map((b) => b.id))
        return [...current, ...data.filter((b) => !ids.has(b.id))]
      })
      setCurrentPage(nextPage)
      // If we got fewer items than pageSize, we've reached the end
      if (data.length < pageSize) setHasMore(false)
    }
    setLoadingMore(false)
  }, [loadingMore, hasMore, currentPage, pageSize, supabase])

  // ── Infinite Scroll: IntersectionObserver ──
  // Watches the sentinel div — when it enters the viewport (with 200px margin), load more
  useEffect(() => {
    const el = loadMoreRef.current
    if (!el || !hasMore) return
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '200px' } // Trigger 200px before reaching the bottom
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasMore, loadMore])

  // ── Local Event Listener (for instant UI updates without Realtime) ──
  // AddBookmarkForm dispatches a 'bookmark-added' custom event after successful insert.
  // This ensures the bookmark appears immediately even if Supabase Realtime is disabled.
  useEffect(() => {
    const handleBookmarkAdded = (e: Event) => {
      const bookmark = (e as CustomEvent).detail as Bookmark
      // Prepend the new bookmark, but skip if it already exists (dedup with Realtime)
      setBookmarks((c) => c.some((b) => b.id === bookmark.id) ? c : [bookmark, ...c])
    }
    window.addEventListener('bookmark-added', handleBookmarkAdded)
    return () => window.removeEventListener('bookmark-added', handleBookmarkAdded)
  }, [])

  // ── Supabase Realtime Subscription ──
  // Listens for INSERT, DELETE, and UPDATE events on the bookmarks table
  useEffect(() => {
    const channel = supabase
      .channel('bookmarks-channel')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'bookmarks', filter: `user_id=eq.${userId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          // Prepend new bookmark, but skip if it already exists (dedup with optimistic inserts)
          setBookmarks((c) => c.some((b) => b.id === (payload.new as Bookmark).id) ? c : [payload.new as Bookmark, ...c])
        } else if (payload.eventType === 'DELETE') {
          setBookmarks((c) => c.filter((b) => b.id !== payload.old.id))
        } else if (payload.eventType === 'UPDATE') {
          setBookmarks((c) => c.map((b) => b.id === (payload.new as Bookmark).id ? (payload.new as Bookmark) : b))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase])

  // ── Optimistic Delete ──
  // Removes the bookmark from UI immediately, then deletes from DB.
  // Rolls back if the DB delete fails.
  const handleDelete = useCallback(async (id: string) => {
    const prev = bookmarks // Save current state for rollback
    setBookmarks((c) => c.filter((b) => b.id !== id))
    toast.success('Deleted')
    const { error } = await supabase.from('bookmarks').delete().eq('id', id)
    if (error) { setBookmarks(prev); toast.error('Failed to delete') }
  }, [bookmarks, supabase])

  // ── Drag-and-Drop Handlers ──
  const handleDragStart = (id: string) => setDraggedId(id)
  const handleDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); if (id !== draggedId) setDragOverId(id) }
  const handleDragLeave = () => setDragOverId(null)
  const handleDragEnd = () => { setDraggedId(null); setDragOverId(null) }

  /**
   * Handles the drop event — reorders bookmarks optimistically.
   * 1. Removes the dragged item from its current position
   * 2. Inserts it at the target position
   * 3. Recalculates all positions (0, 1, 2, ...)
   * 4. Updates the UI immediately (optimistic)
   * 5. Persists the new order to Supabase via upsert
   * 6. Rolls back on failure
   */
  const handleDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) { handleDragEnd(); return }
    const prev = [...bookmarks] // Save for rollback
    const di = bookmarks.findIndex((b) => b.id === draggedId)
    const ti = bookmarks.findIndex((b) => b.id === targetId)
    if (di === -1 || ti === -1) return

    // Reorder: remove dragged item and insert at target position
    const reordered = [...bookmarks]
    const [moved] = reordered.splice(di, 1)
    reordered.splice(ti, 0, moved)

    // Recalculate positions (0-indexed)
    const updated = reordered.map((b, i) => ({ ...b, position: i }))
    setBookmarks(updated)
    handleDragEnd()

    // Persist to database — upsert all bookmarks with new positions
    const ups = updated.map((b) => ({
      id: b.id, user_id: userId, title: b.title, url: b.url,
      favicon_url: b.favicon_url, og_image: b.og_image,
      og_description: b.og_description, position: b.position,
      created_at: b.created_at,
    }))
    const { error } = await supabase.from('bookmarks').upsert(ups)
    if (error) { setBookmarks(prev); toast.error('Failed to reorder') }
  }

  /** Extracts the domain name from a URL (e.g., "github.com" from "https://www.github.com/foo") */
  const getDomain = (url: string) => {
    try { return new URL(url).hostname.replace('www.', '') } catch { return url }
  }

  // ── Empty State ──
  if (bookmarks.length === 0 && !searchQuery) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-[#C5AE79] text-3xl mb-2">EMPTY</p>
        <p className="text-xs text-[#3A3A3A]">Add your first bookmark above.</p>
      </div>
    )
  }

  return (
    <div>
      {/* ── Search Input ── */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-xs bg-transparent border-b border-[#1A1A1A] text-[#C5AE79] placeholder:text-[#5A5A5A] text-sm py-2 outline-none focus:border-[#333] transition-colors duration-200"
        />
      </div>

      {/* Search results count */}
      {debouncedQuery && (
        <p className="text-[10px] text-[#3A3A3A] uppercase tracking-widest mb-6">
          {filteredBookmarks.length} result{filteredBookmarks.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* No results message */}
      {filteredBookmarks.length === 0 && debouncedQuery && (
        <p className="text-xs text-[#3A3A3A] py-12 text-center">No results.</p>
      )}

      {/* ── 2-Column Bookmark Card Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredBookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            draggable={!debouncedQuery} // Disable drag during search
            onDragStart={() => handleDragStart(bookmark.id)}
            onDragOver={(e) => handleDragOver(e, bookmark.id)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(bookmark.id)}
            onDragEnd={handleDragEnd}
            className={`group border border-[#1A1A1A] p-4 transition-all duration-200 ${
              draggedId === bookmark.id ? 'opacity-30 scale-[0.97]' : ''        // Faded while dragging
            } ${
              dragOverId === bookmark.id ? 'border-[#C5AE79]' : 'hover:border-[#2A2A2A]' // Gold border on drag target
            } ${!debouncedQuery ? 'cursor-grab active:cursor-grabbing' : ''}`}  // Grab cursor when not searching
          >
            {/* ── OG Image / Fallback ── */}
            {/* Shows OG image if available, falls back to favicon, then to first letter of domain */}
            <div className="w-full aspect-[16/9] bg-[#111] mb-4 overflow-hidden">
              {bookmark.og_image ? (
                <img
                  src={bookmark.og_image}
                  alt={bookmark.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // If OG image fails to load, replace with a letter fallback
                    const parent = (e.target as HTMLImageElement).parentElement!
                    parent.innerHTML = `<div class="w-full h-full flex items-center justify-center"><span class="font-display text-[#1A1A1A] text-4xl">${getDomain(bookmark.url).charAt(0).toUpperCase()}</span></div>`
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {bookmark.favicon_url ? (
                    <img
                      src={bookmark.favicon_url}
                      alt=""
                      className="w-8 h-8 object-contain opacity-30"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    // Last fallback: first letter of the domain
                    <span className="font-display text-[#1A1A1A] text-4xl">
                      {getDomain(bookmark.url).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* ── Bookmark Title ── */}
            <h3 className="text-sm text-[#C5AE79] truncate mb-1.5">
              {bookmark.title}
            </h3>

            {/* ── Bookmark Link (domain only) ── */}
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#5A5A5A] hover:text-[#7A7055] truncate block mb-4 transition-colors duration-200"
            >
              {getDomain(bookmark.url)}
            </a>

            {/* ── Date + Delete Row ── */}
            <div className="flex items-center justify-between">
              {/* Creation date (gold, scales on hover) */}
              <span className="text-[10px] text-[#C5AE79] uppercase tracking-widest transition-transform duration-200 hover:scale-110 inline-block">
                {format(new Date(bookmark.created_at), 'MMM d')}
              </span>
              {/* Delete button — only visible on card hover, scales on its own hover */}
              <button
                onClick={() => handleDelete(bookmark.id)}
                className="text-[10px] text-[#C5AE79] uppercase tracking-widest transition-transform duration-200 hover:scale-110 border border-[#C5AE79] px-3 py-1 opacity-0 group-hover:opacity-100 "
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Infinite Scroll Sentinel + Load More Button ── */}
      {/* Hidden during search. The IntersectionObserver watches this div. */}
      {!debouncedQuery && hasMore && (
        <div ref={loadMoreRef} className="py-10 text-center">
          {loadingMore ? (
            <div className="inline-flex items-center gap-2 text-[#3A3A3A]">
              <div className="w-3 h-3 border border-[#3A3A3A] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Loading</span>
            </div>
          ) : (
            // Fallback button in case IntersectionObserver doesn't trigger
            <button
              onClick={loadMore}
              className="text-xs text-[#3A3A3A] hover:text-[#7A7055] transition-colors duration-200"
            >
              Load more &middot; {bookmarks.length}/{totalCount}
            </button>
          )}
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && bookmarks.length > pageSize && !debouncedQuery && (
        <p className="text-[10px] text-[#1A1A1A] text-center py-8">End of list</p>
      )}
    </div>
  )
}

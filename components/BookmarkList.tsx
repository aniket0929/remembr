'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'

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

interface BookmarkListProps {
  initialBookmarks: Bookmark[]
  userId: string
  totalCount: number
  pageSize: number
}

export default function BookmarkList({ initialBookmarks, userId, totalCount, pageSize }: BookmarkListProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialBookmarks.length < totalCount)
  const [currentPage, setCurrentPage] = useState(1)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const filteredBookmarks = useMemo(() => {
    if (!debouncedQuery.trim()) return bookmarks
    const q = debouncedQuery.toLowerCase()
    return bookmarks.filter((b) => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q))
  }, [bookmarks, debouncedQuery])

  // Load more
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
      setBookmarks((current) => {
        const ids = new Set(current.map((b) => b.id))
        return [...current, ...data.filter((b) => !ids.has(b.id))]
      })
      setCurrentPage(nextPage)
      if (data.length < pageSize) setHasMore(false)
    }
    setLoadingMore(false)
  }, [loadingMore, hasMore, currentPage, pageSize, supabase])

  // Intersection observer
  useEffect(() => {
    const el = loadMoreRef.current
    if (!el || !hasMore) return
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '200px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasMore, loadMore])

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('bookmarks-channel')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'bookmarks', filter: `user_id=eq.${userId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
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

  // Delete
  const handleDelete = useCallback(async (id: string) => {
    const prev = bookmarks
    setBookmarks((c) => c.filter((b) => b.id !== id))
    toast.success('Deleted')
    const { error } = await supabase.from('bookmarks').delete().eq('id', id)
    if (error) { setBookmarks(prev); toast.error('Failed to delete') }
  }, [bookmarks, supabase])

  // Drag & drop
  const handleDragStart = (id: string) => setDraggedId(id)
  const handleDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); if (id !== draggedId) setDragOverId(id) }
  const handleDragLeave = () => setDragOverId(null)
  const handleDragEnd = () => { setDraggedId(null); setDragOverId(null) }

  const handleDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) { handleDragEnd(); return }
    const prev = [...bookmarks]
    const di = bookmarks.findIndex((b) => b.id === draggedId)
    const ti = bookmarks.findIndex((b) => b.id === targetId)
    if (di === -1 || ti === -1) return
    const reordered = [...bookmarks]
    const [moved] = reordered.splice(di, 1)
    reordered.splice(ti, 0, moved)
    const updated = reordered.map((b, i) => ({ ...b, position: i }))
    setBookmarks(updated)
    handleDragEnd()
    const ups = updated.map((b) => ({ id: b.id, user_id: userId, title: b.title, url: b.url, favicon_url: b.favicon_url, og_image: b.og_image, og_description: b.og_description, position: b.position, created_at: b.created_at }))
    const { error } = await supabase.from('bookmarks').upsert(ups)
    if (error) { setBookmarks(prev); toast.error('Failed to reorder') }
  }

  const getDomain = (url: string) => {
    try { return new URL(url).hostname.replace('www.', '') } catch { return url }
  }

  // Empty state
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
      {/* Search */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-xs bg-transparent border-b border-[#1A1A1A] text-[#C5AE79] placeholder:text-[#2A2A2A] text-sm py-2 outline-none focus:border-[#333] transition-colors duration-200"
        />
      </div>

      {debouncedQuery && (
        <p className="text-[10px] text-[#3A3A3A] uppercase tracking-widest mb-6">
          {filteredBookmarks.length} result{filteredBookmarks.length !== 1 ? 's' : ''}
        </p>
      )}

      {filteredBookmarks.length === 0 && debouncedQuery && (
        <p className="text-xs text-[#3A3A3A] py-12 text-center">No results.</p>
      )}

      {/* 2-Column Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredBookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            draggable={!debouncedQuery}
            onDragStart={() => handleDragStart(bookmark.id)}
            onDragOver={(e) => handleDragOver(e, bookmark.id)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(bookmark.id)}
            onDragEnd={handleDragEnd}
            className={`group border border-[#1A1A1A] p-4 transition-all duration-200 ${
              draggedId === bookmark.id ? 'opacity-30 scale-[0.97]' : ''
            } ${
              dragOverId === bookmark.id ? 'border-[#C5AE79]' : 'hover:border-[#2A2A2A]'
            } ${!debouncedQuery ? 'cursor-grab active:cursor-grabbing' : ''}`}
          >
            {/* OG Image */}
            <div className="w-full aspect-[16/9] bg-[#111] mb-4 overflow-hidden">
              {bookmark.og_image ? (
                <img
                  src={bookmark.og_image}
                  alt={bookmark.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
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
                    <span className="font-display text-[#1A1A1A] text-4xl">
                      {getDomain(bookmark.url).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Title */}
            <h3 className="text-sm text-[#C5AE79] truncate mb-1.5">
              {bookmark.title}
            </h3>

            {/* Link */}
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#5A5A5A] hover:text-[#7A7055] truncate block mb-4 transition-colors duration-200"
            >
              {getDomain(bookmark.url)}
            </a>

            {/* Date + Delete */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#C5AE79] uppercase tracking-widest transition-transform duration-200 hover:scale-110 inline-block">
                {format(new Date(bookmark.created_at), 'MMM d')}
              </span>
              <button
                onClick={() => handleDelete(bookmark.id)}
                className="text-[10px] text-[#C5AE79] uppercase tracking-widest transition-transform duration-200 hover:scale-110 border border-[#C5AE79] px-3 py-1 opacity-0 group-hover:opacity-100"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Load more */}
      {!debouncedQuery && hasMore && (
        <div ref={loadMoreRef} className="py-10 text-center">
          {loadingMore ? (
            <div className="inline-flex items-center gap-2 text-[#3A3A3A]">
              <div className="w-3 h-3 border border-[#3A3A3A] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Loading</span>
            </div>
          ) : (
            <button
              onClick={loadMore}
              className="text-xs text-[#3A3A3A] hover:text-[#7A7055] transition-colors duration-200"
            >
              Load more &middot; {bookmarks.length}/{totalCount}
            </button>
          )}
        </div>
      )}

      {!hasMore && bookmarks.length > pageSize && !debouncedQuery && (
        <p className="text-[10px] text-[#1A1A1A] text-center py-8">End of list</p>
      )}
    </div>
  )
}

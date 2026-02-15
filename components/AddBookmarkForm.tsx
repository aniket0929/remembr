/**
 * AddBookmarkForm Component (components/AddBookmarkForm.tsx)
 *
 * A client-side form for adding bookmarks to the database.
 *
 * Features:
 * - Auto-fetches metadata (title, favicon, OG image, OG description) when a valid URL is pasted
 * - Calls the /api/fetch-metadata API route to extract Open Graph data from the target page
 * - Only overwrites the title if the user hasn't manually typed one (tracks via `autoFetched` flag)
 * - Shows a spinner while metadata is being fetched
 * - Displays the favicon next to the title input once fetched
 * - Shows a preview of the OG description below the inputs
 * - Inserts the bookmark into Supabase with all metadata fields
 * - Resets the form after successful submission
 *
 * Props:
 * - userId: The authenticated user's ID (used to associate bookmarks with the user)
 */

'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface AddBookmarkFormProps {
  userId: string
}

export default function AddBookmarkForm({ userId }: AddBookmarkFormProps) {
  // ── Form state ──
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)
  const [ogImage, setOgImage] = useState<string | null>(null)
  const [ogDescription, setOgDescription] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)      // True while inserting into DB
  const [fetching, setFetching] = useState(false)     // True while fetching metadata
  const [autoFetched, setAutoFetched] = useState(false) // Tracks if title was auto-filled

  // Memoize the Supabase client so it's not recreated on every render
  const supabase = useMemo(() => createClient(), [])

  /**
   * Handles URL input changes and auto-fetches metadata.
   * Only triggers the fetch if the URL starts with http:// or https:// and is valid.
   * Preserves user-typed titles — only overwrites if title was previously auto-fetched.
   */
  const handleUrlChange = async (newUrl: string) => {
    setUrl(newUrl)
    setAutoFetched(false)

    // Only fetch metadata for URLs with a protocol prefix
    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) return

    // Validate URL format
    try { new URL(newUrl) } catch { return }

    setFetching(true)
    try {
      const response = await fetch('/api/fetch-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl }),
      })

      if (response.ok) {
        const data = await response.json()
        // Only overwrite title if user hasn't manually typed one
        if (!title || autoFetched) {
          setTitle(data.title || '')
          setAutoFetched(true)
        }
        setFaviconUrl(data.favicon_url || null)
        setOgImage(data.og_image || null)
        setOgDescription(data.og_description || null)
      }
    } catch (err) {
      console.error('Failed to fetch metadata:', err)
    } finally {
      setFetching(false)
    }
  }

  /**
   * Handles form submission — inserts the bookmark into Supabase.
   * Includes all metadata fields (favicon, OG image, OG description).
   * Resets the form on success.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url || !title) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)

    // Insert and return the full row (including server-generated id, created_at, position)
    const { data: newBookmark, error } = await supabase.from('bookmarks').insert([
      {
        user_id: userId,
        url,
        title,
        favicon_url: faviconUrl,
        og_image: ogImage,
        og_description: ogDescription,
      },
    ]).select().single()

    setLoading(false)

    if (error) {
      console.error('Error adding bookmark:', error)
      toast.error('Failed to add bookmark')
    } else {
      toast.success('Bookmark added')

      // Dispatch a custom event so BookmarkList can immediately show the new bookmark
      // This works even if Supabase Realtime is not enabled in production
      if (newBookmark) {
        window.dispatchEvent(new CustomEvent('bookmark-added', { detail: newBookmark }))
      }

      // Reset all form fields
      setUrl('')
      setTitle('')
      setFaviconUrl(null)
      setOgImage(null)
      setOgDescription(null)
      setAutoFetched(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-b border-[#1A1A1A] pb-10">
      {/* ── Input Fields (2-column grid on desktop) ── */}
      <div className="grid md:grid-cols-2 gap-3 mb-4">
        {/* URL Input with loading spinner */}
        <div className="relative">
          <input
            type="url"
            placeholder="Paste a URL"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            disabled={loading}
            className="w-full bg-[#111] border border-[#1A1A1A] text-[#C5AE79] placeholder:text-[#333] text-sm px-4 py-3 outline-none focus:border-[#333] transition-colors duration-200 disabled:opacity-40"
          />
          {/* Spinner shown while metadata is being fetched */}
          {fetching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-3 h-3 border border-[#C5AE79] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Title Input with favicon preview */}
        <div className="flex items-center gap-2">
          {/* Show fetched favicon next to title input */}
          {faviconUrl && (
            <img
              src={faviconUrl}
              alt=""
              className="w-4 h-4 object-contain flex-shrink-0 opacity-50"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
          <input
            type="text"
            placeholder={fetching ? 'Fetching...' : 'Title'}
            value={title}
            onChange={(e) => { setTitle(e.target.value); setAutoFetched(false) }}
            disabled={loading}
            className="flex-1 bg-[#111] border border-[#1A1A1A] text-[#C5AE79] placeholder:text-[#333] text-sm px-4 py-3 outline-none focus:border-[#333] transition-colors duration-200 disabled:opacity-40"
          />
        </div>
      </div>

      {/* ── OG Description Preview (shown after metadata is auto-fetched) ── */}
      {autoFetched && ogDescription && (
        <p className="text-xs text-[#5A5A5A] mb-4 line-clamp-1">{ogDescription}</p>
      )}

      {/* ── Submit Button ── */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading || fetching}
          className="text-xs font-medium tracking-wide uppercase text-[#0A0A0A] bg-[#C5AE79] px-6 py-2.5 hover:bg-[#B89D68] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {loading ? 'Adding...' : 'Add'}
        </button>

        {/* Label indicating the title was auto-filled from metadata */}
        {autoFetched && (
          <span className="text-[10px] text-[#3A3A3A] uppercase tracking-widest">Auto-fetched</span>
        )}
      </div>
    </form>
  )
}

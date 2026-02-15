'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface AddBookmarkFormProps {
  userId: string
}

export default function AddBookmarkForm({ userId }: AddBookmarkFormProps) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)
  const [ogImage, setOgImage] = useState<string | null>(null)
  const [ogDescription, setOgDescription] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [autoFetched, setAutoFetched] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const handleUrlChange = async (newUrl: string) => {
    setUrl(newUrl)
    setAutoFetched(false)

    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) return

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url || !title) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)

    const { error } = await supabase.from('bookmarks').insert([
      {
        user_id: userId,
        url,
        title,
        favicon_url: faviconUrl,
        og_image: ogImage,
        og_description: ogDescription,
      },
    ])

    setLoading(false)

    if (error) {
      console.error('Error adding bookmark:', error)
      toast.error('Failed to add bookmark')
    } else {
      toast.success('Bookmark added')
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
      <div className="grid md:grid-cols-2 gap-3 mb-4">
        {/* URL */}
        <div className="relative">
          <input
            type="url"
            placeholder="Paste a URL"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            disabled={loading}
            className="w-full bg-[#111] border border-[#1A1A1A] text-[#C5AE79] placeholder:text-[#333] text-sm px-4 py-3 outline-none focus:border-[#333] transition-colors duration-200 disabled:opacity-40"
          />
          {fetching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-3 h-3 border border-[#C5AE79] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Title */}
        <div className="flex items-center gap-2">
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

      {/* Preview */}
      {autoFetched && ogDescription && (
        <p className="text-xs text-[#5A5A5A] mb-4 line-clamp-1">{ogDescription}</p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading || fetching}
          className="text-xs font-medium tracking-wide uppercase text-[#0A0A0A] bg-[#C5AE79] px-6 py-2.5 hover:bg-[#B89D68] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {loading ? 'Adding...' : 'Add'}
        </button>

        {autoFetched && (
          <span className="text-[10px] text-[#3A3A3A] uppercase tracking-widest">Auto-fetched</span>
        )}
      </div>
    </form>
  )
}

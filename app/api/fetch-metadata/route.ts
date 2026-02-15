/**
 * Metadata Fetcher API Route (app/api/fetch-metadata/route.ts)
 *
 * Server-side API endpoint that fetches a web page and extracts metadata for bookmark previews.
 *
 * Extraction pipeline (with fallbacks):
 * - Title:       og:title → <title> tag → hostname
 * - Description: og:description → meta[name="description"] → null
 * - Image:       og:image → twitter:image → null
 * - Favicon:     <link rel="icon"> → <link rel="apple-touch-icon"> → Google Favicons API
 *
 * Features:
 * - 5-second timeout to prevent hanging on slow sites
 * - Handles relative URLs (converts to absolute using the page origin)
 * - Handles reversed attribute order in meta tags (content before property)
 * - Decodes HTML entities in extracted text
 * - Truncates descriptions to 200 characters
 * - Spoofs a Chrome User-Agent to avoid bot-blocking
 *
 * Called by: AddBookmarkForm when a user pastes a URL
 */

import { NextResponse } from 'next/server'

// Helper to extract meta tag content by property or name
function extractMeta(html: string, property: string): string | null {
    // Try property="og:xxx" format
    const propMatch = html.match(
        new RegExp(
            `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`,
            'i'
        )
    )
    if (propMatch?.[1]) return propMatch[1]

    // Try content before property (reverse attribute order)
    const propMatch2 = html.match(
        new RegExp(
            `<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`,
            'i'
        )
    )
    if (propMatch2?.[1]) return propMatch2[1]

    // Try name="xxx" format (for description, etc.)
    const nameMatch = html.match(
        new RegExp(
            `<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`,
            'i'
        )
    )
    if (nameMatch?.[1]) return nameMatch[1]

    // Try content before name
    const nameMatch2 = html.match(
        new RegExp(
            `<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${property}["']`,
            'i'
        )
    )
    if (nameMatch2?.[1]) return nameMatch2[1]

    return null
}

// Decode common HTML entities
function decodeEntities(text: string): string {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
}

export async function POST(request: Request) {
    try {
        const { url } = await request.json()

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 })
        }

        // Validate URL
        let validUrl: URL
        try {
            validUrl = new URL(url)
        } catch {
            return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
        }

        // Fetch the page HTML with a timeout
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)

        let html = ''
        try {
            const response = await fetch(validUrl.toString(), {
                signal: controller.signal,
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
            })
            html = await response.text()
        } catch {
            // If fetching the page fails, return fallback data
            return NextResponse.json({
                title: validUrl.hostname,
                favicon_url: `https://www.google.com/s2/favicons?domain=${validUrl.hostname}&sz=64`,
                og_image: null,
                og_description: null,
            })
        } finally {
            clearTimeout(timeout)
        }

        // Extract title: prefer og:title, fall back to <title> tag
        let title = validUrl.hostname
        const ogTitle = extractMeta(html, 'og:title')
        if (ogTitle) {
            title = decodeEntities(ogTitle.trim())
        } else {
            const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
            if (titleMatch?.[1]) {
                title = decodeEntities(titleMatch[1].trim())
            }
        }

        // Extract OG description, fall back to meta description
        let og_description: string | null = null
        const ogDesc = extractMeta(html, 'og:description')
        if (ogDesc) {
            og_description = decodeEntities(ogDesc.trim())
        } else {
            const metaDesc = extractMeta(html, 'description')
            if (metaDesc) {
                og_description = decodeEntities(metaDesc.trim())
            }
        }
        // Truncate to 200 characters
        if (og_description && og_description.length > 200) {
            og_description = og_description.slice(0, 197) + '...'
        }

        // Extract OG image
        let og_image: string | null = null
        const ogImg = extractMeta(html, 'og:image')
        if (ogImg) {
            try {
                // Handle relative URLs
                og_image = new URL(ogImg, validUrl.origin).toString()
            } catch {
                og_image = ogImg
            }
        } else {
            // Try twitter:image as fallback
            const twitterImg = extractMeta(html, 'twitter:image')
            if (twitterImg) {
                try {
                    og_image = new URL(twitterImg, validUrl.origin).toString()
                } catch {
                    og_image = twitterImg
                }
            }
        }

        // Extract favicon
        let favicon_url = `https://www.google.com/s2/favicons?domain=${validUrl.hostname}&sz=64`
        const faviconMatch = html.match(
            /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["'][^>]*>/i
        )
        const faviconMatch2 = html.match(
            /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["'][^>]*>/i
        )
        // Also try apple-touch-icon for higher quality
        const appleTouchMatch = html.match(
            /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["'][^>]*>/i
        )

        const rawFavicon = faviconMatch?.[1] || faviconMatch2?.[1] || appleTouchMatch?.[1]
        if (rawFavicon) {
            try {
                favicon_url = new URL(rawFavicon, validUrl.origin).toString()
            } catch {
                // Keep Google fallback
            }
        }

        return NextResponse.json({
            title,
            favicon_url,
            og_image,
            og_description,
        })
    } catch {
        return NextResponse.json(
            { error: 'Failed to fetch metadata' },
            { status: 500 }
        )
    }
}

# Remembr-Smart Bookmark App 

A modern, real-time bookmark manager built with Next.js, Supabase, and Tailwind CSS. Save, organize, and access your favorite links from anywhere with automatic synchronization across all your devices.



##  Features

-  **Google OAuth Authentication** - Secure sign-in with Google (no password needed)
-  **Private Bookmarks** - Each user's bookmarks are completely private
-  **Real-time Synchronization** - Changes appear instantly across all open tabs
-  **CRUD Operations** - Add, view, and delete bookmarks seamlessly
-  **Responsive Design** - Works perfectly on desktop, tablet, and mobile
-  **Beautiful UI** - Modern interface built with shadcn/ui components

##  Live Demo

**Deployed URL:** [https://remembr-rho.vercel.app](https://remembr-rho.vercel.app)

**Test Credentials:** Sign in with any Google account

##  Table of Contents

- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Flow Diagram](#-flow-diagram)
- [Routes](#-routes)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [Problems & Solutions](#-problems--solutions)
- [Future Enhancements](#-future-enhancements)
- [Contributing](#-contributing)
- [License](#-license)

## 🛠 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library built on Radix UI
- **React Hooks** - State management (useState, useEffect)

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL Database
  - Authentication (Google OAuth)
  - Real-time subscriptions
  - Row Level Security (RLS)

### Deployment
- **Vercel** - Hosting and deployment platform

### Development Tools
- **ESLint** - Code linting
- **Git** - Version control
- **npm** - Package management

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │  Landing   │  │   Login    │  │     Dashboard        │  │
│  │   Page     │  │   Page     │  │  (Protected Route)   │  │
│  └────────────┘  └────────────┘  └──────────────────────┘  │
│         │              │                    │                │
│         └──────────────┴────────────────────┘                │
│                        │                                      │
└────────────────────────┼──────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │         Next.js Middleware          │
        │    (Session Refresh & Auth)         │
        └────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │      Supabase Client (SSR)          │
        │  ┌──────────┐    ┌──────────────┐  │
        │  │  Server  │    │   Browser    │  │
        │  │  Client  │    │   Client     │  │
        │  └──────────┘    └──────────────┘  │
        └────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │          Supabase Cloud             │
        │  ┌──────────────────────────────┐  │
        │  │    PostgreSQL Database       │  │
        │  │  ┌────────────────────────┐  │  │
        │  │  │  bookmarks table       │  │  │
        │  │  │  - id (uuid)           │  │  │
        │  │  │  - user_id (uuid)      │  │  │
        │  │  │  - title (text)        │  │  │
        │  │  │  - url (text)          │  │  │
        │  │  │  - created_at          │  │  │
        │  │  └────────────────────────┘  │  │
        │  └──────────────────────────────┘  │
        │  ┌──────────────────────────────┐  │
        │  │    Authentication (Auth)     │  │
        │  │    - Google OAuth 2.0        │  │
        │  │    - Session Management      │  │
        │  └──────────────────────────────┘  │
        │  ┌──────────────────────────────┐  │
        │  │    Realtime (WebSocket)      │  │
        │  │    - Live updates            │  │
        │  │    - Multi-tab sync          │  │
        │  └──────────────────────────────┘  │
        └────────────────────────────────────┘
```

### Key Architecture Decisions

1. **Server-Side Rendering (SSR)** - Initial bookmark data is fetched on the server for better performance
2. **Real-time Subscriptions** - WebSocket connection for instant updates across tabs
3. **Row Level Security** - Database-level security ensures users only see their own data
4. **Middleware Authentication** - Automatic session refresh on every request
5. **Component Separation** - Clean separation between server and client components

##  Flow Diagram

### User Authentication Flow

```
┌─────────┐
│  User   │
│ visits  │
│   /     │
└────┬────┘
     │
     ▼
┌─────────────┐      No      ┌──────────────┐
│  Logged in? ├─────────────►│ Show Landing │
└──────┬──────┘               │     Page     │
       │                      └──────┬───────┘
       │ Yes                         │
       │                      User clicks
       │                     "Sign In with Google"
       │                             │
       │                             ▼
       │                    ┌─────────────────┐
       │                    │  /login page    │
       │                    └────────┬────────┘
       │                             │
       │                      User clicks
       │                    "Sign in with Google"
       │                             │
       │                             ▼
       │                    ┌─────────────────┐
       │                    │ POST /auth/     │
       │                    │    google       │
       │                    └────────┬────────┘
       │                             │
       │                    Redirect to Google
       │                             │
       │                             ▼
       │                    ┌─────────────────┐
       │                    │  Google OAuth   │
       │                    │  Consent Screen │
       │                    └────────┬────────┘
       │                             │
       │                      User approves
       │                             │
       │                             ▼
       │                    ┌─────────────────┐
       │                    │ GET /auth/      │
       │                    │   callback      │
       │                    └────────┬────────┘
       │                             │
       │                    Exchange code for
       │                         session
       │                             │
       └─────────────────────────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │   Redirect to   │
                            │   /dashboard    │
                            └─────────────────┘
```

### Bookmark CRUD Flow

```
┌──────────────────────────────────────────────────────────┐
│                      Dashboard Page                       │
└───────────────────────────┬──────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
     ┌─────────────────┐     ┌─────────────────┐
     │  Add Bookmark   │     │  View Bookmarks │
     │      Form       │     │      List       │
     └────────┬────────┘     └────────┬────────┘
              │                       │
       User fills form          Initial fetch
       and submits              from server
              │                       │
              ▼                       ▼
     ┌─────────────────┐     ┌─────────────────┐
     │  INSERT INTO    │     │  SELECT * FROM  │
     │   bookmarks     │     │   bookmarks     │
     └────────┬────────┘     └────────┬────────┘
              │                       │
              │                       ▼
              │              ┌─────────────────┐
              │              │  useEffect()    │
              │              │  Subscribe to   │
              │              │  Realtime       │
              │              └────────┬────────┘
              │                       │
              └───────────┬───────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │  Supabase Realtime   │
              │  WebSocket Channel   │
              └───────────┬──────────┘
                          │
                Event: INSERT/DELETE
                          │
                          ▼
              ┌──────────────────────┐
              │  Update Local State  │
              │  setBookmarks()      │
              └───────────┬──────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │   Re-render UI       │
              │ (All tabs update)    │
              └──────────────────────┘
```

### Delete Bookmark Flow

```
User clicks "Delete" button
          │
          ▼
┌──────────────────────┐
│  handleDelete(id)    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  DELETE FROM         │
│  bookmarks           │
│  WHERE id = ?        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Realtime event      │
│  broadcasts DELETE   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  All subscribed tabs │
│  receive event       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Update local state  │
│  Remove bookmark     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  UI updates in       │
│  all tabs            │
└──────────────────────┘
```

## 🛣 Routes

### Public Routes

| Route | Description | Page Type |
|-------|-------------|-----------|
| `/` | Landing page with app information | Server Component |
| `/login` | Login page with Google OAuth button | Server Component |

### Protected Routes

| Route | Description | Page Type |
|-------|-------------|-----------|
| `/dashboard` | Main bookmark manager interface | Server Component |

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/auth/google` | POST | Initiates Google OAuth flow |
| `/auth/callback` | GET | Handles OAuth callback from Google |
| `/auth/signout` | POST | Signs out the user |

### Middleware

- **`middleware.ts`** - Runs on every request to refresh authentication tokens

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Google account (for OAuth setup)
- A Supabase account (free tier works)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/bookmark-app.git
cd bookmark-app
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up Supabase**

- Go to [supabase.com](https://supabase.com)
- Create a new project
- Wait for the database to initialize (~2 minutes)
- Go to SQL Editor and run the following:

```sql
-- Create bookmarks table
create table bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  url text not null,
  favicon_url text,
  position integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table bookmarks enable row level security;

-- Create policy: Users can only see their own bookmarks
create policy "Users can view their own bookmarks"
  on bookmarks for select
  using (auth.uid() = user_id);

-- Create policy: Users can insert their own bookmarks
create policy "Users can insert their own bookmarks"
  on bookmarks for insert
  with check (auth.uid() = user_id);

-- Create policy: Users can update their own bookmarks
create policy "Users can update their own bookmarks"
  on bookmarks for update
  using (auth.uid() = user_id);

-- Create policy: Users can delete their own bookmarks
create policy "Users can delete their own bookmarks"
  on bookmarks for delete
  using (auth.uid() = user_id);

-- Enable realtime
alter publication supabase_realtime add table bookmarks;
```

> **If you already have the table**, run this migration instead:
> ```sql
> ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS favicon_url text;
> ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS position integer DEFAULT 0;
> CREATE POLICY "Users can update their own bookmarks"
>   ON bookmarks FOR UPDATE USING (auth.uid() = user_id);
> ```

4. **Set up Google OAuth**

- Go to [Google Cloud Console](https://console.cloud.google.com)
- Create a new project
- Enable the Google+ API
- Go to Credentials → Create OAuth 2.0 Client ID
- Add authorized redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`
- Copy Client ID and Client Secret
- In Supabase: Authentication → Providers → Google → Enable and paste credentials

5. **Configure environment variables**

Create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

6. **Run the development server**

```bash
npm run dev
```

7. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

##  Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | `eyJhbGc...` |
| `NEXT_PUBLIC_APP_URL` | Your app URL (for OAuth redirects) | `http://localhost:3000` (dev) or `https://your-app.vercel.app` (prod) |

## 🗄 Database Schema

### `bookmarks` Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique bookmark identifier |
| `user_id` | uuid | FOREIGN KEY → auth.users(id), NOT NULL | References the user who owns this bookmark |
| `title` | text | NOT NULL | Bookmark title/name |
| `url` | text | NOT NULL | Bookmark URL |
| `favicon_url` | text | NULLABLE | URL of the website's favicon (auto-fetched) |
| `position` | integer | DEFAULT 0 | Sort order for drag-and-drop reordering |
| `created_at` | timestamp | DEFAULT now(), NOT NULL | Timestamp when bookmark was created |

### Row Level Security (RLS) Policies

1. **SELECT Policy**: Users can only view their own bookmarks
   ```sql
   using (auth.uid() = user_id)
   ```

2. **INSERT Policy**: Users can only insert bookmarks with their own user_id
   ```sql
   with check (auth.uid() = user_id)
   ```

3. **UPDATE Policy**: Users can only update their own bookmarks
   ```sql
   using (auth.uid() = user_id)
   ```

4. **DELETE Policy**: Users can only delete their own bookmarks
   ```sql
   using (auth.uid() = user_id)
   ```

##  Problems & Solutions

### Problem 1: Real-time Updates Not Working Across Tabs

**Issue:** When adding a bookmark in one tab, it wasn't appearing in other open tabs.

**Root Cause:** 
- Forgot to enable real-time publication for the `bookmarks` table
- The Supabase real-time subscription wasn't filtering by user_id

**Solution:**
```sql
-- Enable realtime for the bookmarks table
alter publication supabase_realtime add table bookmarks;
```

```typescript
// Add user_id filter to subscription
const channel = supabase
  .channel('bookmarks-channel')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'bookmarks',
      filter: `user_id=eq.${userId}`, // This was missing!
    },
    (payload) => {
      // Handle updates
    }
  )
  .subscribe()
```

**Learning:** Always enable real-time publication at the database level AND filter subscriptions by user to avoid receiving other users' updates.

---

### Problem 2: Google OAuth Redirect Loop

**Issue:** After clicking "Sign in with Google", the app would redirect back to the login page instead of the dashboard.

**Root Cause:** 
- The OAuth callback URL in Google Cloud Console didn't match the Supabase callback URL
- Missing `NEXT_PUBLIC_APP_URL` environment variable

**Solution:**
1. Verified the callback URL in Supabase (Settings → API → Auth → Redirect URLs)
2. Added the exact same URL to Google Cloud Console authorized redirect URIs
3. Added `NEXT_PUBLIC_APP_URL` to `.env.local`
4. Updated the OAuth configuration:

```typescript
const { data } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  },
})
```

**Learning:** OAuth redirect URIs must match EXACTLY (including trailing slashes) between the OAuth provider and your application.

---

### Problem 3: "Cannot read properties of undefined (reading 'getAll')" Error

**Issue:** Getting errors in middleware about cookies being undefined.

**Root Cause:**
- Using the old Supabase client initialization method
- Not properly handling cookies in Next.js 15's async cookie API

**Solution:**
Updated to use `@supabase/ssr` with proper async handling:

```typescript
// Before (incorrect)
const cookieStore = cookies()

// After (correct)
const cookieStore = await cookies()
```

**Learning:** Next.js 15 changed the cookies API to be async. Always `await` when calling `cookies()`.

---

### Problem 4: Users Could See Each Other's Bookmarks

**Issue:** During testing, realized that users could potentially query all bookmarks if RLS wasn't properly configured.

**Root Cause:**
- Initially forgot to enable Row Level Security
- Policies weren't restrictive enough

**Solution:**
```sql
-- Enable RLS (this is critical!)
alter table bookmarks enable row level security;

-- Create strict policies
create policy "Users can only view their own bookmarks"
  on bookmarks for select
  using (auth.uid() = user_id);
```

Also verified by testing:
1. Signed in with User A
2. Created bookmarks
3. Signed out and signed in with User B
4. Verified User B couldn't see User A's bookmarks

**Learning:** ALWAYS enable Row Level Security on tables containing user data. Test with multiple accounts to verify privacy.

---


### Problem 5: TypeScript Errors with Supabase Types

**Issue:** TypeScript complaining about types not matching for database queries.

**Root Cause:**
- Not using proper TypeScript types for database schema
- Supabase client wasn't properly typed

**Solution:**
While we used inline types for this project, the proper solution is:

```bash
# Generate types from your database
npx supabase gen types typescript --project-id your-project-ref > types/supabase.ts
```

Then use them:
```typescript
import { Database } from '@/types/supabase'

const supabase = createClient<Database>()
```

**Learning:** For production apps, always generate and use TypeScript types from your Supabase schema.

---

### Problem 6: Bookmarks Not Deleting Properly

**Issue:** Delete button not working, no error messages.

**Root Cause:**
- Forgot to add DELETE policy in Row Level Security
- Initially only had SELECT and INSERT policies

**Solution:**
```sql
create policy "Users can delete their own bookmarks"
  on bookmarks for delete
  using (auth.uid() = user_id);
```

**Learning:** Remember to create RLS policies for ALL operations (SELECT, INSERT, UPDATE, DELETE) that your app needs.

---

### Problem 7: Memory Leak Warning in Console

**Issue:** React warning about memory leaks when navigating away from dashboard.

**Root Cause:**
- Not cleaning up Supabase real-time subscription when component unmounts

**Solution:**
```typescript
useEffect(() => {
  const channel = supabase.channel('bookmarks-channel')
    .on(/* ... */)
    .subscribe()

  // Cleanup function
  return () => {
    supabase.removeChannel(channel)
  }
}, [userId, supabase])
```

**Learning:** Always clean up subscriptions, timers, and event listeners in the useEffect cleanup function.

---

### Problem 8: Realtime Subscription Continuously Reconnecting

**Issue:** The Supabase realtime channel was being torn down and re-created on every component render, causing unnecessary WebSocket reconnections and potential performance issues.

**Root Cause:**
- `createClient()` was called directly inside the component body, returning a new Supabase client reference on every render
- Since `supabase` was listed in the `useEffect` dependency array, React detected a "new" dependency each render and re-ran the effect — unsubscribing and re-subscribing the realtime channel every time

**Solution:**
Wrapped the `createClient()` call in `useMemo` to memoize the Supabase client instance, ensuring a stable reference across renders:

```typescript
// Before (incorrect) — new reference every render
const supabase = createClient()

// After (correct) — stable reference across renders
const supabase = useMemo(() => createClient(), [])
```

This ensures the `useEffect` that subscribes to Supabase Realtime only runs when `userId` actually changes, not on every render.

**Learning:** When using external client instances (like Supabase, Firebase, etc.) inside `useEffect` dependency arrays, always memoize them with `useMemo` to prevent unnecessary effect re-runs. An unstable reference in the dependency array defeats the purpose of the cleanup/setup lifecycle.

##  Deployment to Vercel

### Steps:

1. **Push code to GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/bookmark-app.git
git push -u origin main
```

2. **Deploy to Vercel**

- Go to [vercel.com](https://vercel.com)
- Click "Import Project"
- Select your GitHub repository
- Configure project:
  - Framework Preset: Next.js
  - Root Directory: ./
  - Build Command: `npm run build`
  - Output Directory: `.next`

3. **Add Environment Variables**

In Vercel project settings, add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` (use your Vercel URL)

4. **Update Google OAuth**

Add your Vercel URL to authorized redirect URIs:
```
https://your-app.vercel.app/auth/callback
```

5. **Deploy!**

Click "Deploy" and wait for build to complete.

## ✨ Additional Features Implemented

Beyond the core requirements, the following advanced features were implemented to demonstrate production-level engineering:

### 1. Auto-Fetch Page Title & Favicon from URL

When a user pastes a URL into the bookmark form, the app automatically fetches the page's `<title>` tag and favicon using a custom Next.js API route (`/api/fetch-metadata`).

**How it works:**
- A server-side API route fetches the target URL's HTML
- Parses the `<title>` tag and `<link rel="icon">` using regex
- Falls back to Google's favicon service (`google.com/s2/favicons`) if no icon found
- 5-second timeout prevents hanging on slow sites
- User can override the auto-fetched title by typing manually

**Skills demonstrated:** Server-side API routes, HTML parsing, error handling, graceful fallbacks, UX polish.

### 2. Search & Filter with Debouncing

A search bar that filters bookmarks in real-time as the user types, with a 300ms debounce to avoid excessive re-renders.

**How it works:**
- `searchQuery` state updates on every keystroke
- `useEffect` with a 300ms `setTimeout` sets `debouncedQuery`
- `useMemo` filters bookmarks by title OR URL matching the debounced query
- Shows result count (e.g., "3 results for 'react'")
- Drag-and-drop is disabled during search to avoid confusion

**Skills demonstrated:** Debouncing, `useMemo` for performance, responsive filtering UX.

### 3. Drag-and-Drop Reordering

Users can drag bookmarks to reorder them. The new order persists to the database.

**How it works:**
- Native HTML5 Drag and Drop API (no external library needed)
- Visual feedback: dragged card becomes semi-transparent, drop target gets a blue border
- Grip handle icon on each card indicates draggability
- Optimistic reorder: UI updates immediately, rolls back on DB error
- Position stored as an integer column, updated via `upsert`

**Skills demonstrated:** HTML5 drag-and-drop, optimistic updates, array manipulation, database persistence.

### 4. Optimistic Updates with Rollback

All mutations (add, delete, reorder) update the UI instantly before the server confirms, with automatic rollback on failure.

**How it works:**
- **Delete:** Removes the bookmark from state immediately → fires async delete → restores on error
- **Add:** Realtime subscription picks up the INSERT event and deduplicates against optimistic entries
- **Reorder:** Reorders the array in state immediately → fires async upsert → restores original order on error
- Toast notifications inform the user of success or rollback

**Skills demonstrated:** Production-grade UX patterns, state snapshots for rollback, error recovery.

### 5. Bookmark Link Preview Cards (OG Image)

Each bookmark displays a rich preview card with an Open Graph image thumbnail, page description, and favicon — similar to how Slack, Discord, and Twitter preview links.

**How it works:**
- The `/api/fetch-metadata` API route extracts `og:image`, `og:description`, `og:title`, and `twitter:image` meta tags from the target page
- Falls back to `<meta name="description">` if no OG description is found
- OG images display as a thumbnail on the right side of each bookmark card
- Descriptions are shown below the URL, truncated to 2 lines with `line-clamp-2`
- Images that fail to load are gracefully hidden via `onError` handlers
- All OG metadata is persisted in the database (`og_image`, `og_description` columns)

**Skills demonstrated:** HTML meta tag parsing, Open Graph protocol understanding, responsive image layouts, graceful degradation, rich UI design.

### 6. Infinite Scroll Pagination

Instead of loading all bookmarks at once (which would slow down the app as the collection grows), the app uses hybrid server/client pagination with infinite scroll.

**How it works:**
- **Server-side:** The dashboard page fetches only the first 20 bookmarks + an exact total count using Supabase's `.select('*', { count: 'exact' }).range(0, 19)`
- **Client-side:** An `IntersectionObserver` watches a sentinel element at the bottom of the list. When it enters the viewport (with 200px margin), it triggers the next page fetch
- **Deduplication:** New bookmarks added via realtime are deduplicated against paginated results using a `Set` lookup
- **Fallback:** A "Load More" button shows progress (e.g., "12 of 54") in case the observer doesn't trigger
- **End indicator:** When all bookmarks are loaded, a subtle "You've seen all X bookmarks" message appears
- Pagination is hidden during search (filtering happens on all loaded bookmarks)

**Skills demonstrated:** Server-side pagination with Supabase `.range()`, `IntersectionObserver` API, hybrid SSR + client architecture, progressive loading UX.

---

##  Future Enhancements

### Planned Features

- [x] **Search & Filter** - Search bookmarks by title or URL 
- [x] **Bookmark Preview** - Show website favicons 
- [ ] **Categories/Tags** - Organize bookmarks with custom tags
- [ ] **Folders** - Group bookmarks into folders
- [ ] **Bulk Actions** - Select and delete multiple bookmarks
- [ ] **Import/Export** - Import from browser, export as JSON/CSV
- [ ] **Chrome Extension** - Quick bookmark saving from browser
- [ ] **Sharing** - Share bookmark collections with others
- [ ] **Dark Mode** - Toggle between light and dark themes
- [ ] **Analytics** - Track most visited bookmarks

### Technical Improvements

- [x] Optimistic updates with rollback 
- [x] Auto-fetch page title and favicon 
- [x] Drag-and-drop reordering 
- [x] Debounced search 
- [ ] Add unit tests (Jest + React Testing Library)
- [ ] Add E2E tests (Playwright)
- [ ] Implement caching for better performance
- [ ] Add skeleton loaders for better UX
- [x] Infinite scroll pagination 
- [ ] Implement offline support with service workers
- [ ] Add rate limiting for API calls
- [ ] Set up monitoring and error tracking (Sentry)



### Guidelines:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



##  Acknowledgments

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vercel](https://vercel.com/)




Made with love using Next.js and Supabase
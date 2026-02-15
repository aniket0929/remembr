/**
 * Root Layout (app/layout.tsx)
 *
 * This is the top-level layout that wraps every page in the app.
 * It provides:
 * - Global CSS imports (Tailwind, custom styles, fonts)
 * - SEO metadata (title, description)
 * - Font variables for Geist Sans/Mono (used as CSS custom properties)
 * - The Sonner Toaster component for toast notifications (styled to match the dark theme)
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

// Load Geist fonts and expose them as CSS variables
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// SEO metadata — used by Next.js to generate <title> and <meta> tags
export const metadata: Metadata = {
  title: "Remembr - Smart Bookmark App",
  description: "Save, organize, and access your favorite links from anywhere. Real-time sync with Google sign-in.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* Toast notifications — styled to match the dark gold theme */}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: '#111',
              border: '1px solid #1A1A1A',
              color: '#C5AE79',
              borderRadius: '0',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
            },
          }}
        />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/sonner" 
import { TooltipProvider } from "@/components/ui/tooltip"

const inter = Inter({ subsets: ["latin"] })

// Konfigurasi Viewport untuk PWA Mobile
export const viewport: Viewport = {
  themeColor: "#163832",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// Konfigurasi Metadata & Manifest PWA
export const metadata: Metadata = {
  title: "Glorya Motor POS",
  description: "Sistem Kasir dan Manajemen Bengkel Glorya Motor",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Glorya POS",
  },
};

// Struktur Layout Utama
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <Providers>
          <TooltipProvider>
            {children}
            <Toaster position="top-center" richColors />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  )
}
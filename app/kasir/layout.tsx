"use client"

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BukaKasirDialog } from '@/components/kasir/BukaKasirDialog'
import { logoutAction } from '@/app/(auth)/login/actions'
import { 
  LayoutDashboard, 
  FileText, 
  Wrench, 
  ShoppingBag, 
  PackageSearch, 
  Users, 
  LogOut 
} from 'lucide-react'

export default function KasirLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  // HELPER ACTIVE STATE
  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`)

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Glorya Motor</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Panel Kasir</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {/* MENU DASHBOARD */}
          <Link 
            href="/kasir/dashboard" 
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              isActive('/kasir/dashboard') 
                ? 'bg-slate-100 text-slate-900 shadow-sm' 
                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 ${isActive('/kasir/dashboard') ? 'text-slate-700' : 'text-slate-400'}`} />
            Dashboard
          </Link>
          
          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Transaksi
            </p>
          </div>
          
          {/* MENU TRANSAKSI */}
          <Link 
            href="/kasir/tiket/buat" 
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              isActive('/kasir/tiket/buat') 
                ? 'bg-slate-100 text-slate-900 shadow-sm' 
                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Wrench className={`w-5 h-5 ${isActive('/kasir/tiket/buat') ? 'text-slate-700' : 'text-slate-400'}`} />
            Buat Tiket Servis
          </Link>

          <Link 
            href="/kasir/takeaway" 
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              isActive('/kasir/takeaway') 
                ? 'bg-slate-100 text-slate-900 shadow-sm' 
                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className={`w-5 h-5 ${isActive('/kasir/takeaway') ? 'text-slate-700' : 'text-slate-400'}`} />
            Takeaway POS
          </Link>

          <Link 
            href="/kasir/tiket/aktif" 
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              isActive('/kasir/tiket/aktif') 
                ? 'bg-slate-100 text-slate-900 shadow-sm' 
                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <FileText className={`w-5 h-5 ${isActive('/kasir/tiket/aktif') ? 'text-slate-700' : 'text-slate-400'}`} />
            Antrean Aktif
          </Link>

          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Manajemen Data
            </p>
          </div>

          {/* MENU MANAJEMEN DATA */}
          <Link 
            href="/kasir/stok" 
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              isActive('/kasir/stok') 
                ? 'bg-slate-100 text-slate-900 shadow-sm' 
                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <PackageSearch className={`w-5 h-5 ${isActive('/kasir/stok') ? 'text-slate-700' : 'text-slate-400'}`} />
            Stok & Barang
          </Link>

          <Link 
            href="/kasir/customers" 
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              isActive('/kasir/customers') 
                ? 'bg-slate-100 text-slate-900 shadow-sm' 
                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Users className={`w-5 h-5 ${isActive('/kasir/customers') ? 'text-slate-700' : 'text-slate-400'}`} />
            Data Customer
          </Link>
        </nav>

        {/* BOTTOM SECTION */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <form action={logoutAction}>
            <button 
              type="submit" 
              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Keluar Sistem
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col relative overflow-y-auto w-full">
        <div className="p-8 w-full max-w-7xl mx-auto flex-1">
          {children}
        </div>
      </main>
      
      <BukaKasirDialog />
    </div>
  )
}
import { ReactNode } from 'react'
import Link from 'next/link'
import { BukaKasirDialog } from '@/components/kasir/BukaKasirDialog'
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
  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Glorya Motor</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Panel Kasir</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link 
            href="/kasir/dashboard" 
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <LayoutDashboard className="w-5 h-5 text-slate-500" />
            Dashboard
          </Link>
          
          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Transaksi
            </p>
          </div>
          
          <Link 
            href="/kasir/tiket/buat" 
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Wrench className="w-5 h-5 text-slate-500" />
            Buat Tiket Servis
          </Link>
          <Link 
            href="/kasir/takeaway" 
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ShoppingBag className="w-5 h-5 text-slate-500" />
            Takeaway POS
          </Link>
          <Link 
            href="/kasir/tiket/aktif" 
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <FileText className="w-5 h-5 text-slate-500" />
            Antrean Aktif
          </Link>

          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Manajemen Data
            </p>
          </div>

          <Link 
            href="/kasir/stok" 
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <PackageSearch className="w-5 h-5 text-slate-500" />
            Stok & Barang
          </Link>
          <Link 
            href="/kasir/customers" 
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Users className="w-5 h-5 text-slate-500" />
            Data Customer
          </Link>
        </nav>

        {/* Bottom Section (Tutup Kasir & Logout) */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <form action="/auth/signout" method="post">
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

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-y-auto w-full">
        <div className="p-8 w-full max-w-7xl mx-auto flex-1">
          {children}
        </div>
      </main>
      <BukaKasirDialog />
    </div>
  )
}
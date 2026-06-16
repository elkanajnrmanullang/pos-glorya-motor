"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  FileBox, 
  History, 
  Wrench, 
  Boxes, 
  Users, 
  Award, 
  LogOut 
} from "lucide-react"
import { logoutAction } from "@/app/(auth)/login/actions"

export default function OwnerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  // HELPER UNTUK MENU AKTIF
  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`)

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#FAFCFB] lg:flex-row font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-64 bg-[#051F20] flex flex-col transition-all overflow-y-auto">
        
        {/* BRANDING */}
        <div className="p-8 flex flex-col items-center border-b border-[#163832]">
          <div className="text-xl tracking-[0.2em] font-light text-white">
            GLORYA<span className="font-bold text-[#8EB69B]">MOTOR</span>
          </div>
          <div className="text-[10px] mt-2 text-[#8EB69B] tracking-widest uppercase font-bold">
            Executive Panel
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-6">
          
          {/* GRUP 1: ANALITIK & LAPORAN */}
          <div className="space-y-1">
            <p className="px-4 text-[10px] font-bold tracking-widest text-[#163832] uppercase mb-2">Analitik & Laporan</p>
            <Link 
              href="/owner/dashboard" 
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-300 group ${
                isActive('/owner/dashboard') ? 'bg-[#163832] text-white shadow-md' : 'text-[#8EB69B] hover:bg-[#163832]/50 hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 group-hover:scale-110 transition-transform" /> 
              <span className="font-medium text-sm">Ringkasan Utama</span>
            </Link>
            
            <Link 
              href="/owner/laporan-shift" 
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-300 group ${
                isActive('/owner/laporan-shift') ? 'bg-[#163832] text-white shadow-md' : 'text-[#8EB69B] hover:bg-[#163832]/50 hover:text-white'
              }`}
            >
              <FileBox className="h-4 w-4 group-hover:scale-110 transition-transform" /> 
              <span className="font-medium text-sm">Audit Shift Kasir</span>
            </Link>

            <Link 
              href="/owner/riwayat" 
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-300 group ${
                isActive('/owner/riwayat') ? 'bg-[#163832] text-white shadow-md' : 'text-[#8EB69B] hover:bg-[#163832]/50 hover:text-white'
              }`}
            >
              <History className="h-4 w-4 group-hover:scale-110 transition-transform" /> 
              <span className="font-medium text-sm">Riwayat Transaksi</span>
            </Link>
          </div>

          {/* GRUP 2: MANAJEMEN BENGKEL */}
          <div className="space-y-1">
            <p className="px-4 text-[10px] font-bold tracking-widest text-[#163832] uppercase mb-2">Manajemen Bengkel</p>
            <Link 
              href="/owner/master-jasa" 
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-300 group ${
                isActive('/owner/master-jasa') ? 'bg-[#163832] text-white shadow-md' : 'text-[#8EB69B] hover:bg-[#163832]/50 hover:text-white'
              }`}
            >
              <Wrench className="h-4 w-4 group-hover:scale-110 transition-transform" /> 
              <span className="font-medium text-sm">Katalog Jasa Servis</span>
            </Link>
            <Link 
              href="/owner/stok" 
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-300 group ${
                isActive('/owner/stok') ? 'bg-[#163832] text-white shadow-md' : 'text-[#8EB69B] hover:bg-[#163832]/50 hover:text-white'
              }`}
            >
              <Boxes className="h-4 w-4 group-hover:scale-110 transition-transform" /> 
              <span className="font-medium text-sm">Pantauan Stok & Aset</span>
            </Link>
          </div>

          {/* GRUP 3: KARYAWAN & PERFORMA */}
          <div className="space-y-1">
            <p className="px-4 text-[10px] font-bold tracking-widest text-[#163832] uppercase mb-2">Tim & Karyawan</p>
            <Link 
              href="/owner/performa" 
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-300 group ${
                isActive('/owner/performa') ? 'bg-[#163832] text-white shadow-md' : 'text-[#8EB69B] hover:bg-[#163832]/50 hover:text-white'
              }`}
            >
              <Award className="h-4 w-4 group-hover:scale-110 transition-transform" /> 
              <span className="font-medium text-sm">Bagi Hasil Mekanik</span>
            </Link>
            <Link 
              href="/owner/karyawan" 
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-300 group ${
                isActive('/owner/karyawan') ? 'bg-[#163832] text-white shadow-md' : 'text-[#8EB69B] hover:bg-[#163832]/50 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4 group-hover:scale-110 transition-transform" /> 
              <span className="font-medium text-sm">Akun Karyawan</span>
            </Link>
          </div>

        </nav>

        {/* BOTTOM SECTION */}
        <div className="p-4 border-t border-[#163832]">
          <form action={logoutAction} className="w-full">
            <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-[#8EB69B] hover:bg-red-900/30 hover:text-red-400 transition-all duration-300 group">
              <LogOut className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
              <span className="font-medium text-sm">Keluar Sistem</span>
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 lg:p-10 max-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
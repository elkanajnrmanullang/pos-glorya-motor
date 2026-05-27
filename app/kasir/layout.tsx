import Link from "next/link"
import { Package, PenTool, LayoutDashboard, LogOut, Users, Boxes } from "lucide-react"
import { logoutAction } from "@/app/(auth)/login/actions"

export default function KasirLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-[#FAFCFB] lg:flex-row font-sans">
      <aside className="w-full lg:w-64 bg-[#051F20] flex flex-col transition-all">
        <div className="p-8 flex flex-col items-center border-b border-[#163832]">
          <div className="text-xl tracking-[0.2em] font-light text-white">
            GLORYA<span className="font-bold text-[#8EB69B]">MOTOR</span>
          </div>
          <div className="text-[10px] mt-2 text-[#8EB69B] tracking-widest uppercase font-bold">Panel Kasir</div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/kasir/dashboard" className="flex items-center gap-3 rounded-lg px-4 py-3 text-white bg-[#163832] transition-all duration-300 group">
            <LayoutDashboard className="h-4 w-4 group-hover:scale-110 transition-transform" /> 
            <span className="font-medium text-sm">Dashboard</span>
          </Link>
          <Link href="/kasir/tiket/buat" className="flex items-center gap-3 rounded-lg px-4 py-3 text-[#8EB69B] hover:bg-[#163832] hover:text-white transition-all duration-300 group">
            <PenTool className="h-4 w-4 group-hover:scale-110 transition-transform" /> 
            <span className="font-medium text-sm">Buat Tiket</span>
          </Link>
          <Link href="/kasir/takeaway" className="flex items-center gap-3 rounded-lg px-4 py-3 text-[#8EB69B] hover:bg-[#163832] hover:text-white transition-all duration-300 group">
            <Package className="h-4 w-4 group-hover:scale-110 transition-transform" /> 
            <span className="font-medium text-sm">Jual Langsung</span>
          </Link>
          <Link href="/kasir/customers" className="flex items-center gap-3 rounded-lg px-4 py-3 text-[#8EB69B] hover:bg-[#163832] hover:text-white transition-all duration-300 group">
            <Users className="h-4 w-4 group-hover:scale-110 transition-transform" /> 
            <span className="font-medium text-sm">Data Pelanggan</span>
          </Link>
          <Link href="/kasir/stok" className="flex items-center gap-3 rounded-lg px-4 py-3 text-[#8EB69B] hover:bg-[#163832] hover:text-white transition-all duration-300 group">
            <Boxes className="h-4 w-4 group-hover:scale-110 transition-transform" /> 
            <span className="font-medium text-sm">Stok & Barang</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-[#163832]">
          <form action={logoutAction} className="w-full">
            <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-[#8EB69B] hover:bg-red-900/30 hover:text-red-400 transition-all duration-300 group">
              <LogOut className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
              <span className="font-medium text-sm">Keluar</span>
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-10">
        {children}
      </main>
    </div>
  )
}
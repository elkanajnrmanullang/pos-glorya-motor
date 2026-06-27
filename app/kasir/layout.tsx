"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Users, Box, Wrench, FileText, ShoppingBag, LogOut, Menu, X, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { BukaKasirDialog } from '@/components/kasir/BukaKasirDialog'

export default function KasirLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [userName, setUserName] = useState<string>('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      if (profile) setUserName(profile.full_name)
    }
    getUser()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    toast.success('Berhasil logout')
  }

  const navItems = [
    { name: 'Antrean Servis (Home)', href: '/kasir/tiket/aktif', icon: Wrench },
    { name: 'Buat Tiket Servis', href: '/kasir/tiket/buat', icon: FileText },
    { name: 'Penjualan Takeaway', href: '/kasir/takeaway', icon: ShoppingBag },
    { name: 'Katalog Stok Suku Cadang', href: '/kasir/stok', icon: Box },
    { name: 'Database Pelanggan', href: '/kasir/customers', icon: Users },
  ]

  return (
    <div className="flex h-screen bg-[#FAF7F2] overflow-hidden font-sans">
      <BukaKasirDialog />
      
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#051F20] text-white flex items-center justify-between px-4 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-[#8EB69B] p-1.5 rounded-xl">
            <Wrench className="w-5 h-5 text-[#051F20]" />
          </div>
          <h1 className="text-lg font-black tracking-wider">GLORYA<span className="text-[#8EB69B]">POS</span></h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-72 md:w-64 bg-[#051F20] text-white flex flex-col h-full transition-transform duration-300 ease-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="hidden md:flex p-6 items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="bg-[#8EB69B] p-2 rounded-2xl shadow-sm">
              <Wrench className="w-6 h-6 text-[#051F20]" />
            </div>
            <h1 className="text-2xl font-black tracking-wider text-white">
              GLORYA<span className="text-[#8EB69B]">POS</span>
            </h1>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto mt-16 md:mt-0">
          <div className="text-[10px] font-bold text-[#8EB69B] uppercase tracking-widest mb-4 px-2">Menu Utama</div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all duration-200 ${
                  isActive ? 'bg-[#8EB69B] text-[#051F20] shadow-sm' : 'text-slate-300 hover:bg-[#163832] hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#051F20]' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 bg-[#051F20] mt-auto space-y-2">
          <div className="flex items-center gap-3 mb-2 px-2 bg-[#163832] p-3 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-[#8EB69B] flex items-center justify-center text-[#051F20] font-black text-lg">
              {userName.charAt(0).toUpperCase() || 'K'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-white">{userName || 'Memuat...'}</p>
              <p className="text-[10px] text-[#8EB69B] font-bold uppercase tracking-widest">Kasir</p>
            </div>
          </div>
          
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false)
              router.push('/kasir/sesi/tutup')
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-[#051F20] rounded-2xl font-bold transition-all duration-200"
          >
            <Lock className="w-4 h-4" /> Tutup Kasir
          </button>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl font-bold transition-all duration-200"
          >
            <LogOut className="w-4 h-4" /> Keluar Sesi
          </button>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto w-full pt-16 md:pt-0">
        <div className="p-4 sm:p-6 md:p-8 max-w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
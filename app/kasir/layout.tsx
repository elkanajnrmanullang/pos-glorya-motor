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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
      
      if (profile) {
        if (profile.role !== 'kasir') {
          toast.error('Akses ditolak. Anda login bukan sebagai Kasir.')
          if (profile.role === 'mekanik') router.push('/mekanik/dashboard')
          else if (profile.role === 'owner') router.push('/owner/dashboard')
          else router.push('/login')
          return
        }
        setUserName(profile.full_name)
      }
    }
    getUser()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    toast.success('Berhasil logout')
  }

  const navItems = [
    { name: 'Antrean Servis', href: '/kasir/tiket/aktif', icon: Wrench },
    { name: 'Buat Tiket Servis', href: '/kasir/tiket/buat', icon: FileText },
    { name: 'Penjualan Takeaway', href: '/kasir/takeaway', icon: ShoppingBag },
    { name: 'Katalog Suku Cadang', href: '/kasir/stok', icon: Box },
    { name: 'Database Pelanggan', href: '/kasir/customers', icon: Users },
  ]

  return (
    <div className="flex h-screen bg-[#FAF7F2] font-sans">
      <BukaKasirDialog />
      
      {/* MOBILE_HEADER */}
      <div className="md:hidden fixed top-0 w-full h-16 bg-[#051F20] z-50 flex items-center justify-between px-5 border-b border-[#163832]">
        <span className="text-lg font-semibold text-white tracking-wide">Glorya Motor</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-[#8EB69B] hover:text-white transition-colors">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* MOBILE_OVERLAY */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 bg-[#051F20] text-white flex flex-col h-full transition-all duration-300 border-r border-[#163832]
        ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
        ${isSidebarOpen ? 'md:w-64' : 'md:w-20'}
      `}>
        
        <div className="hidden md:flex h-16 items-center justify-between px-5 border-b border-[#163832]">
          {isSidebarOpen ? (
            <span className="text-lg font-semibold text-white tracking-wide">Glorya Motor</span>
          ) : (
            <span className="mx-auto text-lg font-semibold text-[#8EB69B]">GM</span>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-[#8EB69B] hover:text-white transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="md:hidden h-16 flex items-center px-5 border-b border-[#163832]">
          <span className="text-lg font-semibold text-white tracking-wide">Glorya Motor</span>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1.5 mt-16 md:mt-0 overflow-y-auto">
          {isSidebarOpen && <p className="px-3 text-xs font-medium text-white/40 mb-3">Menu Kasir</p>}
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isSidebarOpen ? 'px-3' : 'justify-center px-0'
                } ${
                  isActive ? 'bg-[#235347] text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
                title={!isSidebarOpen ? item.name : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#8EB69B]' : 'text-white/40'}`} />
                {isSidebarOpen && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[#163832] flex flex-col gap-2">
          <div className={`flex items-center gap-3 mb-2 ${!isSidebarOpen && 'justify-center'}`}>
            <div className="w-9 h-9 rounded-full bg-[#163832] flex shrink-0 items-center justify-center text-[#8EB69B] font-medium border border-[#235347]">
              {userName ? userName.charAt(0).toUpperCase() : 'K'}
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{userName || 'Memuat...'}</p>
                <p className="text-xs text-[#8EB69B] font-medium">Kasir</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false)
              router.push('/kasir/sesi/tutup')
            }}
            className={`w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-[#051F20] rounded-lg text-sm font-medium transition-colors ${!isSidebarOpen && 'px-0'}`}
            title={!isSidebarOpen ? "Tutup Kasir" : undefined}
          >
            <Lock className="w-4 h-4 shrink-0" />
            {isSidebarOpen && <span>Tutup Kasir</span>}
          </button>

          <button 
            onClick={handleLogout} 
            className={`w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg text-sm font-medium transition-colors ${!isSidebarOpen && 'px-0'}`}
            title={!isSidebarOpen ? "Keluar Sesi" : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {isSidebarOpen && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto w-full pt-16 md:pt-0">
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
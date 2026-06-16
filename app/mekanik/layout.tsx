"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Wrench, ClipboardList, LogOut, Menu, X } from 'lucide-react'
import { toast } from 'sonner'

export default function MekanikLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [userName, setUserName] = useState<string>('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return; }
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
    { name: 'Panel Pekerjaan', href: '/mekanik/dashboard', icon: Wrench },
    { name: 'Riwayat Pekerjaan', href: '/mekanik/riwayat', icon: ClipboardList },
  ]

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#051F20] text-white flex items-center justify-between px-4 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-[#8EB69B] p-1.5 rounded-lg"><Wrench className="w-5 h-5 text-[#051F20]" /></div>
          <h1 className="text-lg font-black tracking-wider">GLORYA<span className="text-[#8EB69B]">POS</span></h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-white/10 rounded-md">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-72 md:w-64 bg-[#163832] text-white flex flex-col h-full transition-transform duration-300 ease-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="hidden md:flex p-6 bg-[#051F20] items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="bg-[#8EB69B] p-2 rounded-xl shadow-inner"><Wrench className="w-6 h-6 text-[#051F20]" /></div>
            <h1 className="text-2xl font-black tracking-wider text-white drop-shadow-md">GLORYA<span className="text-[#8EB69B]">POS</span></h1>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto mt-16 md:mt-0">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Menu Mekanik</div>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 ${
                  isActive ? 'bg-[#8EB69B] text-[#051F20] shadow-md' : 'text-slate-300 hover:bg-[#235347] hover:text-white'
                }`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#051F20]' : 'text-slate-400'}`} /> {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 bg-[#051F20] border-t border-[#235347]/50 mt-auto">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-[#8EB69B] flex items-center justify-center text-[#051F20] font-black text-lg border-2 border-[#163832]">
              {userName.charAt(0).toUpperCase() || 'M'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-white">{userName || 'Memuat...'}</p>
              <p className="text-xs text-[#8EB69B] font-semibold uppercase tracking-wider">Mekanik</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl font-bold">
            <LogOut className="w-4 h-4" /> Keluar Sesi
          </button>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto w-full pt-16 md:pt-0 bg-slate-50">
        <div className="p-4 sm:p-6 md:p-8 max-w-full">{children}</div>
      </main>
    </div>
  )
}
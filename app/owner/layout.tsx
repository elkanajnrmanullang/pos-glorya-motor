"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Loader2 } from 'lucide-react'

function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { state, isMobile } = useSidebar()
  const paddingLeft = isMobile ? '0px' : state === 'expanded' ? '14rem' : '4.5rem'

  return (
    <div 
      className="flex flex-1 flex-col min-h-screen bg-slate-50 transition-all duration-200 ease-linear w-full"
      style={{ paddingLeft }}
    >
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[#E6DFD3] px-4 bg-white sticky top-0 z-40 shadow-sm">
        <SidebarTrigger className="text-[#051F20] bg-slate-50 hover:bg-slate-100 p-2 rounded-md transition-colors cursor-pointer" />
        <div className="w-full flex justify-between items-center pr-4">
          <span className="font-semibold text-[#051F20] text-sm">Dashboard Owner Glorya Motor</span>
        </div>
      </header>
      
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-x-hidden overflow-y-auto w-full">
        {children}
      </main>
    </div>
  )
}

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return; }
      
      const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
      
      if (profile) {
        if (profile.role !== 'owner') {
          toast.error('Akses ditolak. Anda login bukan sebagai Owner.')
          if (profile.role === 'kasir') router.push('/kasir/tiket/aktif')
          else if (profile.role === 'mekanik') router.push('/mekanik/dashboard')
          else router.push('/login')
          return
        }
        setUserName(profile.full_name)
        setIsAuthorized(true)
      }
    }
    checkAuth()
  }, [router, supabase])

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#8EB69B]" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar userName={userName} />
      <DashboardLayoutWrapper>
        {children}
      </DashboardLayoutWrapper>
    </SidebarProvider>
  )
}
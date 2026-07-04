"use client";

import { usePathname, useRouter } from "next/navigation"
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar
} from "@/components/ui/sidebar"
import { LayoutDashboard, Users, Box, Wrench, FileText, Receipt, Activity, LogOut } from 'lucide-react'

export function AppSidebar({ userName }: { userName?: string }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const { state } = useSidebar()
    const isCollapsed = state === "collapsed"

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        toast.success('Berhasil logout')
    }

    const navItems = [
        { name: 'Ringkasan Bisnis', href: '/owner/dashboard', icon: LayoutDashboard },
        { name: 'Pantauan Stok & Aset', href: '/owner/stok', icon: Box },
        { name: 'Katalog Master Jasa', href: '/owner/master-jasa', icon: Wrench },
        { name: 'Bagi Hasil Mekanik', href: '/owner/performa', icon: Activity },
        { name: 'Laporan Tutup Shift', href: '/owner/laporan-shift', icon: FileText },
        { name: 'Riwayat Transaksi', href: '/owner/riwayat', icon: Receipt },
        { name: 'Akun Karyawan', href: '/owner/karyawan', icon: Users },
    ]

    return (
        <Sidebar 
            variant="sidebar" 
            collapsible="icon" 
            className="border-r border-[#E6DFD3] bg-white z-50 shadow-sm"
        >
            <SidebarHeader className="h-16 flex items-center justify-center border-b border-[#E6DFD3] p-0 bg-white">
                <div className={cn("flex items-center w-full", isCollapsed ? "justify-center" : "gap-3 px-4")}>
                    <div className="bg-[#235347] p-2 rounded-xl flex shrink-0 items-center justify-center">
                        <Wrench className="w-5 h-5 text-white" />
                    </div>
                    {!isCollapsed && (
                        <h1 className="text-xl font-bold tracking-wider text-[#051F20] truncate">
                            GLORYA<span className="text-[#8EB69B]">POS</span>
                        </h1>
                    )}
                </div>
            </SidebarHeader>
            
            <SidebarContent className="py-4 px-2 bg-white">
                <SidebarGroup>
                    {!isCollapsed && (
                        <SidebarGroupLabel className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                            Manajemen & Laporan
                        </SidebarGroupLabel>
                    )}
                    <SidebarMenu className="space-y-1.5">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                            const Icon = item.icon
                            return (
                                <SidebarMenuItem key={item.name}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive}
                                        tooltip={item.name}
                                        className={cn(
                                            "h-11 transition-all duration-200 rounded-lg",
                                            isCollapsed ? "justify-center w-10 mx-auto px-0" : "px-3 w-full",
                                            isActive 
                                                ? "bg-[#E1EFE6] text-[#235347] font-semibold shadow-sm" 
                                                : "text-slate-600 hover:bg-slate-50 hover:text-[#051F20] font-medium"
                                        )}
                                    >
                                        <a href={item.href} className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
                                            <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-[#235347]" : "text-slate-400")} />
                                            {!isCollapsed && <span>{item.name}</span>}
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-0 border-t border-[#E6DFD3] bg-white">
                <div className={cn("flex items-center overflow-hidden py-4", isCollapsed ? "justify-center flex-col gap-2" : "gap-3 px-4")}>
                    <div className="w-10 h-10 rounded-full bg-[#FAF7F2] flex shrink-0 items-center justify-center text-[#235347] font-bold text-lg border border-[#E6DFD3]">
                        {userName ? userName.charAt(0).toUpperCase() : 'O'}
                    </div>
                    {!isCollapsed && (
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold truncate text-[#051F20]">{userName || 'Memuat...'}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Owner</p>
                        </div>
                    )}
                </div>
                <div className={cn("pb-4", isCollapsed ? "px-2" : "px-4")}>
                    <Button 
                        variant="ghost" 
                        className={cn("h-11 text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-semibold rounded-lg transition-colors", isCollapsed ? "w-10 mx-auto justify-center px-0" : "w-full justify-start gap-3 px-3")}
                        onClick={handleLogout}
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        {!isCollapsed && <span>Keluar Aplikasi</span>}
                    </Button>
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}
"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSesiKasir } from '@/hooks/use-sesi-kasir'
import { Loader2, LockKeyhole } from 'lucide-react'
import TutupKasirForm from '@/components/kasir/TutupKasirForm'

// COMPONENT_CLOSE_CASHIER_PAGE
export default function CloseCashierPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id)
    }
    getUser()
  }, [supabase])

  const { sesiAktif, isSesiLoading } = useSesiKasir(userId)

  if (isSesiLoading) {
    return (
      <div className="flex justify-center items-center py-20 text-[#8EB69B]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!sesiAktif) {
    return (
      <div className="p-8 max-w-md mx-auto mt-12 bg-white rounded-xl shadow-sm text-center border border-[#E6DFD3] space-y-4">
        <div className="w-16 h-16 bg-[#FAF7F2] rounded-full flex items-center justify-center mx-auto mb-2 text-[#8EB69B]">
          <LockKeyhole className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-[#051F20]">Tidak Ada Sesi Aktif</h3>
        <p className="text-sm text-slate-500">Shift Anda sudah ditutup atau belum dibuka. Silakan kembali ke dasbor untuk memulai shift baru.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h2 className="text-2xl font-semibold text-[#051F20] tracking-tight">Rekap Tutup Shift</h2>
        <p className="text-slate-500 mt-1 text-sm">Selesaikan shift kerja dengan melakukan rekapitulasi hitungan fisik harian.</p>
      </div>

      <TutupKasirForm sesiAktif={sesiAktif} userId={userId!} />
    </div>
  )
}
"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSesiKasir } from '@/hooks/use-sesi-kasir'
import TutupKasirForm from '@/components/kasir/TutupKasirForm'

export default function CloseCashierPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | undefined>(undefined)

  // Get Current User ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id)
    }
    getUser()
  }, [supabase])

  const { sesiAktif, isSesiLoading } = useSesiKasir(userId)

  if (isSesiLoading) {
    return <div className="text-sm font-medium text-slate-500 p-8">Memeriksa status sesi kasir...</div>
  }

  if (!sesiAktif) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-3">
        <h3 className="text-xl font-bold text-slate-900">Tidak Ada Sesi Aktif</h3>
        <p className="text-sm text-slate-500">Shift Anda sudah ditutup atau belum dimulai. Silakan kembali ke dasbor.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Form Rekap Tutup Kasir</h2>
        <p className="text-sm text-slate-500 mt-1">Selesaikan shift kerja dengan melakukan rekapitulasi hitungan fisik.</p>
      </div>

      <TutupKasirForm sesiAktif={sesiAktif} userId={userId!} />
    </div>
  )
}
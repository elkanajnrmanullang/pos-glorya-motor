"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Loader2 } from "lucide-react"
import { BukaKasirDialog } from "@/components/kasir/BukaKasirDialog"

export default function KasirDashboard() {
  const [kasirId, setKasirId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setKasirId(user.id)
    }
    getUser()
  }, [supabase])

  if (!kasirId) {
    return (
      <div className="flex w-full justify-center py-20 text-[#8EB69B]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full space-y-8 relative">
      <BukaKasirDialog kasirId={kasirId} />

      <div>
        <h1 className="text-2xl font-light text-[#051F20] tracking-tight">Dashboard <span className="font-bold">Kasir</span></h1>
        <p className="text-[#235347] mt-1 text-sm font-medium">Ringkasan operasional dan antrean hari ini.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-[#DAF1DE] shadow-sm hover:shadow-md hover:border-[#8EB69B] transition-all duration-300 group bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#8EB69B] text-xs uppercase tracking-widest font-bold">Service & Part</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light text-[#051F20] mb-2 tracking-tight">Buat Tiket</div>
            <p className="text-sm text-[#163832] mb-8">Pendaftaran motor servis dan integrasi antrean mekanik.</p>
            <Link href="/kasir/tiket/buat">
              <Button className="w-full bg-[#235347] hover:bg-[#0B2B26] text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                Proses Servis <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border border-[#DAF1DE] shadow-sm hover:shadow-md hover:border-[#8EB69B] transition-all duration-300 group bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#8EB69B] text-xs uppercase tracking-widest font-bold">Takeaway</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light text-[#051F20] mb-2 tracking-tight">Jual Langsung</div>
            <p className="text-sm text-[#163832] mb-8">Penjualan sparepart bawa pulang tanpa jasa bengkel.</p>
            <Link href="/kasir/takeaway">
              <Button className="w-full bg-[#8EB69B] hover:bg-[#163832] text-[#051F20] hover:text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                Proses Transaksi <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-[#DAF1DE] shadow-sm bg-white">
        <CardHeader className="border-b border-[#DAF1DE]/50 pb-4">
          <CardTitle className="text-[#051F20] text-sm font-semibold">Status Antrean Aktif</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-[#8EB69B] bg-[#DAF1DE]/20 mt-4 rounded-lg border border-dashed border-[#8EB69B]/50">
            <p className="font-medium text-sm">Belum ada motor yang sedang diservis.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
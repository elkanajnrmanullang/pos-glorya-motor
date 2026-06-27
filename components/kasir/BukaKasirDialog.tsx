"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useSesiKasir } from "@/hooks/use-sesi-kasir"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Wallet, KeyRound } from "lucide-react"
import { toast } from "sonner"

export function BukaKasirDialog() {
  const supabase = createClient()
  const [kasirId, setKasirId] = useState<string | undefined>(undefined)
  const [modalAwal, setModalAwal] = useState<number>(0)
  const [pinOwner, setPinOwner] = useState<string>('')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setKasirId(user?.id)
    }
    getUser()
  }, [supabase])

  const { sesiAktif, isSesiLoading, bukaKasir, isMembukaKasir } = useSesiKasir(kasirId)

  const formatInputRibuan = (val: number) => {
    if (!val || val === 0) return ''
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  const parseInputRibuan = (val: string) => {
    const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10)
    return isNaN(parsed) ? 0 : parsed
  }

  const handleBukaKasir = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!kasirId) {
      toast.error("Gagal mendapatkan data sesi pengguna")
      return
    }

    if (modalAwal < 0) {
      toast.error("Masukkan jumlah modal awal yang valid")
      return
    }

    const validPin = process.env.NEXT_PUBLIC_KASIR_PIN || '123456'
    if (pinOwner !== validPin) {
      toast.error("PIN/Password Owner salah!")
      return
    }

    try {
      await bukaKasir({ modalAwal: modalAwal })
      toast.success("Sesi kasir berhasil dibuka!")
    } catch (error: any) {
      toast.error(error.message || "Gagal membuka kasir, silakan coba lagi.")
    }
  }

  if (!kasirId || isSesiLoading || sesiAktif) return null

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md [&>button]:hidden bg-[#FAF7F2] border-0 shadow-xl rounded-3xl"> 
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-black text-[#051F20]">
            <Wallet className="w-7 h-7 text-[#8EB69B]" />
            Otorisasi Kasir
          </DialogTitle>
          <DialogDescription className="text-[#163832] font-medium pt-2">
            Anda belum membuka sesi hari ini. Masukkan jumlah modal awal laci dan mintalah PIN Owner untuk memulai shift.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleBukaKasir} className="space-y-5 mt-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#163832] uppercase tracking-widest">
              Uang Modal Awal Laci
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#163832] font-bold text-lg">Rp</span>
              <Input 
                type="text" 
                placeholder="0" 
                value={formatInputRibuan(modalAwal)}
                onChange={(e) => setModalAwal(parseInputRibuan(e.target.value))}
                className="h-14 pl-12 text-xl font-black bg-white border-0 shadow-sm text-[#051F20] focus-visible:ring-2 focus-visible:ring-[#8EB69B] rounded-2xl"
                autoFocus
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#163832] uppercase tracking-widest flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5" /> PIN Owner
            </label>
            <Input 
              type="password" 
              placeholder="Masukkan PIN" 
              value={pinOwner}
              onChange={(e) => setPinOwner(e.target.value)}
              className="h-14 text-center text-xl font-black tracking-widest bg-white border-0 shadow-sm text-[#051F20] focus-visible:ring-2 focus-visible:ring-[#8EB69B] rounded-2xl"
              required
            />
          </div>

          <Button 
            type="submit" 
            disabled={isMembukaKasir}
            className="w-full h-14 text-sm font-black tracking-widest bg-[#235347] hover:bg-[#051F20] text-white rounded-2xl transition-all shadow-md mt-4"
          >
            {isMembukaKasir ? "MEMBUKA SESI..." : "MULAI SHIFT"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
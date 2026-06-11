"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useSesiKasir } from "@/hooks/use-sesi-kasir"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Wallet } from "lucide-react"
import { toast } from "sonner"

export function BukaKasirDialog() {
  const supabase = createClient()
  const [kasirId, setKasirId] = useState<string | undefined>(undefined)
  
  // Ubah state jadi number agar aman untuk diproses API
  const [modalAwal, setModalAwal] = useState<number>(0)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setKasirId(user?.id)
    }
    getUser()
  }, [supabase])

  const { sesiAktif, isSesiLoading, bukaKasir, isMembukaKasir } = useSesiKasir(kasirId)

  // Fungsi Format Real-time Input
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

    try {
      await bukaKasir({ modalAwal: modalAwal })
      toast.success("Sesi kasir berhasil dibuka!")
    } catch (error) {
      console.error(error)
      toast.error("Gagal membuka kasir, silakan coba lagi.")
    }
  }

  if (!kasirId || isSesiLoading || sesiAktif) return null

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md [&>button]:hidden bg-[#FAF7F2] border-[#E6DFD3]"> 
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-[#051F20]">
            <Wallet className="w-6 h-6 text-[#8EB69B]" />
            Buka Kasir
          </DialogTitle>
          <DialogDescription className="text-[#163832]">
            Anda belum membuka sesi kasir. Masukkan jumlah modal awal (uang receh di laci) untuk memulai shift Anda.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleBukaKasir} className="space-y-6 mt-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#163832] uppercase tracking-wider">
              Uang Modal Awal
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#163832] font-semibold text-lg">Rp</span>
              <Input 
                type="text" 
                placeholder="0" 
                value={formatInputRibuan(modalAwal)}
                onChange={(e) => setModalAwal(parseInputRibuan(e.target.value))}
                className="h-14 pl-12 text-xl font-bold bg-white text-[#051F20] border-[#8EB69B]/40 focus-visible:ring-[#235347]"
                autoFocus
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isMembukaKasir}
            className="w-full h-12 text-sm font-bold tracking-widest bg-[#235347] hover:bg-[#051F20] text-white transition-all"
          >
            {isMembukaKasir ? "MEMBUKA SESI..." : "MULAI SHIFT"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
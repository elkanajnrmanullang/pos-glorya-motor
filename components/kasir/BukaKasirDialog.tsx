"use client"

import { useState } from "react"
import { useSesiKasir } from "@/hooks/use-sesi-kasir"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Wallet } from "lucide-react"
import { toast } from "sonner"

export function BukaKasirDialog({ kasirId }: { kasirId: string }) {
  const { sesiAktif, isSesiLoading, bukaKasir, isMembukaKasir } = useSesiKasir(kasirId)
  const [modalAwal, setModalAwal] = useState("")

  const handleBukaKasir = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const modal = parseFloat(modalAwal)
    if (isNaN(modal) || modal < 0) {
      toast.error("Masukkan jumlah modal awal yang valid")
      return
    }

    try {
      await bukaKasir({ modalAwal: modal })
      toast.success("Sesi kasir berhasil dibuka!")
    } catch (error) {
      console.error(error)
      toast.error("Gagal membuka kasir, silakan coba lagi.")
    }
  }

  if (isSesiLoading || sesiAktif) return null

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md [&>button]:hidden"> 
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
              Uang Modal Awal (Rp)
            </label>
            <Input 
              type="number" 
              placeholder="Contoh: 150000" 
              value={modalAwal}
              onChange={(e) => setModalAwal(e.target.value)}
              className="h-12 text-lg border-[#8EB69B]/30 focus-visible:ring-[#235347]"
              autoFocus
              required
            />
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
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSesiKasir } from '@/hooks/use-sesi-kasir'
import { useCreateTiket } from '@/hooks/use-tiket'
import { Customer } from '@/hooks/use-customers'
import { CustomerSelect } from '@/components/kasir/CustomerSelect'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { User, Wrench, FileText, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function BuatTiketPage() {
  const supabase = createClient()
  const router = useRouter()
  const [userId, setUserId] = useState<string | undefined>(undefined)

  // Get User ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id)
    }
    getUser()
  }, [supabase])

  const { sesiAktif, isSesiLoading } = useSesiKasir(userId)
  const createTiket = useCreateTiket()

  // Form State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [tipeServis, setTipeServis] = useState<'service_part' | 'jasa'>('service_part')
  
  // Motor State
  const [platMotor, setPlatMotor] = useState('')
  const [merkMotor, setMerkMotor] = useState('')
  const [ccMotor, setCcMotor] = useState('')
  const [tahunMotor, setTahunMotor] = useState('')
  const [keluhan, setKeluhan] = useState('')

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!sesiAktif) {
      toast.error('Gagal: Sesi kasir tidak aktif.')
      return
    }
    if (!selectedCustomer) {
      toast.error('Silakan pilih atau daftarkan customer terlebih dahulu.')
      return
    }
    if (!platMotor || !merkMotor) {
      toast.error('Plat dan Merk Motor wajib diisi.')
      return
    }

    // Generate Nomor Antrean Sederhana (A-[4 Digit Random])
    const antrean = `A-${Math.floor(1000 + Math.random() * 9000)}`

    try {
      await createTiket.mutateAsync({
        nomor_antrian: antrean,
        tipe: tipeServis,
        plat_motor: platMotor.toUpperCase(),
        merk_motor: merkMotor,
        cc_motor: ccMotor ? parseInt(ccMotor) : null,
        tahun_motor: tahunMotor ? parseInt(tahunMotor) : null,
        keluhan: keluhan || null,
        kasir_id: userId!,
        customer_id: selectedCustomer.id,
        sesi_id: sesiAktif.id,
        cabang_id: sesiAktif.cabang_id
      })

      toast.success(`Tiket Antrean ${antrean} Berhasil Dibuat!`)
      router.push('/kasir/tiket/aktif') 
      
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan saat membuat tiket.')
    }
  }

  if (isSesiLoading) return <div className="p-8 text-[#163832]">Memeriksa sesi...</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#051F20] flex items-center gap-2">
          <FileText className="w-6 h-6 text-[#8EB69B]" />
          Buat Tiket Servis Baru
        </h2>
        <p className="text-sm text-[#163832] mt-1">Daftarkan pelanggan ke antrean servis untuk dikerjakan mekanik.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Step 1: Customer */}
        <Card className="bg-[#FAF7F2] border-[#E6DFD3] overflow-visible">
          <CardHeader className="border-b border-[#E6DFD3]/60 bg-white/50 pb-4">
            <CardTitle className="text-base font-bold text-[#051F20] flex items-center gap-2">
              <User className="w-5 h-5 text-[#235347]" /> Pilih Pelanggan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <CustomerSelect 
              selectedCustomer={selectedCustomer} 
              onSelect={setSelectedCustomer} 
            />
          </CardContent>
        </Card>

        {/* Step 2: Data Motor & Keluhan */}
        <Card className={`bg-[#FAF7F2] border-[#E6DFD3] transition-opacity ${!selectedCustomer ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <CardHeader className="border-b border-[#E6DFD3]/60 bg-white/50 pb-4">
            <CardTitle className="text-base font-bold text-[#051F20] flex items-center gap-2">
              <Wrench className="w-5 h-5 text-[#235347]" /> Data Motor & Tindakan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            
            {/* Tipe Servis Radio Cards */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-[#163832] uppercase">Tipe Tindakan</label>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => setTipeServis('service_part')}
                  className={`p-4 border rounded-xl cursor-pointer transition-all ${tipeServis === 'service_part' ? 'bg-[#E1EFE6] border-[#235347] ring-1 ring-[#235347]' : 'bg-white border-[#E6DFD3] hover:border-[#8EB69B]'}`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className={`font-bold ${tipeServis === 'service_part' ? 'text-[#051F20]' : 'text-slate-600'}`}>Servis + Sparepart</h4>
                    {tipeServis === 'service_part' && <CheckCircle2 className="w-5 h-5 text-[#235347]" />}
                  </div>
                  <p className="text-xs text-[#163832] mt-1">Ganti part & memotong stok gudang (Item Reserved)</p>
                </div>
                
                <div 
                  onClick={() => setTipeServis('jasa')}
                  className={`p-4 border rounded-xl cursor-pointer transition-all ${tipeServis === 'jasa' ? 'bg-[#E1EFE6] border-[#235347] ring-1 ring-[#235347]' : 'bg-white border-[#E6DFD3] hover:border-[#8EB69B]'}`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className={`font-bold ${tipeServis === 'jasa' ? 'text-[#051F20]' : 'text-slate-600'}`}>Jasa Saja</h4>
                    {tipeServis === 'jasa' && <CheckCircle2 className="w-5 h-5 text-[#235347]" />}
                  </div>
                  <p className="text-xs text-[#163832] mt-1">Contoh: Setel rantai, isi angin. Tidak memotong stok.</p>
                </div>
              </div>
            </div>

            {/* Form Input Motor */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#163832] uppercase">Nomor Plat Polisi *</label>
                <Input 
                  required
                  value={platMotor}
                  onChange={(e) => setPlatMotor(e.target.value)}
                  placeholder="B 1234 ABC" 
                  className="uppercase border-[#8EB69B]/40 focus-visible:ring-[#235347] bg-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#163832] uppercase">Merk / Tipe Motor *</label>
                <Input 
                  required
                  value={merkMotor}
                  onChange={(e) => setMerkMotor(e.target.value)}
                  placeholder="Honda Vario 150" 
                  className="border-[#8EB69B]/40 focus-visible:ring-[#235347] bg-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#163832] uppercase">Kapasitas (CC)</label>
                <Input 
                  type="number"
                  value={ccMotor}
                  onChange={(e) => setCcMotor(e.target.value)}
                  placeholder="150" 
                  className="border-[#8EB69B]/40 focus-visible:ring-[#235347] bg-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#163832] uppercase">Tahun Motor</label>
                <Input 
                  type="number"
                  value={tahunMotor}
                  onChange={(e) => setTahunMotor(e.target.value)}
                  placeholder="2021" 
                  className="border-[#8EB69B]/40 focus-visible:ring-[#235347] bg-white"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-xs font-bold text-[#163832] uppercase">Keluhan Awal (Opsional)</label>
                <Input 
                  value={keluhan}
                  onChange={(e) => setKeluhan(e.target.value)}
                  placeholder="Tarikan berat, rem depan blong..." 
                  className="border-[#8EB69B]/40 focus-visible:ring-[#235347] bg-white"
                />
              </div>
            </div>

          </CardContent>
        </Card>

        <Button 
          type="submit" 
          disabled={!selectedCustomer || createTiket.isPending}
          className="w-full h-14 text-base font-bold tracking-widest bg-[#235347] hover:bg-[#051F20] text-white shadow-md transition-all"
        >
          {createTiket.isPending ? 'MENCETAK TIKET...' : 'BUAT TIKET & MASUKKAN KE ANTREAN MEKANIK'}
        </Button>
      </form>
    </div>
  )
}
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
import { User, Wrench, FileText, CheckCircle2, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

// COMPONENT_BUAT_TIKET_PAGE
export default function BuatTiketPage() {
  const supabase = createClient()
  const router = useRouter()
  const [userId, setUserId] = useState<string | undefined>(undefined)

  // GET_USER_SESSION
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id)
    }
    getUser()
  }, [supabase])

  const { sesiAktif, isSesiLoading } = useSesiKasir(userId)
  const createTiket = useCreateTiket()

  // STATE_FORM
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [tipeServis, setTipeServis] = useState<'service_part' | 'jasa'>('service_part')
  const [keluhan, setKeluhan] = useState('')

  // STATE_MASTER_MOTOR
  const [masterMotors, setMasterMotors] = useState<any[]>([])
  const [isMasterLoading, setIsMasterLoading] = useState(true)

  // STATE_GARASI_KENDARAAN
  const [garasi, setGarasi] = useState<any[]>([])
  const [selectedKendaraanId, setSelectedKendaraanId] = useState<string>('')
  
  // STATE_KENDARAAN_BARU (Bila Garasi Kosong/Tambah Baru)
  const [isAddingMotor, setIsAddingMotor] = useState(false)
  const [platMotorBaru, setPlatMotorBaru] = useState('')
  const [masterIdBaru, setMasterIdBaru] = useState('')
  const [tahunMotorBaru, setTahunMotorBaru] = useState('')

  // EFFECT_FETCH_MASTER_MOTOR
  useEffect(() => {
    const fetchMaster = async () => {
      const { data } = await supabase.from('master_motor').select('*').order('merk', { ascending: true })
      if (data) setMasterMotors(data)
      setIsMasterLoading(false)
    }
    fetchMaster()
  }, [supabase])

  // EFFECT_FETCH_GARASI_CUSTOMER
  useEffect(() => {
    const fetchGarasi = async () => {
      if (!selectedCustomer) {
        setGarasi([])
        setIsAddingMotor(false)
        return
      }
      const { data } = await supabase
        .from('kendaraan_pelanggan')
        .select('*, master_motor(merk, model, cc)')
        .eq('customer_id', selectedCustomer.id)
      
      setGarasi(data || [])
      if (data && data.length > 0) {
        setSelectedKendaraanId(data[0].id)
        setIsAddingMotor(false)
      } else {
        setSelectedKendaraanId('')
        setIsAddingMotor(true)
      }
    }
    fetchGarasi()
  }, [selectedCustomer, supabase])

  // HANDLE_SUBMIT_TIKET
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!sesiAktif) return toast.error('Sesi kasir tidak aktif.')
    if (!selectedCustomer) return toast.error('Pilih customer terlebih dahulu.')
    if (!isAddingMotor && !selectedKendaraanId) return toast.error('Pilih motor yang akan diservis.')
    if (isAddingMotor && (!platMotorBaru || !masterIdBaru)) return toast.error('Lengkapi data plat dan tipe motor.')

    try {
      let kendaraanIdToUse = selectedKendaraanId
      let merkToUse = ''
      let ccToUse = null
      let platToUse = ''

      // LOGIC_INSERT_KENDARAAN_BARU
      if (isAddingMotor) {
        const { data: newKendaraan, error: errKendaraan } = await supabase
          .from('kendaraan_pelanggan')
          .insert({
            customer_id: selectedCustomer.id,
            master_motor_id: masterIdBaru,
            plat_nomor: platMotorBaru.toUpperCase(),
            tahun_perakitan: tahunMotorBaru ? parseInt(tahunMotorBaru) : null
          })
          .select('*, master_motor(merk, model, cc)')
          .single()

        if (errKendaraan) {
          if (errKendaraan.code === '23505') throw new Error('Plat Nomor ini sudah terdaftar di sistem!')
          throw new Error('Gagal mendaftarkan motor ke garasi.')
        }
        
        kendaraanIdToUse = newKendaraan.id
        merkToUse = `${newKendaraan.master_motor.merk} ${newKendaraan.master_motor.model}`
        ccToUse = newKendaraan.master_motor.cc
        platToUse = newKendaraan.plat_nomor
      } else {
        // LOGIC_USE_EXISTING_KENDARAAN
        const k = garasi.find(g => g.id === selectedKendaraanId)
        if (k) {
          merkToUse = `${k.master_motor.merk} ${k.master_motor.model}`
          ccToUse = k.master_motor.cc
          platToUse = k.plat_nomor
        }
      }

      // LOGIC_CREATE_TIKET
      const antrean = `A-${Math.floor(1000 + Math.random() * 9000)}`
      await createTiket.mutateAsync({
        nomor_antrian: antrean,
        tipe: tipeServis,
        plat_motor: platToUse,
        merk_motor: merkToUse,
        cc_motor: ccToUse,
        tahun_motor: isAddingMotor && tahunMotorBaru ? parseInt(tahunMotorBaru) : null,
        keluhan: keluhan || null,
        kendaraan_id: kendaraanIdToUse,
        kasir_id: userId!,
        customer_id: selectedCustomer.id,
        sesi_id: sesiAktif.id,
        cabang_id: sesiAktif.cabang_id
      })

      toast.success(`Tiket ${antrean} Berhasil Dibuat!`)
      router.push('/kasir/tiket/aktif') 
      
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan saat membuat tiket.')
    }
  }

  if (isSesiLoading) return <div className="p-8 text-[#163832]">Memeriksa sesi...</div>

  // COMPONENT_RENDER
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-[#051F20] flex items-center gap-2">
          <FileText className="w-6 h-6 text-[#8EB69B]" />
          Buat Tiket Servis Baru
        </h2>
        <p className="text-sm text-[#163832] mt-1">Daftarkan pelanggan ke antrean servis untuk dikerjakan mekanik.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION_CUSTOMER */}
        <Card className="bg-[#FAF7F2] border-[#E6DFD3] overflow-visible">
          <CardHeader className="border-b border-[#E6DFD3]/60 bg-white/50 pb-4">
            <CardTitle className="text-base font-bold text-[#051F20] flex items-center gap-2">
              <User className="w-5 h-5 text-[#235347]" /> 1. Pilih Pelanggan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <CustomerSelect selectedCustomer={selectedCustomer} onSelect={setSelectedCustomer} />
          </CardContent>
        </Card>

        {/* SECTION_KENDARAAN */}
        <Card className={`bg-[#FAF7F2] border-[#E6DFD3] transition-opacity ${!selectedCustomer ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <CardHeader className="border-b border-[#E6DFD3]/60 bg-white/50 pb-4">
            <CardTitle className="text-base font-bold text-[#051F20] flex items-center justify-between">
              <div className="flex items-center gap-2"><Wrench className="w-5 h-5 text-[#235347]" /> 2. Pilih Kendaraan (Garasi)</div>
              {selectedCustomer && garasi.length > 0 && !isAddingMotor && (
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingMotor(true)} className="text-xs h-8">
                  <Plus className="w-3 h-3 mr-1"/> Tambah Motor Lain
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            
            {!isAddingMotor && garasi.length > 0 ? (
              <div className="space-y-3">
                {garasi.map(k => (
                  <div 
                    key={k.id} onClick={() => setSelectedKendaraanId(k.id)}
                    className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedKendaraanId === k.id ? 'bg-[#E1EFE6] border-[#235347] ring-1 ring-[#235347]' : 'bg-white border-[#E6DFD3] hover:border-[#8EB69B]'}`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-[#051F20]">{k.master_motor.merk} {k.master_motor.model}</h4>
                        <p className="text-sm font-black text-[#235347] tracking-widest">{k.plat_nomor}</p>
                      </div>
                      {selectedKendaraanId === k.id && <CheckCircle2 className="w-6 h-6 text-[#235347]" />}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-[#E6DFD3]">
                {garasi.length > 0 && (
                  <div className="col-span-full flex justify-end mb-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingMotor(false)} className="text-rose-600 h-8">Batal Tambah Motor</Button>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#163832] uppercase">Nomor Plat Polisi *</label>
                  <Input required={isAddingMotor} value={platMotorBaru} onChange={(e) => setPlatMotorBaru(e.target.value)} placeholder="Contoh: B 1234 ABC" className="uppercase" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#163832] uppercase">Pilih Motor (Master) *</label>
                  <select 
                    required={isAddingMotor} value={masterIdBaru} onChange={(e) => setMasterIdBaru(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" disabled>-- Pilih Model Motor --</option>
                    {masterMotors.map(m => (
                      <option key={m.id} value={m.id}>{m.merk} {m.model} ({m.cc}cc)</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold text-[#163832] uppercase">Tahun Perakitan (Opsional)</label>
                  <Input type="number" value={tahunMotorBaru} onChange={(e) => setTahunMotorBaru(e.target.value)} placeholder="Contoh: 2021" />
                </div>
              </div>
            )}

            {/* SECTION_TIPE_SERVIS */}
            <div className="space-y-3 pt-4 border-t border-[#E6DFD3]">
              <label className="text-xs font-bold text-[#163832] uppercase">3. Tipe Tindakan</label>
              <div className="grid grid-cols-2 gap-4">
                <div onClick={() => setTipeServis('service_part')} className={`p-4 border rounded-xl cursor-pointer transition-all ${tipeServis === 'service_part' ? 'bg-[#E1EFE6] border-[#235347] ring-1 ring-[#235347]' : 'bg-white border-[#E6DFD3] hover:border-[#8EB69B]'}`}>
                  <div className="flex justify-between items-start">
                    <h4 className={`font-bold ${tipeServis === 'service_part' ? 'text-[#051F20]' : 'text-slate-600'}`}>Servis + Sparepart</h4>
                    {tipeServis === 'service_part' && <CheckCircle2 className="w-5 h-5 text-[#235347]" />}
                  </div>
                </div>
                <div onClick={() => setTipeServis('jasa')} className={`p-4 border rounded-xl cursor-pointer transition-all ${tipeServis === 'jasa' ? 'bg-[#E1EFE6] border-[#235347] ring-1 ring-[#235347]' : 'bg-white border-[#E6DFD3] hover:border-[#8EB69B]'}`}>
                  <div className="flex justify-between items-start">
                    <h4 className={`font-bold ${tipeServis === 'jasa' ? 'text-[#051F20]' : 'text-slate-600'}`}>Jasa Saja</h4>
                    {tipeServis === 'jasa' && <CheckCircle2 className="w-5 h-5 text-[#235347]" />}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION_KELUHAN */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#163832] uppercase">4. Keluhan Awal (Opsional)</label>
              <Input value={keluhan} onChange={(e) => setKeluhan(e.target.value)} placeholder="Contoh: Tarikan berat, rem depan blong..." className="bg-white" />
            </div>

          </CardContent>
        </Card>

        <Button type="submit" disabled={!selectedCustomer || createTiket.isPending || isMasterLoading} className="w-full h-14 text-base font-bold tracking-widest bg-[#235347] hover:bg-[#051F20] text-white shadow-md transition-all">
          {createTiket.isPending ? 'MENCETAK TIKET...' : 'BUAT TIKET & MASUKKAN KE ANTREAN MEKANIK'}
        </Button>
      </form>
    </div>
  )
}
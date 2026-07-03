"use client"

import { useState } from 'react'
import { useMekanik } from '@/hooks/use-mekanik'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Wrench, CheckCircle2, Clock, ClipboardCheck } from 'lucide-react'
import { toast } from 'sonner'

const CHECKLIST_ITEMS = [
  { id: 'oli_mesin', label: 'Oli Mesin' },
  { id: 'oli_gardan', label: 'Oli Gardan' },
  { id: 'kampas_depan', label: 'Kampas Rem Depan' },
  { id: 'kampas_belakang', label: 'Kampas Rem Belakang' },
  { id: 'tekanan_ban', label: 'Tekanan Ban' },
  { id: 'kelistrikan', label: 'Lampu & Kelistrikan' }
]

const STATUS_OPTIONS = ['Aman', 'Ganti', 'Servis']

export default function MekanikDashboard() {
  const { userProfile, tiketSemua, isLoadingTiket, klaimTiket, selesaiTiket, isProcessing } = useMekanik()
  const [activeTab, setActiveTab] = useState<'menunggu' | 'kerja'>('menunggu')
  
  const [checklist, setChecklist] = useState<Record<string, string>>({})
  const [saran, setSaran] = useState('')

  const tiketMenunggu = tiketSemua.filter(t => t.status === 'menunggu')
  const tiketDikerjakan = tiketSemua.filter(t => t.status === 'dikerjakan' && t.mekanik_id === userProfile?.id)
  const activeKerjaan = tiketDikerjakan[0]

  const handleChecklistChange = (itemId: string, status: string) => {
    setChecklist(prev => ({ ...prev, [itemId]: status }))
  }

  const handleKlaim = async (id: string) => {
    try {
      if (tiketDikerjakan.length > 0) return toast.error('Selesaikan pekerjaan saat ini terlebih dahulu!')
      await klaimTiket(id)
      toast.success('Tiket berhasil diklaim. Selamat bekerja!')
      setActiveTab('kerja')
    } catch {
      toast.error('Gagal mengklaim tiket.')
    }
  }

  const handleSelesai = async (id: string) => {
    if (Object.keys(checklist).length < CHECKLIST_ITEMS.length) {
      return toast.error('Harap lengkapi seluruh poin Pengecekan Kendaraan.')
    }
    if (!saran.trim()) {
      return toast.error('Harap berikan catatan atau saran pada kolom yang tersedia.')
    }

    try {
      await selesaiTiket({ id, checklist, saran })
      toast.success('Pekerjaan selesai dilaporkan ke Kasir.')
      setChecklist({})
      setSaran('')
      setActiveTab('menunggu')
    } catch {
      toast.error('Gagal menyelesaikan tiket pekerjaan.')
    }
  }

  return (
    <div className="w-full space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-black text-[#051F20] tracking-tight">Panel Pekerjaan</h1>
        <p className="text-[#163832] font-medium text-sm mt-1">Kelola antrean dan laporkan status pengerjaan kendaraan.</p>
      </div>

      <div className="flex bg-white border border-[#E6DFD3] p-1.5 rounded-xl w-full max-w-md shadow-sm">
        <button onClick={() => setActiveTab('menunggu')} className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'menunggu' ? 'bg-[#051F20] text-white shadow-md' : 'text-[#163832] hover:bg-[#FAF7F2]'}`}>
          Antrean ({tiketMenunggu.length})
        </button>
        <button onClick={() => setActiveTab('kerja')} className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'kerja' ? 'bg-[#051F20] text-white shadow-md' : 'text-[#163832] hover:bg-[#FAF7F2]'}`}>
          Lembar Kerja
        </button>
      </div>

      {isLoadingTiket && <p className="text-sm font-medium text-[#163832]">Memuat data operasional...</p>}

      {!isLoadingTiket && activeTab === 'menunggu' && (
        <div className="grid gap-4 md:grid-cols-2">
          {tiketMenunggu.length === 0 ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white rounded-2xl border border-[#E6DFD3] border-dashed shadow-sm">
              <div className="w-12 h-12 bg-[#E1EFE6] rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 className="w-5 h-5 text-[#235347]" />
              </div>
              <p className="font-bold text-[#051F20]">Antrean Kosong</p>
              <p className="text-xs text-[#163832] mt-1">Belum ada kendaraan baru yang masuk.</p>
            </div>
          ) : (
            tiketMenunggu.map((tiket) => (
              <Card key={tiket.id} className="border border-[#E6DFD3] bg-white shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all">
                <CardHeader className="bg-[#FAF7F2] pb-4 border-b border-[#E6DFD3]">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-black text-[#051F20]">{tiket.plat_motor}</h3>
                      <p className="text-[#235347] font-bold text-xs uppercase tracking-widest mt-1">{tiket.merk_motor}</p>
                    </div>
                    <span className="text-[10px] font-bold text-[#163832] bg-white px-2 py-1 border border-[#E6DFD3] rounded-md">
                      {new Date(tiket.waktu_masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-5 space-y-5">
                  <div>
                    <p className="text-[10px] font-bold text-[#8EB69B] uppercase tracking-widest mb-1.5">Keluhan Terdaftar</p>
                    <p className="text-sm text-[#051F20] font-medium leading-relaxed bg-[#FAF7F2] p-3 rounded-xl">
                      {tiket.keluhan || 'Tidak ada keluhan spesifik yang dicatat kasir.'}
                    </p>
                  </div>
                  <Button disabled={isProcessing} onClick={() => handleKlaim(tiket.id)} className="w-full h-12 text-xs uppercase tracking-widest font-black bg-[#235347] hover:bg-[#051F20] text-white rounded-xl shadow-md transition-all">
                    Klaim & Eksekusi
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {!isLoadingTiket && activeTab === 'kerja' && (
        <div className="w-full">
          {!activeKerjaan ? (
            <div className="py-16 flex flex-col items-center justify-center bg-white rounded-2xl border border-[#E6DFD3] border-dashed shadow-sm">
              <div className="w-12 h-12 bg-[#FAF7F2] rounded-full flex items-center justify-center mb-3">
                <Wrench className="w-5 h-5 text-[#8EB69B]" />
              </div>
              <p className="font-bold text-[#051F20]">Ruang Kerja Kosong</p>
              <p className="text-xs text-[#163832] mt-1">Silakan pilih kendaraan dari tab Antrean.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <Card className="bg-[#051F20] text-white border-0 shadow-lg rounded-3xl overflow-hidden">
                <CardContent className="p-6 md:p-8 relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#8EB69B] rounded-bl-full opacity-10 blur-2xl"></div>
                  
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                      <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">{activeKerjaan.plat_motor}</h2>
                      <p className="font-bold text-[#8EB69B] uppercase tracking-widest text-sm mt-1">{activeKerjaan.merk_motor}</p>
                    </div>
                    <span className="bg-[#163832] border border-[#235347] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
                      <Clock className="w-3.5 h-3.5 text-[#8EB69B]" /> Dalam Proses
                    </span>
                  </div>
                  
                  <div className="bg-[#163832] p-4 rounded-xl border border-white/5 relative z-10">
                    <p className="text-[10px] font-bold text-[#8EB69B] uppercase tracking-widest mb-1.5">Keluhan Awal</p>
                    <p className="text-sm font-medium leading-relaxed">{activeKerjaan.keluhan}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-[#E6DFD3] shadow-sm rounded-3xl bg-white overflow-hidden">
                <CardHeader className="pb-5 border-b border-[#E6DFD3] bg-[#FAF7F2]">
                  <CardTitle className="text-base font-black text-[#051F20] flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-[#235347]" /> Pemeriksaan Standar
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-3">
                    {CHECKLIST_ITEMS.map((item) => (
                      <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 hover:bg-[#FAF7F2] rounded-xl transition-colors border border-transparent hover:border-[#E6DFD3]">
                        <span className="text-sm font-bold text-[#051F20]">{item.label}</span>
                        <div className="flex gap-2">
                          {STATUS_OPTIONS.map((status) => {
                            const isSelected = checklist[item.id] === status;
                            let activeClass = '';
                            if (isSelected) {
                              activeClass = status === 'Aman' ? 'bg-[#235347] text-white' : 
                                            status === 'Ganti' ? 'bg-red-600 text-white' : 
                                            'bg-amber-500 text-white';
                            } else {
                              activeClass = 'bg-white border border-[#E6DFD3] text-[#163832] hover:bg-[#FAF7F2]';
                            }

                            return (
                              <button
                                key={status}
                                onClick={() => handleChecklistChange(item.id, status)}
                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-sm ${activeClass}`}
                              >
                                {status}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 pt-4 border-t border-[#E6DFD3]">
                    <label className="text-[10px] font-bold text-[#8EB69B] uppercase tracking-widest">Catatan & Rekomendasi</label>
                    <Textarea 
                      placeholder="Masukkan catatan spesifik mengenai kondisi mesin, tindakan yang telah dilakukan, atau komponen yang perlu diganti pada servis berikutnya."
                      value={saran}
                      onChange={(e) => setSaran(e.target.value)}
                      className="min-h-[120px] bg-[#FAF7F2] border-[#E6DFD3] focus-visible:ring-[#8EB69B] resize-none rounded-xl text-sm font-medium text-[#051F20] p-4"
                    />
                  </div>
                </CardContent>
              </Card>

              <Button disabled={isProcessing} onClick={() => handleSelesai(activeKerjaan.id)} className="w-full h-14 text-sm font-black uppercase tracking-widest bg-[#235347] hover:bg-[#051F20] text-white rounded-2xl shadow-lg transition-all">
                <CheckCircle2 className="w-5 h-5 mr-2" /> Akhiri & Serahkan ke Kasir
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
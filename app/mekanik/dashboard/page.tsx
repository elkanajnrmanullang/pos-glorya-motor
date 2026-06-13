"use client"

import { useState } from 'react'
import { useMekanik } from '@/hooks/use-mekanik'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Wrench, CheckCircle2, Search, Plus, Trash2, Clock } from 'lucide-react'
import { toast } from 'sonner'

// TIKET ITEMS INTERFACE
interface TiketItem {
  id: string
  qty: number
  harga_snapshot: number
  barang?: {
    nama: string
  }
}

// TIKET JASA INTERFACE
interface TiketJasa {
  id: string
  nama_jasa: string
  harga_jasa: number
}

// MAIN COMPONENT
export default function MekanikDashboard() {
  const { 
    userProfile, tiketSemua, isLoadingTiket, barang, jasa, 
    klaimTiket, selesaiTiket, tambahItem, hapusItem, tambahJasa, hapusJasa, isProcessing 
  } = useMekanik()

  const [activeTab, setActiveTab] = useState<'menunggu' | 'kerja'>('menunggu')
  
  // DIALOG STATES
  const [isAddPartOpen, setIsAddPartOpen] = useState(false)
  const [isAddJasaOpen, setIsAddJasaOpen] = useState(false)
  const [searchPart, setSearchPart] = useState('')
  const [searchJasa, setSearchJasa] = useState('')

  // JASA MANUAL STATE
  const [customJasaName, setCustomJasaName] = useState('')
  const [customJasaPrice, setCustomJasaPrice] = useState<number | ''>('')

  // DATA FILTERING
  const tiketMenunggu = tiketSemua.filter(t => t.status === 'menunggu')
  const tiketDikerjakan = tiketSemua.filter(t => t.status === 'dikerjakan' && t.mekanik_id === userProfile?.id)
  
  const activeKerjaan = tiketDikerjakan[0]

  const filteredPart = barang.filter(b => b.nama.toLowerCase().includes(searchPart.toLowerCase())).slice(0, 15)
  const filteredJasa = jasa.filter(j => j.nama_jasa.toLowerCase().includes(searchJasa.toLowerCase()))

  // HANDLE KLAIM TIKET
  const handleKlaim = async (id: string) => {
    try {
      if (tiketDikerjakan.length > 0) return toast.error('Selesaikan pekerjaan saat ini terlebih dahulu!')
      await klaimTiket(id)
      toast.success('Tiket berhasil diklaim. Selamat bekerja!')
      setActiveTab('kerja')
    } catch {
      toast.error('Gagal mengklaim. Tiket mungkin sudah diambil mekanik lain.')
    }
  }

  // HANDLE SELESAI TIKET
  const handleSelesai = async (id: string) => {
    try {
      await selesaiTiket(id)
      toast.success('Pekerjaan selesai! Data dikirim ke Kasir.')
      setActiveTab('menunggu')
    } catch {
      toast.error('Gagal menyelesaikan pekerjaan.')
    }
  }

  // HANDLE SUBMIT JASA MANUAL
  const handleTambahJasaManual = async () => {
    if (!customJasaName || customJasaPrice === '' || customJasaPrice < 0) {
      return toast.error('Nama dan harga jasa manual wajib diisi dengan benar.')
    }
    try {
      await tambahJasa({ tiketId: activeKerjaan.id, namaJasa: customJasaName, harga: customJasaPrice })
      toast.success(`Jasa manual ditambah: ${customJasaName}`)
      setCustomJasaName('')
      setCustomJasaPrice('')
      setIsAddJasaOpen(false)
    } catch {
      toast.error('Gagal menambahkan jasa manual')
    }
  }

  return (
    <div className="w-full space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white">
          <Wrench className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Bengkel Aktif</h1>
          <p className="text-slate-500 font-medium text-sm">Pilih tiket, bongkar, dan catat perbaikan.</p>
        </div>
      </div>

      {/* MOBILE FRIENDLY TABS */}
      <div className="flex bg-slate-200/60 p-1 rounded-xl w-full max-w-sm">
        <button onClick={() => setActiveTab('menunggu')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'menunggu' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>
          Antrean ({tiketMenunggu.length})
        </button>
        <button onClick={() => setActiveTab('kerja')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'kerja' ? 'bg-slate-900 shadow text-white' : 'text-slate-500'}`}>
          Lembar Kerja
        </button>
      </div>

      {isLoadingTiket && <p className="text-center p-8 text-slate-500">Memuat data bengkel...</p>}

      {/* TAB ANTREAN MENUNGGU */}
      {!isLoadingTiket && activeTab === 'menunggu' && (
        <div className="grid gap-4 md:grid-cols-2">
          {tiketMenunggu.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
              <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-bold">Tidak ada antrean baru.</p>
            </div>
          ) : (
            tiketMenunggu.map((tiket) => (
              <Card key={tiket.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-black text-slate-800">{tiket.plat_motor}</h3>
                      <p className="text-blue-600 font-bold text-sm uppercase">{tiket.merk_motor}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      {new Date(tiket.waktu_masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                    <p className="text-xs font-bold text-red-800 mb-1">KELUHAN:</p>
                    <p className="text-sm text-red-900 font-medium">{tiket.keluhan || '-'}</p>
                  </div>
                  <Button disabled={isProcessing} onClick={() => handleKlaim(tiket.id)} className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700">
                    KLAIM & KERJAKAN
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB LEMBAR KERJA */}
      {!isLoadingTiket && activeTab === 'kerja' && (
        <div>
          {!activeKerjaan ? (
            <div className="py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
              <Wrench className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-bold">Anda belum mengklaim pekerjaan apapun.</p>
              <p className="text-sm mt-1">Buka tab Antrean untuk mengambil motor pelanggan.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* HEADER MOTOR */}
              <Card className="bg-slate-900 text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-3xl font-black tracking-wider text-yellow-400">{activeKerjaan.plat_motor}</h2>
                      <p className="font-bold text-slate-300 uppercase mt-0.5">{activeKerjaan.merk_motor}</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Sedang Dikerjakan
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg border border-white/5">
                    <p className="text-xs font-bold text-slate-400 mb-0.5">KELUHAN AWAL:</p>
                    <p className="text-sm font-medium">{activeKerjaan.keluhan}</p>
                  </div>
                </CardContent>
              </Card>

              {/* MODUL SUKU CADANG */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-800">Suku Cadang (Part)</CardTitle>
                  <Button size="sm" onClick={() => setIsAddPartOpen(true)} className="bg-slate-900 text-white h-8 text-xs"><Plus className="w-3.5 h-3.5 mr-1" /> Tambah</Button>
                </CardHeader>
                <CardContent className="p-0">
                  {activeKerjaan.tiket_items?.length === 0 ? (
                    <p className="text-center text-slate-400 py-6 text-sm">Belum ada suku cadang ditambahkan.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {activeKerjaan.tiket_items.map((item: TiketItem) => (
                        <li key={item.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{item.barang?.nama}</p>
                            <p className="text-xs text-slate-500 font-medium">{item.qty} x Rp {item.harga_snapshot.toLocaleString('id-ID')}</p>
                          </div>
                          <Button disabled={isProcessing} variant="ghost" size="icon" onClick={() => hapusItem(item.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* MODUL JASA */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-800">Jasa Servis</CardTitle>
                  <Button size="sm" onClick={() => setIsAddJasaOpen(true)} className="bg-slate-900 text-white h-8 text-xs"><Plus className="w-3.5 h-3.5 mr-1" /> Tambah</Button>
                </CardHeader>
                <CardContent className="p-0">
                  {activeKerjaan.tiket_jasa?.length === 0 ? (
                    <p className="text-center text-slate-400 py-6 text-sm">Belum ada jasa ditambahkan.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {activeKerjaan.tiket_jasa.map((jasaItem: TiketJasa) => (
                        <li key={jasaItem.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{jasaItem.nama_jasa}</p>
                            <p className="text-xs text-slate-500 font-medium">Rp {jasaItem.harga_jasa.toLocaleString('id-ID')}</p>
                          </div>
                          <Button disabled={isProcessing} variant="ghost" size="icon" onClick={() => hapusJasa(jasaItem.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* TOMBOL SELESAI */}
              <Button disabled={isProcessing} onClick={() => handleSelesai(activeKerjaan.id)} className="w-full h-14 text-base font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg">
                <CheckCircle2 className="w-5 h-5 mr-2" /> SELESAI PEKERJAAN
              </Button>
            </div>
          )}
        </div>
      )}

      {/* DIALOG TAMBAH SPAREPART */}
      <Dialog open={isAddPartOpen} onOpenChange={setIsAddPartOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Cari & Tambah Suku Cadang</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Ketik nama part..." value={searchPart} onChange={(e) => setSearchPart(e.target.value)} className="pl-9" />
            </div>
            <div className="max-h-72 overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-100">
              {filteredPart.length === 0 ? <p className="text-sm text-center text-slate-400 py-4">Barang tidak ditemukan atau stok habis.</p> : 
               filteredPart.map((b) => (
                <div key={b.id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                  <div>
                    <p className="font-bold text-sm text-slate-800">{b.nama}</p>
                    <p className="text-xs font-medium text-emerald-600">Stok: {b.stok_fisik - b.stok_reserved}</p>
                  </div>
                  <Button disabled={isProcessing} size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700" onClick={async () => {
                    try {
                      await tambahItem({ tiketId: activeKerjaan.id, barangId: b.id, qty: 1, harga: b.harga_jual })
                      toast.success(`Ditambahkan: ${b.nama}`)
                      setIsAddPartOpen(false)
                    } catch (error) { 
                      toast.error(error instanceof Error ? error.message : 'Gagal menambahkan barang') 
                    }
                  }}>Tambah</Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG TAMBAH JASA */}
      <Dialog open={isAddJasaOpen} onOpenChange={setIsAddJasaOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Tambah Jasa Servis</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            
            {/* INPUT JASA MANUAL */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase">Input Jasa Manual</p>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Nama jasa..." value={customJasaName} onChange={(e) => setCustomJasaName(e.target.value)} className="h-9 text-sm bg-white" />
                <Input type="number" placeholder="Harga..." value={customJasaPrice} onChange={(e) => setCustomJasaPrice(e.target.value ? Number(e.target.value) : '')} className="h-9 text-sm bg-white" />
              </div>
              <Button disabled={isProcessing} onClick={handleTambahJasaManual} className="w-full h-9 text-xs bg-slate-800 text-white hover:bg-black">
                Tambah Jasa Manual
              </Button>
            </div>

            <div className="relative pt-2">
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Atau Pilih Dari Katalog</p>
              <Search className="w-4 h-4 absolute left-3 top-10 text-slate-400" />
              <Input placeholder="Cari katalog jasa..." value={searchJasa} onChange={(e) => setSearchJasa(e.target.value)} className="pl-9" />
            </div>

            <div className="max-h-56 overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-100">
              {filteredJasa.length === 0 ? <p className="text-sm text-center text-slate-400 py-4">Jasa tidak ditemukan.</p> : 
               filteredJasa.map((j) => (
                <div key={j.id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                  <div>
                    <p className="font-bold text-sm text-slate-800">{j.nama_jasa}</p>
                    <p className="text-xs font-medium text-slate-500">Rp {j.harga_jasa.toLocaleString('id-ID')}</p>
                  </div>
                  <Button disabled={isProcessing} size="sm" className="h-7 text-xs bg-slate-900 text-white" onClick={async () => {
                    try {
                      await tambahJasa({ tiketId: activeKerjaan.id, namaJasa: j.nama_jasa, harga: j.harga_jasa })
                      toast.success(`Jasa ditambah: ${j.nama_jasa}`)
                      setIsAddJasaOpen(false)
                    } catch { 
                      toast.error('Gagal menambahkan jasa') 
                    }
                  }}>Pilih</Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
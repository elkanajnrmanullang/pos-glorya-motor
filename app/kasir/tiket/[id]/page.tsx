"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Printer, User, CreditCard, Search, Plus, Trash2, Box, Loader2, Activity, ChevronLeft, ChevronRight, Receipt, UserCircle, CalendarDays, AlertCircle, Wrench, FileDown, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { hitungHargaJasa } from '@/lib/utils/kalkulasi-jasa'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

interface PageProps { params: { id: string } }

function JasaItemCard({ jasa, ccMotor, onAdd, isPending }: { jasa: any, ccMotor: number, onAdd: (data: any) => void, isPending: boolean }) {
  const [kesulitan, setKesulitan] = useState<'mudah' | 'sedang' | 'sulit'>(jasa.default_kesulitan || 'mudah')
  const hargaFinal = hitungHargaJasa(Number(jasa.harga_dasar || 0), ccMotor, kesulitan)
  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

  return (
    <div className="border border-[#E6DFD3] rounded-xl p-3 flex flex-col justify-between bg-white hover:border-[#8EB69B] hover:shadow-sm transition-all gap-3">
      <div>
        <p className="text-sm font-semibold text-[#051F20] line-clamp-1" title={jasa.nama_jasa}>{jasa.nama_jasa}</p>
        <p className="font-bold text-[#235347] text-sm mt-0.5">{formatRupiah(hargaFinal)}</p>
      </div>
      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
        <select
          value={kesulitan}
          onChange={(e) => setKesulitan(e.target.value as 'mudah'|'sedang'|'sulit')}
          className="flex-1 h-8 text-xs bg-slate-50 border border-[#E6DFD3] rounded-lg px-2 text-[#051F20] font-medium outline-none focus:border-[#8EB69B] cursor-pointer"
        >
          <option value="mudah">Mudah</option>
          <option value="sedang">Sedang</option>
          <option value="sulit">Sulit</option>
        </select>
        <Button 
          size="sm" variant="ghost" 
          onClick={() => onAdd({ nama: jasa.nama_jasa, harga: hargaFinal, kesulitan })} 
          disabled={isPending} 
          className="h-8 text-xs bg-[#FAF7F2] text-[#163832] hover:bg-[#235347] hover:text-white rounded-lg border border-[#E6DFD3] px-3 font-semibold transition-colors"
        >
          Tambah
        </Button>
      </div>
    </div>
  )
}

export default function DetailPembayaranPage({ params }: PageProps) {
  const tiketId = params.id
  const supabase = createClient()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [metodeBayar, setMetodeBayar] = useState<'tunai' | 'qris' | 'transfer'>('tunai')
  const [uangDibayar, setUangDibayar] = useState<number>(0)
  const [showNota, setShowNota] = useState(false)
  
  const [activeTab, setActiveTab] = useState<'part' | 'jasa'>('part')
  const [searchKatalog, setSearchKatalog] = useState('')
  const [pageBarang, setPageBarang] = useState(1)
  const ITEMS_PER_PAGE = 20

  const { data: tiket, isLoading: isTiketLoading } = useQuery({
    queryKey: ['tiket-detail', tiketId],
    queryFn: async () => {
      const { data, error } = await supabase.from('tiket_servis').select('*, customers(nama, no_telp)').eq('id', tiketId).single()
      if (error) throw error

      const { data: riwayat } = await supabase
        .from('tiket_servis')
        .select('waktu_lunas')
        .eq('plat_motor', data.plat_motor)
        .eq('status', 'lunas')
        .lt('waktu_masuk', data.waktu_masuk)
        .order('waktu_lunas', { ascending: false })
        .limit(1)
        .maybeSingle()

      return { ...data, kunjungan_terakhir: riwayat?.waktu_lunas }
    }
  })

  const { data: spareparts, isLoading: isPartsLoading } = useQuery({
    queryKey: ['tiket-parts', tiketId],
    queryFn: async () => {
      const { data, error } = await supabase.from('tiket_items').select('*, barang(nama)').eq('tiket_id', tiketId)
      if (error) throw error
      return data || []
    }
  })

  const { data: services, isLoading: isServicesLoading } = useQuery({
    queryKey: ['tiket-services', tiketId],
    queryFn: async () => {
      const { data, error } = await supabase.from('tiket_jasa').select('*').eq('tiket_id', tiketId)
      if (error) throw error
      return data || []
    }
  })

  const { data: katalogBarang, isLoading: isKatalogBarangLoading } = useQuery({
    queryKey: ['katalog-barang', searchKatalog, pageBarang],
    queryFn: async () => {
      const from = (pageBarang - 1) * ITEMS_PER_PAGE
      const to = pageBarang * ITEMS_PER_PAGE - 1
      let q = supabase.from('barang').select('*', { count: 'exact' }).eq('aktif', true)
      
      if (searchKatalog) {
        q = q.or(`nama.ilike.%${searchKatalog}%,sku.ilike.%${searchKatalog}%`)
      }
      
      const { data, count, error } = await q.range(from, to).order('nama')
      if (error) throw error
      return { data: data || [], count: count || 0 }
    }
  })

  const { data: katalogJasa, isLoading: isKatalogJasaLoading } = useQuery({
    queryKey: ['katalog-jasa', searchKatalog],
    queryFn: async () => {
      let q = supabase.from('katalog_jasa').select('*').eq('aktif', true)
      if (searchKatalog) {
        q = q.ilike('nama_jasa', `%${searchKatalog}%`)
      }
      const { data, error } = await q.order('nama_jasa')
      if (error) throw error
      return data || []
    }
  })

  const addItemMutation = useMutation({
    mutationFn: async ({ sku, harga }: { sku: string, harga: number }) => {
      const { error } = await supabase.rpc('tambah_item_tiket', { p_tiket_id: tiketId, p_barang_sku: sku, p_qty: 1, p_harga: harga })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiket-parts', tiketId] })
      queryClient.invalidateQueries({ queryKey: ['tiket-detail', tiketId] })
      queryClient.invalidateQueries({ queryKey: ['katalog-barang'] })
      toast.success('Suku cadang ditambahkan')
    },
    onError: (err: any) => toast.error(err.message || 'Stok tidak mencukupi')
  })

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.rpc('hapus_item_tiket', { p_item_id: itemId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiket-parts', tiketId] })
      queryClient.invalidateQueries({ queryKey: ['tiket-detail', tiketId] })
      queryClient.invalidateQueries({ queryKey: ['katalog-barang'] })
    }
  })

  const addJasaMutation = useMutation({
    mutationFn: async ({ nama, harga, kesulitan }: { nama: string, harga: number, kesulitan: string }) => {
      const { error } = await supabase.rpc('tambah_jasa_tiket', { 
        p_tiket_id: tiketId, 
        p_nama_jasa: nama, 
        p_harga: harga,
        p_kesulitan: kesulitan 
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiket-services', tiketId] })
      queryClient.invalidateQueries({ queryKey: ['tiket-detail', tiketId] })
      toast.success('Jasa servis ditambahkan')
    }
  })

  const removeJasaMutation = useMutation({
    mutationFn: async (jasaId: string) => {
      const { error } = await supabase.rpc('hapus_jasa_tiket', { p_jasa_id: jasaId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiket-services', tiketId] })
      queryClient.invalidateQueries({ queryKey: ['tiket-detail', tiketId] })
    }
  })

  const lunasMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('proses_pelunasan_kasir', { p_tiket_id: tiketId, p_metode_bayar: metodeBayar })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Pembayaran berhasil dilunasi!')
      queryClient.invalidateQueries({ queryKey: ['tiket-aktif'] })
      queryClient.invalidateQueries({ queryKey: ['tiket-detail', tiketId] })
      setShowNota(true)
    }
  })

  const unduhPDF = async () => {
    const element = document.getElementById('nota-hidden-print')
    if (!element) return toast.error('Gagal memproses nota')

    try {
      element.style.display = 'block'
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' })
      element.style.display = 'none'

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 150] })
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Invoice_${tiket?.nomor_antrian || 'Servis'}.pdf`)
      
      toast.success('PDF berhasil diunduh')
    } catch (error) {
      console.error(error)
      toast.error('Terjadi kesalahan saat membuat PDF')
    }
  }

  const kirimWA = () => {
    if (!tiket?.customers?.no_telp) return toast.error('Nomor WA pelanggan tidak ditemukan')
    
    let phone = tiket.customers.no_telp.replace(/\D/g, '')
    if (phone.startsWith('0')) phone = '62' + phone.substring(1)

    let pesan = `*GLORYA MOTOR*\nJl. Raya Bengkel No. 123\n\n`
    pesan += `*STRUK SERVIS KENDARAAN*\n`
    pesan += `No: ${tiket.nomor_antrian}\n`
    pesan += `Tanggal: ${new Date(tiket.waktu_lunas || tiket.waktu_selesai).toLocaleString('id-ID')}\n`
    pesan += `Pelanggan: ${tiket.customers.nama}\n`
    pesan += `Kendaraan: ${tiket.merk_motor} (${tiket.plat_motor})\n`
    pesan += `----------------------------------\n`
    
    if (services && services.length > 0) {
      pesan += `*Jasa Layanan:*\n`
      services.forEach((j: any) => {
        pesan += `- ${j.nama_jasa}: ${formatRupiah(Number(j.harga_jasa))}\n`
      })
    }
    
    if (spareparts && spareparts.length > 0) {
      pesan += `\n*Suku Cadang:*\n`
      spareparts.forEach((p: any) => {
        pesan += `- ${p.barang?.nama} (${p.qty}x): ${formatRupiah(p.qty * p.harga_snapshot)}\n`
      })
    }
    
    pesan += `----------------------------------\n`
    pesan += `*Total: ${formatRupiah(totalAkhir)}*\n`
    pesan += `Metode: ${(tiket.metode_bayar || '').toUpperCase()}\n\n`

    if (tiket.keluhan) {
      pesan += `*Keluhan Awal:*\n${tiket.keluhan}\n\n`
    }
    
    if (tiket.saran_mekanik || tiket.catatan_kesehatan_mesin) {
      pesan += `*Laporan Mekanik:*\n${tiket.saran_mekanik || tiket.catatan_kesehatan_mesin}\n\n`
    }

    pesan += `Terima kasih telah mempercayakan kendaraan Anda di Glorya Motor! 🙏`

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(pesan)}`, '_blank')
  }

  const formatInputRibuan = (val: number) => val ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ''
  const parseInputRibuan = (val: string) => isNaN(parseInt(val.replace(/[^0-9]/g, ''), 10)) ? 0 : parseInt(val.replace(/[^0-9]/g, ''), 10)
  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  if (isTiketLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#8EB69B]" /></div>
  if (!tiket) return <div className="p-12 text-center text-sm text-slate-500">Data tiket tidak ditemukan.</div>

  const totalJasa = Number(tiket.total_jasa || 0)
  const totalPart = Number(tiket.total_part || 0)
  const totalAkhir = totalJasa + totalPart
  const kembalian = uangDibayar - totalAkhir

  const isLunas = tiket.status === 'lunas'
  const isSelesai = tiket.status === 'selesai' || isLunas
  const totalPagesBarang = Math.ceil((katalogBarang?.count || 0) / ITEMS_PER_PAGE)

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 font-sans relative">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/kasir/tiket/aktif')} className="h-10 w-10 rounded-xl border-[#E6DFD3] hover:bg-slate-50 text-[#051F20]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-semibold text-[#051F20] tracking-tight">Detail Tiket {tiket.nomor_antrian}</h2>
            <p className="text-sm text-slate-500 mt-0.5">Kelola rincian biaya dan pelunasan transaksi</p>
          </div>
        </div>
        <div className={`text-xs font-semibold px-4 py-2 rounded-lg tracking-wide ${isLunas ? 'bg-emerald-100 text-emerald-800' : isSelesai ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
          STATUS: {tiket.status.toUpperCase()}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12 items-start">
        
        <div className="xl:col-span-7 space-y-6">
          <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-[#FAF7F2] py-4 border-b border-[#E6DFD3]">
              <CardTitle className="text-sm font-semibold text-[#051F20] flex items-center gap-2">
                <User className="w-4 h-4 text-[#8EB69B]" /> Identitas Kendaraan & Pelanggan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6">
              <div>
                <p className="text-xs text-slate-500 mb-1">Nama Pelanggan (ID)</p>
                <p className="text-sm font-medium text-[#051F20]">
                  {tiket.customers?.nama || 'Non-Member'} {tiket.customer_id && <span className="text-xs text-slate-400 font-normal">({tiket.customer_id})</span>}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Motor & Plat</p>
                <p className="text-sm font-medium text-[#051F20]">
                  {tiket.merk_motor} {tiket.cc_motor ? `(${tiket.cc_motor}cc)` : ''} — <span className="text-[#235347] bg-[#E1EFE6] px-1.5 py-0.5 rounded">{tiket.plat_motor}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Tanggal Kunjungan</p>
                <p className="text-sm font-medium text-[#051F20]">{formatDate(tiket.waktu_masuk)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Kunjungan Terakhir</p>
                <p className="text-sm font-medium text-[#051F20]">{tiket.kunjungan_terakhir ? formatDate(tiket.kunjungan_terakhir) : 'Servis Pertama (Baru)'}</p>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Keluhan Awal</p>
                <p className="text-sm text-[#051F20] bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {tiket.keluhan || 'Tidak ada keluhan.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {isSelesai && (
            <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-[#FAF7F2] py-4 border-b border-[#E6DFD3]">
                <CardTitle className="text-sm font-semibold text-[#051F20] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" /> Rapor Kesehatan Kendaraan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Checklist Pemeriksaan Mekanik</p>
                  {tiket.checklist_kendaraan && Object.keys(tiket.checklist_kendaraan).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(tiket.checklist_kendaraan).map(([key, val]) => (
                        <span key={key} className={`text-xs px-2.5 py-1 rounded-md border ${val === 'Aman' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : val === 'Ganti' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                          {key.replace('_', ' ').toUpperCase()}: {String(val)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">Belum ada pengecekan komponen.</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Catatan & Saran Lanjutan</p>
                  <p className="text-sm text-[#051F20] bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                    {tiket.saran_mekanik || <span className="text-slate-400 italic">Mekanik belum memberikan saran lanjutan.</span>}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {!isLunas && (
            <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-[#FAF7F2] py-4 border-b border-[#E6DFD3] flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-[#051F20] flex items-center gap-2">
                  <Box className="w-4 h-4 text-[#8EB69B]" /> Katalog Layanan & Suku Cadang
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex border-b border-[#E6DFD3]">
                  <button onClick={() => { setActiveTab('part'); setSearchKatalog(''); setPageBarang(1); }} className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'part' ? 'border-b-2 border-[#235347] text-[#235347]' : 'text-slate-500 hover:bg-slate-50'}`}>Suku Cadang</button>
                  <button onClick={() => { setActiveTab('jasa'); setSearchKatalog(''); }} className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'jasa' ? 'border-b-2 border-[#235347] text-[#235347]' : 'text-slate-500 hover:bg-slate-50'}`}>Jasa Servis</button>
                </div>
                
                <div className="p-4">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder={`Cari ${activeTab === 'part' ? 'nama sparepart atau SKU' : 'nama jasa'}...`} 
                      value={searchKatalog} 
                      onChange={e => { setSearchKatalog(e.target.value); setPageBarang(1); }}
                      className="pl-9 bg-slate-50 border-[#E6DFD3] focus-visible:ring-[#8EB69B] rounded-xl text-sm"
                    />
                  </div>

                  {activeTab === 'part' ? (
                    <div className="space-y-4">
                      {isKatalogBarangLoading ? (
                        <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#8EB69B]" /></div>
                      ) : katalogBarang?.data.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-500">Barang tidak ditemukan.</div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {katalogBarang?.data.map((b) => (
                            <div key={b.sku} className="border border-[#E6DFD3] rounded-xl p-3 flex flex-col justify-between bg-white hover:border-[#8EB69B] hover:shadow-sm transition-all">
                              <div>
                                <p className="text-xs font-semibold text-[#051F20] line-clamp-2" title={b.nama}>{b.nama}</p>
                                <p className="text-[10px] text-slate-500 mt-1">Stok: {b.stok_tersedia}</p>
                              </div>
                              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                                <span className="font-semibold text-[#235347] text-xs">{formatRupiah(b.harga_jual)}</span>
                                <Button 
                                  size="sm" variant="ghost" 
                                  onClick={() => addItemMutation.mutate({ sku: b.sku, harga: b.harga_jual })} 
                                  disabled={b.stok_tersedia <= 0 || addItemMutation.isPending} 
                                  className="h-7 w-7 p-0 bg-[#E1EFE6] text-[#235347] hover:bg-[#235347] hover:text-white rounded-md shrink-0"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {totalPagesBarang > 1 && (
                        <div className="flex items-center justify-between pt-2">
                          <Button variant="outline" size="sm" onClick={() => setPageBarang(p => Math.max(1, p - 1))} disabled={pageBarang === 1} className="h-8 text-xs border-[#E6DFD3] rounded-lg">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                          </Button>
                          <span className="text-xs font-medium text-slate-500">Hal {pageBarang} / {totalPagesBarang}</span>
                          <Button variant="outline" size="sm" onClick={() => setPageBarang(p => Math.min(totalPagesBarang, p + 1))} disabled={pageBarang === totalPagesBarang} className="h-8 text-xs border-[#E6DFD3] rounded-lg">
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {isKatalogJasaLoading ? (
                        <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#8EB69B]" /></div>
                      ) : katalogJasa?.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-500">Jasa tidak ditemukan.</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {katalogJasa?.map((j) => (
                            <JasaItemCard 
                              key={j.id} 
                              jasa={j} 
                              ccMotor={tiket.cc_motor || 0}
                              onAdd={(data) => addJasaMutation.mutate(data)}
                              isPending={addJasaMutation.isPending}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="xl:col-span-5 space-y-6">
          <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-2xl overflow-hidden sticky top-6">
            <CardHeader className="border-b border-[#E6DFD3] bg-[#FAF7F2] py-4">
              <CardTitle className="text-sm font-semibold text-[#051F20]">Rincian Tagihan</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white">
                  <TableRow className="border-slate-100">
                    <TableHead className="text-slate-500 font-medium pl-5 text-xs">Item</TableHead>
                    <TableHead className="text-center text-slate-500 font-medium text-xs">Qty</TableHead>
                    <TableHead className="text-right text-slate-500 font-medium pr-5 text-xs">Harga</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white">
                  {isServicesLoading || isPartsLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto text-[#8EB69B]"/></TableCell></TableRow>
                  ) : (
                    <>
                      {services?.map((svc) => (
                        <TableRow key={svc.id} className="border-slate-50 hover:bg-slate-50">
                          <TableCell className="pl-5 py-3">
                            <p className="text-xs font-semibold text-[#051F20]">{svc.nama_jasa}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 capitalize">Jasa • {svc.tingkat_kesulitan}</p>
                          </TableCell>
                          <TableCell className="text-center text-slate-500 text-xs">1</TableCell>
                          <TableCell className="text-right pr-5">
                            <span className="text-xs font-semibold text-[#051F20]">{formatRupiah(Number(svc.harga_jasa))}</span>
                            {!isLunas && (
                              <button onClick={() => removeJasaMutation.mutate(svc.id)} className="ml-2 p-1 text-red-400 hover:text-red-600 transition-colors align-middle"><Trash2 className="w-3.5 h-3.5" /></button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {spareparts?.map((part) => (
                        <TableRow key={part.id} className="border-slate-50 hover:bg-slate-50">
                          <TableCell className="pl-5 py-3">
                            <p className="text-xs font-semibold text-[#051F20]">{part.barang?.nama}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Part</p>
                          </TableCell>
                          <TableCell className="text-center text-slate-500 text-xs">{part.qty}</TableCell>
                          <TableCell className="text-right pr-5">
                            <span className="text-xs font-semibold text-[#051F20]">{formatRupiah(Number(part.harga_snapshot) * part.qty)}</span>
                            {!isLunas && (
                              <button onClick={() => removeItemMutation.mutate(part.id)} className="ml-2 p-1 text-red-400 hover:text-red-600 transition-colors align-middle"><Trash2 className="w-3.5 h-3.5" /></button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!services?.length && !spareparts?.length && (
                        <TableRow><TableCell colSpan={3} className="text-center text-slate-400 py-6 text-xs italic">Belum ada item ditambahkan.</TableCell></TableRow>
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
              <div className="bg-[#FAF7F2] p-5 border-t border-[#E6DFD3] space-y-2">
                <div className="flex justify-between text-slate-500 text-xs font-medium"><span>Subtotal Jasa</span><span>{formatRupiah(totalJasa)}</span></div>
                <div className="flex justify-between text-slate-500 text-xs font-medium"><span>Subtotal Part</span><span>{formatRupiah(totalPart)}</span></div>
                <div className="flex justify-between items-center pt-3 mt-3 border-t border-[#E6DFD3]">
                  <span className="text-sm font-semibold text-[#163832]">Total Tagihan</span>
                  <span className="text-xl font-bold text-[#235347]">{formatRupiah(totalAkhir)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-2xl overflow-hidden sticky top-[480px]">
            <CardHeader className="bg-[#051F20] py-4">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#8EB69B]" /> Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              {!isSelesai ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3"><Loader2 className="w-6 h-6 animate-spin" /></div>
                  <p className="text-sm font-semibold text-[#051F20]">Pengerjaan Berlangsung</p>
                  <p className="text-xs text-slate-500 mt-1">Pembayaran menunggu mekanik menyelesaikan tiket.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">Pilih Metode</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['tunai', 'qris', 'transfer'].map(method => (
                        <Button 
                          key={method} type="button" variant={metodeBayar === method ? 'default' : 'outline'} disabled={isLunas}
                          className={`h-10 text-xs font-semibold rounded-xl transition-all capitalize ${metodeBayar === method ? 'bg-[#235347] text-white' : 'bg-white border-[#E6DFD3] text-slate-600 hover:bg-slate-50'}`}
                          onClick={() => setMetodeBayar(method as any)}
                        >
                          {method}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {metodeBayar === 'tunai' && !isLunas && (
                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-semibold text-slate-600">Uang Diterima</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">Rp</span>
                        <Input 
                          type="text" value={formatInputRibuan(uangDibayar)} onChange={(e) => setUangDibayar(parseInputRibuan(e.target.value))} placeholder="0"
                          className="pl-11 h-12 font-bold text-lg bg-white border-[#E6DFD3] text-[#051F20] focus-visible:ring-[#8EB69B] rounded-xl"
                        />
                      </div>
                      {uangDibayar >= totalAkhir && totalAkhir > 0 && (
                        <div className="p-3 mt-2 bg-emerald-50 border border-emerald-100 rounded-xl flex justify-between items-center">
                          <span className="font-medium text-emerald-800 text-xs">Kembalian</span>
                          <span className="font-bold text-emerald-700 text-base">{formatRupiah(kembalian)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {isLunas ? (
                    <Button type="button" onClick={() => setShowNota(true)} className="w-full h-12 text-sm font-semibold bg-[#051F20] hover:bg-black text-white rounded-xl shadow-sm transition-all">
                      <Printer className="w-4 h-4 mr-2" /> CETAK INVOICE & RAPOR
                    </Button>
                  ) : (
                    <Button 
                      type="button" disabled={lunasMutation.isPending || (metodeBayar === 'tunai' && uangDibayar < totalAkhir) || totalAkhir === 0}
                      onClick={() => lunasMutation.mutate()} className="w-full h-12 text-sm font-semibold bg-[#235347] hover:bg-[#051F20] text-white shadow-sm rounded-xl transition-all"
                    >
                      {lunasMutation.isPending ? 'MEMPROSES...' : 'SELESAIKAN PEMBAYARAN'}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showNota} onOpenChange={setShowNota}>
        <DialogContent className="sm:max-w-4xl w-[95vw] bg-[#FAF7F2] border border-[#E6DFD3] rounded-2xl shadow-sm p-0 overflow-hidden max-h-[90vh] flex flex-col gap-0 font-sans">
          <div className="p-6 bg-white border-b border-[#E6DFD3] flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-black text-[#051F20] flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#8EB69B]" /> Struk Laporan {tiket?.nomor_antrian}
              </DialogTitle>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="border-0 uppercase tracking-widest font-bold text-[10px] px-2.5 py-1 bg-blue-50 text-blue-600">
                Servis Kendaraan
              </Badge>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <UserCircle className="w-8 h-8 text-slate-300" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identitas Konsumen</p>
                      <p className="text-base font-bold text-[#051F20]">{tiket?.customers?.nama || 'Pelanggan Umum'}</p>
                      {tiket?.customers?.no_telp && <p className="text-xs font-medium text-slate-500 mt-0.5">HP: {tiket.customers.no_telp}</p>}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                    <CalendarDays className="w-5 h-5 text-slate-300" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu Transaksi</p>
                      <p className="text-sm font-bold text-[#051F20]">{formatDate(tiket?.waktu_lunas || tiket?.waktu_selesai || '')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl">
                <CardContent className="p-5 flex flex-col justify-center h-full">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Kendaraan Pelanggan</p>
                  <h3 className="text-lg font-black text-[#051F20]">
                    {tiket?.merk_motor || '-'} <span className="text-sm text-slate-500 font-semibold">{tiket?.cc_motor ? `(${tiket.cc_motor}cc)` : ''}</span>
                  </h3>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="px-3 py-1.5 bg-slate-100 text-[#051F20] font-black text-sm rounded-md tracking-widest border border-slate-200">
                      {tiket?.plat_motor || '-'}
                    </span>
                    {tiket?.tahun_motor && <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tahun {tiket.tahun_motor}</span>}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-sm">
                <p className="font-bold text-xs text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4"/> Keluhan Awal 
                </p>
                <p className="text-[#051F20] font-medium text-sm leading-relaxed">
                  {tiket?.keluhan || '-'}
                </p>
              </div>
              
              <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm">
                <p className="font-bold text-xs text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4"/> Laporan / Saran Mekanik
                </p>
                <div className="text-[#051F20] font-medium text-sm leading-relaxed">
                    {tiket?.saran_mekanik || tiket?.catatan_kesehatan_mesin || <span className="text-slate-400 italic">Tidak ada catatan khusus dari mekanik.</span>}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E6DFD3] shadow-sm overflow-hidden mt-6">
              <div className="bg-[#FAF7F2] px-5 py-3 border-b border-[#E6DFD3]">
                <h4 className="text-sm font-bold text-[#051F20]">Rincian Tindakan & Pembelian</h4>
              </div>
              
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Jasa Layanan</p>
                    <div className="space-y-3">
                      {services && services.length > 0 ? (
                        services.map((j: any, i: number) => (
                          <div key={`jasa-${i}`} className="flex justify-between items-start text-sm">
                            <span className="font-medium text-[#051F20] flex-1 pr-4">{j.nama_jasa}</span>
                            <span className="font-bold text-[#051F20] whitespace-nowrap">{formatRupiah(Number(j.harga_jasa))}</span>
                          </div>
                        ))
                      ) : totalJasa > 0 ? (
                        <div className="flex justify-between items-start text-sm">
                          <span className="font-medium text-[#051F20] flex-1 pr-4">Jasa Servis (Manual)</span>
                          <span className="font-bold text-[#051F20] whitespace-nowrap">{formatRupiah(totalJasa)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium italic block py-2">-</span>
                      )}
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subtotal Jasa</span>
                      <span className="text-sm font-bold text-[#051F20]">{formatRupiah(totalJasa)}</span>
                    </div>
                  </div>

                  <div className="space-y-4 md:border-l md:border-slate-100 md:pl-6 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Suku Cadang / Sparepart</p>
                    <div className="space-y-3">
                      {spareparts && spareparts.length > 0 ? (
                        spareparts.map((it: any, i: number) => (
                          <div key={`item-${i}`} className="flex justify-between items-start text-sm">
                            <div className="flex gap-2 flex-1 pr-4">
                              <span className="text-slate-500 font-bold shrink-0">{it.qty}x</span>
                              <span className="font-medium text-[#051F20]">{it.barang?.nama || 'Barang Terhapus'}</span>
                            </div>
                            <span className="font-bold text-[#051F20] whitespace-nowrap">{formatRupiah((Number(it.qty) || 0) * (Number(it.harga_snapshot) || 0))}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 font-medium italic block py-2">-</span>
                      )}
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subtotal Part</span>
                      <span className="text-sm font-bold text-[#051F20]">{formatRupiah(totalPart)}</span>
                    </div>
                  </div>

                </div>
                
                <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-[#E6DFD3] mt-6">
                  <span className="font-black text-[#051F20] text-sm uppercase tracking-widest mb-2 sm:mb-0">TOTAL PEMBAYARAN</span>
                  <span className="font-black text-3xl text-[#235347]">{formatRupiah(totalAkhir)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <Button onClick={unduhPDF} variant="outline" className="h-12 w-full border-[#E6DFD3] text-[#051F20] font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-[#FAF7F2]">
                <FileDown className="w-5 h-5 text-blue-600" /> <span>Unduh PDF</span>
              </Button>
              <Button onClick={kirimWA} variant="outline" className="h-12 w-full border-[#E6DFD3] text-[#051F20] font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-[#FAF7F2]">
                <MessageCircle className="w-5 h-5 text-emerald-600" /> <span>Kirim ke WA</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div id="nota-hidden-print" className="bg-white p-4 w-[280px] hidden text-black mx-auto absolute top-0 left-0 -z-50" style={{ fontFamily: 'monospace' }}>
        <div className="text-center pb-4 border-b border-dashed border-gray-400">
          <h1 className="text-xl font-bold">GLORYA MOTOR</h1>
          <p className="text-[10px] mt-1">Jl. Raya Bengkel No. 123</p>
        </div>
        <div className="py-2 text-[10px] border-b border-dashed border-gray-400 space-y-1">
          <div className="flex justify-between"><span>No</span><span>{tiket?.nomor_antrian}</span></div>
          <div className="flex justify-between"><span>Tgl</span><span>{new Date(tiket?.waktu_lunas || Date.now()).toLocaleString('id-ID')}</span></div>
          <div className="flex justify-between"><span>Plg</span><span>{tiket?.customers?.nama || 'Umum'}</span></div>
          <div className="flex justify-between"><span>Mtr</span><span>{tiket?.plat_motor}</span></div>
        </div>
        <div className="py-2 border-b border-dashed border-gray-400">
          {services?.map((svc: any, i: number) => (
            <div key={`svc-${i}`} className="mb-2 text-[10px]">
              <div>[Jasa] {svc.nama_jasa}</div>
              <div className="flex justify-between">
                <span>1 x {formatRupiah(Number(svc.harga_jasa))}</span>
                <span>{formatRupiah(Number(svc.harga_jasa))}</span>
              </div>
            </div>
          ))}
          {spareparts?.map((part: any, i: number) => (
            <div key={`part-${i}`} className="mb-2 text-[10px]">
              <div>[Part] {part.barang?.nama}</div>
              <div className="flex justify-between">
                <span>{part.qty} x {formatRupiah(Number(part.harga_snapshot))}</span>
                <span>{formatRupiah(part.qty * Number(part.harga_snapshot))}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="py-2 text-[10px] space-y-1">
          <div className="flex justify-between font-bold"><span>Total</span><span>{formatRupiah(totalAkhir)}</span></div>
          <div className="flex justify-between"><span>Bayar ({tiket?.metode_bayar})</span><span>{formatRupiah(totalAkhir)}</span></div>
        </div>
        <div className="text-center text-[10px] mt-4 pt-2 border-t border-dashed border-gray-400">
          <p>Terima kasih atas kunjungannya!</p>
          <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</p>
        </div>
      </div>

    </div>
  )
}
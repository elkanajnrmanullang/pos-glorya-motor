"use client"

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Printer, User, Wrench, CreditCard, Search, Plus, Minus, Trash2, Box, Loader2, Calendar, FileText, Activity, Lightbulb, History, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface PageProps { params: { id: string } }

// COMPONENT_TIKET_DETAIL_PAGE
export default function DetailPembayaranPage({ params }: PageProps) {
  const tiketId = params.id
  const supabase = createClient()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [metodeBayar, setMetodeBayar] = useState<'tunai' | 'qris' | 'transfer'>('tunai')
  const [uangDibayar, setUangDibayar] = useState<number>(0)
  const [searchPart, setSearchPart] = useState('')

  // FETCH_DETAIL_TIKET_AND_LAST_VISIT
  const { data: tiket, isLoading: isTiketLoading } = useQuery({
    queryKey: ['tiket-detail', tiketId],
    queryFn: async () => {
      // 1. Ambil data tiket saat ini
      const { data, error } = await supabase.from('tiket_servis').select(`*, customers(nama, no_telp)`).eq('id', tiketId).single()
      if (error) throw error

      // 2. Ambil riwayat kunjungan terakhir motor ini (sebelum tiket ini dibuat)
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

  // FETCH_ITEMS_SPAREPART
  const { data: spareparts, isLoading: isPartsLoading } = useQuery({
    queryKey: ['tiket-parts', tiketId],
    queryFn: async () => {
      const { data, error } = await supabase.from('tiket_items').select(`*, barang(nama, barcode)`).eq('tiket_id', tiketId)
      if (error) throw error
      return data || []
    }
  })

  // FETCH_ITEMS_JASA
  const { data: services, isLoading: isServicesLoading } = useQuery({
    queryKey: ['tiket-services', tiketId],
    queryFn: async () => {
      const { data, error } = await supabase.from('tiket_jasa').select('*').eq('tiket_id', tiketId)
      if (error) throw error
      return data || []
    }
  })

  // SEARCH_BARANG_GUDANG
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['search-barang', searchPart],
    queryFn: async () => {
      if (searchPart.length < 2) return []
      const { data, error } = await supabase.from('barang').select('*').or(`nama.ilike.%${searchPart}%,barcode.ilike.%${searchPart}%`).eq('aktif', true).limit(5)
      if (error) throw error
      return data || []
    },
    enabled: searchPart.length > 1
  })

  // MUTATION_MANAGE_SPAREPART
  const managePartMutation = useMutation({
    mutationFn: async ({ action, barangId, itemId, harga, qtySekarang }: { action: 'add' | 'reduce' | 'remove', barangId?: string, itemId?: string, harga?: number, qtySekarang?: number }) => {
      if (!tiket) throw new Error('Data tiket tidak valid')
      const totalPartCurrent = Number(tiket.total_part || 0)

      if (action === 'add' && barangId && harga) {
        const existing = spareparts?.find(p => p.barang_id === barangId)
        if (existing) {
          await supabase.from('tiket_items').update({ qty: existing.qty + 1 }).eq('id', existing.id)
          await supabase.from('tiket_servis').update({ total_part: totalPartCurrent + harga }).eq('id', tiketId)
        } else {
          await supabase.from('tiket_items').insert({ tiket_id: tiketId, barang_id: barangId, qty: 1, harga_snapshot: harga })
          await supabase.from('tiket_servis').update({ total_part: totalPartCurrent + harga }).eq('id', tiketId)
        }
      } else if (action === 'reduce' && itemId && harga && qtySekarang) {
        if (qtySekarang > 1) {
          await supabase.from('tiket_items').update({ qty: qtySekarang - 1 }).eq('id', itemId)
          await supabase.from('tiket_servis').update({ total_part: totalPartCurrent - harga }).eq('id', tiketId)
        } else {
          await supabase.from('tiket_items').delete().eq('id', itemId)
          await supabase.from('tiket_servis').update({ total_part: totalPartCurrent - harga }).eq('id', tiketId)
        }
      } else if (action === 'remove' && itemId && harga && qtySekarang) {
        const totalPotong = harga * qtySekarang
        await supabase.from('tiket_items').delete().eq('id', itemId)
        await supabase.from('tiket_servis').update({ total_part: totalPartCurrent - totalPotong }).eq('id', tiketId)
      }
    },
    onSuccess: () => {
      setSearchPart('')
      queryClient.invalidateQueries({ queryKey: ['tiket-parts', tiketId] })
      queryClient.invalidateQueries({ queryKey: ['tiket-detail', tiketId] })
    }
  })

  const handleAddPart = useCallback((barangId: string, harga: number) => { managePartMutation.mutate({ action: 'add', barangId, harga }) }, [managePartMutation])
  const handleReducePart = useCallback((itemId: string, harga: number, qtySekarang: number) => { managePartMutation.mutate({ action: 'reduce', itemId, harga, qtySekarang }) }, [managePartMutation])
  const handleRemovePart = useCallback((itemId: string, harga: number, qtySekarang: number) => { managePartMutation.mutate({ action: 'remove', itemId, harga, qtySekarang }) }, [managePartMutation])

  // MUTATION_PELUNASAN
  const lunasMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('proses_pelunasan_kasir', { p_tiket_id: tiketId, p_metode_bayar: metodeBayar })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Pembayaran berhasil dilunasi!')
      queryClient.invalidateQueries({ queryKey: ['tiket-aktif'] })
      queryClient.invalidateQueries({ queryKey: ['tiket-detail', tiketId] })
    }
  })

  // HELPER_FORMATTER
  const formatInputRibuan = (val: number) => val ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ''
  const parseInputRibuan = (val: string) => isNaN(parseInt(val.replace(/[^0-9]/g, ''), 10)) ? 0 : parseInt(val.replace(/[^0-9]/g, ''), 10)
  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  if (isTiketLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#8EB69B]" /></div>
  if (!tiket) return <div className="p-12 text-center text-sm font-bold text-slate-500">Data tiket tidak ditemukan.</div>

  const totalJasa = Number(tiket.total_jasa || 0)
  const totalPart = Number(tiket.total_part || 0)
  const totalAkhir = totalJasa + totalPart
  const kembalian = uangDibayar - totalAkhir

  // RENDER_UI
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/kasir/tiket/aktif')} className="h-12 w-12 rounded-2xl border-[#E6DFD3] hover:bg-[#FAF7F2] text-[#051F20]">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h2 className="text-3xl font-black text-[#051F20] tracking-tight">Proses Pelunasan</h2>
            <p className="text-sm font-bold text-[#8EB69B] uppercase tracking-widest mt-1">Antrean {tiket.nomor_antrian} • Pelat {tiket.plat_motor}</p>
          </div>
        </div>
        <div className={`text-xs font-black px-4 py-2 rounded-xl uppercase tracking-widest ${tiket.status === 'lunas' ? 'bg-[#235347] text-white shadow-sm' : 'bg-amber-100 text-amber-900'}`}>
          STATUS: {tiket.status}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        <div className="lg:col-span-7 space-y-6">
          
          {/* KARTU_LAPORAN_RAPOR_KENDARAAN */}
          <Card className="bg-white border-0 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-[#051F20] py-4">
              <CardTitle className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest">
                <FileText className="w-4 h-4 text-[#8EB69B]" /> Identitas & Laporan Kendaraan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Identitas Section */}
              <div className="p-5 grid grid-cols-2 gap-y-4 gap-x-6 bg-white border-b border-[#E6DFD3]/60">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nama Pelanggan</p>
                  <p className="text-sm font-black text-[#051F20] flex items-center gap-2">
                    <User className="w-4 h-4 text-[#8EB69B]" /> {tiket.customers?.nama || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Motor & Plat</p>
                  <p className="text-sm font-black text-[#051F20] flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-[#8EB69B]" /> {tiket.merk_motor} {tiket.cc_motor ? `(${tiket.cc_motor}cc)` : ''} — <span className="text-[#235347] bg-[#E1EFE6] px-1.5 py-0.5 rounded">{tiket.plat_motor}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tanggal Servis</p>
                  <p className="text-sm font-bold text-[#163832] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#8EB69B]" /> {formatDate(tiket.waktu_masuk)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kunjungan Terakhir</p>
                  <p className="text-sm font-bold text-[#163832] flex items-center gap-2">
                    <History className="w-4 h-4 text-[#8EB69B]" /> {tiket.kunjungan_terakhir ? formatDate(tiket.kunjungan_terakhir) : 'Servis Pertama (Baru)'}
                  </p>
                </div>
                <div className="col-span-2 pt-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Keluhan Pelanggan (Awal)</p>
                  <p className="text-sm font-semibold text-[#051F20] bg-[#FAF7F2] p-3 rounded-xl border border-[#E6DFD3]/40">
                    {tiket.keluhan || 'Tidak ada keluhan tertulis.'}
                  </p>
                </div>
              </div>

              {/* Laporan Mekanik Section */}
              <div className="p-5 bg-[#FAF7F2] space-y-4">
                <div>
                  <p className="text-[10px] font-black text-[#051F20] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-amber-500" /> Hasil Diagnosa / Kesehatan Mesin
                  </p>
                  <p className="text-sm font-medium text-[#163832] leading-relaxed bg-white p-3 rounded-xl border border-amber-200/50 shadow-sm">
                    {tiket.catatan_kesehatan_mesin || <span className="text-slate-400 italic">Mekanik belum memberikan catatan diagnosa.</span>}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#051F20] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-emerald-500" /> Saran & Rekomendasi Mekanik
                  </p>
                  <p className="text-sm font-medium text-[#163832] leading-relaxed bg-white p-3 rounded-xl border border-emerald-200/50 shadow-sm">
                    {tiket.rekomendasi_mekanik || <span className="text-slate-400 italic">Mekanik belum memberikan saran lanjutan.</span>}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PANEL_INPUT_BARANG_KASIR (Hanya jika belum lunas) */}
          {tiket.status !== 'lunas' && (
            <Card className="bg-white border-0 shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-[#051F20] py-4"><CardTitle className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest"><Box className="w-4 h-4 text-[#8EB69B]" /> Tambah Sparepart / Suku Cadang</CardTitle></CardHeader>
              <CardContent className="p-5 bg-[#FAF7F2] space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input 
                    placeholder="Ketik nama atau scan barcode barang..." value={searchPart} onChange={e => setSearchPart(e.target.value)}
                    className="pl-12 h-14 bg-white border-0 shadow-sm rounded-2xl focus-visible:ring-2 focus-visible:ring-[#8EB69B] text-base font-bold text-[#051F20]"
                  />
                </div>
                {searchPart.length > 1 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-[#E6DFD3] p-2 space-y-1 max-h-48 overflow-y-auto">
                    {isSearching ? <div className="p-4 text-center text-xs font-bold text-slate-400">Mencari...</div> : searchResults?.length === 0 ? <div className="p-4 text-center text-xs font-bold text-slate-400">Barang tidak ditemukan.</div> : searchResults?.map(b => (
                      <div key={b.id} className="flex items-center justify-between p-3 hover:bg-[#FAF7F2] rounded-xl transition-colors">
                        <div>
                          <p className="font-black text-[#051F20] text-sm">{b.nama}</p>
                          <p className="text-[10px] font-bold text-[#8EB69B] uppercase tracking-widest mt-0.5">Sisa Fisik: {b.stok_fisik}</p>
                        </div>
                        <Button size="sm" onClick={() => handleAddPart(b.id, b.harga_jual)} disabled={b.stok_fisik <= 0 || managePartMutation.isPending} className="bg-[#235347] hover:bg-[#051F20] text-white font-bold text-xs h-9 rounded-lg">
                          + TAMBAH
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* TABEL_RINCIAN */}
          <Card className="bg-white border-0 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-[#E6DFD3]/60 bg-[#FAF7F2] py-5"><CardTitle className="text-sm font-black text-[#051F20] tracking-wider uppercase">Daftar Pengerjaan & Suku Cadang</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white">
                  <TableRow className="border-[#E6DFD3]/40">
                    <TableHead className="text-[#163832] font-bold pl-6">Deskripsi Item</TableHead>
                    <TableHead className="text-center text-[#163832] font-bold w-24">Qty</TableHead>
                    <TableHead className="text-right text-[#163832] font-bold pr-6">Harga</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white">
                  {isServicesLoading || isPartsLoading ? <TableRow><TableCell colSpan={3} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#8EB69B]"/></TableCell></TableRow> : (
                    <>
                      {services?.map((svc) => (
                        <TableRow key={svc.id} className="border-[#E6DFD3]/40 hover:bg-[#FAF7F2]">
                          <TableCell className="pl-6 py-4 font-black text-[#051F20]">
                            <span className="text-[10px] font-black text-[#235347] mr-2 bg-[#E1EFE6] px-2 py-1 rounded-md tracking-widest">JASA</span>{svc.nama_jasa}
                          </TableCell>
                          <TableCell className="text-center text-slate-500 font-bold">1</TableCell>
                          <TableCell className="text-right text-[#051F20] font-black pr-6">{formatRupiah(Number(svc.harga_jasa))}</TableCell>
                        </TableRow>
                      ))}
                      {spareparts?.map((part) => (
                        <TableRow key={part.id} className="border-[#E6DFD3]/40 hover:bg-[#FAF7F2]">
                          <TableCell className="pl-6 py-4 font-black text-[#051F20]">
                            <span className="text-[10px] font-black text-amber-900 mr-2 bg-amber-100 px-2 py-1 rounded-md tracking-widest">PART</span>{part.barang?.nama}
                          </TableCell>
                          <TableCell className="text-center align-middle">
                            {tiket.status !== 'lunas' ? (
                              <div className="flex items-center justify-center bg-white border border-[#E6DFD3] rounded-lg w-max mx-auto overflow-hidden">
                                <button type="button" onClick={() => handleReducePart(part.id, part.harga_snapshot, part.qty)} disabled={managePartMutation.isPending} className="p-1.5 hover:bg-rose-50 text-rose-500"><Minus className="w-3.5 h-3.5" /></button>
                                <span className="w-6 text-center font-black text-[#051F20] text-xs">{part.qty}</span>
                                <button type="button" onClick={() => handleAddPart(part.barang_id, part.harga_snapshot)} disabled={managePartMutation.isPending} className="p-1.5 hover:bg-[#E1EFE6] text-[#235347]"><Plus className="w-3.5 h-3.5" /></button>
                              </div>
                            ) : (<span className="font-bold text-slate-500">{part.qty}</span>)}
                          </TableCell>
                          <TableCell className="text-right text-[#051F20] font-black pr-6 align-middle">
                            {formatRupiah(Number(part.harga_snapshot) * part.qty)}
                            {tiket.status !== 'lunas' && (
                              <button type="button" onClick={() => handleRemovePart(part.id, part.harga_snapshot, part.qty)} className="ml-3 p-1.5 bg-rose-100 hover:bg-rose-500 hover:text-white text-rose-600 rounded-lg transition-colors align-middle"><Trash2 className="w-3.5 h-3.5" /></button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!services?.length && !spareparts?.length && (
                        <TableRow><TableCell colSpan={3} className="text-center text-slate-400 font-medium py-8 text-sm">Belum ada rincian jasa atau suku cadang.</TableCell></TableRow>
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
              <div className="bg-[#FAF7F2] p-6 border-t border-[#E6DFD3]/60 space-y-2">
                <div className="flex justify-between text-slate-500 text-sm font-bold"><span>Total Jasa</span><span>{formatRupiah(totalJasa)}</span></div>
                <div className="flex justify-between text-slate-500 text-sm font-bold"><span>Total Sparepart</span><span>{formatRupiah(totalPart)}</span></div>
                <div className="flex justify-between text-xl font-black text-[#051F20] pt-3 mt-3 border-t border-[#E6DFD3]"><span>GRAND TOTAL</span><span>{formatRupiah(totalAkhir)}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-6">
          {/* PANEL_BAYAR_LUNAS */}
          <Card className="bg-white border-0 shadow-sm rounded-3xl overflow-hidden sticky top-6">
            <CardHeader className="bg-[#051F20] py-5">
              <CardTitle className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest">
                <CreditCard className="w-4 h-4 text-[#8EB69B]" /> Proses Pelunasan Kasir
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 bg-[#FAF7F2] space-y-6">
              {tiket.status !== 'selesai' && tiket.status !== 'lunas' ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4"><span className="font-black text-2xl">⏳</span></div>
                  <h4 className="font-black text-[#051F20] text-lg">Tiket Sedang Berjalan</h4>
                  <p className="text-xs text-slate-500 font-medium mt-1">Pembayaran hanya bisa dilakukan setelah status tiket diubah menjadi Selesai oleh mekanik.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[#163832] uppercase tracking-widest">Metode Pembayaran</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['tunai', 'qris', 'transfer'].map(method => (
                        <Button 
                          key={method} type="button" variant={metodeBayar === method ? 'default' : 'outline'} disabled={tiket.status === 'lunas'}
                          className={`h-12 text-xs font-black tracking-widest rounded-xl transition-all ${metodeBayar === method ? 'bg-[#235347] text-white' : 'bg-white border-[#E6DFD3] text-[#163832] hover:bg-[#FAF7F2]'}`}
                          onClick={() => setMetodeBayar(method as any)}
                        >
                          {method.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {metodeBayar === 'tunai' && tiket.status !== 'lunas' && (
                    <div className="space-y-2 pt-4 border-t border-[#E6DFD3]/60">
                      <label className="text-[11px] font-bold text-[#163832] uppercase tracking-widest">Uang Diterima</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                        <Input 
                          type="text" value={formatInputRibuan(uangDibayar)} onChange={(e) => setUangDibayar(parseInputRibuan(e.target.value))} placeholder="0"
                          className="pl-12 h-14 font-black text-xl bg-white border-0 shadow-sm text-[#051F20] focus-visible:ring-2 focus-visible:ring-[#8EB69B] rounded-2xl"
                        />
                      </div>
                      {uangDibayar >= totalAkhir && (
                        <div className="p-4 mt-2 bg-[#E1EFE6] border border-[#8EB69B]/40 rounded-2xl flex justify-between items-center">
                          <span className="font-bold text-[#163832] text-xs uppercase tracking-widest">Kembalian:</span>
                          <span className="font-black text-[#235347] text-lg">{formatRupiah(kembalian)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {tiket.status === 'lunas' ? (
                    <Button type="button" onClick={() => toast.info('Integrasi PDF struk akan ditambahkan di Tahap 3')} className="w-full h-16 font-black tracking-widest bg-[#051F20] hover:bg-black text-white rounded-2xl shadow-md mt-4">
                      <Printer className="w-5 h-5 mr-2" /> CETAK STRUK & RAPOR (PDF)
                    </Button>
                  ) : (
                    <Button 
                      type="button" disabled={lunasMutation.isPending || (metodeBayar === 'tunai' && uangDibayar < totalAkhir) || totalAkhir === 0}
                      onClick={() => lunasMutation.mutate()} className="w-full h-16 font-black tracking-widest bg-[#235347] hover:bg-[#051F20] text-white shadow-md rounded-2xl mt-4"
                    >
                      {lunasMutation.isPending ? 'MEMPROSES...' : 'KONFIRMASI LUNAS & BAYAR'}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
"use client"

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Printer, User, Wrench, CreditCard, Search, Plus, Trash2, Box, Loader2, Calendar, FileText, Activity, Lightbulb, History, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

interface PageProps { params: { id: string } }

export default function DetailPembayaranPage({ params }: PageProps) {
  const tiketId = params.id
  const supabase = createClient()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [metodeBayar, setMetodeBayar] = useState<'tunai' | 'qris' | 'transfer'>('tunai')
  const [uangDibayar, setUangDibayar] = useState<number>(0)
  
  // STATE KATALOG
  const [activeTab, setActiveTab] = useState<'part' | 'jasa'>('part')
  const [searchKatalog, setSearchKatalog] = useState('')
  const [pageBarang, setPageBarang] = useState(1)
  const ITEMS_PER_PAGE = 20

  // 1. FETCH TIKET & IDENTITAS
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

  // 2. FETCH ITEMS (PART & JASA)
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

  // 3. FETCH KATALOG BARANG (PAGINASI)
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

  // 4. FETCH KATALOG JASA
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

  // MUTASI ADD/REMOVE ITEM VIA RPC
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

  // MUTASI ADD/REMOVE JASA VIA RPC
  const addJasaMutation = useMutation({
    mutationFn: async ({ nama, harga }: { nama: string, harga: number }) => {
      const { error } = await supabase.rpc('tambah_jasa_tiket', { p_tiket_id: tiketId, p_nama_jasa: nama, p_harga: harga })
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

  // MUTASI PELUNASAN
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

  // HELPER FORMATTER
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
    <div className="max-w-7xl mx-auto space-y-6 pb-16 font-sans">
      
      {/* HEADER TIKET */}
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
        
        {/* KOLOM KIRI: IDENTITAS & RAPOR KENDARAAN */}
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

          {/* RAPOR KENDARAAN (Tampil Jika Selesai/Lunas) */}
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

          {/* GRID KATALOG KASIR (Hanya tampil jika belum lunas) */}
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
                      
                      {/* PAGINATION BARANG */}
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
                            <div key={j.id} className="border border-[#E6DFD3] rounded-xl p-3 flex items-center justify-between bg-white hover:border-[#8EB69B] hover:shadow-sm transition-all">
                              <div>
                                <p className="text-sm font-semibold text-[#051F20]">{j.nama_jasa}</p>
                                <p className="font-medium text-[#235347] text-xs mt-0.5">{formatRupiah(j.harga_jasa)}</p>
                              </div>
                              <Button 
                                size="sm" variant="ghost" 
                                onClick={() => addJasaMutation.mutate({ nama: j.nama_jasa, harga: j.harga_jasa })} 
                                disabled={addJasaMutation.isPending} 
                                className="h-8 text-xs bg-[#FAF7F2] text-[#163832] hover:bg-[#235347] hover:text-white rounded-lg border border-[#E6DFD3]"
                              >
                                Tambah
                              </Button>
                            </div>
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

        {/* KOLOM KANAN: TAGIHAN & PEMBAYARAN */}
        <div className="xl:col-span-5 space-y-6">
          
          <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-2xl overflow-hidden">
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
                            <p className="text-[10px] text-slate-400 mt-0.5">Jasa</p>
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

          <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-2xl overflow-hidden sticky top-6">
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
                    <Button type="button" onClick={() => toast.info('Fitur cetak PDF A4 akan dikembangkan di Tahap 3')} className="w-full h-12 text-sm font-semibold bg-[#051F20] hover:bg-black text-white rounded-xl shadow-sm transition-all">
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
    </div>
  )
}
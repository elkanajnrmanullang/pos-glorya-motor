"use client"

import { useState } from 'react'
import { useOwnerRiwayat } from '@/hooks/use-owner-riwayat'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { History, Search, Loader2, DollarSign, Wrench, Receipt, UserCircle, CalendarDays, AlertCircle, Package } from 'lucide-react'

// COMPONENT RIWAYAT TRANSAKSI OWNER
export default function RiwayatTransaksiOwnerPage() {
  const { riwayat, isLoading } = useOwnerRiwayat()
  const [search, setSearch] = useState('')
  const [selectedTrx, setSelectedTrx] = useState<any | null>(null)

  // FILTER PENCARIAN 
  const filteredRiwayat = riwayat.filter(item => 
    item.nomor.toLowerCase().includes(search.toLowerCase()) ||
    item.keterangan.toLowerCase().includes(search.toLowerCase()) ||
    item.pelanggan.toLowerCase().includes(search.toLowerCase()) ||
    item.kasir.toLowerCase().includes(search.toLowerCase())
  )

  // FORMATTER
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  // RENDER UTAMA
  return (
    <div className="w-full space-y-6 font-sans pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#051F20] tracking-tight">Buku Besar Transaksi</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Daftar seluruh nota penjualan dan servis yang telah lunas dibayarkan.</p>
        </div>
      </div>

      {/* MAIN CARD TABEL */}
      <Card className="border-[#DAF1DE] bg-white shadow-sm overflow-hidden rounded-xl">
        <CardHeader className="border-b border-[#E6DFD3] bg-[#FAF7F2] py-4 px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-sm font-bold flex items-center text-[#051F20]">
            <History className="w-5 h-5 mr-2 text-[#235347]" /> Daftar Seluruh Riwayat
          </CardTitle>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Cari nota, plat, pelanggan, kasir..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9 h-10 text-sm bg-white border-[#E6DFD3] focus-visible:ring-1 focus-visible:ring-[#8EB69B] shadow-sm rounded-lg" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto w-full">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#235347]" /></div>
          ) : (
            <Table className="min-w-[900px]">
              <TableHeader className="bg-slate-50">
                <TableRow className="border-[#E6DFD3] hover:bg-transparent">
                  <TableHead className="font-bold text-[#163832] pl-6 w-[180px] text-xs uppercase tracking-wider">Waktu Transaksi</TableHead>
                  <TableHead className="font-bold text-[#163832] text-xs uppercase tracking-wider">No. Nota & Tipe</TableHead>
                  <TableHead className="font-bold text-[#163832] text-xs uppercase tracking-wider">Pelanggan / Keterangan</TableHead>
                  <TableHead className="font-bold text-[#163832] text-xs uppercase tracking-wider">Kasir Bertugas</TableHead>
                  <TableHead className="font-bold text-[#163832] text-center text-xs uppercase tracking-wider">Metode</TableHead>
                  <TableHead className="font-bold text-[#163832] text-right text-xs uppercase tracking-wider">Total</TableHead>
                  <TableHead className="font-bold text-[#163832] text-right pr-6 w-[100px] text-xs uppercase tracking-wider">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRiwayat.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500 font-medium text-sm">
                      Tidak ada transaksi ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRiwayat.map((item) => (
                    <TableRow key={item.id || item.nomor} className="hover:bg-slate-50 transition-colors border-[#E6DFD3]">
                      <TableCell className="pl-6 py-4">
                        <div className="text-sm font-bold text-[#051F20]">
                          {new Date(item.waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          Pukul {new Date(item.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.tipe === 'SERVIS' ? 'bg-blue-50 text-blue-600' : 'bg-[#E1EFE6] text-[#235347]'}`}>
                            {item.tipe === 'SERVIS' ? <Wrench className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-bold text-[#051F20] text-sm">{item.nomor}</div>
                            <div className="text-[10px] font-black tracking-widest text-slate-400 mt-0.5 uppercase">
                              {item.tipe}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="font-bold text-[#163832] text-sm">{item.pelanggan || 'Non-Member'}</div>
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.keterangan || '-'}</div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-xs font-bold text-[#051F20] bg-slate-100 px-2.5 py-1 rounded-md">
                          {item.kasir || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <Badge variant="outline" className={`font-bold uppercase tracking-wider text-[10px] border-0 ${item.metode === 'tunai' ? 'bg-amber-100 text-amber-700' : item.metode === 'qris' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {item.metode || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-black text-[#051F20] text-sm py-4">
                        {formatRupiah(item.total)}
                      </TableCell>
                      <TableCell className="text-right pr-6 py-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setSelectedTrx(item)} 
                          className="h-8 text-xs font-bold border-[#E6DFD3] text-[#235347] hover:bg-[#E1EFE6] rounded-lg transition-colors"
                        >
                          Rincian
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* MODAL DETAIL TRANSAKSI */}
      <Dialog open={!!selectedTrx} onOpenChange={(open) => !open && setSelectedTrx(null)}>
        <DialogContent className="sm:max-w-4xl w-[95vw] bg-[#FAF7F2] border border-[#E6DFD3] rounded-2xl shadow-sm p-0 overflow-hidden max-h-[90vh] flex flex-col gap-0 font-sans">
          {selectedTrx && (() => {
            const raw = selectedTrx.raw_data;
            const subtotalJasa = raw.tiket_jasa?.reduce((acc: number, cur: any) => acc + (Number(cur.harga_jasa) || 0), 0) || raw.total_jasa || 0;
            const itemList = raw.tiket_items || raw.transaksi_takeaway_items || [];
            const subtotalPart = itemList.reduce((acc: number, cur: any) => acc + ((Number(cur.qty) || 0) * (Number(cur.harga_snapshot) || 0)), 0) || raw.total_part || 0;

            return (
              <>
                <div className="p-6 bg-white border-b border-[#E6DFD3] flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-xl font-black text-[#051F20] flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-[#8EB69B]" /> Struk Laporan {selectedTrx.nomor}
                    </DialogTitle>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={`border-0 uppercase tracking-widest font-bold text-[10px] px-2.5 py-1 ${selectedTrx.tipe === 'SERVIS' ? 'bg-blue-50 text-blue-600' : 'bg-[#E1EFE6] text-[#235347]'}`}>
                      {selectedTrx.tipe === 'SERVIS' ? 'Servis Kendaraan' : 'Pembelian Takeaway'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* SEGMEN IDENTITAS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <UserCircle className="w-8 h-8 text-slate-300" />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identitas Konsumen</p>
                            <p className="text-base font-bold text-[#051F20]">{selectedTrx.pelanggan || raw.customers?.nama || 'Pelanggan Umum'}</p>
                            {raw.customers?.no_telp && <p className="text-xs font-medium text-slate-500 mt-0.5">HP: {raw.customers.no_telp}</p>}
                          </div>
                        </div>
                        <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                          <CalendarDays className="w-5 h-5 text-slate-300" />
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu Transaksi</p>
                            <p className="text-sm font-bold text-[#051F20]">{formatDate(selectedTrx.waktu)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {selectedTrx.tipe === 'SERVIS' && (
                      <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl">
                        <CardContent className="p-5 flex flex-col justify-center h-full">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Kendaraan Pelanggan</p>
                          <h3 className="text-lg font-black text-[#051F20]">
                            {raw.merk_motor || '-'} <span className="text-sm text-slate-500 font-semibold">{raw.cc_motor ? `(${raw.cc_motor}cc)` : ''}</span>
                          </h3>
                          <div className="flex items-center gap-3 mt-3">
                            <span className="px-3 py-1.5 bg-slate-100 text-[#051F20] font-black text-sm rounded-md tracking-widest border border-slate-200">
                              {raw.plat_motor || '-'}
                            </span>
                            {raw.tahun_motor && <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tahun {raw.tahun_motor}</span>}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* SEGMEN KELUHAN & MEKANIK */}
                  {selectedTrx.tipe === 'SERVIS' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-sm">
                        <p className="font-bold text-xs text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4"/> Keluhan Awal 
                        </p>
                        <p className="text-[#051F20] font-medium text-sm leading-relaxed">
                          {raw.keluhan || '-'}
                        </p>
                      </div>
                      
                      <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm">
                        <p className="font-bold text-xs text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <Wrench className="w-4 h-4"/> Laporan / Saran Mekanik
                        </p>
                        <div className="text-[#051F20] font-medium text-sm leading-relaxed">
                           {raw.saran_mekanik || raw.rekomendasi_mekanik || raw.catatan_kesehatan_mesin || <span className="text-slate-400 italic">Tidak ada catatan khusus dari mekanik.</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SEGMEN RINCIAN TRANSAKSI */}
                  <div className="bg-white rounded-xl border border-[#E6DFD3] shadow-sm overflow-hidden mt-6">
                    <div className="bg-[#FAF7F2] px-5 py-3 border-b border-[#E6DFD3]">
                      <h4 className="text-sm font-bold text-[#051F20]">Rincian Tindakan & Pembelian</h4>
                    </div>
                    
                    <div className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div className="space-y-4">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Jasa Layanan</p>
                          <div className="space-y-3">
                            {raw.tiket_jasa && raw.tiket_jasa.length > 0 ? (
                              raw.tiket_jasa.map((j: any, i: number) => (
                                <div key={`jasa-${i}`} className="flex justify-between items-start text-sm">
                                  <span className="font-medium text-[#051F20] flex-1 pr-4">{j.nama_jasa}</span>
                                  <span className="font-bold text-[#051F20] whitespace-nowrap">{formatRupiah(j.harga_jasa)}</span>
                                </div>
                              ))
                            ) : raw.total_jasa > 0 ? (
                              <div className="flex justify-between items-start text-sm">
                                <span className="font-medium text-[#051F20] flex-1 pr-4">Jasa Servis (Manual)</span>
                                <span className="font-bold text-[#051F20] whitespace-nowrap">{formatRupiah(raw.total_jasa)}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium italic block py-2">-</span>
                            )}
                          </div>
                          <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subtotal Jasa</span>
                            <span className="text-sm font-bold text-[#051F20]">{formatRupiah(subtotalJasa)}</span>
                          </div>
                        </div>

                        <div className="space-y-4 md:border-l md:border-slate-100 md:pl-6 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Suku Cadang / Sparepart</p>
                          <div className="space-y-3">
                            {itemList.length > 0 ? (
                              itemList.map((it: any, i: number) => (
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
                            <span className="text-sm font-bold text-[#051F20]">{formatRupiah(subtotalPart)}</span>
                          </div>
                        </div>

                      </div>
                      
                      <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-[#E6DFD3] mt-6">
                        <span className="font-black text-[#051F20] text-sm uppercase tracking-widest mb-2 sm:mb-0">TOTAL PEMBAYARAN</span>
                        <span className="font-black text-3xl text-[#235347]">{formatRupiah(selectedTrx.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
"use client"

import { useState } from 'react'
import { useLaporanShift, SesiShift } from '@/hooks/use-laporan-shift'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, Loader2, FileBox, AlertTriangle, CheckCircle2, Info, FileImage } from 'lucide-react'

// COMPONENT LAPORAN SHIFT
export default function AuditShiftPage() {
  const { shifts, isLoading } = useLaporanShift()
  const [search, setSearch] = useState('')
  const [selectedShift, setSelectedShift] = useState<SesiShift | null>(null)

  // FILTER DATA
  const filteredShifts = shifts.filter(s => 
    s.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.catatan?.toLowerCase().includes(search.toLowerCase())
  )

  // FORMAT RUPIAH
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0)
  }

  // RENDER STATUS SELISIH
  const renderSelisihBadge = (selisih: number) => {
    if (selisih === 0) return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> BALANCE</Badge>
    if (selisih > 0) return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none"><Info className="w-3 h-3 mr-1" /> LEBIH {formatRupiah(selisih)}</Badge>
    return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none"><AlertTriangle className="w-3 h-3 mr-1" /> KURANG {formatRupiah(Math.abs(selisih))}</Badge>
  }

  // PARSER KETERANGAN (Ekstrak URL Publik dari Teks)
  const parsePengeluaran = (keterangan: string) => {
    // Cari URL (http:// atau https://) di dalam tanda kurung
    const fileMatch = keterangan.match(/\(File Struk: (https?:\/\/[^\)]+)\)/)
    const sourceMatch = keterangan.match(/\[Sumber: (.*?)\]/)
    
    return {
      fileUrl: fileMatch ? fileMatch[1] : null,
      source: sourceMatch ? sourceMatch[1] : 'CASH',
      text: keterangan.replace(/\(File Struk: .*?\)/, '').replace(/\[Sumber: .*?\]/, '').trim()
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* HEADER HALAMAN */}
      <div>
        <h1 className="text-3xl font-black text-[#051F20] tracking-tight">Audit Shift Kasir</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Periksa kesesuaian uang fisik di laci dengan sistem untuk mencegah kecurangan.</p>
      </div>

      {/* KARTU DAFTAR SHIFT */}
      <Card className="border-[#DAF1DE] bg-white shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-sm font-bold text-[#051F20] flex items-center gap-2">
            <FileBox className="w-5 h-5 text-[#235347]" /> Daftar Laporan Tutup Shift
          </CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Cari nama kasir..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9 h-10 bg-slate-50" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 w-full overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#235347]" /></div>
          ) : (
            <Table className="min-w-[600px]">
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-semibold text-[#163832] pl-6">Waktu Tutup</TableHead>
                  <TableHead className="font-semibold text-[#163832]">Nama Kasir</TableHead>
                  <TableHead className="font-semibold text-[#163832] text-center">Selisih Uang Tunai</TableHead>
                  <TableHead className="font-semibold text-[#163832] text-right pr-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShifts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">Tidak ada laporan shift ditemukan.</TableCell>
                  </TableRow>
                ) : (
                  filteredShifts.map((shift) => (
                    <TableRow key={shift.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="pl-6">
                        <div className="font-bold text-[#051F20] text-sm">
                          {new Date(shift.waktu_tutup).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          Pukul {new Date(shift.waktu_tutup).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-slate-700 text-sm">{shift.profiles?.full_name || 'Tidak diketahui'}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {renderSelisihBadge(shift.selisih_cash)}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs font-bold text-[#235347] border-[#235347] hover:bg-[#235347] hover:text-white transition-colors"
                          onClick={() => setSelectedShift(shift)}
                        >
                          Lihat Detail
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

      {/* DIALOG DETAIL SHIFT (DIJAMIN RESPONSIF & BEBAS SCROLL X) */}
      <Dialog open={!!selectedShift} onOpenChange={(open) => !open && setSelectedShift(null)}>
        <DialogContent className="w-[95vw] sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6 rounded-xl">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <DialogTitle className="text-xl font-black text-[#051F20]">Rincian Audit Shift</DialogTitle>
          </DialogHeader>
          
          {selectedShift && (
            <div className="space-y-6 pt-2 w-full overflow-hidden">
              {/* INFO DASAR */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Kasir Bertugas</p>
                  <p className="text-lg font-black text-[#051F20]">{selectedShift.profiles?.full_name}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Waktu Tutup</p>
                  <p className="text-sm font-bold text-slate-700">{new Date(selectedShift.waktu_tutup).toLocaleString('id-ID')}</p>
                </div>
              </div>

              {/* TABEL PERHITUNGAN */}
              <div className="border border-[#DAF1DE] rounded-xl overflow-hidden shadow-sm w-full">
                <div className="bg-[#E1EFE6] px-4 py-3 font-bold text-[#163832] text-sm flex justify-between gap-2">
                  <span>Perhitungan Sistem</span>
                  <span className="text-slate-600 sm:text-[#163832]">Nilai Laporan</span>
                </div>
                <div className="p-4 space-y-3 text-sm font-medium w-full">
                  <div className="flex justify-between gap-4 text-slate-600">
                    <span className="flex-1">Modal Awal Laci</span>
                    <span className="text-right whitespace-nowrap">{formatRupiah(selectedShift.modal_awal)}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-slate-600">
                    <span className="flex-1">(+) Tunai Masuk</span>
                    <span className="text-emerald-600 text-right whitespace-nowrap">+{formatRupiah(selectedShift.cash_sistem)}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-slate-600">
                    <span className="flex-1">(-) Pengeluaran</span>
                    <span className="text-rose-600 text-right whitespace-nowrap">-{formatRupiah(selectedShift.total_pengeluaran)}</span>
                  </div>
                  <div className="flex justify-between gap-4 pt-3 border-t border-slate-100 font-bold text-slate-800">
                    <span className="flex-1">Ekspektasi Uang Laci</span>
                    <span className="text-right whitespace-nowrap">{formatRupiah(selectedShift.modal_awal + selectedShift.cash_sistem - selectedShift.total_pengeluaran)}</span>
                  </div>
                </div>

                <div className="bg-[#051F20] px-4 py-4 font-bold text-white text-sm flex justify-between items-center gap-2">
                  <span>Aktual Fisik Laci</span>
                  <span className="text-xl text-emerald-400 sm:text-white">{formatRupiah(selectedShift.cash_aktual)}</span>
                </div>
              </div>

              {/* REKAP SELISIH (Responsif Stack) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-row sm:flex-col justify-between sm:justify-center items-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Selisih Tunai</p>
                  <div className="sm:mt-1">{renderSelisihBadge(selectedShift.selisih_cash)}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-row sm:flex-col justify-between sm:justify-center items-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Selisih QRIS</p>
                  <div className="sm:mt-1">{renderSelisihBadge(selectedShift.selisih_qris)}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-row sm:flex-col justify-between sm:justify-center items-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Selisih Transfer</p>
                  <div className="sm:mt-1">{renderSelisihBadge(selectedShift.selisih_transfer)}</div>
                </div>
              </div>

              {/* TABEL PENGELUARAN MENDADAK DENGAN FOTO */}
              {selectedShift.pengeluaran_kasir && selectedShift.pengeluaran_kasir.length > 0 && (
                <div className="space-y-3 w-full">
                  <h4 className="text-sm font-bold text-[#051F20]">Rincian Pengeluaran Kasir:</h4>
                  <div className="w-full overflow-x-auto border border-slate-200 rounded-md shadow-sm">
                    <Table className="min-w-[400px]">
                      <TableHeader className="bg-slate-50 text-xs">
                        <TableRow>
                          <TableHead>Keterangan & Bukti Struk</TableHead>
                          <TableHead className="text-right">Jumlah</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedShift.pengeluaran_kasir.map(p => {
                          // Menggunakan parser untuk mengambil Link URL Asli
                          const { fileUrl, source, text } = parsePengeluaran(p.keterangan)
                          
                          return (
                            <TableRow key={p.id}>
                              <TableCell className="text-sm font-medium text-slate-600 space-y-2">
                                <div className="flex items-start gap-2">
                                  <Badge variant="outline" className={`text-[9px] mt-0.5 whitespace-nowrap ${source === 'CASH' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                    {source}
                                  </Badge>
                                  <span className="leading-snug">{text}</span>
                                </div>
                                {/* Tombol Buka Tab Baru Jika File Valid */}
                                {fileUrl && (
                                  <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    className="h-7 text-[10px] bg-slate-100 text-blue-700 hover:bg-blue-100 border border-slate-200 mt-1"
                                    onClick={() => window.open(fileUrl, '_blank')}
                                  >
                                    <FileImage className="w-3 h-3 mr-1.5" /> Lihat Struk (Buka di Tab Baru)
                                  </Button>
                                )}
                              </TableCell>
                              <TableCell className="text-right text-rose-600 font-bold text-sm align-top">
                                -{formatRupiah(p.jumlah)}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* CATATAN TAMBAHAN */}
              {selectedShift.catatan && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg w-full">
                  <p className="text-xs font-bold text-amber-800 uppercase mb-1">Catatan Tambahan Kasir:</p>
                  <p className="text-sm text-amber-900 font-medium italic">&quot;{selectedShift.catatan}&quot;</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
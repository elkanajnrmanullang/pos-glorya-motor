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

export default function AuditShiftPage() {
  const { shifts, isLoading } = useLaporanShift()
  const [search, setSearch] = useState('')
  const [selectedShift, setSelectedShift] = useState<SesiShift | null>(null)

  const filteredShifts = shifts.filter(s => 
    s.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.catatan?.toLowerCase().includes(search.toLowerCase())
  )

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0)
  }

  const renderSelisihBadge = (selisih: number) => {
    if (selisih === 0) return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-none font-semibold hover:bg-emerald-50"><CheckCircle2 className="w-3 h-3 mr-1.5" /> BALANCE</Badge>
    if (selisih > 0) return <Badge className="bg-blue-50 text-blue-700 border border-blue-200 shadow-none font-semibold hover:bg-blue-50"><Info className="w-3 h-3 mr-1.5" /> LEBIH {formatRupiah(selisih)}</Badge>
    return <Badge className="bg-rose-50 text-rose-700 border border-rose-200 shadow-none font-semibold hover:bg-rose-50"><AlertTriangle className="w-3 h-3 mr-1.5" /> KURANG {formatRupiah(Math.abs(selisih))}</Badge>
  }

  const parsePengeluaran = (keterangan: string) => {
    const fileMatch = keterangan.match(/\(File Struk: (https?:\/\/[^\)]+)\)/)
    const sourceMatch = keterangan.match(/\[Sumber: (.*?)\]/)
    
    return {
      fileUrl: fileMatch ? fileMatch[1] : null,
      source: sourceMatch ? sourceMatch[1] : 'CASH',
      text: keterangan.replace(/\(File Struk: .*?\)/, '').replace(/\[Sumber: .*?\]/, '').trim()
    }
  }

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      <div>
        <h1 className="text-2xl font-semibold text-[#051F20] tracking-tight">Audit Shift Kasir</h1>
        <p className="text-slate-500 text-sm mt-1">Periksa kesesuaian uang fisik di laci dengan sistem untuk mencegah kecurangan.</p>
      </div>

      <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="border-b border-[#E6DFD3] pb-4 pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white">
          <CardTitle className="text-sm font-semibold flex items-center text-[#051F20]">
            <FileBox className="w-4 h-4 mr-2 text-[#8EB69B]" /> Daftar Laporan Tutup Shift
          </CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Cari nama kasir..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9 h-10 text-sm bg-slate-50 border border-[#E6DFD3] focus-visible:ring-1 focus-visible:ring-[#8EB69B] rounded-lg w-full" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto w-full">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#8EB69B]" /></div>
          ) : (
            <Table className="min-w-[650px]">
              <TableHeader className="bg-slate-50">
                <TableRow className="border-[#E6DFD3] hover:bg-transparent">
                  <TableHead className="font-medium text-slate-500 pl-6 text-xs w-44">Waktu Tutup</TableHead>
                  <TableHead className="font-medium text-slate-500 text-xs">Nama Kasir</TableHead>
                  <TableHead className="font-medium text-slate-500 text-center text-xs">Selisih Uang Laci (Cash)</TableHead>
                  <TableHead className="font-medium text-slate-500 text-right pr-6 w-32 text-xs">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShifts.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-400 text-sm">Tidak ada laporan shift ditemukan.</TableCell></TableRow>
                ) : (
                  filteredShifts.map((shift) => (
                    <TableRow key={shift.id} className="hover:bg-slate-50 transition-colors border-[#E6DFD3]">
                      <TableCell className="pl-6 py-4">
                        <div className="font-semibold text-[#051F20] text-sm">
                          {new Date(shift.waktu_tutup).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {new Date(shift.waktu_tutup).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-[#051F20] text-sm">{shift.profiles?.full_name || 'Tidak diketahui'}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {renderSelisihBadge(shift.selisih_cash)}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-xs font-semibold border-[#E6DFD3] text-[#051F20] hover:bg-slate-100 rounded-lg shadow-sm"
                          onClick={() => setSelectedShift(shift)}
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

      <Dialog open={!!selectedShift} onOpenChange={(open) => !open && setSelectedShift(null)}>
        <DialogContent className="sm:max-w-2xl w-[95vw] bg-white border border-[#E6DFD3] shadow-sm rounded-xl p-0 overflow-hidden max-h-[85vh] flex flex-col">
          <DialogHeader className="px-6 py-5 border-b border-[#E6DFD3]">
            <DialogTitle className="text-lg font-semibold text-[#051F20]">Rincian Audit Shift</DialogTitle>
          </DialogHeader>
          
          {selectedShift && (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              
              {/* INFO DASAR */}
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-[#E6DFD3]">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Kasir Bertugas</p>
                  <p className="text-base font-semibold text-[#051F20] mt-1">{selectedShift.profiles?.full_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Waktu Tutup</p>
                  <p className="text-sm font-semibold text-[#051F20] mt-1">{new Date(selectedShift.waktu_tutup).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              </div>

              {/* TABEL PERHITUNGAN */}
              <div className="border border-[#E6DFD3] rounded-xl overflow-hidden shadow-sm">
                <div className="bg-[#FAF7F2] px-4 py-3 font-semibold text-[#051F20] text-sm flex justify-between border-b border-[#E6DFD3]">
                  <span>Perhitungan Uang Laci (Tunai)</span>
                  <span className="text-slate-500 text-xs hidden sm:block">Perbandingan Sistem vs Aktual</span>
                </div>
                <div className="p-4 space-y-3.5 text-sm font-medium">
                  <div className="flex justify-between text-slate-600">
                    <span>Modal Awal (Kas Receh)</span>
                    <span>{formatRupiah(selectedShift.modal_awal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>(+) Omzet Masuk (Hanya Tunai)</span>
                    <span className="text-emerald-600">+{formatRupiah(selectedShift.cash_sistem)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>(-) Pengeluaran Kasir</span>
                    <span className="text-rose-600">-{formatRupiah(selectedShift.total_pengeluaran)}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-slate-100 font-bold text-[#051F20]">
                    <span>Ekspektasi Sistem</span>
                    <span>{formatRupiah(selectedShift.modal_awal + selectedShift.cash_sistem - selectedShift.total_pengeluaran)}</span>
                  </div>
                </div>

                <div className="bg-[#051F20] px-4 py-4 text-white text-sm flex justify-between items-center">
                  <span className="font-semibold">Aktual Fisik Dihitung Kasir</span>
                  <span className="text-lg font-bold">{formatRupiah(selectedShift.cash_aktual)}</span>
                </div>
              </div>

              {/* REKAP SELISIH */}
              <div>
                <h4 className="text-sm font-semibold text-[#051F20] mb-3">Selisih Seluruh Metode Bayar</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-[#E6DFD3] flex flex-row sm:flex-col justify-between sm:justify-center items-center gap-2 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500">Tunai Laci</p>
                    {renderSelisihBadge(selectedShift.selisih_cash)}
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-[#E6DFD3] flex flex-row sm:flex-col justify-between sm:justify-center items-center gap-2 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500">QRIS Bank</p>
                    {renderSelisihBadge(selectedShift.selisih_qris)}
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-[#E6DFD3] flex flex-row sm:flex-col justify-between sm:justify-center items-center gap-2 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500">Transfer Bank</p>
                    {renderSelisihBadge(selectedShift.selisih_transfer)}
                  </div>
                </div>
              </div>

              {/* TABEL PENGELUARAN MENDADAK */}
              {selectedShift.pengeluaran_kasir && selectedShift.pengeluaran_kasir.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[#051F20] mb-3">Rincian Pengeluaran Kasir</h4>
                  <div className="border border-[#E6DFD3] rounded-xl overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow className="border-[#E6DFD3]">
                          <TableHead className="font-medium text-slate-500 text-xs">Keterangan Pengeluaran</TableHead>
                          <TableHead className="text-right font-medium text-slate-500 text-xs w-32">Nominal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedShift.pengeluaran_kasir.map(p => {
                          const { fileUrl, source, text } = parsePengeluaran(p.keterangan)
                          return (
                            <TableRow key={p.id} className="border-[#E6DFD3]">
                              <TableCell className="py-3">
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${source === 'CASH' ? 'bg-[#E1EFE6] text-[#235347]' : 'bg-blue-50 text-blue-600'}`}>
                                      {source}
                                    </span>
                                    <span className="text-sm font-medium text-[#051F20]">{text}</span>
                                  </div>
                                  {fileUrl && (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-7 w-fit text-[10px] text-blue-600 border-[#E6DFD3] hover:bg-slate-50 mt-1"
                                      onClick={() => window.open(fileUrl, '_blank')}
                                    >
                                      <FileImage className="w-3 h-3 mr-1.5" /> Lihat Struk Belanja
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-rose-600 font-semibold text-sm align-top pt-3.5">
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

              {/* CATATAN */}
              {selectedShift.catatan && (
                <div className="bg-slate-50 border border-[#E6DFD3] p-4 rounded-xl">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Catatan Kasir</p>
                  <p className="text-sm text-[#051F20] italic">&quot;{selectedShift.catatan}&quot;</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
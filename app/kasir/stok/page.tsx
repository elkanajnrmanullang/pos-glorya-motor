'use client'

import { useState } from 'react'
import { useBarang, useRiwayatBarang } from '@/hooks/use-barang'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Boxes, Search, Loader2, History, ChevronLeft, ChevronRight } from 'lucide-react'

// COMPONENT_STOK_PAGE
export default function StokPage() {
  const { barang, isBarangLoading } = useBarang()
  const { data: riwayat, isLoading: isRiwayatLoading } = useRiwayatBarang()

  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  
  // PAGINATION_STATE
  const filteredBarang = barang?.filter(b => b.nama.toLowerCase().includes(search.toLowerCase()) || b.sku.toLowerCase().includes(search.toLowerCase())) || []
  const totalPages = Math.ceil(filteredBarang.length / itemsPerPage)
  const paginatedBarang = filteredBarang.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // COMPONENT_RENDER
  return (
    <div className="w-full space-y-6 pb-12 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#051F20] tracking-tight">Katalog Stok</h1>
          <p className="text-[#163832] mt-1 text-sm font-medium">Pantau ketersediaan sparepart dan harga jual (Mode Hanya-Baca).</p>
        </div>
      </div>

      <Card className="bg-white border-0 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-[#E6DFD3]/50 pb-5 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#FAF7F2]">
          <CardTitle className="text-base font-black flex items-center text-[#051F20] tracking-wider uppercase">
            <Boxes className="w-5 h-5 mr-2 text-[#8EB69B]" /> Daftar Suku Cadang
          </CardTitle>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Cari SKU atau nama barang..." 
              value={search} 
              onChange={e => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }} 
              className="pl-11 h-12 text-sm w-full bg-white border-0 shadow-sm focus-visible:ring-2 focus-visible:ring-[#8EB69B] rounded-2xl font-medium" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto w-full">
          {isBarangLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#8EB69B]" /></div>
          ) : (
            <div className="min-w-[800px]">
              <Table>
                <TableHeader className="bg-white">
                  <TableRow className="border-[#E6DFD3]/40">
                    <TableHead className="font-bold text-[#163832] pl-6">SKU / Kode</TableHead>
                    <TableHead className="font-bold text-[#163832]">Nama Barang / Merek</TableHead>
                    <TableHead className="font-bold text-[#163832]">Harga Jual</TableHead>
                    <TableHead className="font-bold text-[#163832] text-center">Stok Gudang</TableHead>
                    <TableHead className="font-bold text-[#163832] text-center pr-6">Stok Bebas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBarang.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-400 font-medium">Barang tidak ditemukan dalam katalog.</TableCell></TableRow>
                  ) : (
                    paginatedBarang.map((item) => (
                      <TableRow key={item.sku} className="border-[#E6DFD3]/40 hover:bg-[#FAF7F2] transition-colors">
                        <TableCell className="font-bold text-[#8EB69B] pl-6 py-4">{item.sku}</TableCell>
                        <TableCell className="font-black text-[#051F20]">{item.nama}</TableCell>
                        <TableCell className="text-[#235347] font-black">Rp {item.harga_jual.toLocaleString('id-ID')}</TableCell>
                        <TableCell className="text-center font-bold text-slate-600">{item.stok_fisik}</TableCell>
                        <TableCell className="text-center text-emerald-700 font-black pr-6">{item.stok_tersedia}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        
        {/* PAGINATION_CONTROLS */}
        {!isBarangLoading && filteredBarang.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-[#E6DFD3]/50 bg-white gap-4">
            <p className="text-xs text-slate-500 font-bold text-center sm:text-left tracking-wider uppercase">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredBarang.length)} dari {filteredBarang.length}
            </p>
            <div className="flex gap-2 w-full sm:w-auto justify-center">
              <Button 
                variant="outline" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
                className="h-10 text-xs font-bold border-[#E6DFD3] text-[#163832] rounded-xl hover:bg-[#FAF7F2]"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> SEBELUMNYA
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
                className="h-10 text-xs font-bold border-[#E6DFD3] text-[#163832] rounded-xl hover:bg-[#FAF7F2]"
              >
                SELANJUTNYA <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* SECTION_RIWAYAT_BARANG */}
      <Card className="bg-white border-0 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-[#E6DFD3]/50 pb-5 pt-6 bg-[#FAF7F2]">
          <CardTitle className="text-base font-black flex items-center text-[#051F20] tracking-wider uppercase">
            <History className="w-5 h-5 mr-2 text-[#8EB69B]" /> Log Riwayat Master Data
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[300px] overflow-y-auto bg-white">
            {isRiwayatLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#8EB69B]" /></div>
            ) : riwayat?.length === 0 ? (
              <p className="text-center text-sm text-slate-400 font-medium py-12">Belum ada aktivitas terekam.</p>
            ) : (
              <ul className="divide-y divide-[#E6DFD3]/50">
                {riwayat?.map((log) => (
                  <li key={log.id} className="p-5 hover:bg-[#FAF7F2] transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <span className="text-sm font-black text-[#051F20]">
                        {log.barang?.nama || 'Barang Dihapus'}
                      </span>
                      <span className="text-[10px] font-bold tracking-widest text-[#8EB69B] uppercase">
                        {new Date(log.waktu).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                      {log.keterangan}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
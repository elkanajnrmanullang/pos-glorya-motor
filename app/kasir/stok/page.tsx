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
  
  const filteredBarang = barang?.filter(b => b.nama.toLowerCase().includes(search.toLowerCase()) || b.sku.toLowerCase().includes(search.toLowerCase())) || []
  const totalPages = Math.ceil(filteredBarang.length / itemsPerPage)
  const paginatedBarang = filteredBarang.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="w-full space-y-6 pb-12 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#051F20] tracking-tight">Katalog Stok</h1>
          <p className="text-slate-500 mt-1 text-sm">Pantau ketersediaan sparepart dan harga jual (Mode Hanya-Baca).</p>
        </div>
      </div>

      <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="border-b border-[#E6DFD3] pb-4 pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white">
          <CardTitle className="text-sm font-semibold flex items-center text-[#051F20]">
            <Boxes className="w-4 h-4 mr-2 text-[#8EB69B]" /> Daftar Suku Cadang
          </CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Cari SKU atau nama barang..." 
              value={search} 
              onChange={e => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }} 
              className="pl-9 h-10 text-sm w-full bg-slate-50 border border-[#E6DFD3] focus-visible:ring-1 focus-visible:ring-[#8EB69B] rounded-lg" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto w-full">
          {isBarangLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#8EB69B]" /></div>
          ) : (
            <div className="min-w-[800px]">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-[#E6DFD3] hover:bg-transparent">
                    <TableHead className="font-semibold text-slate-500 pl-6 text-xs">SKU / Kode</TableHead>
                    <TableHead className="font-semibold text-slate-500 text-xs">Nama Barang / Merek</TableHead>
                    <TableHead className="font-semibold text-slate-500 text-xs">Harga Jual</TableHead>
                    <TableHead className="font-semibold text-slate-500 text-center text-xs">Stok Gudang</TableHead>
                    <TableHead className="font-semibold text-slate-500 text-center pr-6 text-xs">Stok Bebas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBarang.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-400 text-sm">Barang tidak ditemukan dalam katalog.</TableCell></TableRow>
                  ) : (
                    paginatedBarang.map((item) => (
                      <TableRow key={item.sku} className="border-[#E6DFD3] hover:bg-slate-50 transition-colors">
                        <TableCell className="font-semibold text-[#8EB69B] pl-6 py-4 text-sm">{item.sku}</TableCell>
                        <TableCell className="font-semibold text-[#051F20] text-sm">{item.nama}</TableCell>
                        <TableCell className="text-[#235347] font-semibold text-sm">Rp {item.harga_jual.toLocaleString('id-ID')}</TableCell>
                        <TableCell className="text-center font-medium text-slate-600 text-sm">{item.stok_fisik}</TableCell>
                        <TableCell className="text-center text-[#235347] font-semibold pr-6 text-sm">{item.stok_tersedia}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        
        {!isBarangLoading && filteredBarang.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-[#E6DFD3] bg-white gap-4">
            <p className="text-xs text-slate-500 font-medium text-center sm:text-left">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredBarang.length)} dari {filteredBarang.length}
            </p>
            <div className="flex gap-2 w-full sm:w-auto justify-center">
              <Button 
                variant="outline" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
                className="h-9 text-xs font-medium border-[#E6DFD3] text-slate-600 rounded-lg hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Sebelumnya
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
                className="h-9 text-xs font-medium border-[#E6DFD3] text-slate-600 rounded-lg hover:bg-slate-50"
              >
                Selanjutnya <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="border-b border-[#E6DFD3] pb-4 pt-5 bg-white">
          <CardTitle className="text-sm font-semibold flex items-center text-[#051F20]">
            <History className="w-4 h-4 mr-2 text-[#8EB69B]" /> Log Riwayat Master Data
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[300px] overflow-y-auto bg-slate-50">
            {isRiwayatLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#8EB69B]" /></div>
            ) : riwayat?.length === 0 ? (
              <p className="text-center text-sm text-slate-400 font-medium py-12">Belum ada aktivitas terekam.</p>
            ) : (
              <ul className="divide-y divide-[#E6DFD3]">
                {riwayat?.map((log) => (
                  <li key={log.id} className="p-4 hover:bg-white transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                      <span className="text-sm font-semibold text-[#051F20]">
                        {log.barang?.nama || 'Barang Dihapus'}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {new Date(log.waktu).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
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
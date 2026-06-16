"use client"

import { useState } from 'react'
import { useOwnerRiwayat } from '@/hooks/use-owner-riwayat'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { History, Search, Loader2, DollarSign, Wrench } from 'lucide-react'

// COMPONENT RIWAYAT TRANSAKSI OWNER
export default function RiwayatTransaksiOwnerPage() {
  const { riwayat, isLoading } = useOwnerRiwayat()
  const [search, setSearch] = useState('')

  // FILTER PENCARIAN (Nota, Plat, Pelanggan, atau Nama Kasir)
  const filteredRiwayat = riwayat.filter(item => 
    item.nomor.toLowerCase().includes(search.toLowerCase()) ||
    item.keterangan.toLowerCase().includes(search.toLowerCase()) ||
    item.pelanggan.toLowerCase().includes(search.toLowerCase()) ||
    item.kasir.toLowerCase().includes(search.toLowerCase())
  )

  // FORMAT RUPIAH
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0)
  }

  return (
    <div className="w-full space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#051F20] tracking-tight">Buku Besar Transaksi</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Daftar seluruh nota penjualan dan servis yang telah lunas dibayarkan.</p>
        </div>
      </div>

      <Card className="border-[#DAF1DE] bg-white shadow-sm overflow-hidden">
        <CardHeader className="border-b border-[#DAF1DE]/50 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-sm font-bold flex items-center text-[#051F20]">
            <History className="w-5 h-5 mr-2 text-[#235347]" /> Daftar Seluruh Riwayat
          </CardTitle>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="Cari nota, plat, pelanggan, kasir..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9 h-10 text-sm bg-slate-50" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto w-full">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#235347]" /></div>
          ) : (
            <Table className="min-w-[800px]">
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold text-[#163832] pl-6 w-[200px]">Waktu Transaksi</TableHead>
                  <TableHead className="font-bold text-[#163832]">No. Nota & Tipe</TableHead>
                  <TableHead className="font-bold text-[#163832]">Pelanggan / Keterangan</TableHead>
                  <TableHead className="font-bold text-[#163832]">Kasir Bertugas</TableHead>
                  <TableHead className="font-bold text-[#163832] text-center">Metode</TableHead>
                  <TableHead className="font-bold text-[#163832] text-right pr-6">Total Transaksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRiwayat.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500 font-medium">
                      Tidak ada transaksi ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRiwayat.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="pl-6">
                        <div className="text-sm font-bold text-[#051F20]">
                          {new Date(item.waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          Pukul {new Date(item.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded flex items-center justify-center ${item.tipe === 'SERVIS' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {item.tipe === 'SERVIS' ? <Wrench className="w-3.5 h-3.5" /> : <DollarSign className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <div className="font-bold text-[#051F20] text-sm">{item.nomor}</div>
                            <div className="text-[10px] font-black tracking-wider text-slate-400 mt-0.5">
                              {item.tipe}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-[#163832] text-sm">{item.pelanggan}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{item.keterangan}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                          {item.kasir}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`font-bold uppercase text-[10px] ${item.metode === 'tunai' ? 'bg-amber-50 text-amber-700 border-amber-200' : item.metode === 'qris' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                          {item.metode || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-black text-[#051F20] pr-6 text-base">
                        {formatRupiah(item.total)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
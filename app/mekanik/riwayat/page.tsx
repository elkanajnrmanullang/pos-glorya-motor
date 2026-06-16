"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRiwayatMekanik } from '@/hooks/use-riwayat-mekanik'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Loader2, Wrench } from 'lucide-react'

// COMPONENT_RIWAYAT_PEKERJAAN_MEKANIK
export default function RiwayatPekerjaanMekanik() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | undefined>(undefined)

  // GET_USER_SESSION
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id)
    }
    getUser()
  }, [supabase])

  // FETCH_RIWAYAT_DATA
  const { riwayat, isLoading } = useRiwayatMekanik(userId)
  const [search, setSearch] = useState('')

  // FILTER_DATA
  const filteredRiwayat = riwayat.filter(item => 
    item.plat_motor.toLowerCase().includes(search.toLowerCase()) ||
    (item.customers?.nama || '').toLowerCase().includes(search.toLowerCase())
  )

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0)
  }

  // RENDER_UI
  return (
    <div className="w-full space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#051F20] tracking-tight">Riwayat Pekerjaan</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Daftar motor yang telah Anda selesaikan.</p>
        </div>
      </div>

      <Card className="border-[#DAF1DE] bg-white shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-sm font-bold flex items-center text-[#051F20]">
            <Wrench className="w-5 h-5 mr-2 text-[#235347]" /> Histori Servis Anda
          </CardTitle>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="Cari plat motor atau pelanggan..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9 h-10 text-sm bg-slate-50 border-[#E6DFD3] focus-visible:ring-[#235347]" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto w-full">
          {isLoading || !userId ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#235347]" /></div>
          ) : (
            <Table className="min-w-[700px]">
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold text-[#163832] pl-6 w-[180px]">Waktu Selesai</TableHead>
                  <TableHead className="font-bold text-[#163832] w-[150px]">Kendaraan</TableHead>
                  <TableHead className="font-bold text-[#163832] w-[150px]">Pelanggan</TableHead>
                  <TableHead className="font-bold text-[#163832] pr-6">Rincian Jasa Dikerjakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRiwayat.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-slate-500 font-medium">
                      Tidak ada riwayat pekerjaan ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRiwayat.map((item) => {
                    const totalJasa = item.tiket_jasa?.reduce((sum: number, j: any) => sum + Number(j.harga_jasa), 0) || 0
                    return (
                      <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="pl-6 align-top pt-4">
                          <div className="font-bold text-[#051F20] text-sm">
                            {new Date(item.waktu_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-xs text-slate-500 font-medium mt-0.5">
                            Pukul {new Date(item.waktu_selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </TableCell>
                        <TableCell className="align-top pt-4">
                          <div className="font-black text-[#051F20] text-base">{item.plat_motor}</div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">{item.merk_motor}</div>
                        </TableCell>
                        <TableCell className="align-top pt-4">
                          <div className="font-semibold text-slate-700 text-sm">{item.customers?.nama || 'Umum'}</div>
                        </TableCell>
                        <TableCell className="align-top pt-4 pb-4 pr-6">
                          {item.tiket_jasa && item.tiket_jasa.length > 0 ? (
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                              <ul className="space-y-1.5">
                                {item.tiket_jasa.map((jasa: any, idx: number) => (
                                  <li key={idx} className="text-sm flex justify-between gap-4 border-b border-slate-200/60 pb-1.5 last:border-0 last:pb-0">
                                    <span className="text-slate-600 font-medium">• {jasa.nama_jasa}</span>
                                    <span className="text-[#235347] font-bold">{formatRupiah(jasa.harga_jasa)}</span>
                                  </li>
                                ))}
                                <li className="text-sm flex justify-between gap-4 pt-2 mt-2 border-t-2 border-slate-200">
                                  <span className="text-slate-800 font-black text-xs uppercase tracking-wider">Subtotal Jasa</span>
                                  <span className="text-emerald-700 font-black">{formatRupiah(totalJasa)}</span>
                                </li>
                              </ul>
                            </div>
                          ) : (
                            <span className="text-xs italic text-slate-400">Tidak ada jasa, hanya ganti sparepart</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
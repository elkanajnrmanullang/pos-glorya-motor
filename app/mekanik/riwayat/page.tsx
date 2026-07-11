"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRiwayatMekanik } from '@/hooks/use-riwayat-mekanik'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Loader2, ClipboardList, FileText } from 'lucide-react'

export default function RiwayatPekerjaanMekanik() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id)
    }
    getUser()
  }, [supabase])

  const { riwayat, isLoading } = useRiwayatMekanik(userId)
  const [search, setSearch] = useState('')

  const filteredRiwayat = riwayat.filter(item => 
    item.plat_motor.toLowerCase().includes(search.toLowerCase()) ||
    (item.customers?.nama || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-full space-y-8 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-black text-[#051F20] tracking-tight">Riwayat Pengerjaan</h1>
        <p className="text-[#163832] text-sm font-medium mt-1">Arsip dan rekam jejak kendaraan yang telah diselesaikan.</p>
      </div>
      <Card className="border border-[#E6DFD3] bg-white shadow-sm overflow-hidden rounded-3xl">
        <CardHeader className="border-b border-[#E6DFD3] pb-5 bg-[#FAF7F2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center text-[#051F20]">
            <ClipboardList className="w-4 h-4 mr-2 text-[#8EB69B]" /> Log Pekerjaan
          </CardTitle>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Pencarian plat atau nama..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9 h-10 text-sm bg-white border-[#E6DFD3] focus-visible:ring-[#8EB69B] rounded-xl" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto w-full">
          {isLoading || !userId ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#8EB69B]" /></div>
          ) : (
            <Table className="min-w-[800px]">
              <TableHeader className="bg-white">
                <TableRow className="border-[#E6DFD3]">
                  <TableHead className="font-bold text-[#163832] pl-6 py-4 w-[180px]">Diselesaikan</TableHead>
                  <TableHead className="font-bold text-[#163832] py-4 w-[180px]">Unit Kendaraan</TableHead>
                  <TableHead className="font-bold text-[#163832] py-4 w-[160px]">Pemilik</TableHead>
                  <TableHead className="font-bold text-[#163832] py-4 pr-6">Detail Pelaporan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRiwayat.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-16 text-slate-400 font-medium">
                      Data riwayat tidak ditemukan dalam arsip.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRiwayat.map((item) => (
                    <TableRow key={item.id} className="hover:bg-[#FAF7F2] transition-colors border-[#E6DFD3]/50">
                      <TableCell className="pl-6 align-top pt-5">
                        <div className="font-bold text-[#051F20] text-sm">
                          {new Date(item.waktu_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-xs font-bold text-[#8EB69B] mt-1">
                          {new Date(item.waktu_selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </div>
                      </TableCell>
                      <TableCell className="align-top pt-5">
                        <div className="font-black text-[#051F20] text-base">{item.plat_motor}</div>
                        <div className="text-[10px] font-bold text-[#235347] uppercase tracking-widest mt-1">{item.merk_motor}</div>
                      </TableCell>
                      <TableCell className="align-top pt-5">
                        <div className="font-bold text-[#163832] text-sm">{item.customers?.nama || 'Non-Member'}</div>
                      </TableCell>
                      <TableCell className="align-top pt-5 pb-5 pr-6">
                        {item.saran_mekanik ? (
                          <div className="bg-white border border-[#E6DFD3] rounded-xl p-4 shadow-sm">
                            <div className="flex items-start gap-2">
                              <FileText className="w-4 h-4 text-[#8EB69B] mt-0.5 shrink-0" />
                              <p className="text-sm text-[#051F20] font-medium leading-relaxed">&quot;{item.saran_mekanik}&quot;</p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-[#E6DFD3]/50 flex flex-wrap gap-2">
                              {item.checklist_kendaraan && Object.entries(item.checklist_kendaraan).map(([key, val]) => (
                                <span key={key} className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${val === 'Aman' ? 'bg-[#E1EFE6] text-[#235347]' : val === 'Ganti' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                  {key.replace('_', ' ')}: {val}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">Tidak ada log tercatat.</span>
                        )}
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
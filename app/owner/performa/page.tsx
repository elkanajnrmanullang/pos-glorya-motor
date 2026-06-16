"use client"

import { useState, useEffect } from 'react'
import { useOwnerPerforma, PerformaTiket } from '@/hooks/use-owner-performa'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Award, Calendar, Wrench, Wallet } from 'lucide-react'

export default function PerformaMekanikPage() {
  const hariIni = new Date()
  const awalBulan = new Date(hariIni.getFullYear(), hariIni.getMonth(), 1)
  
  const [startDate, setStartDate] = useState(awalBulan.toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(hariIni.toISOString().split('T')[0])
  const [selectedMekanik, setSelectedMekanik] = useState<string>('')

  const { mekanikList, performaData, isLoadingMekanik, isLoadingPerforma } = useOwnerPerforma(selectedMekanik, startDate, endDate)

  useEffect(() => {
    if (mekanikList.length > 0 && !selectedMekanik) {
      setSelectedMekanik(mekanikList[0].id)
    }
  }, [mekanikList, selectedMekanik])

  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0)

  let totalMotor = 0
  let totalPendapatanJasa = 0

  performaData.forEach(tiket => {
    totalMotor++
    tiket.tiket_jasa?.forEach(jasa => {
      totalPendapatanJasa += Number(jasa.harga_jasa)
    })
  })

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#051F20] tracking-tight">Kalkulator Bagi Hasil</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Pantau performa mekanik dan hitung total nilai jasa yang dihasilkan.</p>
        </div>
      </div>

      <Card className="border-[#DAF1DE] bg-white shadow-sm">
        <CardContent className="p-4 sm:p-6 grid gap-4 md:grid-cols-3 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#163832] uppercase">Pilih Mekanik</label>
            {isLoadingMekanik ? (
              <div className="h-10 border border-slate-200 rounded-md bg-slate-50 animate-pulse"></div>
            ) : (
              <select 
                value={selectedMekanik} 
                onChange={e => setSelectedMekanik(e.target.value)}
                className="flex h-10 w-full rounded-md border border-[#8EB69B]/40 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#235347] font-semibold text-[#051F20]"
              >
                {mekanikList.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#163832] uppercase flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Tanggal Mulai</label>
            <Input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="border-[#8EB69B]/40 font-semibold text-[#051F20]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#163832] uppercase flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Tanggal Akhir</label>
            <Input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="border-[#8EB69B]/40 font-semibold text-[#051F20]"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-[#DAF1DE] bg-white shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Motor Dikerjakan</p>
              <h3 className="text-3xl font-black text-blue-700">{totalMotor} Unit</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#DAF1DE] bg-emerald-700 shadow-md text-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Total Nilai Jasa Dihasilkan</p>
              <h3 className="text-3xl font-black text-white">{formatRupiah(totalPendapatanJasa)}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-800 text-emerald-100 rounded-xl flex items-center justify-center border border-emerald-600/50">
              <Wallet className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#DAF1DE] bg-white shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-sm font-bold text-[#051F20] flex items-center gap-2">
            <Award className="w-5 h-5 text-[#235347]" /> Rincian Pekerjaan Mekanik
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto w-full">
          {isLoadingPerforma ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#235347]" /></div>
          ) : (
            <Table className="min-w-[700px]">
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-semibold text-[#163832] pl-6 w-[180px]">Waktu Selesai</TableHead>
                  <TableHead className="font-semibold text-[#163832] w-[180px]">Kendaraan</TableHead>
                  <TableHead className="font-semibold text-[#163832]">Rincian Tindakan Jasa</TableHead>
                  <TableHead className="font-semibold text-[#163832] text-right pr-6 w-[150px]">Subtotal Jasa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performaData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-slate-500 font-medium">
                      Tidak ada pekerjaan diselesaikan pada rentang tanggal ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  performaData.map((tiket: PerformaTiket) => {
                    const subtotal = tiket.tiket_jasa?.reduce((sum, item) => sum + Number(item.harga_jasa), 0) || 0
                    
                    return (
                      <TableRow key={tiket.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="pl-6 align-top pt-4">
                          <div className="font-bold text-[#051F20] text-sm">
                            {new Date(tiket.waktu_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-xs text-slate-500 font-medium mt-0.5">
                            Pukul {new Date(tiket.waktu_selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </TableCell>
                        <TableCell className="align-top pt-4">
                          <div className="font-black text-lg text-[#051F20]">{tiket.plat_motor}</div>
                          <div className="text-xs font-bold text-slate-500 uppercase mt-0.5">{tiket.merk_motor}</div>
                        </TableCell>
                        <TableCell className="align-top pt-4">
                          {tiket.tiket_jasa && tiket.tiket_jasa.length > 0 ? (
                            <ul className="space-y-1.5">
                              {tiket.tiket_jasa.map((jasa, idx) => (
                                <li key={idx} className="flex justify-between items-center text-sm border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                                  <span className="font-medium text-slate-700 flex-1 pr-4">• {jasa.nama_jasa}</span>
                                  <span className="text-slate-500 font-bold">{formatRupiah(Number(jasa.harga_jasa))}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Hanya ganti part (tidak ada input jasa)</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-6 align-top pt-4 font-black text-[#235347] text-base">
                          {formatRupiah(subtotal)}
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
"use client"

import { useState, useEffect } from 'react'
import { useOwnerPerforma, PerformaTiket } from '@/hooks/use-owner-performa'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Award, Calendar, Wrench, Wallet } from 'lucide-react'

// COMPONENT PERFORMA MEKANIK PAGE
export default function PerformaMekanikPage() {
  // INISIALISASI TANGGAL DEFAULT
  const hariIni = new Date()
  const awalBulan = new Date(hariIni.getFullYear(), hariIni.getMonth(), 1)
  
  // STATE & HOOKS
  const [startDate, setStartDate] = useState(awalBulan.toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(hariIni.toISOString().split('T')[0])
  const [selectedMekanik, setSelectedMekanik] = useState<string>('')

  const { mekanikList, performaData, isLoadingMekanik, isLoadingPerforma } = useOwnerPerforma(selectedMekanik, startDate, endDate)

  // AUTO SELECT MEKANIK PERTAMA
  useEffect(() => {
    if (mekanikList.length > 0 && !selectedMekanik) {
      setSelectedMekanik(mekanikList[0].id)
    }
  }, [mekanikList, selectedMekanik])

  // FORMATTER
  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0)

  // KALKULASI DATA SUMMARY
  let totalMotor = 0
  let totalPendapatanJasa = 0

  performaData.forEach(tiket => {
    totalMotor++
    tiket.tiket_jasa?.forEach(jasa => {
      totalPendapatanJasa += Number(jasa.harga_jasa)
    })
  })

  // RENDER UTAMA
  return (
    <div className="w-full space-y-6 font-sans pb-12">
      
      {/* HEADER PAGE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#051F20] tracking-tight">Kalkulator Bagi Hasil</h1>
          <p className="text-slate-500 text-sm mt-1">Pantau performa mekanik dan hitung total nilai jasa yang dihasilkan.</p>
        </div>
      </div>

      {/* FILTER CARD */}
      <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl">
        <CardContent className="p-5 grid gap-4 md:grid-cols-3 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pilih Mekanik</label>
            {isLoadingMekanik ? (
              <div className="h-10 w-full rounded-lg bg-slate-50 border border-[#E6DFD3] animate-pulse"></div>
            ) : (
              <select 
                value={selectedMekanik} 
                onChange={e => setSelectedMekanik(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-[#E6DFD3] bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#8EB69B] font-semibold text-[#051F20] cursor-pointer"
              >
                {mekanikList.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Tanggal Mulai
            </label>
            <Input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="h-10 border-[#E6DFD3] focus-visible:ring-1 focus-visible:ring-[#8EB69B] font-medium text-[#051F20] shadow-sm rounded-lg"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Tanggal Akhir
            </label>
            <Input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="h-10 border-[#E6DFD3] focus-visible:ring-1 focus-visible:ring-[#8EB69B] font-medium text-[#051F20] shadow-sm rounded-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* SUMMARY CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl lg:col-span-2">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Motor Dikerjakan</p>
              <h3 className="text-2xl font-semibold text-[#051F20]">{totalMotor} <span className="text-sm font-normal text-slate-500">Unit</span></h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#235347] border-0 shadow-md rounded-xl lg:col-span-2">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-emerald-100/80 uppercase tracking-wide">Total Nilai Jasa Dihasilkan</p>
              <h3 className="text-2xl font-semibold text-white">{formatRupiah(totalPendapatanJasa)}</h3>
            </div>
            <div className="w-12 h-12 bg-white/10 text-white rounded-lg flex items-center justify-center shrink-0 border border-white/10">
              <Wallet className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABEL DATA TIKET */}
      <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="border-b border-[#E6DFD3] bg-[#FAF7F2] py-4 px-5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[#051F20]">
            <Award className="w-4 h-4 text-[#8EB69B]" /> Rincian Pekerjaan Mekanik
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto w-full">
          {isLoadingPerforma ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#8EB69B]" /></div>
          ) : (
            <Table className="min-w-[700px]">
              <TableHeader className="bg-slate-50">
                <TableRow className="border-[#E6DFD3] hover:bg-transparent">
                  <TableHead className="font-medium text-slate-500 pl-6 w-[180px] text-xs">Waktu Selesai</TableHead>
                  <TableHead className="font-medium text-slate-500 w-[180px] text-xs">Kendaraan</TableHead>
                  <TableHead className="font-medium text-slate-500 text-xs">Rincian Tindakan Jasa</TableHead>
                  <TableHead className="font-medium text-slate-500 text-right pr-6 w-[150px] text-xs">Subtotal Jasa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performaData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-slate-400 text-sm">
                      Tidak ada pekerjaan diselesaikan pada rentang tanggal ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  performaData.map((tiket: PerformaTiket) => {
                    const subtotal = tiket.tiket_jasa?.reduce((sum, item) => sum + Number(item.harga_jasa), 0) || 0
                    
                    return (
                      <TableRow key={tiket.id} className="hover:bg-slate-50 transition-colors border-[#E6DFD3]">
                        <TableCell className="pl-6 align-top pt-4 pb-4">
                          <div className="font-semibold text-[#051F20] text-sm">
                            {new Date(tiket.waktu_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Pukul {new Date(tiket.waktu_selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </TableCell>
                        <TableCell className="align-top pt-4 pb-4">
                          <div className="inline-block px-2.5 py-1 bg-[#E1EFE6] text-[#235347] font-semibold text-sm rounded-md tracking-widest mb-1.5">
                            {tiket.plat_motor}
                          </div>
                          <div className="text-xs font-medium text-slate-500">
                            {tiket.merk_motor} {tiket.cc_motor ? `(${tiket.cc_motor}cc)` : ''}
                          </div>
                        </TableCell>
                        <TableCell className="align-top pt-4 pb-4">
                          {tiket.tiket_jasa && tiket.tiket_jasa.length > 0 ? (
                            <div className="space-y-2">
                              {tiket.tiket_jasa.map((jasa, idx) => (
                                <div key={idx} className="flex justify-between items-start text-sm border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                                  <span className="font-medium text-[#051F20] flex-1 pr-4">{jasa.nama_jasa}</span>
                                  <span className="text-slate-600 font-medium whitespace-nowrap">{formatRupiah(Number(jasa.harga_jasa))}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Hanya penggantian suku cadang (tanpa jasa)</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-6 align-top pt-4 pb-4 font-semibold text-[#235347] text-sm">
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
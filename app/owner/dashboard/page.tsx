"use client"

import { useState } from 'react'
import { useOwnerDashboard, FilterWaktu } from "@/hooks/use-owner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Wallet, ArrowDownCircle, Bike, Loader2, DollarSign, Wrench, Receipt, Users, Package, UserCircle, CalendarDays, AlertCircle } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"

export default function OwnerDashboardPage() {
  const [filter, setFilter] = useState<FilterWaktu>('hari_ini')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [selectedTrx, setSelectedTrx] = useState<any | null>(null)
  
  const { data, isLoading } = useOwnerDashboard(filter, customStart, customEnd)

  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0)
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const TrendIndicator = ({ value }: { value: number }) => {
    if (value === 0) return <span className="text-xs font-medium text-slate-400 ml-2">0% (Stabil)</span>
    const isUp = value > 0
    return (
      <span className={`text-xs font-semibold ml-2 flex items-center ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
        {isUp ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
        {Math.abs(value).toFixed(1)}%
      </span>
    )
  }

  const getJenisServis = (trx: any) => {
    if (trx.tipe === 'TAKEAWAY') return 'Pembelian Suku Cadang (Takeaway)'
    const adaJasa = trx.tiket_jasa?.length > 0 || trx.total_jasa > 0
    const adaPart = (trx.tiket_items?.length > 0) || (trx.transaksi_takeaway_items?.length > 0)
    if (adaJasa && adaPart) return 'Jasa Servis + Pembelian Sparepart'
    if (adaJasa) return 'Hanya Jasa Servis'
    if (adaPart) return 'Hanya Pembelian Sparepart'
    return 'Pemeriksaan Kendaraan'
  }

  if (isLoading) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#8EB69B]" />
      </div>
    )
  }

  const metrics = data?.metrics || { 
    omzet: { total: 0, trend: 0 }, kasBersih: { total: 0, trend: 0 }, pengeluaran: { total: 0, trend: 0 }, unit: { total: 0, trend: 0 }, breakdownMetode: { tunai: 0, qris: 0, transfer: 0 } 
  }
  const topItems = data?.topItems || []
  const mechanicStatus = data?.mechanicStatus || []
  const recentTransactions = data?.recentTransactions || []
  const chartData = data?.chartData || []

  const totalMetode = metrics.breakdownMetode.tunai + metrics.breakdownMetode.qris + metrics.breakdownMetode.transfer
  const persenTunai = totalMetode > 0 ? (metrics.breakdownMetode.tunai / totalMetode) * 100 : 0
  const persenQris = totalMetode > 0 ? (metrics.breakdownMetode.qris / totalMetode) * 100 : 0
  const persenTransfer = totalMetode > 0 ? (metrics.breakdownMetode.transfer / totalMetode) * 100 : 0

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#051F20] tracking-tight">Ringkasan Analitik</h1>
          <p className="text-sm text-slate-500 mt-1">Pantau performa omzet dan aktivitas bengkel secara menyeluruh.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {filter === 'custom' && (
            <div className="flex items-center gap-2 bg-white border border-[#E6DFD3] rounded-lg px-2 shadow-sm">
              <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="h-9 border-0 shadow-none focus-visible:ring-0 text-sm w-32" />
              <span className="text-slate-400">-</span>
              <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="h-9 border-0 shadow-none focus-visible:ring-0 text-sm w-32" />
            </div>
          )}
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as FilterWaktu)}
            className="h-10 px-3 py-2 bg-white border border-[#E6DFD3] rounded-lg text-sm font-semibold text-[#051F20] focus:ring-1 focus:ring-[#8EB69B] shadow-sm cursor-pointer min-w-[150px]"
          >
            <option value="hari_ini">Data Hari Ini</option>
            <option value="minggu_ini">Minggu Ini</option>
            <option value="bulan_ini">Bulan Ini</option>
            <option value="tahun_ini">Tahun Ini</option>
            <option value="custom">Pilih Rentang Tanggal...</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Omzet</p>
              <h3 className="text-xl font-semibold text-[#051F20]">{formatRupiah(metrics.omzet.total)}</h3>
              <div className="flex items-center text-xs text-slate-500">vs Periode Lalu <TrendIndicator value={metrics.omzet.trend} /></div>
            </div>
            <div className="w-10 h-10 bg-[#E1EFE6] text-[#235347] rounded-lg flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Kas Bersih</p>
              <h3 className="text-xl font-semibold text-[#051F20]">{formatRupiah(metrics.kasBersih.total)}</h3>
              <div className="flex items-center text-xs text-slate-500">vs Periode Lalu <TrendIndicator value={metrics.kasBersih.trend} /></div>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pengeluaran</p>
              <h3 className="text-xl font-semibold text-rose-600">{formatRupiah(metrics.pengeluaran.total)}</h3>
              <div className="flex items-center text-xs text-slate-500">vs Periode Lalu <TrendIndicator value={metrics.pengeluaran.trend} /></div>
            </div>
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center shrink-0">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Unit Diservis</p>
              <h3 className="text-xl font-semibold text-[#051F20]">{metrics.unit.total} <span className="text-sm text-slate-500 font-normal">Motor</span></h3>
              <div className="flex items-center text-xs text-slate-500">vs Periode Lalu <TrendIndicator value={metrics.unit.trend} /></div>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <Bike className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4 bg-white border-[#E6DFD3] shadow-sm rounded-xl overflow-hidden flex flex-col">
          <CardHeader className="border-b border-[#E6DFD3] bg-[#FAF7F2] py-4 px-5">
            <CardTitle className="text-sm font-semibold text-[#051F20]">Grafik Tren Pendapatan Berkala</CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">Sumbu X merespons jenis filter secara dinamis.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-1">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6DFD3" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(value) => `Rp${value / 1000}k`}
                  />
                  <RechartsTooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E6DFD3', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', fontSize: '12px', fontWeight: 500 }}
                    formatter={(value: any) => [formatRupiah(Number(value || 0)), "Omzet"]}
                  />
                  <Bar dataKey="total" fill="#235347" radius={[4, 4, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 flex flex-col gap-6">
          <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl overflow-hidden flex-1">
            <CardHeader className="border-b border-[#E6DFD3] bg-[#FAF7F2] py-4 px-5">
              <CardTitle className="text-sm font-semibold text-[#051F20] flex items-center gap-2">
                <Package className="w-4 h-4 text-[#8EB69B]" /> Top 10 Suku Cadang Terjual
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[280px] overflow-y-auto">
                <Table>
                  <TableBody>
                    {topItems.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-sm text-slate-500 py-8">Tidak ada data.</TableCell></TableRow>
                    ) : topItems.map((item, i) => (
                      <TableRow key={i} className="border-[#E6DFD3] hover:bg-slate-50">
                        <TableCell className="font-semibold text-[#051F20] text-sm pl-5 py-3">{item.nama}</TableCell>
                        <TableCell className="text-center font-medium text-slate-600 text-sm py-3">{item.qty} pcs</TableCell>
                        <TableCell className="text-right text-[#235347] font-semibold pr-5 text-sm py-3">{formatRupiah(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="border-b border-[#E6DFD3] bg-[#FAF7F2] py-4 px-5">
              <CardTitle className="text-sm font-semibold text-[#051F20] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#8EB69B]" /> Pantauan Kinerja Mekanik
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[#E6DFD3] max-h-[250px] overflow-y-auto">
                {mechanicStatus.map((m: any) => (
                  <div key={m.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#051F20] text-sm">{m.nama}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Diselesaikan: {m.selesai} motor</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded uppercase tracking-wider ${m.status === 'Sibuk' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {m.status}
                      </span>
                      {m.status === 'Sibuk' && <p className="text-xs font-bold text-[#051F20] mt-1">{m.motorAktif}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="border-b border-[#E6DFD3] bg-[#FAF7F2] py-4 px-5">
          <CardTitle className="text-sm font-semibold text-[#051F20]">Proporsi Pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="p-5 flex flex-col justify-center gap-5">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-slate-500">Tunai / Cash</span>
              <span className="font-semibold text-[#051F20]">{formatRupiah(metrics.breakdownMetode.tunai)} <span className="text-xs text-slate-400">({persenTunai.toFixed(0)}%)</span></span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div style={{ width: `${persenTunai}%` }} className="h-full bg-amber-500 rounded-full" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-slate-500">QRIS Dinamis</span>
              <span className="font-semibold text-[#051F20]">{formatRupiah(metrics.breakdownMetode.qris)} <span className="text-xs text-slate-400">({persenQris.toFixed(0)}%)</span></span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div style={{ width: `${persenQris}%` }} className="h-full bg-blue-500 rounded-full" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-slate-500">Transfer Bank</span>
              <span className="font-semibold text-[#051F20]">{formatRupiah(metrics.breakdownMetode.transfer)} <span className="text-xs text-slate-400">({persenTransfer.toFixed(0)}%)</span></span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div style={{ width: `${persenTransfer}%` }} className="h-full bg-[#235347] rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="border-b border-[#E6DFD3] bg-white py-4 px-5">
          <CardTitle className="text-sm font-semibold text-[#051F20] flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#8EB69B]" /> Riwayat Transaksi Lengkap
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {recentTransactions.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">Belum ada transaksi terekam pada periode ini.</div>
          ) : (
            <Table className="min-w-[800px]">
              <TableHeader className="bg-slate-50">
                <TableRow className="border-[#E6DFD3] hover:bg-transparent">
                  <TableHead className="font-medium text-slate-500 text-xs pl-5">No. Referensi</TableHead>
                  <TableHead className="font-medium text-slate-500 text-xs">Customer</TableHead>
                  <TableHead className="font-medium text-slate-500 text-xs">Waktu</TableHead>
                  <TableHead className="font-medium text-slate-500 text-xs">Tipe Transaksi</TableHead>
                  <TableHead className="font-medium text-slate-500 text-right text-xs">Total Pembayaran</TableHead>
                  <TableHead className="font-medium text-slate-500 text-right pr-5 w-24 text-xs">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((trx: any) => (
                  <TableRow key={trx.id} className="border-[#E6DFD3] hover:bg-slate-50 transition-colors">
                    <TableCell className="font-semibold text-[#8EB69B] text-sm pl-5">{trx.nomor}</TableCell>
                    <TableCell className="font-medium text-[#051F20] text-sm">{trx.customer}</TableCell>
                    <TableCell className="text-slate-600 text-sm">{formatDate(trx.waktu)}</TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded uppercase tracking-wider ${trx.tipe === 'SERVIS' ? 'bg-blue-50 text-blue-600' : 'bg-[#E1EFE6] text-[#235347]'}`}>
                        {trx.tipe}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-[#051F20] text-sm">{formatRupiah(trx.total)}</TableCell>
                    <TableCell className="text-right pr-5">
                      <Button variant="outline" size="sm" onClick={() => setSelectedTrx(trx)} className="h-8 text-xs font-semibold border-[#E6DFD3] text-[#051F20] hover:bg-slate-100 rounded-lg">
                        Rincian
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedTrx} onOpenChange={(open) => !open && setSelectedTrx(null)}>
        <DialogContent className="sm:max-w-4xl w-[95vw] bg-[#FAF7F2] border border-[#E6DFD3] rounded-2xl shadow-sm p-0 overflow-hidden max-h-[90vh] flex flex-col gap-0">
          {selectedTrx && (
            <>
              <div className="p-6 bg-white border-b border-[#E6DFD3] flex items-start justify-between">
                <div>
                  <DialogTitle className="text-xl font-semibold text-[#051F20] flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-[#8EB69B]" /> Struk {selectedTrx.nomor}
                  </DialogTitle>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className={`border-0 uppercase tracking-wider font-semibold text-xs ${selectedTrx.tipe === 'SERVIS' ? 'bg-blue-50 text-blue-600' : 'bg-[#E1EFE6] text-[#235347]'}`}>
                    {getJenisServis(selectedTrx)}
                  </Badge>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <UserCircle className="w-8 h-8 text-slate-400" />
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Identitas Konsumen</p>
                          <p className="text-base font-semibold text-[#051F20]">{selectedTrx.customers?.nama || 'Non-Member'}</p>
                          {selectedTrx.customers?.id && <p className="text-xs text-slate-500">ID: {selectedTrx.customers.id}</p>}
                          {selectedTrx.customers?.no_telp && <p className="text-xs text-slate-500">No. HP: {selectedTrx.customers.no_telp}</p>}
                        </div>
                      </div>
                      <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <CalendarDays className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Waktu Kunjungan</p>
                          <p className="text-sm font-medium text-[#051F20]">{formatDate(selectedTrx.waktu)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {selectedTrx.tipe === 'SERVIS' && (
                    <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl">
                      <CardContent className="p-5 flex flex-col justify-center h-full">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Kendaraan Pelanggan</p>
                        <h3 className="text-lg font-semibold text-[#051F20]">
                          {selectedTrx.merk_motor} <span className="text-sm text-slate-500 font-medium">({selectedTrx.cc_motor || '-'}cc)</span>
                        </h3>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="px-3 py-1.5 bg-[#E1EFE6] text-[#235347] font-semibold text-sm rounded-md tracking-widest">{selectedTrx.plat_motor}</span>
                          {selectedTrx.tahun_motor && <span className="text-sm font-medium text-slate-500">Tahun {selectedTrx.tahun_motor}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {selectedTrx.tipe === 'SERVIS' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-[#E6DFD3] shadow-sm">
                      <p className="font-semibold text-xs text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-rose-500"/> Keluhan Awal Kasir</p>
                      <p className="text-slate-700 text-sm leading-relaxed">{selectedTrx.keluhan || 'Tidak ada keluhan dicatat'}</p>
                    </div>
                    
                    <div className="bg-white p-5 rounded-xl border border-[#E6DFD3] shadow-sm">
                      <p className="font-semibold text-xs text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Wrench className="w-4 h-4 text-[#8EB69B]"/> Laporan Mekanik ({selectedTrx.mekanik?.full_name || '-'})</p>
                      <div className="text-slate-700 text-sm leading-relaxed bg-slate-50 border border-slate-100 rounded-lg p-3 italic text-center">
                        *(Data hasil ceklis & saran mekanik belum dikonfigurasi di Skema Database V2)*
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-xl border border-[#E6DFD3] shadow-sm overflow-hidden mt-6">
                  <div className="bg-slate-50 px-5 py-3 border-b border-[#E6DFD3]">
                    <h4 className="text-sm font-semibold text-[#051F20]">Rincian Transaksi & Harga</h4>
                  </div>
                  
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      <div className="space-y-4">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Jasa Layanan</p>
                        <div className="space-y-3">
                          {selectedTrx.tiket_jasa && selectedTrx.tiket_jasa.length > 0 ? (
                            selectedTrx.tiket_jasa.map((j: any, i: number) => (
                              <div key={`jasa-${i}`} className="flex justify-between items-start text-sm">
                                <span className="font-medium text-[#051F20] flex-1 pr-4">{j.nama_jasa}</span>
                                <span className="font-semibold text-[#051F20] whitespace-nowrap">{formatRupiah(j.harga_jasa)}</span>
                              </div>
                            ))
                          ) : selectedTrx.total_jasa > 0 ? (
                            <div className="flex justify-between items-start text-sm">
                              <span className="font-medium text-[#051F20] flex-1 pr-4">Jasa Servis (Manual)</span>
                              <span className="font-semibold text-[#051F20] whitespace-nowrap">{formatRupiah(selectedTrx.total_jasa)}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic block py-2">Tidak ada jasa layanan</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4 md:border-l md:border-slate-100 md:pl-6 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Suku Cadang / Barang</p>
                        <div className="space-y-3">
                          {((selectedTrx.tiket_items && selectedTrx.tiket_items.length > 0) || (selectedTrx.transaksi_takeaway_items && selectedTrx.transaksi_takeaway_items.length > 0)) ? (
                            (selectedTrx.tiket_items || selectedTrx.transaksi_takeaway_items).map((it: any, i: number) => (
                              <div key={`item-${i}`} className="flex justify-between items-start text-sm">
                                <div className="flex gap-2 flex-1 pr-4">
                                  <span className="text-slate-500 font-medium shrink-0">{it.qty}x</span>
                                  <span className="font-medium text-[#051F20]">{it.barang?.nama}</span>
                                </div>
                                <span className="font-semibold text-[#051F20] whitespace-nowrap">{formatRupiah(it.qty * it.harga_snapshot)}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic block py-2">Tidak ada suku cadang</span>
                          )}
                        </div>
                      </div>

                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t-2 border-dashed border-[#E6DFD3] mt-6">
                      <span className="font-bold text-[#051F20] text-base mb-2 sm:mb-0">TOTAL KESELURUHAN</span>
                      <span className="font-bold text-3xl text-[#235347]">{formatRupiah(selectedTrx.total)}</span>
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
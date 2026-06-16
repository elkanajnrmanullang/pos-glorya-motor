"use client"

import { useOwnerDashboard } from "@/hooks/use-owner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Wallet, ArrowDownCircle, Bike, Loader2, ArrowUpRight, DollarSign, Wrench } from "lucide-react"

// COMPONENT DASHBOARD UTAMA OWNER
export default function OwnerDashboardPage() {
  const { metrics, isLoading } = useOwnerDashboard()

  // FORMAT RUPIAH HELPER
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
  }

  if (isLoading) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center text-[#163832]">
        <Loader2 className="h-10 w-12 animate-spin" />
      </div>
    )
  }

  const dataFinansial = metrics!
  const totalMetode = dataFinansial.breakdownMetode.tunai + dataFinansial.breakdownMetode.qris + dataFinansial.breakdownMetode.transfer
  
  const persenTunai = totalMetode > 0 ? (dataFinansial.breakdownMetode.tunai / totalMetode) * 100 : 0
  const persenQris = totalMetode > 0 ? (dataFinansial.breakdownMetode.qris / totalMetode) * 100 : 0
  const persenTransfer = totalMetode > 0 ? (dataFinansial.breakdownMetode.transfer / totalMetode) * 100 : 0

  // Deklarasi type eksplisit pada parameter d
  const nilaiMaksimumTren = Math.max(...dataFinansial.trenTujuhHari.map((d: { total: number }) => d.total), 100000)

  return (
    <div className="w-full space-y-8">
      
      {/* JUDUL HALAMAN */}
      <div>
        <h1 className="text-3xl font-black text-[#051F20] tracking-tight">Ringkasan Utama</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Laporan grafik omzet berjalan dan analisis performa harian bengkel.</p>
      </div>

      {/* UI KARTU METRIK RINGKASAN */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-[#DAF1DE] bg-white shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Omzet Hari Ini</p>
              <h3 className="text-xl font-black text-[#051F20]">{formatRupiah(dataFinansial.pendapatanHariIni)}</h3>
            </div>
            <div className="w-12 h-12 bg-[#E1EFE6] text-[#235347] rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#DAF1DE] bg-white shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pengeluaran Laci</p>
              <h3 className="text-xl font-black text-rose-700">{formatRupiah(dataFinansial.pengeluaranHariIni)}</h3>
            </div>
            <div className="w-12 h-12 bg-rose-50 text-rose-700 rounded-xl flex items-center justify-center">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#DAF1DE] bg-white shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kas Bersih Masuk</p>
              <h3 className="text-xl font-black text-emerald-700">{formatRupiah(dataFinansial.kasBersihHariIni)}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#DAF1DE] bg-white shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unit Servis Shift</p>
              <h3 className="text-xl font-black text-blue-900">{dataFinansial.motorServisHariIni} Motor</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-900 rounded-xl flex items-center justify-center">
              <Bike className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* UI GRAFIK TREN PENDAPATAN */}
      <Card className="border-[#DAF1DE] bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-sm font-bold text-[#051F20]">Grafik Tren Omzet (7 Hari Terakhir)</CardTitle>
        </CardHeader>
        <CardContent className="pt-8 px-6">
          <div className="flex h-64 items-end justify-between gap-2 pt-4">
            {/* Deklarasi type eksplisit pada map parameters */}
            {dataFinansial.trenTujuhHari.map((day: { tanggal: string; total: number }, idx: number) => {
              const tinggiBar = (day.total / nilaiMaksimumTren) * 100
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-bold text-[#235347] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mb-1">
                    {day.total > 0 ? formatRupiah(day.total) : 'Rp 0'}
                  </div>
                  <div 
                    style={{ height: `${Math.max(tinggiBar, 4)}%` }} 
                    className={`w-full rounded-t-md transition-all duration-500 ${day.total > 0 ? 'bg-[#235347] hover:bg-[#051F20]' : 'bg-slate-100'}`}
                  />
                  <span className="text-[10px] font-bold text-slate-500 mt-1 whitespace-nowrap">{day.tanggal}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* UI METODE PEMBAYARAN DAN AKTIVITAS */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* DIAGRAM PROPORSI METODE */}
        <Card className="border-[#DAF1DE] bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-sm font-bold text-[#051F20]">Proporsi Pembayaran Hari Ini</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Cash / Tunai</span>
                <span>{formatRupiah(dataFinansial.breakdownMetode.tunai)} ({persenTunai.toFixed(0)}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div style={{ width: `${persenTunai}%` }} className="h-full bg-amber-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>QRIS Dinamis</span>
                <span>{formatRupiah(dataFinansial.breakdownMetode.qris)} ({persenQris.toFixed(0)}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div style={{ width: `${persenQris}%` }} className="h-full bg-blue-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Transfer Bank</span>
                <span>{formatRupiah(dataFinansial.breakdownMetode.transfer)} ({persenTransfer.toFixed(0)}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div style={{ width: `${persenTransfer}%` }} className="h-full bg-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DAFTAR NOTA TERAKHIR */}
        <Card className="md:col-span-2 border-[#DAF1DE] bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-sm font-bold text-[#051F20]">Aktivitas Penjualan Terkini</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {dataFinansial.aktivitasTerakhir.length === 0 ? (
              <p className="text-center py-12 text-sm text-slate-400 italic">Belum ada transaksi terekam pada sistem.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {/* Deklarasi type eksplisit pada map parameters */}
                {dataFinansial.aktivitasTerakhir.map((item: any) => (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.tipe === 'SERVIS' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {item.tipe === 'SERVIS' ? <Wrench className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#051F20]">{item.nomor} <span className="text-xs font-medium text-slate-400">· {item.pelanggan}</span></p>
                        <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">{item.tipe} · {new Date(item.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-[#163832]">{formatRupiah(item.total)}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
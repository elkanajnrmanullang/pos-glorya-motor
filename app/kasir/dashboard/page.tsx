"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSesiKasir } from '@/hooks/use-sesi-kasir'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wrench, ClipboardList, Wallet, ArrowRight, ShieldAlert, AlertTriangle, Clock } from 'lucide-react'

export default function CashierDashboard() {
  const supabase = createClient()
  const router = useRouter()
  const [userId, setUserId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id)
    }
    getUser()
  }, [supabase])

  const { sesiAktif, isSesiLoading } = useSesiKasir(userId)

  // 1. Fetch Metrik & List Tiket Sesi Ini
  const { data: metrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['metrics-sesi', sesiAktif?.id],
    queryFn: async () => {
      if (!sesiAktif?.id) return null

      const [tiketRes, takeawayRes] = await Promise.all([
        supabase
          .from('tiket_servis')
          .select('*, customers(nama)')
          .eq('sesi_id', sesiAktif.id)
          .order('waktu_masuk', { ascending: false }),
        supabase
          .from('transaksi_takeaway')
          .select('total, metode_bayar')
          .eq('sesi_id', sesiAktif.id)
      ])

      if (tiketRes.error) throw tiketRes.error
      if (takeawayRes.error) throw takeawayRes.error

      const tikets = tiketRes.data || []
      const takeaways = takeawayRes.data || []

      const antreanAktif = tikets.filter(t => t.status === 'menunggu' || t.status === 'dikerjakan').length
      const siapBayar = tikets.filter(t => t.status === 'selesai').length
      
      // Preview tiket belum lunas
      const listAntreanPreview = tikets.filter(t => t.status !== 'lunas')

      let totalCash = 0, totalQris = 0, totalTransfer = 0

      tikets.forEach(t => {
        if (t.status === 'lunas' && t.total_akhir) {
          if (t.metode_bayar === 'tunai') totalCash += Number(t.total_akhir)
          if (t.metode_bayar === 'qris') totalQris += Number(t.total_akhir)
          if (t.metode_bayar === 'transfer') totalTransfer += Number(t.total_akhir)
        }
      })
      takeaways.forEach(tw => {
        if (tw.metode_bayar === 'tunai') totalCash += Number(tw.total)
        if (tw.metode_bayar === 'qris') totalQris += Number(tw.total)
        if (tw.metode_bayar === 'transfer') totalTransfer += Number(tw.total)
      })

      return {
        antreanAktif, siapBayar, totalCash, totalQris, totalTransfer,
        totalPendapatan: totalCash + totalQris + totalTransfer,
        listAntreanPreview
      }
    },
    enabled: !!sesiAktif?.id
  })

  // 2. Fetch Alert Stok Menipis
  const { data: stokMenipis } = useQuery({
    queryKey: ['stok-menipis-alert'],
    queryFn: async () => {
      const { data, error } = await supabase.from('barang').select('nama, stok_fisik, stok_minimum').eq('aktif', true)
      if (error) throw error
      return data.filter(b => b.stok_fisik <= (b.stok_minimum || 5))
    }
  })

  if (isSesiLoading || isMetricsLoading) return <div className="text-sm p-8 text-[#163832]">Memuat data dashboard...</div>

  const formatRupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#051F20]">Dashboard Kasir</h2>
        <p className="text-[#163832] mt-1">Ringkasan operasional, peringatan stok, dan keuangan shift Anda hari ini.</p>
      </div>

      {/* ALERT STOK MENIPIS */}
      {stokMenipis && stokMenipis.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-4 shadow-sm">
          <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-rose-900">Perhatian: {stokMenipis.length} Barang Mencapai Batas Minimum Stok!</h4>
            <p className="text-sm text-rose-700 mt-1">
              {stokMenipis.slice(0, 3).map(b => `${b.nama} (Sisa ${b.stok_fisik})`).join(', ')}
              {stokMenipis.length > 3 ? `, dan ${stokMenipis.length - 3} lainnya.` : '.'}
            </p>
          </div>
          <Button variant="outline" size="sm" className="bg-white text-rose-700 border-rose-200" onClick={() => router.push('/kasir/stok')}>
            Cek Gudang
          </Button>
        </div>
      )}

      {sesiAktif && (
        <div className="bg-[#E1EFE6] border border-[#8EB69B]/50 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-[#051F20]">Shift Anda Sedang Aktif</h4>
            <p className="text-sm text-[#163832]">
              Dibuka: {new Date(sesiAktif.waktu_buka!).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})} | Modal Awal: <span className="font-bold">{formatRupiah(Number(sesiAktif.modal_awal))}</span>
            </p>
          </div>
          <Button className="bg-[#235347] hover:bg-[#051F20] text-white" onClick={() => router.push('/kasir/sesi/tutup')}>
            Tutup Sesi Kasir <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-[#FAF7F2] border-[#E6DFD3]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-[#163832]">Antrean Servis Aktif</CardTitle>
            <Wrench className="h-4 w-4 text-[#235347]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-[#051F20]">{metrics?.antreanAktif || 0} Motor</div>
          </CardContent>
        </Card>

        <Card className="bg-[#FAF7F2] border-[#E6DFD3]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-[#163832]">Siap Dibayar</CardTitle>
            <ClipboardList className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-[#051F20]">{metrics?.siapBayar || 0} Tiket</div>
          </CardContent>
        </Card>

        <Card className="bg-[#FAF7F2] border-[#E6DFD3]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-[#163832]">Omzet Sistem Sesi Ini</CardTitle>
            <Wallet className="h-4 w-4 text-[#235347]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-[#051F20]">{formatRupiah(metrics?.totalPendapatan || 0)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* PREVIEW ANTREAN */}
        <Card className="bg-white border-[#E6DFD3]">
          <CardHeader className="border-b border-[#E6DFD3]/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-[#051F20] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#8EB69B]" /> Pratinjau Antrean
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-[#235347]" onClick={() => router.push('/kasir/tiket/aktif')}>
                Lihat Semua <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {metrics?.listAntreanPreview?.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">Antrean sedang kosong.</div>
            ) : (
              <div className="divide-y divide-[#E6DFD3]/60">
                {metrics?.listAntreanPreview?.slice(0, 5).map((t: any) => (
                  <div key={t.id} className="p-4 flex items-center justify-between hover:bg-[#FAF7F2] transition-colors">
                    <div>
                      <h4 className="font-bold text-[#051F20]">{t.nomor_antrian} <span className="text-sm text-[#163832] font-medium">— {t.plat_motor}</span></h4>
                      <p className="text-xs text-slate-500 mt-0.5">{t.customers?.nama}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] font-bold ${t.status === 'menunggu' ? 'bg-amber-100 text-amber-800' : t.status === 'dikerjakan' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {t.status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* PREVIEW KEUANGAN */}
        <Card className="bg-[#FAF7F2] border-[#E6DFD3]">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#051F20]">Rincian Metode Bayar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <div className="flex justify-between p-3 bg-white border border-[#E6DFD3] rounded-lg">
                <span className="text-sm font-bold text-[#163832]">Tunai (Cash)</span>
                <span className="font-black text-[#051F20]">{formatRupiah(metrics?.totalCash || 0)}</span>
              </div>
              <div className="flex justify-between p-3 bg-white border border-[#E6DFD3] rounded-lg">
                <span className="text-sm font-bold text-[#163832]">QRIS</span>
                <span className="font-black text-[#051F20]">{formatRupiah(metrics?.totalQris || 0)}</span>
              </div>
              <div className="flex justify-between p-3 bg-white border border-[#E6DFD3] rounded-lg">
                <span className="text-sm font-bold text-[#163832]">Transfer BCA</span>
                <span className="font-black text-[#051F20]">{formatRupiah(metrics?.totalTransfer || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
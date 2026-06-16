"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Wrench, CheckCircle2, AlertCircle, ArrowRight, User } from 'lucide-react'
import { toast } from 'sonner'

export default function TiketAktifPage() {
  const supabase = createClient()
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [userId, setUserId] = useState<string | undefined>(undefined)

  // GET_USER_SESSION
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id)
    }
    getUser()
  }, [supabase])

  // FETCH_UNPAID_TICKETS
  const { data: tiketAktif, isLoading } = useQuery({
    queryKey: ['tiket-aktif'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tiket_servis')
        .select(`
          *,
          customers(nama, no_telp)
        `)
        // QUERY_FILTER_EXCLUDE_LUNAS
        .neq('status', 'lunas')
        .order('waktu_masuk', { ascending: true })

      if (error) throw error
      return data
    }
  })

  // INIT_REALTIME_SUBSCRIPTION_TIKET_SERVIS
  useEffect(() => {
    const channel = supabase
      .channel('realtime-tiket-kasir')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tiket_servis'
      }, (payload) => {
        // INVALIDATE_QUERY_ON_POSTGRES_CHANGES
        queryClient.invalidateQueries({ queryKey: ['tiket-aktif'] })
        
        // TRIGGER_TOAST_ON_STATUS_SELESAI
        const newData = payload.new as any;
        const oldData = payload.old as any;
        
        if (newData && newData.status === 'selesai' && oldData && oldData.status !== 'selesai') {
          toast.success(`Tiket Antrean ${newData.nomor_antrian} telah selesai dikerjakan mekanik! Menunggu pembayaran.`)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, queryClient])

  if (isLoading) return <div className="text-sm font-medium text-[#163832] p-8">Memuat antrean aktif...</div>

  // CATEGORIZE_TICKETS_BY_STATUS
  const tiketMenunggu = tiketAktif?.filter(t => t.status === 'menunggu') || []
  const tiketDikerjakan = tiketAktif?.filter(t => t.status === 'dikerjakan') || []
  const tiketSelesai = tiketAktif?.filter(t => t.status === 'selesai') || []

  // FORMAT_TIMESTAMP_TO_TIME_STRING
  const formatWaktu = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  // COMPONENT_TIKET_CARD
  const TiketCard = ({ tiket }: { tiket: any }) => (
    <Card className={`border ${tiket.status === 'selesai' ? 'border-emerald-300 bg-emerald-50' : 'border-[#E6DFD3] bg-white'} shadow-sm relative overflow-hidden`}>
      {tiket.status === 'selesai' && (
        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
          SIAP BAYAR
        </div>
      )}
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-black tracking-tight text-[#051F20]">{tiket.nomor_antrian}</h3>
            <p className="text-xs font-bold text-[#235347] uppercase tracking-wider">{tiket.plat_motor}</p>
          </div>
          <Badge variant="outline" className={`font-bold uppercase ${
            tiket.status === 'menunggu' ? 'border-amber-400 text-amber-700 bg-amber-50' :
            tiket.status === 'dikerjakan' ? 'border-blue-400 text-blue-700 bg-blue-50' :
            'border-emerald-500 text-emerald-700 bg-emerald-100'
          }`}>
            {tiket.status}
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-sm text-[#163832]">
            <User className="w-3.5 h-3.5 opacity-70" /> 
            <span className="font-semibold truncate max-w-[150px]">{tiket.customers?.nama}</span>
          </div>
          <div className="text-xs text-[#163832] flex items-center gap-1.5">
            <span className="font-medium bg-[#E1EFE6] px-1.5 py-0.5 rounded text-[#235347]">
              {tiket.tipe === 'jasa' ? 'HANYA JASA' : 'SERVIS + PART'}
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-[#E6DFD3] flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1 font-medium">
            <Clock className="w-3 h-3" /> Masuk: {formatWaktu(tiket.waktu_masuk)}
          </div>
          
          {tiket.status === 'selesai' && (
            <Button 
              size="sm" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-xs px-3 shadow-md"
              onClick={() => router.push(`/kasir/tiket/${tiket.id}`)}
            >
              LUNASI <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  // RENDER_MAIN_LAYOUT
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#051F20] flex items-center gap-2">
          <Clock className="w-6 h-6 text-[#8EB69B]" />
          Monitor Antrean Tiket Aktif
        </h2>
        <p className="text-sm text-[#163832] mt-1">Daftar motor pelanggan yang masih berada di bengkel dan belum dilunasi.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* RENDER_COLUMN_MENUNGGU */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-amber-200">
            <h3 className="font-bold text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Menunggu ({tiketMenunggu.length})
            </h3>
          </div>
          {tiketMenunggu.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-8 border border-dashed rounded-lg bg-slate-50">Tidak ada antrean menunggu</div>
          ) : (
            <div className="grid gap-3">
              {tiketMenunggu.map(t => <TiketCard key={t.id} tiket={t} />)}
            </div>
          )}
        </div>

        {/* RENDER_COLUMN_DIKERJAKAN */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-blue-200">
            <h3 className="font-bold text-blue-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-500" />
              Sedang Dikerjakan ({tiketDikerjakan.length})
            </h3>
          </div>
          {tiketDikerjakan.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-8 border border-dashed rounded-lg bg-slate-50">Tidak ada motor yang sedang dibongkar</div>
          ) : (
            <div className="grid gap-3">
              {tiketDikerjakan.map(t => <TiketCard key={t.id} tiket={t} />)}
            </div>
          )}
        </div>

        {/* RENDER_COLUMN_SELESAI */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
            <h3 className="font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Siap Bayar ({tiketSelesai.length})
            </h3>
          </div>
          {tiketSelesai.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-8 border border-dashed rounded-lg bg-slate-50">Belum ada motor yang siap dibayar</div>
          ) : (
            <div className="grid gap-3">
              {tiketSelesai.map(t => <TiketCard key={t.id} tiket={t} />)}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
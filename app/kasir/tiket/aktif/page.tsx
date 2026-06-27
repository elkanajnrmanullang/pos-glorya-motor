"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Wrench, CheckCircle2, AlertCircle, ArrowRight, User } from 'lucide-react'
import { toast } from 'sonner'

// COMPONENT_TIKET_AKTIF_PAGE
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
        .select('*, customers(nama, no_telp)')
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tiket_servis' }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['tiket-aktif'] })
        const newData = payload.new as any;
        const oldData = payload.old as any;
        if (newData && newData.status === 'selesai' && oldData && oldData.status !== 'selesai') {
          toast.success(`Antrean ${newData.nomor_antrian} selesai dikerjakan! Siap bayar.`)
        }
      }).subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, queryClient])

  if (isLoading) return <div className="text-sm font-bold tracking-widest text-[#163832] uppercase p-8">Memuat antrean...</div>

  // CATEGORIZE_TICKETS_BY_STATUS
  const tiketMenunggu = tiketAktif?.filter(t => t.status === 'menunggu') || []
  const tiketDikerjakan = tiketAktif?.filter(t => t.status === 'dikerjakan') || []
  const tiketSelesai = tiketAktif?.filter(t => t.status === 'selesai') || []

  // FORMAT_TIME_HELPER
  const formatWaktu = (dateString: string) => new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  // COMPONENT_TIKET_CARD_MODERN
  const TiketCard = ({ tiket }: { tiket: any }) => (
    <Card className={`border-0 shadow-sm relative overflow-hidden rounded-3xl transition-all duration-200 hover:shadow-md ${tiket.status === 'selesai' ? 'bg-[#E1EFE6]' : 'bg-white'}`}>
      <CardContent className="p-5 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-[#051F20]">{tiket.nomor_antrian}</h3>
            <p className="text-xs font-black text-[#8EB69B] uppercase tracking-widest mt-0.5">{tiket.plat_motor}</p>
          </div>
          <div className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest ${
            tiket.status === 'menunggu' ? 'bg-amber-100 text-amber-800' :
            tiket.status === 'dikerjakan' ? 'bg-blue-100 text-blue-800' :
            'bg-[#235347] text-white shadow-sm'
          }`}>
            {tiket.status}
          </div>
        </div>

        <div className="bg-[#FAF7F2] p-3 rounded-2xl space-y-2 border border-[#E6DFD3]/40">
          <div className="flex items-center gap-2 text-sm text-[#051F20]">
            <User className="w-4 h-4 text-[#8EB69B]" /> 
            <span className="font-bold truncate max-w-[150px]">{tiket.customers?.nama}</span>
          </div>
          <div className="text-[10px] font-bold text-[#163832] flex items-center gap-2 uppercase tracking-widest">
            <span className="bg-white px-2 py-1 rounded-md shadow-sm">
              {tiket.tipe === 'jasa' ? 'HANYA JASA' : 'SERVIS + PART'}
            </span>
            <span>MASUK: {formatWaktu(tiket.waktu_masuk)}</span>
          </div>
        </div>

        {tiket.status !== 'menunggu' && (
          <Button 
            className={`w-full h-12 rounded-2xl font-black tracking-widest text-xs shadow-sm transition-all ${
              tiket.status === 'selesai' ? 'bg-[#051F20] hover:bg-black text-white' : 'bg-white border-2 border-[#E6DFD3] text-[#051F20] hover:border-[#8EB69B] hover:bg-[#FAF7F2]'
            }`}
            onClick={() => router.push(`/kasir/tiket/${tiket.id}`)}
          >
            {tiket.status === 'selesai' ? 'PROSES PELUNASAN' : 'KELOLA BARANG TIKET'} <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  )

  // RENDER_MAIN_DASHBOARD
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div>
        <h2 className="text-3xl font-black text-[#051F20] flex items-center gap-3 tracking-tight">
          <Clock className="w-8 h-8 text-[#8EB69B]" /> Monitor Antrean
        </h2>
        <p className="text-sm font-medium text-[#163832] mt-2">Pusat kendali motor yang sedang berada di bengkel.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* COLUMN_MENUNGGU */}
        <div className="bg-[#FAF7F2] rounded-[2.5rem] p-5 space-y-4 border border-[#E6DFD3]/60">
          <div className="flex items-center justify-between px-2 pt-2">
            <h3 className="font-black text-[#051F20] flex items-center gap-2 tracking-wider">
              <AlertCircle className="w-5 h-5 text-amber-500" /> MENUNGGU
            </h3>
            <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-black text-sm text-[#051F20] shadow-sm">{tiketMenunggu.length}</span>
          </div>
          {tiketMenunggu.length === 0 ? (
            <div className="text-xs text-slate-400 font-bold text-center py-10 uppercase tracking-widest">KOSONG</div>
          ) : (
            <div className="grid gap-4">{tiketMenunggu.map(t => <TiketCard key={t.id} tiket={t} />)}</div>
          )}
        </div>

        {/* COLUMN_DIKERJAKAN */}
        <div className="bg-[#FAF7F2] rounded-[2.5rem] p-5 space-y-4 border border-[#E6DFD3]/60">
          <div className="flex items-center justify-between px-2 pt-2">
            <h3 className="font-black text-[#051F20] flex items-center gap-2 tracking-wider">
              <Wrench className="w-5 h-5 text-blue-500" /> DIKERJAKAN
            </h3>
            <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-black text-sm text-[#051F20] shadow-sm">{tiketDikerjakan.length}</span>
          </div>
          {tiketDikerjakan.length === 0 ? (
            <div className="text-xs text-slate-400 font-bold text-center py-10 uppercase tracking-widest">KOSONG</div>
          ) : (
            <div className="grid gap-4">{tiketDikerjakan.map(t => <TiketCard key={t.id} tiket={t} />)}</div>
          )}
        </div>

        {/* COLUMN_SELESAI */}
        <div className="bg-[#E1EFE6] rounded-[2.5rem] p-5 space-y-4 shadow-inner border border-[#8EB69B]/40">
          <div className="flex items-center justify-between px-2 pt-2">
            <h3 className="font-black text-[#051F20] flex items-center gap-2 tracking-wider">
              <CheckCircle2 className="w-5 h-5 text-[#235347]" /> SIAP BAYAR
            </h3>
            <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-black text-sm text-[#051F20] shadow-sm">{tiketSelesai.length}</span>
          </div>
          {tiketSelesai.length === 0 ? (
            <div className="text-xs text-[#8EB69B] font-bold text-center py-10 uppercase tracking-widest">KOSONG</div>
          ) : (
            <div className="grid gap-4">{tiketSelesai.map(t => <TiketCard key={t.id} tiket={t} />)}</div>
          )}
        </div>

      </div>
    </div>
  )
}
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

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id)
    }
    getUser()
  }, [supabase])

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

  if (isLoading) return <div className="text-sm font-medium text-slate-500 p-8">Memuat antrean...</div>

  const tiketMenunggu = tiketAktif?.filter(t => t.status === 'menunggu') || []
  const tiketDikerjakan = tiketAktif?.filter(t => t.status === 'dikerjakan') || []
  const tiketSelesai = tiketAktif?.filter(t => t.status === 'selesai') || []

  const formatWaktu = (dateString: string) => new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  const TiketCard = ({ tiket }: { tiket: any }) => (
    <Card className={`border border-[#E6DFD3] shadow-sm relative overflow-hidden rounded-xl transition-all duration-200 hover:border-[#8EB69B] hover:shadow-md ${tiket.status === 'selesai' ? 'bg-[#E1EFE6]' : 'bg-white'}`}>
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-[#051F20] tracking-tight">{tiket.nomor_antrian}</h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{tiket.plat_motor}</p>
          </div>
          <div className={`text-[10px] font-semibold px-2.5 py-1 rounded-md uppercase tracking-wider ${
            tiket.status === 'menunggu' ? 'bg-amber-100 text-amber-800' :
            tiket.status === 'dikerjakan' ? 'bg-blue-100 text-blue-800' :
            'bg-[#235347] text-white shadow-sm'
          }`}>
            {tiket.status}
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg space-y-2 border border-slate-100">
          <div className="flex items-center gap-2 text-sm text-[#051F20]">
            <User className="w-4 h-4 text-slate-400" /> 
            <span className="font-semibold truncate max-w-[150px]">{tiket.customers?.nama}</span>
          </div>
          <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-2 uppercase tracking-wide">
            <span className="bg-white px-2 py-1 rounded-md border border-slate-200">
              {tiket.tipe === 'jasa' ? 'Hanya Jasa' : 'Servis + Part'}
            </span>
            <span>Masuk: {formatWaktu(tiket.waktu_masuk)}</span>
          </div>
        </div>

        {tiket.status !== 'menunggu' && (
          <Button 
            className={`w-full h-10 rounded-lg font-semibold text-xs shadow-sm transition-all ${
              tiket.status === 'selesai' ? 'bg-[#051F20] hover:bg-[#163832] text-white' : 'bg-white border border-[#E6DFD3] text-[#051F20] hover:bg-slate-50'
            }`}
            onClick={() => router.push(`/kasir/tiket/${tiket.id}`)}
          >
            {tiket.status === 'selesai' ? 'Proses Pelunasan' : 'Kelola Barang Tiket'} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 font-sans">
      <div>
        <h2 className="text-2xl font-semibold text-[#051F20] tracking-tight flex items-center gap-2">
          <Clock className="w-6 h-6 text-[#8EB69B]" /> Monitor Antrean
        </h2>
        <p className="text-sm text-slate-500 mt-1">Pusat kendali motor yang sedang berada di bengkel.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* COLUMN_MENUNGGU */}
        <div className="bg-slate-50 rounded-2xl p-4 space-y-4 border border-[#E6DFD3]">
          <div className="flex items-center justify-between px-2 pt-1">
            <h3 className="font-semibold text-sm text-[#051F20] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" /> Menunggu
            </h3>
            <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center font-bold text-xs text-[#051F20] border border-[#E6DFD3]">{tiketMenunggu.length}</span>
          </div>
          {tiketMenunggu.length === 0 ? (
            <div className="text-xs text-slate-400 font-medium text-center py-8">Tidak ada antrean</div>
          ) : (
            <div className="grid gap-3">{tiketMenunggu.map(t => <TiketCard key={t.id} tiket={t} />)}</div>
          )}
        </div>

        {/* COLUMN_DIKERJAKAN */}
        <div className="bg-slate-50 rounded-2xl p-4 space-y-4 border border-[#E6DFD3]">
          <div className="flex items-center justify-between px-2 pt-1">
            <h3 className="font-semibold text-sm text-[#051F20] flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-500" /> Dikerjakan
            </h3>
            <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center font-bold text-xs text-[#051F20] border border-[#E6DFD3]">{tiketDikerjakan.length}</span>
          </div>
          {tiketDikerjakan.length === 0 ? (
            <div className="text-xs text-slate-400 font-medium text-center py-8">Tidak ada pengerjaan</div>
          ) : (
            <div className="grid gap-3">{tiketDikerjakan.map(t => <TiketCard key={t.id} tiket={t} />)}</div>
          )}
        </div>

        {/* COLUMN_SELESAI */}
        <div className="bg-[#E1EFE6]/30 rounded-2xl p-4 space-y-4 border border-[#8EB69B]/40">
          <div className="flex items-center justify-between px-2 pt-1">
            <h3 className="font-semibold text-sm text-[#051F20] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#235347]" /> Siap Bayar
            </h3>
            <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center font-bold text-xs text-[#051F20] border border-[#E6DFD3]">{tiketSelesai.length}</span>
          </div>
          {tiketSelesai.length === 0 ? (
            <div className="text-xs text-slate-400 font-medium text-center py-8">Tidak ada tiket selesai</div>
          ) : (
            <div className="grid gap-3">{tiketSelesai.map(t => <TiketCard key={t.id} tiket={t} />)}</div>
          )}
        </div>

      </div>
    </div>
  )
}
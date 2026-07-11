import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// INTERFACE_TIKET_MEKANIK
export interface TiketMekanik {
  id: string
  nomor_antrian: string
  plat_motor: string
  merk_motor: string
  keluhan: string
  status: string
  waktu_masuk: string
  mekanik_id: string | null
}

// INTERFACE_PAYLOAD_SELESAI
export interface SelesaiPayload {
  id: string
  checklist: Record<string, string>
  saran: string
}

// MAIN_HOOK_FUNCTION
export function useMekanik() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // FETCH_USER_PROFILE
  const { data: userProfile } = useQuery({
    queryKey: ['mekanik-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      return data
    }
  })

  // FETCH_TIKET_AKTIF
  const { data: tiketSemua = [], isLoading: isLoadingTiket } = useQuery({
    queryKey: ['tiket-bengkel-aktif'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tiket_servis')
        .select('*')
        .in('status', ['menunggu', 'dikerjakan'])
        .order('waktu_masuk', { ascending: true })
      if (error) throw error
      return data as TiketMekanik[]
    },
    refetchInterval: 3000
  })

  // MUTATION_KLAIM_TIKET (Menggunakan RPC)
  const klaimTiketMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('klaim_tiket_mekanik', { 
        p_tiket_id: id 
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tiket-bengkel-aktif'] })
  })

  // MUTATION_SELESAI_TIKET (Menggunakan RPC)
  const selesaiTiketMut = useMutation({
    mutationFn: async (payload: SelesaiPayload) => {
      const { error } = await supabase.rpc('selesai_tiket_mekanik', {
        p_tiket_id: payload.id,
        p_checklist: payload.checklist,
        p_saran: payload.saran
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tiket-bengkel-aktif'] })
  })

  return {
    userProfile,
    tiketSemua,
    isLoadingTiket,
    klaimTiket: klaimTiketMut.mutateAsync,
    selesaiTiket: selesaiTiketMut.mutateAsync,
    isProcessing: klaimTiketMut.isPending || selesaiTiketMut.isPending
  }
}
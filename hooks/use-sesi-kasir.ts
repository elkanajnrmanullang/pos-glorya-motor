import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client' 

export function useSesiKasir(kasirId: string | undefined) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: sesiAktif, isLoading: isSesiLoading } = useQuery({
    queryKey: ['sesi-aktif', kasirId],
    queryFn: async () => {
      if (!kasirId) return null

      const { data, error } = await supabase
        .from('sesi_kasir')
        .select('*')
        .eq('kasir_id', kasirId)
        .eq('status', 'aktif')
        .maybeSingle()

      if (error) throw error
      return data
    },
    enabled: !!kasirId,
  })

  const bukaKasirMutation = useMutation({
    mutationFn: async ({ modalAwal, cabangId }: { modalAwal: number, cabangId?: string }) => {
      if (!kasirId) throw new Error('Kasir tidak teridentifikasi')

      const { data, error } = await supabase
        .from('sesi_kasir')
        .insert({
          kasir_id: kasirId,
          cabang_id: cabangId || null,
          modal_awal: modalAwal,
          status: 'aktif'
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sesi-aktif', kasirId] })
    }
  })

  return {
    sesiAktif,
    isSesiLoading,
    bukaKasir: bukaKasirMutation.mutateAsync,
    isMembukaKasir: bukaKasirMutation.isPending
  }
}
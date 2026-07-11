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
    mutationFn: async ({ modalAwal }: { modalAwal: number }) => {
      if (!kasirId) throw new Error('Kasir tidak teridentifikasi. Silakan login ulang.')

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, cabang_id')
        .eq('id', kasirId)
        .single()

      if (profileError || !profile) {
        throw new Error('Gagal memuat profil. Pastikan akun terdaftar di tabel profiles.')
      }

      if (profile.role !== 'kasir' && profile.role !== 'owner') {
        throw new Error(`Akses ditolak. Role Anda adalah ${profile.role}.`)
      }

      if (!profile.cabang_id) {
        throw new Error('Cabang ID kosong! Isi terlebih dahulu cabang_id Anda di Supabase (tabel profiles).')
      }

      const { data, error } = await supabase
        .from('sesi_kasir')
        .insert({
          kasir_id: kasirId,
          cabang_id: profile.cabang_id,
          modal_awal: modalAwal,
          status: 'aktif'
        })
        .select()
        .single()

      if (error) {
        if (error.code === '42501') throw new Error('Ditolak sistem keamanan (RLS). Pastikan Anda adalah kasir yang sah.')
        throw new Error(`Gagal membuka sesi: ${error.message}`)
      }
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
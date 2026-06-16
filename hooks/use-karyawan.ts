import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface Karyawan {
  id: string
  full_name: string
  role: 'kasir' | 'mekanik' | 'owner'
  created_at: string
}

export function useKaryawan() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // FETCH DAFTAR KARYAWAN
  const query = useQuery({
    queryKey: ['owner-daftar-karyawan'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Karyawan[]
    }
  })

  // MUTASI UPDATE PROFIL
  const updateKaryawan = useMutation({
    mutationFn: async (payload: { id: string; full_name: string; role: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: payload.full_name, role: payload.role })
        .eq('id', payload.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-daftar-karyawan'] })
  })

  return {
    karyawanList: query.data || [],
    isLoading: query.isLoading,
    updateKaryawan: updateKaryawan.mutateAsync,
    isUpdating: updateKaryawan.isPending
  }
}
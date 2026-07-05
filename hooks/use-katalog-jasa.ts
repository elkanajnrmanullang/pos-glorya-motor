import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface KatalogJasa {
  id: string
  nama_jasa: string
  harga_dasar: number
  aktif: boolean
  created_at?: string
}

export function useKatalogJasa() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // FETCH SEMUA DATA JASA
  const query = useQuery({
    queryKey: ['owner-katalog-jasa-v2'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('katalog_jasa')
        .select('*')
        .order('nama_jasa', { ascending: true })

      if (error) throw error
      return data as KatalogJasa[]
    }
  })

  // MUTASI TAMBAH JASA
  const tambahJasa = useMutation({
    mutationFn: async (newJasa: { nama_jasa: string; harga_dasar: number }) => {
      const { error } = await supabase
        .from('katalog_jasa')
        .insert([newJasa])

      if (error) {
        if (error.code === '23505') throw new Error('Nama jasa ini sudah ada di katalog!')
        throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-katalog-jasa-v2'] })
  })

  // MUTASI UDPATE JASA 
  const updateJasa = useMutation({
    mutationFn: async (updatedJasa: { id: string; nama_jasa: string; harga_dasar: number }) => {
      const { error } = await supabase
        .from('katalog_jasa')
        .upsert({
          id: updatedJasa.id,
          nama_jasa: updatedJasa.nama_jasa,
          harga_dasar: updatedJasa.harga_dasar
        }, { onConflict: 'id' }) 

      if (error) {
        if (error.code === '23505') throw new Error('Nama jasa ini sudah digunakan!')
        throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-katalog-jasa-v2'] })
  })

  // MUTASI HAPUS JASA
  const hapusJasa = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('katalog_jasa')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-katalog-jasa-v2'] })
  })

  return {
    jasaList: query.data || [],
    isLoading: query.isLoading,
    tambahJasa: tambahJasa.mutateAsync,
    updateJasa: updateJasa.mutateAsync,
    hapusJasa: hapusJasa.mutateAsync,
    isProcessing: tambahJasa.isPending || updateJasa.isPending || hapusJasa.isPending
  }
}
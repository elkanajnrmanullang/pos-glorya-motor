import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// INTERFACE DATA JASA
export interface KatalogJasa {
  id: string
  nama_jasa: string
  harga_jasa: number
  aktif: boolean
  created_at?: string
}

export function useKatalogJasa() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // FETCH SEMUA DATA JASA
  const query = useQuery({
    queryKey: ['owner-katalog-jasa'],
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
    mutationFn: async (newJasa: { nama_jasa: string; harga_jasa: number }) => {
      const { error } = await supabase
        .from('katalog_jasa')
        .insert([newJasa])

      if (error) {
        if (error.code === '23505') throw new Error('Nama jasa ini sudah ada di katalog!')
        throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-katalog-jasa'] })
  })

  // MUTASI UBAH JASA
  const updateJasa = useMutation({
    mutationFn: async (updatedJasa: { id: string; nama_jasa: string; harga_jasa: number }) => {
      const { error } = await supabase
        .from('katalog_jasa')
        .update({
          nama_jasa: updatedJasa.nama_jasa,
          harga_jasa: updatedJasa.harga_jasa
        })
        .eq('id', updatedJasa.id)

      if (error) {
        if (error.code === '23505') throw new Error('Nama jasa ini sudah digunakan!')
        throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-katalog-jasa'] })
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-katalog-jasa'] })
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
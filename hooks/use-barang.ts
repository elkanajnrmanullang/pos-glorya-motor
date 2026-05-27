import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type TBarang = {
  id?: string;
  nama: string;
  harga_beli: number;
  harga_jual: number;
  stok_fisik: number;
  stok_minimum: number;
}

export function useBarang() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Ambil data barang
  const { data: barang, isLoading: isBarangLoading } = useQuery({
    queryKey: ['barang'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('barang')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }
  })

  // Tambah Barang Baru
  const addBarangMutation = useMutation({
    mutationFn: async (newBarang: TBarang) => {
      const { data, error } = await supabase
        .from('barang')
        .insert({
          nama: newBarang.nama,
          harga_beli: newBarang.harga_beli,
          harga_jual: newBarang.harga_jual,
          stok_fisik: newBarang.stok_fisik,
          stok_minimum: newBarang.stok_minimum
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['barang'] })
  })

  // Ubah Data Barang
  const updateBarangMutation = useMutation({
    mutationFn: async (updatedBarang: TBarang) => {
      const { data, error } = await supabase
        .from('barang')
        .update({
          nama: updatedBarang.nama,
          harga_beli: updatedBarang.harga_beli,
          harga_jual: updatedBarang.harga_jual,
          stok_fisik: updatedBarang.stok_fisik,
          stok_minimum: updatedBarang.stok_minimum,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedBarang.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['barang'] })
  })

  // Hapus Barang
  const deleteBarangMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('barang')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['barang'] })
  })

  return {
    barang,
    isBarangLoading,
    addBarang: addBarangMutation.mutateAsync,
    isAddingBarang: addBarangMutation.isPending,
    updateBarang: updateBarangMutation.mutateAsync,
    isUpdatingBarang: updateBarangMutation.isPending,
    deleteBarang: deleteBarangMutation.mutateAsync,
    isDeletingBarang: deleteBarangMutation.isPending
  }
}
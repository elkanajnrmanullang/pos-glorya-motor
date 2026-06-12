import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// INTERFACE BARANG
export interface Barang {
  id: string
  nama: string
  barcode: string | null
  harga_beli: number
  harga_jual: number
  stok_fisik: number
  stok_reserved: number
  stok_minimum: number
  stok_tersedia: number
  aktif: boolean
}

// INTERFACE RIWAYAT
export interface RiwayatBarang {
  id: string
  barang_id: string
  keterangan: string
  waktu: string
  barang?: {
    nama: string
  }
}

// HOOK RIWAYAT GLOBAL
export function useRiwayatBarang() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['riwayat-barang-global'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('riwayat_barang')
        .select('*, barang(nama)')
        .order('waktu', { ascending: false })
        .limit(30)
      if (error) throw error
      return data as RiwayatBarang[]
    }
  })
}

// HOOK UTAMA BARANG
export function useBarang() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // QUERY FETCH BARANG
  const query = useQuery({
    queryKey: ['barang'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('barang')
        .select('*')
        .order('nama', { ascending: true })

      if (error) throw error
      return data as Barang[]
    }
  })

  // MUTATION CREATE BARANG
  const createMutation = useMutation({
    mutationFn: async (payload: Omit<Barang, 'id' | 'stok_reserved' | 'stok_tersedia' | 'aktif'>) => {
      const { data, error } = await supabase
        .from('barang')
        .insert({
          nama: payload.nama,
          barcode: payload.barcode || null,
          harga_beli: payload.harga_beli,
          harga_jual: payload.harga_jual,
          stok_fisik: payload.stok_fisik,
          stok_minimum: payload.stok_minimum
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') throw new Error('Nama barang sudah ada (mirip) atau Barcode terdaftar!')
        throw error
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barang'] })
      queryClient.invalidateQueries({ queryKey: ['riwayat-barang-global'] })
    }
  })

  // MUTATION UPDATE BARANG
  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<Barang> & { id: string }) => {
      const { error } = await supabase.rpc('update_barang_aman', {
        p_id: payload.id,
        p_nama: payload.nama,
        p_barcode: payload.barcode || null,
        p_harga_beli: payload.harga_beli,
        p_harga_jual: payload.harga_jual,
        p_stok_fisik: payload.stok_fisik,
        p_stok_minimum: payload.stok_minimum
      })

      if (error) {
        if (error.code === '23505') throw new Error('Nama barang sudah ada (mirip) atau Barcode terdaftar!')
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barang'] })
      queryClient.invalidateQueries({ queryKey: ['riwayat-barang-global'] })
    }
  })

  // MUTATION DELETE BARANG
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('barang').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barang'] })
      queryClient.invalidateQueries({ queryKey: ['riwayat-barang-global'] })
    }
  })

  return {
    barang: query.data,
    isBarangLoading: query.isLoading,
    addBarang: createMutation.mutateAsync,
    isAddingBarang: createMutation.isPending,
    updateBarang: updateMutation.mutateAsync,
    isUpdatingBarang: updateMutation.isPending,
    deleteBarang: deleteMutation.mutateAsync,
    isDeletingBarang: deleteMutation.isPending
  }
}
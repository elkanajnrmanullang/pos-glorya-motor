import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// INTERFACE DATA BARANG
export interface BarangOwner {
  id: string
  nama: string
  barcode: string
  harga_beli: number
  harga_jual: number
  stok_fisik: number
  stok_reserved: number
  stok_tersedia: number
  stok_minimum: number
  satuan: string
  aktif: boolean
}

export function useOwnerStok() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // 1. FETCH DATA STOK
  const query = useQuery({
    queryKey: ['owner-pantauan-stok'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('barang')
        .select('*')
        .eq('aktif', true)
        .order('nama', { ascending: true })

      if (error) throw error
      return data as BarangOwner[]
    }
  })

  // 2. MUTASI TAMBAH BARANG
  const tambahBarang = useMutation({
    mutationFn: async (newBarang: any) => {
      const { error } = await supabase.from('barang').insert([newBarang])
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-pantauan-stok'] })
  })

  // 3. MUTASI UBAH BARANG
  const updateBarang = useMutation({
    mutationFn: async (updatedData: any) => {
      const { id, ...payload } = updatedData
      const { error } = await supabase.from('barang').update(payload).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-pantauan-stok'] })
  })

  // 4. MUTASI HAPUS BARANG
  const hapusBarang = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('barang').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-pantauan-stok'] })
  })

  const barang = query.data || []

  // KALKULASI TOTAL ASET & POTENSI OMZET
  const totalAsetModal = barang.reduce((sum, item) => sum + (item.stok_fisik * item.harga_beli), 0)
  const potensiOmzet = barang.reduce((sum, item) => sum + (item.stok_fisik * item.harga_jual), 0)
  const estimasiLabaKotor = potensiOmzet - totalAsetModal
  const lowStockCount = barang.filter(b => b.stok_tersedia <= b.stok_minimum).length

  return {
    barang,
    totalAsetModal,
    potensiOmzet,
    estimasiLabaKotor,
    lowStockCount,
    isLoading: query.isLoading,
    tambahBarang: tambahBarang.mutateAsync,
    updateBarang: updateBarang.mutateAsync,
    hapusBarang: hapusBarang.mutateAsync,
    isProcessing: tambahBarang.isPending || updateBarang.isPending || hapusBarang.isPending
  }
}
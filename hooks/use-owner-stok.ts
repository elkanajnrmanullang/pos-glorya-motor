import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type BarangOwner = {
  sku: string
  nama: string
  barcode?: string
  harga_beli: number
  harga_jual: number
  stok_fisik: number
  stok_minimum: number
  stok_tersedia?: number
  satuan: string
}

export function useOwnerStok() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: barang = [], isLoading } = useQuery({
    queryKey: ['owner-stok-v3'],
    queryFn: async () => {
      const { data, error } = await supabase.from('barang').select('*').order('nama', { ascending: true })
      if (error) throw error
      return data.map(d => ({
        ...d,
        stok_tersedia: d.stok_tersedia ?? d.stok_fisik
      })) as BarangOwner[]
    }
  })

  const tambahMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from('barang').insert(payload)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-stok-v3'] })
  })

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { sku } = payload
      if (!sku) throw new Error("Sistem mendeteksi data usang. Harap refresh halaman.")
        
      const { error } = await supabase.from('barang').upsert(payload, { onConflict: 'sku' })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-stok-v3'] })
  })

  const hapusMutation = useMutation({
    mutationFn: async (sku: string) => {
      if (!sku) throw new Error("SKU tidak ditemukan untuk dihapus.")
      const { error } = await supabase.from('barang').delete().eq('sku', sku)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-stok-v3'] })
  })

  const totalAsetModal = barang.reduce((acc, curr) => acc + (curr.stok_fisik * curr.harga_beli), 0)
  const potensiOmzet = barang.reduce((acc, curr) => acc + (curr.stok_fisik * curr.harga_jual), 0)
  const estimasiLabaKotor = potensiOmzet - totalAsetModal
  const lowStockCount = barang.filter(b => (b.stok_tersedia ?? b.stok_fisik) <= b.stok_minimum).length

  return {
    barang,
    totalAsetModal,
    potensiOmzet,
    estimasiLabaKotor,
    lowStockCount,
    isLoading,
    tambahBarang: tambahMutation.mutateAsync,
    updateBarang: updateMutation.mutateAsync,
    hapusBarang: hapusMutation.mutateAsync,
    isProcessing: tambahMutation.isPending || updateMutation.isPending || hapusMutation.isPending
  }
}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useMekanik() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Ambil profil mekanik saat ini
  const { data: userProfile } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      return user
    }
  })

  // Ambil semua tiket
  const queryTiket = useQuery({
    queryKey: ['tiket-mekanik'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tiket_servis')
        .select(`
          *,
          tiket_items(*, barang(nama)),
          tiket_jasa(*)
        `)
        .in('status', ['menunggu', 'dikerjakan', 'selesai', 'lunas'])
        .order('waktu_masuk', { ascending: true })

      if (error) throw error
      return data
    },
    refetchInterval: 5000 // Polling ringan tiap 5 detik sebagai pelapis realtime
  })

  // Ambil Katalog Barang 
  const queryBarang = useQuery({
    queryKey: ['katalog-tersedia'],
    queryFn: async () => {
      const { data, error } = await supabase.from('barang').select('*').eq('aktif', true)
      if (error) throw error
      return data.filter(b => (b.stok_fisik - b.stok_reserved) > 0)
    }
  })

  // Ambil Katalog Jasa
  const queryJasa = useQuery({
    queryKey: ['katalog-jasa'],
    queryFn: async () => {
      const { data, error } = await supabase.from('katalog_jasa').select('*').eq('aktif', true).order('nama_jasa')
      if (error) throw error
      return data
    }
  })

  // ================= MUTASI AKSI MEKANIK =================

  const klaimTiket = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('klaim_tiket_mekanik', { p_tiket_id: id })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tiket-mekanik'] })
  })

  const selesaiTiket = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('selesai_tiket_mekanik', { p_tiket_id: id })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tiket-mekanik'] })
  })

  const tambahItem = useMutation({
    mutationFn: async ({ tiketId, barangId, qty, harga }: any) => {
      const { error } = await supabase.rpc('tambah_item_tiket', { p_tiket_id: tiketId, p_barang_id: barangId, p_qty: qty, p_harga: harga })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiket-mekanik'] })
      queryClient.invalidateQueries({ queryKey: ['katalog-tersedia'] })
    }
  })

  const hapusItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.rpc('hapus_item_tiket', { p_item_id: itemId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiket-mekanik'] })
      queryClient.invalidateQueries({ queryKey: ['katalog-tersedia'] })
    }
  })

  const tambahJasa = useMutation({
    mutationFn: async ({ tiketId, namaJasa, harga }: any) => {
      const { error } = await supabase.rpc('tambah_jasa_tiket', { p_tiket_id: tiketId, p_nama_jasa: namaJasa, p_harga: harga })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tiket-mekanik'] })
  })

  const hapusJasa = useMutation({
    mutationFn: async (jasaId: string) => {
      const { error } = await supabase.rpc('hapus_jasa_tiket', { p_jasa_id: jasaId })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tiket-mekanik'] })
  })

  return {
    userProfile,
    tiketSemua: queryTiket.data || [],
    isLoadingTiket: queryTiket.isLoading,
    barang: queryBarang.data || [],
    jasa: queryJasa.data || [],
    klaimTiket: klaimTiket.mutateAsync,
    selesaiTiket: selesaiTiket.mutateAsync,
    tambahItem: tambahItem.mutateAsync,
    hapusItem: hapusItem.mutateAsync,
    tambahJasa: tambahJasa.mutateAsync,
    hapusJasa: hapusJasa.mutateAsync,
    isProcessing: klaimTiket.isPending || selesaiTiket.isPending || tambahItem.isPending || hapusItem.isPending || tambahJasa.isPending || hapusJasa.isPending
  }
}
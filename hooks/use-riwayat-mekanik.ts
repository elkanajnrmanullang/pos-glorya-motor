import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// INTERFACE_TIKET_RIWAYAT
export interface TiketRiwayat {
  id: string
  plat_motor: string
  merk_motor: string
  status: string
  waktu_masuk: string
  waktu_selesai: string
  customers?: {
    nama: string
  }
  tiket_jasa?: {
    nama_jasa: string
    harga_jasa: number
  }[]
}

// HOOK_USE_RIWAYAT_MEKANIK
export function useRiwayatMekanik(mekanikId: string | undefined) {
  const supabase = createClient()

  // FETCH_DATA_RIWAYAT_MEKANIK
  const query = useQuery({
    queryKey: ['riwayat-mekanik', mekanikId],
    queryFn: async () => {
      if (!mekanikId) return []

      const { data, error } = await supabase
        .from('tiket_servis')
        .select(`
          id, 
          plat_motor, 
          merk_motor, 
          status, 
          waktu_masuk,
          waktu_selesai, 
          customers (nama), 
          tiket_jasa (nama_jasa, harga_jasa)
        `)
        .eq('mekanik_id', mekanikId)
        .in('status', ['selesai', 'lunas'])
        .order('waktu_selesai', { ascending: false })

      if (error) throw error
      
      // TYPE_CASTING_WORKAROUND_SUPABASE_JOIN
      return data as unknown as TiketRiwayat[]
    },
    enabled: !!mekanikId
  })

  return {
    riwayat: query.data || [],
    isLoading: query.isLoading
  }
}
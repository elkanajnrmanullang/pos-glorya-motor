// HOOK_USE_RIWAYAT_MEKANIK
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
  saran_mekanik: string
  checklist_kendaraan: Record<string, string>
  customers?: {
    nama: string
  }
}

// MAIN_HOOK_FUNCTION
export function useRiwayatMekanik(mekanikId: string | undefined) {
  const supabase = createClient()

  // FETCH_DATA_RIWAYAT
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
          saran_mekanik,
          checklist_kendaraan,
          customers (nama)
        `)
        .eq('mekanik_id', mekanikId)
        .in('status', ['selesai', 'lunas'])
        .order('waktu_selesai', { ascending: false })

      if (error) throw error
      return data as unknown as TiketRiwayat[]
    },
    enabled: !!mekanikId
  })

  return {
    riwayat: query.data || [],
    isLoading: query.isLoading
  }
}
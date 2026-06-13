import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// INTERFACE TIKET RIWAYAT
export interface TiketRiwayat {
  id: string
  plat_motor: string
  merk_motor: string
  status: string
  waktu_selesai: string
  waktu_masuk: string
  customers?: {
    nama: string
  }
  tiket_jasa?: {
    nama_jasa: string
    harga_jasa: number
  }[]
}

// HOOK FETCH RIWAYAT MEKANIK
export function useRiwayatMekanik() {
  const supabase = createClient()

  const query = useQuery({
    queryKey: ['riwayat-mekanik'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('tiket_servis')
        .select(`
          id, plat_motor, merk_motor, status, waktu_selesai, waktu_masuk,
          customers(nama),
          tiket_jasa(nama_jasa, harga_jasa)
        `)
        .in('status', ['selesai', 'lunas'])
        .eq('mekanik_id', user.id)
        .order('waktu_selesai', { ascending: false })

      if (error) throw error
      return data as TiketRiwayat[]
    }
  })

  return {
    riwayat: query.data || [],
    isLoading: query.isLoading
  }
}
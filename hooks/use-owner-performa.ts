import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface JasaDetail {
  nama_jasa: string
  harga_jasa: number
}

export interface PerformaTiket {
  id: string
  plat_motor: string
  merk_motor: string
  waktu_selesai: string
  tiket_jasa: JasaDetail[]
  cc_motor?: number | null;
}

export function useOwnerPerforma(mekanikId: string, startDate: string, endDate: string) {
  const supabase = createClient()

  const { data: mekanikList, isLoading: isLoadingMekanik } = useQuery({
    queryKey: ['list-mekanik'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'mekanik')
        .order('full_name')

      if (error) throw error
      return data
    }
  })

  const { data: performaData, isLoading: isLoadingPerforma } = useQuery({
    queryKey: ['performa-mekanik', mekanikId, startDate, endDate],
    queryFn: async () => {
      if (!mekanikId || !startDate || !endDate) return []

      const start = new Date(`${startDate}T00:00:00.000+07:00`).toISOString()
      const end = new Date(`${endDate}T23:59:59.999+07:00`).toISOString()

      const { data, error } = await supabase
        .from('tiket_servis')
        .select(`
          id, plat_motor, merk_motor, waktu_selesai,
          tiket_jasa (nama_jasa, harga_jasa)
        `)
        .eq('mekanik_id', mekanikId)
        .in('status', ['selesai', 'lunas'])
        .gte('waktu_selesai', start)
        .lte('waktu_selesai', end)
        .order('waktu_selesai', { ascending: false })

      if (error) throw error
      return data as PerformaTiket[]
    },
    enabled: !!mekanikId && !!startDate && !!endDate
  })

  return {
    mekanikList: mekanikList || [],
    performaData: performaData || [],
    isLoadingMekanik,
    isLoadingPerforma
  }
}
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// INTERFACE DATA SHIFT
export interface Pengeluaran {
  id: string
  jumlah: number
  keterangan: string
  waktu: string
}

export interface SesiShift {
  id: string
  waktu_buka: string
  waktu_tutup: string
  modal_awal: number
  cash_aktual: number
  qris_aktual: number
  transfer_aktual: number
  cash_sistem: number
  qris_sistem: number
  transfer_sistem: number
  total_pengeluaran: number
  selisih_cash: number
  selisih_qris: number
  selisih_transfer: number
  catatan: string
  profiles?: { full_name: string }
  pengeluaran_kasir?: Pengeluaran[]
}

// HOOK FETCH LAPORAN SHIFT
export function useLaporanShift() {
  const supabase = createClient()

  const query = useQuery({
    queryKey: ['owner-laporan-shift'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sesi_kasir')
        .select(`
          *,
          profiles:kasir_id (full_name),
          pengeluaran_kasir (*)
        `)
        .eq('status', 'ditutup')
        .order('waktu_tutup', { ascending: false })

      if (error) throw error
      return data as unknown as SesiShift[]
    }
  })

  return {
    shifts: query.data || [],
    isLoading: query.isLoading
  }
}
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// Interface Payload Tiket
export interface CreateTiketPayload {
  nomor_antrian: string
  tipe: 'service_part' | 'jasa'
  plat_motor: string
  merk_motor: string
  cc_motor?: number | null
  tahun_motor?: number | null
  keluhan?: string | null
  kasir_id: string
  kendaraan_id? : string | null
  customer_id: string
  sesi_id: string
  cabang_id?: string | null
}

// Hook Create Tiket
export function useCreateTiket() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateTiketPayload) => {
      const { data, error } = await supabase
        .from('tiket_servis')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiket-aktif'] })
      queryClient.invalidateQueries({ queryKey: ['metrics-sesi'] })
    }
  })
}
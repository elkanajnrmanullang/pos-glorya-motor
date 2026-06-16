import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// INTERFACE DATA RIWAYAT OWNER
export interface RiwayatOwner {
  id: string
  nomor: string
  tipe: 'SERVIS' | 'TAKEAWAY'
  keterangan: string
  pelanggan: string
  kasir: string
  total: number
  metode: string
  waktu: string
}

export function useOwnerRiwayat() {
  const supabase = createClient()

  const query = useQuery({
    queryKey: ['owner-riwayat-transaksi'],
    queryFn: async () => {
      // 1. AMBIL TRANSAKSI SERVIS (YANG SUDAH LUNAS)
      const { data: tikets, error: tiketError } = await supabase
        .from('tiket_servis')
        .select(`
          id, nomor_antrian, plat_motor, total_akhir, metode_bayar, waktu_lunas,
          customers(nama),
          kasir:kasir_id(full_name)
        `)
        .eq('status', 'lunas')
        .order('waktu_lunas', { ascending: false })

      if (tiketError) throw tiketError

      // 2. AMBIL TRANSAKSI TAKEAWAY
      const { data: takeaways, error: takeawayError } = await supabase
        .from('transaksi_takeaway')
        .select(`
          id, nomor_struk, total, metode_bayar, created_at,
          customers(nama),
          kasir:kasir_id(full_name)
        `)
        .order('created_at', { ascending: false })

      if (takeawayError) throw takeawayError

      // 3. FORMAT DAN GABUNGKAN DATA
      const formattedTikets: RiwayatOwner[] = tikets.map((t: any) => ({
        id: t.id,
        nomor: t.nomor_antrian,
        tipe: 'SERVIS',
        keterangan: t.plat_motor,
        pelanggan: t.customers?.nama || 'Umum',
        kasir: t.kasir?.full_name || '-',
        total: Number(t.total_akhir || 0),
        metode: t.metode_bayar,
        waktu: t.waktu_lunas
      }))

      const formattedTakeaways: RiwayatOwner[] = takeaways.map((t: any) => ({
        id: t.id,
        nomor: t.nomor_struk,
        tipe: 'TAKEAWAY',
        keterangan: 'Beli Sparepart Langsung',
        pelanggan: t.customers?.nama || 'Umum',
        kasir: t.kasir?.full_name || '-',
        total: Number(t.total || 0),
        metode: t.metode_bayar,
        waktu: t.created_at
      }))

      // 4. GABUNGKAN DAN URUTKAN BERDASARKAN WAKTU TERBARU
      const combined = [...formattedTikets, ...formattedTakeaways]
      combined.sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime())

      return combined
    }
  })

  return {
    riwayat: query.data || [],
    isLoading: query.isLoading
  }
}
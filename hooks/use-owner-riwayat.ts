import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// INTERFACE RIWAYAT OWNER
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
  raw_data: any
}

// HOOK OWNER RIWAYAT
export function useOwnerRiwayat() {
  const supabase = createClient()

  const query = useQuery({
    queryKey: ['owner-riwayat-transaksi-v2'],
    queryFn: async () => {
      // FETCH TIKET SERVIS
      const { data: tikets, error: tiketError } = await supabase
        .from('tiket_servis')
        .select(`
          *,
          customers(nama, no_telp),
          kasir:kasir_id(full_name),
          mekanik:mekanik_id(full_name),
          tiket_items(*, barang(nama)),
          tiket_jasa(*)
        `)
        .eq('status', 'lunas')
        .order('waktu_lunas', { ascending: false })

      if (tiketError) throw tiketError

      // FETCH TRANSAKSI TAKEAWAY
      const { data: takeaways, error: takeawayError } = await supabase
        .from('transaksi_takeaway')
        .select(`
          *,
          customers(nama, no_telp),
          kasir:kasir_id(full_name),
          transaksi_takeaway_items(*, barang(nama))
        `)
        .order('created_at', { ascending: false })

      if (takeawayError) throw takeawayError

      // FORMAT TIKET SERVIS
      const formattedTikets: RiwayatOwner[] = tikets.map((t: any) => ({
        id: t.id,
        nomor: t.nomor_antrian,
        tipe: 'SERVIS',
        keterangan: t.plat_motor ? `${t.plat_motor} - ${t.merk_motor}` : '-',
        pelanggan: t.customers?.nama || 'Non-Member',
        kasir: t.kasir?.full_name || '-',
        total: Number(t.total_akhir || 0),
        metode: t.metode_bayar,
        waktu: t.waktu_lunas,
        raw_data: t
      }))

      // FORMAT TRANSAKSI TAKEAWAY
      const formattedTakeaways: RiwayatOwner[] = takeaways.map((t: any) => ({
        id: t.id,
        nomor: t.nomor_struk,
        tipe: 'TAKEAWAY',
        keterangan: 'Pembelian Langsung',
        pelanggan: t.customers?.nama || 'Non-Member',
        kasir: t.kasir?.full_name || '-',
        total: Number(t.total || 0),
        metode: t.metode_bayar,
        waktu: t.created_at,
        raw_data: t
      }))

      // GABUNGKAN DATA
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
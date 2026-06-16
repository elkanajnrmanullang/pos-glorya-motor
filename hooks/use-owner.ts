import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// INTERFACE METRIK DASHBOARD
export interface OwnerMetrics {
  pendapatanHariIni: number
  pengeluaranHariIni: number
  kasBersihHariIni: number
  motorServisHariIni: number
  breakdownMetode: {
    tunai: number
    qris: number
    transfer: number
  }
  trenTujuhHari: {
    tanggal: string
    total: number
  }[]
  aktivitasTerakhir: {
    id: string
    nomor: string
    tipe: 'SERVIS' | 'TAKEAWAY'
    pelanggan: string
    total: number
    waktu: string
  }[]
}

// HOOK UTAMA ANALITIK OWNER
export function useOwnerDashboard() {
  const supabase = createClient()

  const query = useQuery({
    queryKey: ['owner-dashboard-analytics'],
    queryFn: async () => {
      const tanggalHariIni = new Date().toISOString().split('T')[0]

      const [tiketRes, takeawayRes, pengeluaranRes] = await Promise.all([
        supabase
          .from('tiket_servis')
          // waktu_masuk sudah ditambahkan ke dalam select
          .select('id, nomor_antrian, total_akhir, metode_bayar, status, waktu_lunas, waktu_masuk, customers(nama)')
          .or(`status.eq.lunas,status.eq.selesai`),
        supabase
          .from('transaksi_takeaway')
          .select('id, nomor_struk, total, metode_bayar, created_at, customers(nama)'),
        supabase
          .from('pengeluaran_kasir')
          .select('id, jumlah, waktu')
      ])

      if (tiketRes.error) throw tiketRes.error
      if (takeawayRes.error) throw takeawayRes.error
      if (pengeluaranRes.error) throw pengeluaranRes.error

      let pendapatanHariIni = 0
      let pengeluaranHariIni = 0
      let motorServisHariIni = 0
      
      let tunaiToday = 0
      let qrisToday = 0
      let transferToday = 0

      const petaTren: { [key: string]: number } = {}
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        petaTren[d.toISOString().split('T')[0]] = 0
      }

      // Typecasting untuk mengatasi error 'nama' does not exist
      const tiketData = tiketRes.data as any[]
      const takeawayData = takeawayRes.data as any[]

      tiketData.forEach(t => {
        const waktuKunci = t.waktu_lunas || t.waktu_masuk
        const tgl = waktuKunci ? waktuKunci.split('T')[0] : ''
        
        if (t.status === 'lunas' && t.total_akhir) {
          if (petaTren[tgl] !== undefined) {
            petaTren[tgl] += Number(t.total_akhir)
          }
          if (tgl === tanggalHariIni) {
            pendapatanHariIni += Number(t.total_akhir)
            if (t.metode_bayar === 'tunai') tunaiToday += Number(t.total_akhir)
            if (t.metode_bayar === 'qris') qrisToday += Number(t.total_akhir)
            if (t.metode_bayar === 'transfer') transferToday += Number(t.total_akhir)
          }
        }

        if (tgl === tanggalHariIni) {
          motorServisHariIni++
        }
      })

      takeawayData.forEach(tw => {
        const tgl = tw.created_at ? tw.created_at.split('T')[0] : ''
        
        if (tw.total) {
          if (petaTren[tgl] !== undefined) {
            petaTren[tgl] += Number(tw.total)
          }
          if (tgl === tanggalHariIni) {
            pendapatanHariIni += Number(tw.total)
            if (tw.metode_bayar === 'tunai') tunaiToday += Number(tw.total)
            if (tw.metode_bayar === 'qris') qrisToday += Number(tw.total)
            if (tw.metode_bayar === 'transfer') transferToday += Number(tw.total)
          }
        }
      })

      pengeluaranRes.data.forEach((p: any) => {
        const tgl = p.waktu ? p.waktu.split('T')[0] : ''
        if (tgl === tanggalHariIni && p.jumlah) {
          pengeluaranHariIni += Number(p.jumlah)
        }
      })

      const trenTujuhHari = Object.keys(petaTren).map(tgl => ({
        tanggal: new Date(tgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        total: petaTren[tgl]
      }))

      const listTiket = tiketData.map(t => ({
        id: t.id,
        nomor: t.nomor_antrian,
        tipe: 'SERVIS' as const,
        pelanggan: t.customers?.nama || 'Umum',
        total: Number(t.total_akhir || 0),
        waktu: t.waktu_lunas || t.waktu_masuk
      }))

      const listTakeaway = takeawayData.map(t => ({
        id: t.id,
        nomor: t.nomor_struk,
        tipe: 'TAKEAWAY' as const,
        pelanggan: t.customers?.nama || 'Umum',
        total: Number(t.total || 0),
        waktu: t.created_at
      }))

      const aktivitasTerakhir = [...listTiket, ...listTakeaway]
      aktivitasTerakhir.sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime())

      return {
        pendapatanHariIni,
        pengeluaranHariIni,
        kasBersihHariIni: pendapatanHariIni - pengeluaranHariIni,
        motorServisHariIni,
        breakdownMetode: {
          tunai: tunaiToday,
          qris: qrisToday,
          transfer: transferToday
        },
        trenTujuhHari,
        aktivitasTerakhir: aktivitasTerakhir.slice(0, 5)
      } as OwnerMetrics
    }
  })

  return {
    metrics: query.data,
    isLoading: query.isLoading
  }
}
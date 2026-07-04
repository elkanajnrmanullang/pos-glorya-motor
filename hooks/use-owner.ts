import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type FilterWaktu = 'hari_ini' | 'minggu_ini' | 'bulan_ini' | 'tahun_ini' | 'custom'

export function useOwnerDashboard(filter: FilterWaktu, customStart?: string, customEnd?: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['owner-dashboard', filter, customStart, customEnd],
    queryFn: async () => {
      let startDate = new Date()
      let endDate = new Date()
      let prevStartDate = new Date()
      let prevEndDate = new Date()

      if (filter === 'hari_ini') {
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        prevStartDate = new Date(startDate); prevStartDate.setDate(prevStartDate.getDate() - 1)
        prevEndDate = new Date(endDate); prevEndDate.setDate(prevEndDate.getDate() - 1)
      } else if (filter === 'minggu_ini') {
        const day = startDate.getDay() || 7
        startDate.setDate(startDate.getDate() - day + 1); startDate.setHours(0, 0, 0, 0)
        endDate = new Date(startDate); endDate.setDate(endDate.getDate() + 6); endDate.setHours(23, 59, 59, 999)
        prevStartDate = new Date(startDate); prevStartDate.setDate(prevStartDate.getDate() - 7)
        prevEndDate = new Date(endDate); prevEndDate.setDate(prevEndDate.getDate() - 7)
      } else if (filter === 'bulan_ini') {
        startDate.setDate(1); startDate.setHours(0, 0, 0, 0)
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999)
        prevStartDate = new Date(startDate); prevStartDate.setMonth(prevStartDate.getMonth() - 1)
        prevEndDate = new Date(prevStartDate.getFullYear(), prevStartDate.getMonth() + 1, 0, 23, 59, 59, 999)
      } else if (filter === 'tahun_ini') {
        startDate.setMonth(0, 1); startDate.setHours(0, 0, 0, 0)
        endDate.setMonth(11, 31); endDate.setHours(23, 59, 59, 999)
        prevStartDate = new Date(startDate); prevStartDate.setFullYear(prevStartDate.getFullYear() - 1)
        prevEndDate = new Date(endDate); prevEndDate.setFullYear(prevEndDate.getFullYear() - 1)
      } else if (filter === 'custom' && customStart && customEnd) {
        startDate = new Date(customStart); startDate.setHours(0, 0, 0, 0)
        endDate = new Date(customEnd); endDate.setHours(23, 59, 59, 999)
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
        prevEndDate = new Date(startDate.getTime() - 1)
        prevStartDate = new Date(prevEndDate.getTime() - diffTime)
        prevStartDate.setHours(0, 0, 0, 0)
      }

      const [tiketRes, takeawayRes, pengeluaranRes, mekanikRes] = await Promise.all([
        supabase.from('tiket_servis').select(`
          *,
          customers(id, nama, no_telp),
          mekanik:profiles!tiket_servis_mekanik_id_fkey(full_name),
          tiket_items(qty, harga_snapshot, barang(nama)),
          tiket_jasa(nama_jasa, harga_jasa)
        `).gte('waktu_masuk', startDate.toISOString()).lte('waktu_masuk', endDate.toISOString()),
        supabase.from('transaksi_takeaway').select(`
          *,
          customers(id, nama, no_telp),
          transaksi_takeaway_items(qty, harga_snapshot, barang(nama))
        `).gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString()),
        supabase.from('pengeluaran_kasir').select('jumlah').gte('waktu', startDate.toISOString()).lte('waktu', endDate.toISOString()),
        supabase.from('profiles').select('id, full_name').eq('role', 'mekanik')
      ])

      const [prevTiket, prevTakeaway, prevPengeluaran] = await Promise.all([
        supabase.from('tiket_servis').select('total_akhir').gte('waktu_masuk', prevStartDate.toISOString()).lte('waktu_masuk', prevEndDate.toISOString()),
        supabase.from('transaksi_takeaway').select('total').gte('created_at', prevStartDate.toISOString()).lte('created_at', prevEndDate.toISOString()),
        supabase.from('pengeluaran_kasir').select('jumlah').gte('waktu', prevStartDate.toISOString()).lte('waktu', prevEndDate.toISOString())
      ])

      const tikets = tiketRes.data || []
      const takeaways = takeawayRes.data || []
      const pengeluarans = pengeluaranRes.data || []
      const mekaniks = mekanikRes.data || []

      let omzetCurrent = 0, unitCurrent = 0, tunai = 0, qris = 0, transfer = 0
      let topItemsMap: Record<string, { nama: string, qty: number, total: number }> = {}
      const allTransactions: any[] = []

      // Inisialisasi Kategori Grafik Berdasarkan Filter
      const groupedChart: Record<string, number> = {}
      if (filter === 'hari_ini') {
        for(let i=0; i<=23; i++) groupedChart[`${i.toString().padStart(2,'0')}:00`] = 0
      } else if (filter === 'minggu_ini') {
        const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
        days.forEach(d => groupedChart[d] = 0)
      } else if (filter === 'bulan_ini') {
        for(let i=1; i<=endDate.getDate(); i++) groupedChart[i.toString()] = 0
      } else if (filter === 'tahun_ini') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
        months.forEach(m => groupedChart[m] = 0)
      }

      const addToChart = (waktuStr: string, amount: number) => {
        const d = new Date(waktuStr)
        let key = ''
        if (filter === 'hari_ini') key = `${d.getHours().toString().padStart(2,'0')}:00`
        else if (filter === 'minggu_ini') {
          const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
          key = days[d.getDay()]
        }
        else if (filter === 'bulan_ini') key = d.getDate().toString()
        else if (filter === 'tahun_ini') {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
          key = months[d.getMonth()]
        } else {
          key = d.toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})
          if (groupedChart[key] === undefined) groupedChart[key] = 0
        }
        
        if (groupedChart[key] !== undefined) groupedChart[key] += amount
      }

      tikets.forEach(t => {
        if (t.status === 'lunas' || t.status === 'selesai') {
          const tTotal = Number(t.total_akhir || 0)
          omzetCurrent += tTotal
          unitCurrent += 1
          if (t.metode_bayar === 'tunai') tunai += tTotal
          if (t.metode_bayar === 'qris') qris += tTotal
          if (t.metode_bayar === 'transfer') transfer += tTotal

          addToChart(t.waktu_masuk, tTotal)

          t.tiket_items?.forEach((item: any) => {
            const nama = item.barang?.nama || 'Unknown'
            if (!topItemsMap[nama]) topItemsMap[nama] = { nama, qty: 0, total: 0 }
            topItemsMap[nama].qty += item.qty
            topItemsMap[nama].total += (item.qty * Number(item.harga_snapshot))
          })

          allTransactions.push({
            id: t.id,
            nomor: t.nomor_antrian,
            tipe: 'SERVIS',
            waktu: t.waktu_masuk,
            total: tTotal,
            ...t
          })
        }
      })

      takeaways.forEach(tw => {
        const twTotal = Number(tw.total || 0)
        omzetCurrent += twTotal
        if (tw.metode_bayar === 'tunai') tunai += twTotal
        if (tw.metode_bayar === 'qris') qris += twTotal
        if (tw.metode_bayar === 'transfer') transfer += twTotal

        addToChart(tw.created_at, twTotal)

        tw.transaksi_takeaway_items?.forEach((item: any) => {
          const nama = item.barang?.nama || 'Unknown'
          if (!topItemsMap[nama]) topItemsMap[nama] = { nama, qty: 0, total: 0 }
          topItemsMap[nama].qty += item.qty
          topItemsMap[nama].total += (item.qty * Number(item.harga_snapshot))
        })

        allTransactions.push({
          id: tw.id,
          nomor: tw.nomor_struk,
          tipe: 'TAKEAWAY',
          waktu: tw.created_at,
          total: twTotal,
          ...tw
        })
      })

      const pengeluaranCurrent = pengeluarans.reduce((a, b) => a + Number(b.jumlah), 0)
      const kasBersihCurrent = omzetCurrent - pengeluaranCurrent

      const prevOmzet = (prevTiket.data?.reduce((a, b) => a + Number(b.total_akhir), 0) || 0) + (prevTakeaway.data?.reduce((a, b) => a + Number(b.total), 0) || 0)
      const prevPengeluaranTotal = prevPengeluaran.data?.reduce((a, b) => a + Number(b.jumlah), 0) || 0
      const prevKasBersih = prevOmzet - prevPengeluaranTotal
      const prevUnit = prevTiket.data?.length || 0

      const calcTrend = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0
        return ((curr - prev) / prev) * 100
      }

      const top10Items = Object.values(topItemsMap).sort((a, b) => b.qty - a.qty).slice(0, 10)
      const finalChartData = Object.keys(groupedChart).map(k => ({ name: k, total: groupedChart[k] }))

      const mechanicStatus = mekaniks.map(m => {
        const sedangDikerjakan = tikets.find(t => t.mekanik_id === m.id && t.status === 'dikerjakan')
        const tiketSelesai = tikets.filter(t => t.mekanik_id === m.id && (t.status === 'selesai' || t.status === 'lunas')).length
        return {
          id: m.id,
          nama: m.full_name,
          status: sedangDikerjakan ? 'Sibuk' : 'Standby',
          motorAktif: sedangDikerjakan ? sedangDikerjakan.plat_motor : '-',
          selesai: tiketSelesai
        }
      })

      return {
        metrics: {
          omzet: { total: omzetCurrent, trend: calcTrend(omzetCurrent, prevOmzet) },
          kasBersih: { total: kasBersihCurrent, trend: calcTrend(kasBersihCurrent, prevKasBersih) },
          pengeluaran: { total: pengeluaranCurrent, trend: calcTrend(pengeluaranCurrent, prevPengeluaranTotal) },
          unit: { total: unitCurrent, trend: calcTrend(unitCurrent, prevUnit) },
          breakdownMetode: { tunai, qris, transfer }
        },
        topItems: top10Items,
        mechanicStatus,
        recentTransactions: allTransactions.sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime()),
        chartData: finalChartData
      }
    },
    enabled: filter !== 'custom' || (filter === 'custom' && !!customStart && !!customEnd)
  })
}
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2, AlertTriangle, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface TutupKasirFormProps {
  sesiAktif: any
  userId: string
}

interface PengeluaranInput {
  jumlah: number
  keterangan: string
  kategori: string
  sumberDana: 'cash' | 'rekening'
  fotoNama?: string
}

export default function TutupKasirForm({ sesiAktif, userId }: TutupKasirFormProps) {
  const supabase = createClient()
  const router = useRouter()
  const queryClient = useQueryClient()

  // State angka aktual
  const [cashAktual, setCashAktual] = useState<number>(0)
  const [qrisAktual, setQrisAktual] = useState<number>(0)
  const [transferAktual, setTransferAktual] = useState<number>(0)
  const [catatan, setCatatan] = useState<string>('')
  
  // State pengeluaran
  const [pengeluaranList, setPengeluaranList] = useState<PengeluaranInput[]>([])
  const [newJumlah, setNewJumlah] = useState<number>(0)
  const [newKeterangan, setNewKeterangan] = useState<string>('')
  const [sumberDana, setSumberDana] = useState<'cash' | 'rekening'>('cash')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Fungsi Format Real-time Input
  const formatInputRibuan = (val: number) => {
    if (!val || val === 0) return ''
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  const parseInputRibuan = (val: string) => {
    const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10)
    return isNaN(parsed) ? 0 : parsed
  }

  // Query Summary Transaksi
  const { data: systemSummary, isLoading } = useQuery({
    queryKey: ['summary-tutup-sesi', sesiAktif.id],
    queryFn: async () => {
      const [tiketRes, takeawayRes] = await Promise.all([
        supabase
          .from('tiket_servis')
          .select('status, total_akhir, metode_bayar')
          .eq('sesi_id', sesiAktif.id),
        supabase
          .from('transaksi_takeaway')
          .select('total, metode_bayar')
          .eq('sesi_id', sesiAktif.id)
      ])

      if (tiketRes.error) throw tiketRes.error
      if (takeawayRes.error) throw takeawayRes.error

      const tikets = tiketRes.data || []
      const takeaways = takeawayRes.data || []

      const adaTiketSelesai = tikets.some(t => t.status === 'selesai')

      let cashSistem = 0
      let qrisSistem = 0
      let transferSistem = 0

      tikets.forEach(t => {
        if (t.status === 'lunas' && t.total_akhir) {
          if (t.metode_bayar === 'tunai') cashSistem += Number(t.total_akhir)
          if (t.metode_bayar === 'qris') qrisSistem += Number(t.total_akhir)
          if (t.metode_bayar === 'transfer') transferSistem += Number(t.total_akhir)
        }
      })

      takeaways.forEach(tw => {
        if (tw.metode_bayar === 'tunai') cashSistem += Number(tw.total)
        if (tw.metode_bayar === 'qris') qrisSistem += Number(tw.total)
        if (tw.metode_bayar === 'transfer') transferSistem += Number(tw.total)
      })

      return {
        adaTiketSelesai,
        cashSistem,
        qrisSistem,
        transferSistem
      }
    },
    enabled: !!sesiAktif?.id
  })

  // Fungsi Tambah Pengeluaran
  const handleAddPengeluaran = () => {
    if (!newJumlah || !newKeterangan) {
      toast.error('Jumlah dan keterangan wajib diisi')
      return
    }
    setPengeluaranList([
      ...pengeluaranList,
      {
        jumlah: newJumlah,
        keterangan: newKeterangan,
        kategori: 'lainnya',
        sumberDana: sumberDana,
        fotoNama: selectedFile ? selectedFile.name : undefined
      }
    ])
    setNewJumlah(0)
    setNewKeterangan('')
    setSelectedFile(null)
  }

  // Fungsi Hapus Pengeluaran
  const handleRemovePengeluaran = (index: number) => {
    setPengeluaranList(pengeluaranList.filter((_, i) => i !== index))
  }

  // Perhitungan Data Latar Belakang
  const modalAwal = Number(sesiAktif.modal_awal)
  const cashSistem = systemSummary?.cashSistem || 0
  const qrisSistem = systemSummary?.qrisSistem || 0
  const transferSistem = systemSummary?.transferSistem || 0
  const totalPengeluaran = pengeluaranList.reduce((acc, curr) => acc + curr.jumlah, 0)

  const selisihCash = cashAktual - (modalAwal + cashSistem - totalPengeluaran)
  const selisihQris = qrisAktual - qrisSistem
  const selisihTransfer = transferAktual - transferSistem

  // Mutasi Submit Rekap Sesi
  const tutupKasirMutation = useMutation({
    mutationFn: async () => {
      if (systemSummary?.adaTiketSelesai) {
        throw new Error('Tidak bisa menutup kasir karena masih ada tiket berstatus selesai yang belum lunas')
      }

      // Bypass CORS dengan memanggil RPC tutup_sesi_kasir (Metode POST)
      const { error: sesiError } = await supabase.rpc('tutup_sesi_kasir', {
        p_id: sesiAktif.id,
        p_cash_aktual: cashAktual,
        p_qris_aktual: qrisAktual,
        p_transfer_aktual: transferAktual,
        p_cash_sistem: cashSistem,
        p_qris_sistem: qrisSistem,
        p_transfer_sistem: transferSistem,
        p_selisih_cash: selisihCash,
        p_selisih_qris: selisihQris,
        p_selisih_transfer: selisihTransfer,
        p_total_pengeluaran: totalPengeluaran,
        p_catatan: catatan
      })

      if (sesiError) throw sesiError

      if (pengeluaranList.length > 0) {
        const pengeluaranPayload = pengeluaranList.map(p => ({
          sesi_id: sesiAktif.id,
          kasir_id: userId,
          jumlah: p.jumlah,
          keterangan: `[Sumber: ${p.sumberDana.toUpperCase()}] ${p.keterangan}${p.fotoNama ? ` (File Struk: ${p.fotoNama})` : ''}`,
          kategori: p.kategori,
          cabang_id: sesiAktif.cabang_id
        }))

        const { error: pengeluaranError } = await supabase
          .from('pengeluaran_kasir')
          .insert(pengeluaranPayload)

        if (pengeluaranError) throw pengeluaranError
      }

      return true
    },
    onSuccess: () => {
      toast.success('Sesi kasir berhasil ditutup. Terima Kasih, semangatt!.')
      queryClient.invalidateQueries({ queryKey: ['sesi-aktif', userId] })
      router.push('/kasir/dashboard')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menutup sesi kasir')
    }
  })

  if (isLoading) return <div className="text-sm text-[#163832] p-4">Memuat form penutupan shift...</div>

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {systemSummary?.adaTiketSelesai && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
          <div>
            <h5 className="font-semibold">Penutupan Kasir Terkunci</h5>
            <p className="text-sm mt-0.5">Ada tiket pelanggan yang berstatus &quot;Selesai&quot; namun belum diselesaikan pembayarannya oleh Kasir. Selesaikan seluruh pembayaran antrean sebelum menutup shift.</p>
          </div>
        </div>
      )}

      {/* Bagian 1: Input Aktual */}
      <Card className="bg-[#FAF7F2] border-[#E6DFD3]">
        <CardHeader className="border-b border-[#E6DFD3]/60">
          <CardTitle className="text-base font-bold text-[#051F20]">Input Aktual Uang Fisik & Mutasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#163832]">Total Uang Tunai / Cash Fisik (Laci Kasir)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#163832] font-semibold text-sm">Rp</span>
              <Input 
                type="text" 
                value={formatInputRibuan(cashAktual)} 
                onChange={(e) => setCashAktual(parseInputRibuan(e.target.value))}
                placeholder="0"
                className="pl-10 border-[#8EB69B]/40 focus-visible:ring-[#235347] bg-white text-[#051F20]"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#163832]">Total QRIS Aktual (Berdasarkan Aplikasi / Mutasi)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#163832] font-semibold text-sm">Rp</span>
              <Input 
                type="text" 
                value={formatInputRibuan(qrisAktual)} 
                onChange={(e) => setQrisAktual(parseInputRibuan(e.target.value))}
                placeholder="0"
                className="pl-10 border-[#8EB69B]/40 focus-visible:ring-[#235347] bg-white text-[#051F20]"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#163832]">Total Transfer Bank Aktual (Berdasarkan Mutasi Rekening)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#163832] font-semibold text-sm">Rp</span>
              <Input 
                type="text" 
                value={formatInputRibuan(transferAktual)} 
                onChange={(e) => setTransferAktual(parseInputRibuan(e.target.value))}
                placeholder="0"
                className="pl-10 border-[#8EB69B]/40 focus-visible:ring-[#235347] bg-white text-[#051F20]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bagian 2: Pengeluaran Kasir */}
      <Card className="bg-[#FAF7F2] border-[#E6DFD3]">
        <CardHeader className="border-b border-[#E6DFD3]/60">
          <CardTitle className="text-base font-bold text-[#051F20]">Biaya & Pengeluaran Mendadak</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-2 bg-[#E1EFE6]/40 p-4 rounded-lg border border-[#8EB69B]/30">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#163832] uppercase">Keterangan Pengeluaran</label>
              <Input 
                type="text" 
                value={newKeterangan} 
                onChange={(e) => setNewKeterangan(e.target.value)}
                placeholder="Contoh: Beli oli cadangan dari toko sebelah"
                className="border-[#8EB69B]/40 focus-visible:ring-[#235347] bg-white text-[#051F20]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#163832] uppercase">Jumlah Pengeluaran</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#163832] font-semibold text-sm">Rp</span>
                <Input 
                  type="text" 
                  value={formatInputRibuan(newJumlah)} 
                  onChange={(e) => setNewJumlah(parseInputRibuan(e.target.value))}
                  placeholder="0"
                  className="pl-10 border-[#8EB69B]/40 focus-visible:ring-[#235347] bg-white text-[#051F20]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#163832] uppercase">Dana Yang Digunakan</label>
              <div className="flex gap-3 h-10 items-center">
                <label className="flex items-center gap-2 text-sm text-[#163832] font-medium cursor-pointer">
                  <input 
                    type="radio" 
                    name="sumberDana" 
                    checked={sumberDana === 'cash'} 
                    onChange={() => setSumberDana('cash')}
                    className="accent-[#235347] w-4 h-4"
                  />
                  Uang Cash / Laci
                </label>
                <label className="flex items-center gap-2 text-sm text-[#163832] font-medium cursor-pointer">
                  <input 
                    type="radio" 
                    name="sumberDana" 
                    checked={sumberDana === 'rekening'} 
                    onChange={() => setSumberDana('rekening')}
                    className="accent-[#235347] w-4 h-4"
                  />
                  Rekening / Transfer
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#163832] uppercase flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-[#235347]" /> Upload Foto Struk Nota
              </label>
              <Input 
                type="file" 
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="border-[#8EB69B]/40 focus-visible:ring-[#235347] bg-white file:text-xs file:bg-[#E1EFE6] file:text-[#235347] file:border-0 cursor-pointer"
              />
            </div>
            <Button 
              type="button" 
              onClick={handleAddPengeluaran} 
              className="w-full md:col-span-2 bg-[#235347] hover:bg-[#051F20] text-white font-semibold mt-2"
            >
              <Plus className="w-4 h-4 mr-1" /> Tambahkan Pengeluaran
            </Button>
          </div>

          {pengeluaranList.length > 0 && (
            <Table className="bg-white border border-[#E6DFD3] rounded-lg overflow-hidden">
              <TableHeader className="bg-[#FAF7F2]">
                <TableRow>
                  <TableHead className="text-[#163832] font-bold">Keterangan & Sumber Dana</TableHead>
                  <TableHead className="text-[#163832] font-bold">File Nota</TableHead>
                  <TableHead className="text-right text-[#163832] font-bold">Jumlah</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pengeluaranList.map((p, idx) => (
                  <TableRow key={idx} className="border-b border-[#E6DFD3]/60">
                    <TableCell className="font-medium text-[#051F20]">
                      <span className={`text-xs px-2 py-0.5 rounded-full mr-2 font-bold ${p.sumberDana === 'cash' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                        {p.sumberDana.toUpperCase()}
                      </span>
                      {p.keterangan}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 italic max-w-[150px] truncate">
                      {p.fotoNama || 'Tidak ada'}
                    </TableCell>
                    <TableCell className="text-right text-[#051F20] font-bold">{formatRupiah(p.jumlah)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleRemovePengeluaran(idx)} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Catatan Tambahan & Submit */}
      <Card className="bg-[#FAF7F2] border-[#E6DFD3]">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#163832]">Catatan Tambahan Shift (Opsional)</label>
            <Input 
              type="text" 
              value={catatan} 
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tambahkan informasi penting mengenai shift hari ini jika ada"
              className="border-[#8EB69B]/40 focus-visible:ring-[#235347] bg-white text-[#051F20]"
            />
          </div>

          <Button 
            onClick={() => tutupKasirMutation.mutate()} 
            className="w-full h-14 text-base font-bold bg-[#235347] hover:bg-[#051F20] text-white shadow-md transition-all tracking-wider"
            disabled={tutupKasirMutation.isPending || systemSummary?.adaTiketSelesai}
          >
            {tutupKasirMutation.isPending ? 'Mengunci & Mengirim Rekap...' : 'SELESAIKAN SHIFT & KIRIM REKAPAN'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
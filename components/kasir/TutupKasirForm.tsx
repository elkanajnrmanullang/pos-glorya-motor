"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2, AlertTriangle, Image as ImageIcon, KeyRound } from 'lucide-react'
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
  fileObj?: File
}

export default function TutupKasirForm({ sesiAktif, userId }: TutupKasirFormProps) {
  const supabase = createClient()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [cashAktual, setCashAktual] = useState<number>(0)
  const [qrisAktual, setQrisAktual] = useState<number>(0)
  const [transferAktual, setTransferAktual] = useState<number>(0)
  const [catatan, setCatatan] = useState<string>('')
  const [pinOwner, setPinOwner] = useState<string>('')
  
  const [pengeluaranList, setPengeluaranList] = useState<PengeluaranInput[]>([])
  const [newJumlah, setNewJumlah] = useState<number>(0)
  const [newKeterangan, setNewKeterangan] = useState<string>('')
  const [sumberDana, setSumberDana] = useState<'cash' | 'rekening'>('cash')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const formatInputRibuan = (val: number) => {
    if (!val || val === 0) return ''
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  const parseInputRibuan = (val: string) => {
    const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10)
    return isNaN(parsed) ? 0 : parsed
  }

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

      return { adaTiketSelesai, cashSistem, qrisSistem, transferSistem }
    },
    enabled: !!sesiAktif?.id
  })

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
        fotoNama: selectedFile ? selectedFile.name : undefined,
        fileObj: selectedFile || undefined 
      }
    ])
    setNewJumlah(0)
    setNewKeterangan('')
    setSelectedFile(null)
    
    const fileInput = document.getElementById('file-upload') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  const handleRemovePengeluaran = (index: number) => {
    setPengeluaranList(pengeluaranList.filter((_, i) => i !== index))
  }

  const pendingJumlah = (newJumlah > 0 && newKeterangan.trim() !== '') ? newJumlah : 0
  const totalPengeluaranList = pengeluaranList.reduce((acc, curr) => acc + curr.jumlah, 0)
  const totalPengeluaran = totalPengeluaranList + pendingJumlah 

  const modalAwal = Number(sesiAktif.modal_awal)
  const cashSistem = systemSummary?.cashSistem || 0
  const qrisSistem = systemSummary?.qrisSistem || 0
  const transferSistem = systemSummary?.transferSistem || 0

  const selisihCash = cashAktual - (modalAwal + cashSistem - totalPengeluaran)
  const selisihQris = qrisAktual - qrisSistem
  const selisihTransfer = transferAktual - transferSistem

  const handleExecuteTutupSesi = () => {
    const validPin = process.env.NEXT_PUBLIC_KASIR_PIN || '123456'
    if (pinOwner !== validPin) {
      toast.error("PIN/Password Owner salah!")
      return
    }
    tutupKasirMutation.mutate()
  }

  const tutupKasirMutation = useMutation({
    mutationFn: async () => {
      if (systemSummary?.adaTiketSelesai) {
        throw new Error('Selesaikan seluruh pembayaran antrean sebelum menutup shift.')
      }

      const finalPengeluaranList = [...pengeluaranList]
      if (newJumlah > 0 && newKeterangan.trim() !== '') {
        finalPengeluaranList.push({
          jumlah: newJumlah,
          keterangan: newKeterangan,
          kategori: 'lainnya',
          sumberDana: sumberDana,
          fotoNama: selectedFile ? selectedFile.name : undefined,
          fileObj: selectedFile || undefined
        })
      }

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

      if (finalPengeluaranList.length > 0) {
        const pengeluaranPayload = await Promise.all(finalPengeluaranList.map(async (p) => {
          let fileUrl = ''
          
          if (p.fileObj) {
            const fileExt = p.fileObj.name.split('.').pop()
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
            
            const { error: uploadError } = await supabase.storage
              .from('bukti_struk')
              .upload(fileName, p.fileObj)
              
            if (!uploadError) {
              const { data: publicUrlData } = supabase.storage.from('bukti_struk').getPublicUrl(fileName)
              fileUrl = publicUrlData.publicUrl
            }
          }

          const strUrl = fileUrl ? ` (File Struk: ${fileUrl})` : ''
          
          return {
            sesi_id: sesiAktif.id,
            kasir_id: userId,
            jumlah: p.jumlah,
            keterangan: `[Sumber: ${p.sumberDana.toUpperCase()}] ${p.keterangan}${strUrl}`,
            kategori: p.kategori,
            cabang_id: sesiAktif.cabang_id || null
          }
        }))

        const { error: pengeluaranError } = await supabase
          .from('pengeluaran_kasir')
          .insert(pengeluaranPayload)

        if (pengeluaranError) throw pengeluaranError
      }

      return true
    },
    onSuccess: () => {
      toast.success('Sesi ditutup & rekapan berhasil dikirim ke Owner!')
      queryClient.invalidateQueries({ queryKey: ['sesi-aktif', userId] })
      router.replace('/kasir/tiket/aktif')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menutup sesi kasir')
    }
  })

  if (isLoading) return <div className="text-sm font-bold text-[#163832] p-8">Memuat form penutupan shift...</div>

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {systemSummary?.adaTiketSelesai && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
          <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5 text-rose-600" />
          <div>
            <h5 className="font-black text-lg">Tindakan Terkunci</h5>
            <p className="text-sm mt-1 font-medium">Selesaikan seluruh pembayaran antrean sebelum menutup shift.</p>
          </div>
        </div>
      )}

      <Card className="bg-white border-0 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="bg-[#051F20] text-white py-5">
          <CardTitle className="text-lg font-black tracking-wider">Laci & Mutasi Aktual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-6 bg-[#FAF7F2]">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#163832] uppercase tracking-widest">Cash Laci Akhir</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#163832] font-bold">Rp</span>
              <Input 
                type="text" value={formatInputRibuan(cashAktual)} onChange={(e) => setCashAktual(parseInputRibuan(e.target.value))}
                placeholder="0" className="pl-12 h-14 text-xl font-black bg-white border-0 shadow-sm text-[#051F20] focus-visible:ring-2 focus-visible:ring-[#8EB69B] rounded-2xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#163832] uppercase tracking-widest">Total Mutasi QRIS</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#163832] font-bold">Rp</span>
              <Input 
                type="text" value={formatInputRibuan(qrisAktual)} onChange={(e) => setQrisAktual(parseInputRibuan(e.target.value))}
                placeholder="0" className="pl-12 h-14 text-xl font-black bg-white border-0 shadow-sm text-[#051F20] focus-visible:ring-2 focus-visible:ring-[#8EB69B] rounded-2xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#163832] uppercase tracking-widest">Total Transfer Bank</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#163832] font-bold">Rp</span>
              <Input 
                type="text" value={formatInputRibuan(transferAktual)} onChange={(e) => setTransferAktual(parseInputRibuan(e.target.value))}
                placeholder="0" className="pl-12 h-14 text-xl font-black bg-white border-0 shadow-sm text-[#051F20] focus-visible:ring-2 focus-visible:ring-[#8EB69B] rounded-2xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-0 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="bg-[#051F20] text-white py-5">
          <CardTitle className="text-lg font-black tracking-wider">Pengeluaran Operasional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-6 bg-[#FAF7F2]">
          <div className="grid gap-5 md:grid-cols-2 bg-white p-5 rounded-2xl border-0 shadow-sm">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#163832] uppercase tracking-widest">Rincian Keperluan</label>
              <Input 
                type="text" value={newKeterangan} onChange={(e) => setNewKeterangan(e.target.value)}
                placeholder="Contoh: Beli token listrik" className="h-12 bg-[#FAF7F2] border-[#E6DFD3] focus-visible:ring-[#8EB69B] text-[#051F20] rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#163832] uppercase tracking-widest">Total Biaya</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#163832] font-semibold text-sm">Rp</span>
                <Input 
                  type="text" value={formatInputRibuan(newJumlah)} onChange={(e) => setNewJumlah(parseInputRibuan(e.target.value))}
                  placeholder="0" className="pl-10 h-12 font-bold bg-[#FAF7F2] border-[#E6DFD3] focus-visible:ring-[#8EB69B] text-[#051F20] rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#163832] uppercase tracking-widest">Metode Bayar Pengeluaran</label>
              <div className="flex gap-4 h-12 bg-[#FAF7F2] border border-[#E6DFD3] rounded-xl px-4 items-center">
                <label className="flex items-center gap-2 text-sm text-[#051F20] font-bold cursor-pointer">
                  <input type="radio" name="sumberDana" checked={sumberDana === 'cash'} onChange={() => setSumberDana('cash')} className="accent-[#235347] w-4 h-4" /> Uang Laci
                </label>
                <label className="flex items-center gap-2 text-sm text-[#051F20] font-bold cursor-pointer">
                  <input type="radio" name="sumberDana" checked={sumberDana === 'rekening'} onChange={() => setSumberDana('rekening')} className="accent-[#235347] w-4 h-4" /> Rek. Owner
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#163832] uppercase tracking-widest flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" /> Upload Bukti/Nota
              </label>
              <Input 
                id="file-upload" type="file" accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="h-12 border-[#E6DFD3] focus-visible:ring-[#8EB69B] bg-[#FAF7F2] file:mt-1 file:text-[10px] file:bg-[#8EB69B] file:text-[#051F20] file:font-bold file:px-3 file:rounded-lg file:border-0 cursor-pointer rounded-xl"
              />
            </div>
            <Button 
              type="button" onClick={handleAddPengeluaran} 
              className="w-full md:col-span-2 h-12 bg-[#235347] hover:bg-[#051F20] text-white font-black tracking-widest rounded-xl mt-2"
            >
              <Plus className="w-5 h-5 mr-1" /> SIMPAN PENGELUARAN
            </Button>
          </div>

          {pengeluaranList.length > 0 && (
            <div className="w-full overflow-x-auto bg-white rounded-2xl shadow-sm">
              <Table className="min-w-[500px]">
                <TableHeader className="bg-[#E6DFD3]/40">
                  <TableRow>
                    <TableHead className="text-[#051F20] font-bold">Keterangan</TableHead>
                    <TableHead className="text-[#051F20] font-bold">File Nota</TableHead>
                    <TableHead className="text-right text-[#051F20] font-bold">Jumlah</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pengeluaranList.map((p, idx) => (
                    <TableRow key={idx} className="border-b border-[#E6DFD3]/40 hover:bg-[#FAF7F2]">
                      <TableCell className="font-bold text-[#051F20]">
                        <span className={`text-[9px] px-2 py-1 rounded-md mr-2 tracking-widest uppercase ${p.sumberDana === 'cash' ? 'bg-[#8EB69B] text-[#051F20]' : 'bg-blue-200 text-blue-900'}`}>
                          {p.sumberDana}
                        </span>
                        {p.keterangan}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 max-w-[120px] truncate">
                        {p.fotoNama || '-'}
                      </TableCell>
                      <TableCell className="text-right text-[#051F20] font-black">{formatRupiah(p.jumlah)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleRemovePengeluaran(idx)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white border-0 shadow-sm rounded-3xl">
        <CardContent className="pt-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#163832] uppercase tracking-widest">Catatan Shift (Opsional)</label>
            <Input 
              type="text" value={catatan} onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tambahkan info untuk Owner jika perlu..." className="h-14 bg-[#FAF7F2] border-[#E6DFD3] focus-visible:ring-[#8EB69B] text-[#051F20] rounded-2xl"
            />
          </div>

          <div className="p-5 bg-[#E1EFE6] rounded-2xl border border-[#8EB69B]/50 space-y-3">
            <label className="text-[11px] font-bold text-[#163832] uppercase tracking-widest flex items-center gap-1">
              <KeyRound className="w-4 h-4" /> Otorisasi PIN Owner
            </label>
            <Input 
              type="password" value={pinOwner} onChange={(e) => setPinOwner(e.target.value)}
              placeholder="Masukkan PIN" className="h-14 text-center text-xl font-black tracking-widest bg-white border-0 shadow-sm text-[#051F20] focus-visible:ring-2 focus-visible:ring-[#8EB69B] rounded-2xl"
            />
          </div>

          <Button 
            onClick={handleExecuteTutupSesi} 
            className="w-full h-16 text-sm font-black bg-[#235347] hover:bg-[#051F20] text-white shadow-md transition-all tracking-widest rounded-2xl"
            disabled={tutupKasirMutation.isPending || systemSummary?.adaTiketSelesai}
          >
            {tutupKasirMutation.isPending ? 'MENGUNCI & MENGUNGGAH DATA...' : 'SELESAIKAN SHIFT SEKARANG'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
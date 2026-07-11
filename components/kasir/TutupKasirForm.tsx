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

// COMPONENT_TUTUP_KASIR_FORM
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

      const adaTiketAktif = tikets.some(t => t.status !== 'lunas')

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

      return { adaTiketAktif, cashSistem, qrisSistem, transferSistem }
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
      if (systemSummary?.adaTiketAktif) {
        throw new Error('Terdapat tiket yang belum lunas. Selesaikan atau batalkan sebelum menutup shift.')
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

  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

  if (isLoading) return <div className="text-sm font-medium text-slate-500 p-8 text-center bg-white rounded-xl border border-[#E6DFD3]">Menghitung kalkulasi sistem...</div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {systemSummary?.adaTiketAktif && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-5 rounded-xl flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
          <div>
            <h5 className="font-semibold text-sm">Tindakan Terkunci (Ada Antrean Aktif)</h5>
            <p className="text-xs mt-1">
              Anda tidak dapat menutup shift karena masih ada tiket servis dengan status Menunggu, Dikerjakan, atau Selesai (Belum Lunas).
              Harap selesaikan seluruh tagihan antrean atau batalkan tiket terlebih dahulu.
            </p>
          </div>
        </div>
      )}

      <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-[#FAF7F2] border-b border-[#E6DFD3] py-4 px-5">
          <CardTitle className="text-sm font-semibold text-[#051F20]">Laci & Mutasi Aktual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5 px-5 pb-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500">Cash Laci Akhir</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">Rp</span>
              <Input 
                type="text" value={formatInputRibuan(cashAktual)} onChange={(e) => setCashAktual(parseInputRibuan(e.target.value))}
                placeholder="0" className="pl-10 h-10 text-base font-semibold bg-white border border-[#E6DFD3] shadow-sm text-[#051F20] focus-visible:ring-1 focus-visible:ring-[#8EB69B] rounded-lg"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500">Total Mutasi QRIS</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">Rp</span>
              <Input 
                type="text" value={formatInputRibuan(qrisAktual)} onChange={(e) => setQrisAktual(parseInputRibuan(e.target.value))}
                placeholder="0" className="pl-10 h-10 text-base font-semibold bg-white border border-[#E6DFD3] shadow-sm text-[#051F20] focus-visible:ring-1 focus-visible:ring-[#8EB69B] rounded-lg"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500">Total Transfer Bank</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">Rp</span>
              <Input 
                type="text" value={formatInputRibuan(transferAktual)} onChange={(e) => setTransferAktual(parseInputRibuan(e.target.value))}
                placeholder="0" className="pl-10 h-10 text-base font-semibold bg-white border border-[#E6DFD3] shadow-sm text-[#051F20] focus-visible:ring-1 focus-visible:ring-[#8EB69B] rounded-lg"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-[#FAF7F2] border-b border-[#E6DFD3] py-4 px-5">
          <CardTitle className="text-sm font-semibold text-[#051F20]">Pengeluaran Operasional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-5 px-5 pb-6">
          <div className="grid gap-4 md:grid-cols-2 bg-slate-50 p-5 rounded-xl border border-[#E6DFD3] shadow-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Rincian Keperluan</label>
              <Input 
                type="text" value={newKeterangan} onChange={(e) => setNewKeterangan(e.target.value)}
                placeholder="Contoh: Beli token listrik" className="h-10 bg-white border border-[#E6DFD3] focus-visible:ring-1 focus-visible:ring-[#8EB69B] text-sm text-[#051F20] rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Total Biaya</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
                <Input 
                  type="text" value={formatInputRibuan(newJumlah)} onChange={(e) => setNewJumlah(parseInputRibuan(e.target.value))}
                  placeholder="0" className="pl-9 h-10 font-semibold bg-white border border-[#E6DFD3] focus-visible:ring-1 focus-visible:ring-[#8EB69B] text-[#051F20] rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Metode Bayar Pengeluaran</label>
              <div className="flex gap-4 h-10 bg-white border border-[#E6DFD3] rounded-lg px-3 items-center">
                <label className="flex items-center gap-2 text-xs text-[#051F20] font-medium cursor-pointer">
                  <input type="radio" name="sumberDana" checked={sumberDana === 'cash'} onChange={() => setSumberDana('cash')} className="accent-[#235347] w-3.5 h-3.5" /> Uang Laci
                </label>
                <label className="flex items-center gap-2 text-xs text-[#051F20] font-medium cursor-pointer">
                  <input type="radio" name="sumberDana" checked={sumberDana === 'rekening'} onChange={() => setSumberDana('rekening')} className="accent-[#235347] w-3.5 h-3.5" /> Rek. Owner
                </label>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" /> Upload Bukti/Nota
              </label>
              <Input 
                id="file-upload" type="file" accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="h-10 border border-[#E6DFD3] focus-visible:ring-1 focus-visible:ring-[#8EB69B] bg-white file:mt-0.5 file:text-[10px] file:bg-slate-100 file:text-[#051F20] file:font-medium file:px-2 file:rounded-md file:border-0 cursor-pointer rounded-lg text-xs pt-2"
              />
            </div>
            <Button 
              type="button" onClick={handleAddPengeluaran} 
              className="w-full md:col-span-2 h-10 bg-[#235347] hover:bg-[#051F20] text-white font-medium rounded-lg mt-1 shadow-sm transition-all text-sm"
            >
              <Plus className="w-4 h-4 mr-2" /> Simpan Pengeluaran
            </Button>
          </div>

          {pengeluaranList.length > 0 && (
            <div className="w-full overflow-x-auto bg-white rounded-xl shadow-sm border border-[#E6DFD3]">
              <Table className="min-w-[500px]">
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-[#E6DFD3]">
                    <TableHead className="text-slate-500 font-semibold text-xs pl-4">Keterangan</TableHead>
                    <TableHead className="text-slate-500 font-semibold text-xs">File Nota</TableHead>
                    <TableHead className="text-right text-slate-500 font-semibold text-xs">Jumlah</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pengeluaranList.map((p, idx) => (
                    <TableRow key={idx} className="border-b border-[#E6DFD3] hover:bg-slate-50 transition-colors">
                      <TableCell className="font-medium text-[#051F20] pl-4 py-3 text-sm">
                        <span className={`text-[10px] px-2 py-0.5 rounded mr-2 uppercase font-semibold ${p.sumberDana === 'cash' ? 'bg-[#E1EFE6] text-[#235347]' : 'bg-blue-50 text-blue-700'}`}>
                          {p.sumberDana}
                        </span>
                        {p.keterangan}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 max-w-[120px] truncate">
                        {p.fotoNama || '-'}
                      </TableCell>
                      <TableCell className="text-right text-[#051F20] font-semibold text-sm">{formatRupiah(p.jumlah)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleRemovePengeluaran(idx)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg h-8 w-8">
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

      <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl">
        <CardContent className="p-5 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500">Catatan Shift (Opsional)</label>
            <Input 
              type="text" value={catatan} onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tambahkan info untuk Owner jika perlu..." className="h-10 bg-white border border-[#E6DFD3] focus-visible:ring-1 focus-visible:ring-[#8EB69B] text-sm text-[#051F20] rounded-lg"
            />
          </div>

          <div className="p-5 bg-slate-50 rounded-xl border border-[#E6DFD3] space-y-3">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1 justify-center">
              <KeyRound className="w-4 h-4" /> Otorisasi PIN Owner
            </label>
            <Input 
              type="password" value={pinOwner} onChange={(e) => setPinOwner(e.target.value)}
              placeholder="Masukkan PIN" className="h-12 text-center text-lg font-bold tracking-widest bg-white border border-[#E6DFD3] shadow-sm text-[#051F20] focus-visible:ring-1 focus-visible:ring-[#8EB69B] rounded-lg max-w-xs mx-auto block"
            />
          </div>

          <Button 
            onClick={handleExecuteTutupSesi} 
            className="w-full h-12 text-sm font-semibold bg-[#235347] hover:bg-[#051F20] text-white shadow-sm transition-all rounded-lg"
            disabled={tutupKasirMutation.isPending || systemSummary?.adaTiketAktif}
          >
            {tutupKasirMutation.isPending ? 'Memproses...' : 'Selesaikan Shift'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
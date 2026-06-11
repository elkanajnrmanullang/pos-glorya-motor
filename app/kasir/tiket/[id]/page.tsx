"use client"

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Wallet, ArrowLeft, Check, Printer, User, Wrench, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function DetailPembayaranPage({ params }: PageProps) {
  const { id: tiketId } = use(params)
  const supabase = createClient()
  const router = useRouter()
  const queryClient = useQueryClient()

  // State Pembayaran
  const [metodeBayar, setMetodeBayar] = useState<'tunai' | 'qris' | 'transfer'>('tunai')
  const [uangDibayar, setUangDibayar] = useState<number>(0)

  // Query: Ambil Detail Utama Tiket Servis
  const { data: tiket, isLoading: isTiketLoading } = useQuery({
    queryKey: ['tiket-detail', tiketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tiket_servis')
        .select(`
          *,
          customers(nama, no_telp)
        `)
        .eq('id', tiketId)
        .single()

      if (error) throw error
      return data
    }
  })

  // Query: Ambil Daftar Sparepart (Items) Dalam Tiket
  const { data: spareparts, isLoading: isPartsLoading } = useQuery({
    queryKey: ['tiket-parts', tiketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tiket_items')
        .select(`
          *,
          barang(nama, barcode)
        `)
        .eq('tiket_id', tiketId)

      if (error) throw error
      return data
    }
  })

  // Query: Ambil Daftar Jasa Dalam Tiket
  const { data: services, isLoading: isServicesLoading } = useQuery({
    queryKey: ['tiket-services', tiketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tiket_jasa')
        .select('*')
        .eq('tiket_id', tiketId)

      if (error) throw error
      return data
    }
  })

  // Mutasi: Proses Transaksi Lunas & Potong Stok Permanen
  const lunasMutation = useMutation({
    mutationFn: async () => {
      // 1. Update Status Tiket Servis Jadi Lunas
      const { error: tiketError } = await supabase
        .from('tiket_servis')
        .update({
          status: 'lunas',
          metode_bayar: metodeBayar,
          waktu_lunas: new Date().toISOString()
        })
        .eq('id', tiketId)

      if (tiketError) throw tiketError

      // 2. Transisi Status Sparepart Dari Reserved Ke Committed (ACID Compliance)
      if (spareparts && spareparts.length > 0) {
        const { error: itemsError } = await supabase
          .from('tiket_items')
          .update({ status: 'committed' })
          .eq('tiket_id', tiketId)

        if (itemsError) throw itemsError

        // 3. Kurangi Stok Fisik & Stok Reserved Di Tabel Barang Secara Bersamaan
        for (const item of spareparts) {
          // Ambil data stok terbaru barang saat ini
          const { data: currentBarang } = await supabase
            .from('barang')
            .select('stok_fisik, stok_reserved')
            .eq('id', item.barang_id)
            .single()

          if (currentBarang) {
            const newFisik = currentBarang.stok_fisik - item.qty
            const newReserved = currentBarang.stok_reserved - item.qty

            await supabase
              .from('barang')
              .update({
                stok_fisik: newFisik >= 0 ? newFisik : 0,
                stok_reserved: newReserved >= 0 ? newReserved : 0,
                updated_at: new Date().toISOString()
              })
              .eq('id', item.barang_id)
          }
        }
      }
    },
    onSuccess: () => {
      toast.success('Pembayaran berhasil dilunasi!')
      queryClient.invalidateQueries({ queryKey: ['tiket-aktif'] })
      queryClient.invalidateQueries({ queryKey: ['metrics-sesi'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal memproses pelunasan')
    }
  })

  // Utilitas: Format Ribuan Angka Input
  const formatInputRibuan = (val: number) => {
    if (!val || val === 0) return ''
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  const parseInputRibuan = (val: string) => {
    const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10)
    return isNaN(parsed) ? 0 : parsed
  }

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
  }

  if (isTiketLoading || isPartsLoading || isServicesLoading) {
    return <div className="text-sm font-medium text-[#163832] p-8">Memuat rincian tagihan...</div>
  }

  if (!tiket) {
    return <div className="p-8 text-center text-sm font-medium text-slate-500">Data tiket tidak ditemukan.</div>
  }

  // Akumulasi Total Biaya Akhir
  const totalJasa = Number(tiket.total_jasa || 0)
  const totalPart = Number(tiket.total_part || 0)
  const totalAkhir = totalJasa + totalPart
  const kembalian = uangDibayar - totalAkhir

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/kasir/tiket/aktif')} className="text-[#163832] hover:bg-[#E1EFE6]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-[#051F20]">Proses Kasir Pembayaran</h2>
            <p className="text-sm text-[#163832] mt-0.5">Antrean {tiket.nomor_antrian} · Pelat {tiket.plat_motor}</p>
          </div>
        </div>
        <Badge variant="outline" className={`font-bold h-7 ${tiket.status === 'lunas' ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : 'border-amber-500 text-amber-700 bg-amber-50'}`}>
          STATUS TIKET: {tiket.status.toUpperCase()}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3 items-start">
        
        {/* Kolom Kiri: Rincian Nota Transaksi */}
        <div className="md:col-span-2 space-y-6">
          {/* Data Profil Ringkas Pelanggan */}
          <Card className="bg-[#FAF7F2] border-[#E6DFD3]">
            <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#235347]" />
                <div>
                  <p className="text-xs text-slate-500 font-medium">Nama Pelanggan</p>
                  <p className="font-bold text-[#051F20]">{tiket.customers?.nama}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#235347]" />
                <div>
                  <p className="text-xs text-slate-500 font-medium">Motor Kendaraan</p>
                  <p className="font-bold text-[#051F20]">{tiket.merk_motor} ({tiket.cc_motor ? `${tiket.cc_motor}cc` : '-'})</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rincian Seluruh Tindakan Kerja & Biaya */}
          <Card className="bg-[#FAF7F2] border-[#E6DFD3] overflow-hidden">
            <CardHeader className="border-b border-[#E6DFD3]/60 bg-white/40">
              <CardTitle className="text-sm font-bold text-[#051F20]">Rincian Jasa & Suku Cadang</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-[#FAF7F2]">
                  <TableRow className="border-b border-[#E6DFD3]/60">
                    <TableHead className="text-[#163832] font-bold pl-6">Item Pengerjaan / Sparepart</TableHead>
                    <TableHead className="text-center text-[#163832] font-bold w-20">Qty</TableHead>
                    <TableHead className="text-right text-[#163832] font-bold pr-6">Harga</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white">
                  {/* List Item Jasa */}
                  {services?.map((svc) => (
                    <TableRow key={svc.id} className="border-b border-[#E6DFD3]/40">
                      <TableCell className="pl-6 font-medium text-[#051F20]">
                        <span className="text-xs font-bold text-[#235347] mr-2 bg-[#E1EFE6] px-1.5 py-0.5 rounded">JASA</span>
                        {svc.nama_jasa}
                      </TableCell>
                      <TableCell className="text-center text-slate-600 font-medium">1</TableCell>
                      <TableCell className="text-right text-[#051F20] font-semibold pr-6">{formatRupiah(Number(svc.harga_jasa))}</TableCell>
                    </TableRow>
                  ))}

                  {/* List Item Sparepart */}
                  {spareparts?.map((part) => (
                    <TableRow key={part.id} className="border-b border-[#E6DFD3]/40">
                      <TableCell className="pl-6 font-medium text-[#051F20]">
                        <span className="text-xs font-bold text-amber-800 mr-2 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">PART</span>
                        {part.barang?.nama}
                      </TableCell>
                      <TableCell className="text-center text-slate-700 font-bold">{part.qty}</TableCell>
                      <TableCell className="text-right text-[#051F20] font-semibold pr-6">{formatRupiah(Number(part.harga_snapshot))}</TableCell>
                    </TableRow>
                  ))}

                  {/* Jika Nota Masih Kosong */}
                  {(!services?.length && !spareparts?.length) && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-slate-400 py-6 italic">Tidak ada tindakan atau sparepart terdaftar.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Subtotal Nota Blok Bawah */}
              <div className="bg-[#FAF7F2] p-6 border-t border-[#E6DFD3]/60 space-y-2 text-sm font-medium">
                <div className="flex justify-between text-slate-600">
                  <span>Total Ongkos Jasa</span>
                  <span>{formatRupiah(totalJasa)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Pembelian Sparepart</span>
                  <span>{formatRupiah(totalPart)}</span>
                </div>
                <div className="flex justify-between text-lg font-black text-[#051F20] pt-2 border-t border-[#E6DFD3]">
                  <span>Total Tagihan Akhir</span>
                  <span>{formatRupiah(totalAkhir)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Panel Kasir Eksekusi Bayar */}
        <div className="space-y-6">
          <Card className="bg-[#FAF7F2] border-[#E6DFD3]">
            <CardHeader className="border-b border-[#E6DFD3]/60">
              <CardTitle className="text-sm font-bold text-[#051F20] flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#235347]" /> Metode & Pelunasan
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              
              {/* Opsi Dropdown / Pilihan Metode */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#163832] uppercase">Pilih Metode Pembayaran</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    type="button" 
                    variant={metodeBayar === 'tunai' ? 'default' : 'outline'}
                    disabled={tiket.status === 'lunas'}
                    className={`text-xs font-bold ${metodeBayar === 'tunai' ? 'bg-[#235347] text-white hover:bg-[#051F20]' : 'bg-white border-[#8EB69B]/40 text-[#163832]'}`}
                    onClick={() => setMetodeBayar('tunai')}
                  >
                    CASH
                  </Button>
                  <Button 
                    type="button" 
                    variant={metodeBayar === 'qris' ? 'default' : 'outline'}
                    disabled={tiket.status === 'lunas'}
                    className={`text-xs font-bold ${metodeBayar === 'qris' ? 'bg-[#235347] text-white hover:bg-[#051F20]' : 'bg-white border-[#8EB69B]/40 text-[#163832]'}`}
                    onClick={() => setMetodeBayar('qris')}
                  >
                    QRIS
                  </Button>
                  <Button 
                    type="button" 
                    variant={metodeBayar === 'transfer' ? 'default' : 'outline'}
                    disabled={tiket.status === 'lunas'}
                    className={`text-xs font-bold ${metodeBayar === 'transfer' ? 'bg-[#235347] text-white hover:bg-[#051F20]' : 'bg-white border-[#8EB69B]/40 text-[#163832]'}`}
                    onClick={() => setMetodeBayar('transfer')}
                  >
                    BANK
                  </Button>
                </div>
              </div>

              {/* Form Khusus Tunai / Kembalian */}
              {metodeBayar === 'tunai' && tiket.status !== 'lunas' && (
                <div className="space-y-4 pt-2 border-t border-[#E6DFD3]/60">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#163832] uppercase">Jumlah Uang Diterima</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-semibold">Rp</span>
                      <Input 
                        type="text"
                        value={formatInputRibuan(uangDibayar)}
                        onChange={(e) => setUangDibayar(parseInputRibuan(e.target.value))}
                        placeholder="0"
                        className="pl-9 h-11 font-bold bg-white text-[#051F20] border-[#8EB69B]/50"
                      />
                    </div>
                  </div>

                  {uangDibayar >= totalAkhir && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex justify-between items-center text-sm">
                      <span className="font-semibold text-emerald-800">Uang Kembalian:</span>
                      <span className="font-black text-emerald-900 text-base">{formatRupiah(kembalian)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Tombol Eksekusi atau Tombol Cetak Struk */}
              {tiket.status === 'lunas' ? (
                <Button 
                  type="button"
                  className="w-full h-12 font-bold tracking-wider bg-[#051F20] hover:bg-black text-white"
                  onClick={() => toast.info('Fitur Printer ESC/POS Thermal WebUSB dipanggil')}
                >
                  <Printer className="w-4 h-4 mr-1.5" /> CETAK STRUK FINAL
                </Button>
              ) : (
                <Button 
                  type="button"
                  disabled={lunasMutation.isPending || (metodeBayar === 'tunai' && uangDibayar < totalAkhir)}
                  onClick={() => lunasMutation.mutate()}
                  className="w-full h-14 font-black tracking-widest bg-[#235347] hover:bg-[#051F20] text-white shadow-md"
                >
                  {lunasMutation.isPending ? 'MEMPROSES PELUNASAN...' : 'KONFIRMASI LUNAS'}
                </Button>
              )}

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
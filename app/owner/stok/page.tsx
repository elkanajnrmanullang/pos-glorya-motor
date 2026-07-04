"use client"

import { useState } from 'react'
import { useOwnerStok, BarangOwner } from '@/hooks/use-owner-stok'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Search, Loader2, Boxes, AlertTriangle, TrendingUp, Wallet, ArrowRight, Plus, Edit, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function PantauanStokOwnerPage() {
  const { 
    barang, totalAsetModal, potensiOmzet, estimasiLabaKotor, lowStockCount, 
    isLoading, tambahBarang, updateBarang, hapusBarang, isProcessing 
  } = useOwnerStok()
  
  const [search, setSearch] = useState('')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  
  const [formMode, setFormMode] = useState<'baru' | 'update'>('baru')
  const [searchBarang, setSearchBarang] = useState('')
  const [selectedBarangSku, setSelectedBarangSku] = useState<string | null>(null)
  
  const [refHargaBeli, setRefHargaBeli] = useState(0)
  const [refHargaJual, setRefHargaJual] = useState(0)

  const [formData, setFormData] = useState({
    nama: '',
    barcode: '',
    harga_beli: '',
    harga_jual: '',
    stok_fisik: '', 
    stok_minimum: '',
    satuan: 'pcs'
  })

  const [deletingSku, setDeletingSku] = useState<string | null>(null)

  const filteredBarang = barang.filter(b => 
    b.nama.toLowerCase().includes(search.toLowerCase()) ||
    (b.barcode && b.barcode.toLowerCase().includes(search.toLowerCase())) ||
    (b.sku && b.sku.toLowerCase().includes(search.toLowerCase()))
  )

  const formSearchHits = barang.filter(b => b.nama.toLowerCase().includes(searchBarang.toLowerCase()) && searchBarang.length > 1).slice(0, 5)

  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0)

  // HANDLER MENOLAK INPUT ANGKA NEGATIF
  const handleNumberChange = (field: string, value: string) => {
    const safeValue = value.replace(/-/g, '')
    setFormData(prev => ({ ...prev, [field]: safeValue }))
  }

  const openSmartForm = () => {
    setFormMode('baru')
    setSearchBarang('')
    setSelectedBarangSku(null)
    setFormData({ nama: '', barcode: '', harga_beli: '', harga_jual: '', stok_fisik: '0', stok_minimum: '5', satuan: 'pcs' })
    setIsFormOpen(true)
  }

  const selectExistingBarang = (item: BarangOwner) => {
    setFormMode('update')
    setSelectedBarangSku(item.sku)
    setSearchBarang(item.nama)
    setRefHargaBeli(item.harga_beli)
    setRefHargaJual(item.harga_jual)
    
    setFormData({
      nama: item.nama,
      barcode: item.barcode || '',
      harga_beli: item.harga_beli.toString(),
      harga_jual: item.harga_jual.toString(),
      stok_fisik: '0', 
      stok_minimum: item.stok_minimum.toString(),
      satuan: item.satuan || 'pcs'
    })
  }

  const resetToNewBarang = () => {
    setFormMode('baru')
    setSelectedBarangSku(null)
    setFormData(prev => ({ ...prev, nama: searchBarang, stok_fisik: '0' }))
  }

  const openDeleteForm = (sku: string) => {
    if(!sku) return toast.error('Kesalahan data (SKU tidak ditemukan). Refresh halaman.')
    setDeletingSku(sku)
    setIsDeleteOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nama || !formData.harga_beli || !formData.harga_jual) {
      return toast.error('Nama, Harga Modal, dan Harga Jual wajib diisi!')
    }

    const hBeli = Number(formData.harga_beli)
    const hJual = Number(formData.harga_jual)
    const sFisik = Number(formData.stok_fisik)
    const sMin = Number(formData.stok_minimum)

    if (hBeli < 0 || hJual < 0 || sFisik < 0 || sMin < 0) {
      return toast.error('Sistem mendeteksi angka negatif. Mohon periksa kembali input Anda.')
    }

    try {
      if (formMode === 'update' && selectedBarangSku) {
        const originalItem = barang.find(b => b.sku === selectedBarangSku)
        if (!originalItem) throw new Error("Barang referensi tidak ditemukan.")
        
        const stokBaruTotal = originalItem.stok_fisik + sFisik

        await updateBarang({ 
          sku: selectedBarangSku,
          nama: formData.nama,
          barcode: formData.barcode || null,
          harga_beli: hBeli,
          harga_jual: hJual,
          stok_fisik: stokBaruTotal,
          stok_minimum: sMin,
          satuan: formData.satuan
        })
        toast.success(`Berhasil! Stok bertambah ${sFisik} dan data terupdate.`)

      } else {
        const generatedSku = formData.barcode 
          ? formData.barcode.toUpperCase() 
          : `BRG-${Math.floor(100000 + Math.random() * 900000)}`

        await tambahBarang({
          sku: generatedSku,
          nama: formData.nama,
          barcode: formData.barcode || null,
          harga_beli: hBeli,
          harga_jual: hJual,
          stok_fisik: sFisik,
          stok_minimum: sMin,
          satuan: formData.satuan
        })
        toast.success('Barang baru berhasil ditambahkan ke katalog!')
      }
      setIsFormOpen(false)
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan barang. Pastikan nama belum terdaftar.')
    }
  }

  const handleDelete = async () => {
    if (!deletingSku) return
    try {
      await hapusBarang(deletingSku)
      toast.success('Barang berhasil dihapus dari sistem.')
      setIsDeleteOpen(false)
    } catch (error) {
      toast.error('Gagal menghapus. Barang ini sedang terikat pada transaksi historis.')
    }
  }

  const renderMarginIndicator = (current: number, ref: number) => {
    if (formMode !== 'update') return null
    if (current === ref || isNaN(current)) return <span className="text-xs text-slate-400 font-medium">Tetap (Sama seperti stok lama)</span>
    const diff = current - ref
    const isUp = diff > 0
    return (
      <span className={`text-xs font-semibold flex items-center ${isUp ? 'text-rose-600' : 'text-emerald-600'}`}>
        {isUp ? <ArrowUpCircle className="w-3.5 h-3.5 mr-1" /> : <ArrowDownCircle className="w-3.5 h-3.5 mr-1" />}
        {isUp ? 'Naik' : 'Turun'} {formatRupiah(Math.abs(diff))}
      </span>
    )
  }

  return (
    <div className="w-full space-y-6 font-sans pb-12">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#051F20] tracking-tight">Pantauan Stok & Aset</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola inventaris dan pantau total valuasi aset barang di gudang.</p>
        </div>
        <Button onClick={openSmartForm} className="bg-[#235347] hover:bg-[#051F20] text-white shadow-sm h-10 px-4 rounded-lg w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" /> Kelola Barang / Restock
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Aset Modal</p>
              <h3 className="text-xl font-semibold text-[#051F20]">{formatRupiah(totalAsetModal)}</h3>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Potensi Omzet</p>
              <h3 className="text-xl font-semibold text-[#235347]">{formatRupiah(potensiOmzet)}</h3>
            </div>
            <div className="w-10 h-10 bg-[#E1EFE6] text-[#235347] rounded-lg flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Estimasi Laba Kotor</p>
              <h3 className="text-xl font-semibold text-emerald-600">{formatRupiah(estimasiLabaKotor)}</h3>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
              <ArrowRight className="w-5 h-5 -rotate-45" />
            </div>
          </CardContent>
        </Card>

        <Card className={`shadow-sm rounded-xl ${lowStockCount > 0 ? 'bg-rose-50 border-rose-200 border' : 'bg-white border-[#E6DFD3] border'}`}>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1.5">
              <p className={`text-xs font-medium uppercase tracking-wide ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-500'}`}>Peringatan Restock</p>
              <h3 className={`text-xl font-semibold ${lowStockCount > 0 ? 'text-rose-700' : 'text-[#051F20]'}`}>{lowStockCount} <span className="text-sm font-normal">Item Menipis</span></h3>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${lowStockCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="border-b border-[#E6DFD3] bg-[#FAF7F2] pb-4 pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-sm font-semibold flex items-center text-[#051F20]">
            <Boxes className="w-4 h-4 mr-2 text-[#8EB69B]" /> Database Inventaris Gudang
          </CardTitle>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Cari nama barang atau SKU/Barcode..." 
              value={search} onChange={e => setSearch(e.target.value)} 
              className="pl-9 h-10 text-sm bg-white border-[#E6DFD3] focus-visible:ring-1 focus-visible:ring-[#8EB69B] rounded-lg" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto w-full">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#8EB69B]" /></div>
          ) : (
            <Table className="min-w-[900px]">
              <TableHeader className="bg-slate-50">
                <TableRow className="border-[#E6DFD3] hover:bg-transparent">
                  <TableHead className="font-medium text-slate-500 pl-6 text-xs">SKU / Nama Barang</TableHead>
                  <TableHead className="font-medium text-slate-500 text-center text-xs">Stok Sisa</TableHead>
                  <TableHead className="font-medium text-slate-500 text-right text-xs">Harga Modal</TableHead>
                  <TableHead className="font-medium text-slate-500 text-right text-xs">Harga Jual</TableHead>
                  <TableHead className="font-medium text-slate-500 text-right text-xs">Valuasi Aset</TableHead>
                  <TableHead className="font-medium text-slate-500 text-right pr-6 w-24 text-xs">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBarang.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400 text-sm">Tidak ada barang yang cocok dengan pencarian.</TableCell></TableRow>
                ) : (
                  filteredBarang.map((item) => {
                    const isLowStock = (item.stok_tersedia ?? item.stok_fisik) <= item.stok_minimum
                    const asetItem = item.stok_fisik * item.harga_beli
                    
                    return (
                      <TableRow key={item.sku || Math.random().toString()} className="hover:bg-slate-50 transition-colors border-[#E6DFD3]">
                        <TableCell className="pl-6 py-4">
                          <div className="font-semibold text-[#051F20] text-sm">{item.nama}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{item.sku}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className={`text-sm font-semibold ${isLowStock ? 'text-rose-600' : 'text-[#051F20]'}`}>
                            {item.stok_tersedia ?? item.stok_fisik} <span className="text-xs font-medium text-slate-500">{item.satuan}</span>
                          </div>
                          {isLowStock && <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded uppercase mt-1.5 inline-block">Restock</span>}
                        </TableCell>
                        <TableCell className="text-right text-slate-600 font-medium text-sm">
                          {formatRupiah(item.harga_beli)}
                        </TableCell>
                        <TableCell className="text-right text-[#235347] font-semibold text-sm">
                          {formatRupiah(item.harga_jual)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-[#051F20] text-sm">
                          {formatRupiah(asetItem)}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button variant="ghost" size="icon" onClick={() => { selectExistingBarang(item); setIsFormOpen(true); }} className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-lg mr-1">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteForm(item.sku)} className="h-8 w-8 text-rose-600 hover:bg-rose-50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-xl w-[95vw] bg-[#FAF7F2] border border-[#E6DFD3] shadow-sm rounded-xl p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-white border-b border-[#E6DFD3]">
            <DialogTitle className="text-lg font-semibold text-[#051F20]">
              {formMode === 'update' ? 'Update Stok & Harga Barang' : 'Entri Barang Baru'}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              {formMode === 'update' 
                ? 'Tambahkan jumlah stok yang baru masuk dan sesuaikan harganya jika perlu.' 
                : 'Ketik nama barang untuk mencari. Jika tidak ada, lanjutkan mengisi form di bawah.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 overflow-y-auto max-h-[70vh] bg-slate-50/50">
            <div className="mb-6 relative">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Cari atau Ketik Nama Barang <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input 
                  value={searchBarang} 
                  onChange={(e) => {
                    setSearchBarang(e.target.value);
                    setFormData(prev => ({ ...prev, nama: e.target.value }));
                    if (formMode === 'update') resetToNewBarang();
                  }} 
                  placeholder="Ketik nama barang..." 
                  className="pl-9 h-10 border-[#E6DFD3] focus-visible:ring-1 focus-visible:ring-[#8EB69B] bg-white text-sm"
                  autoComplete="off"
                />
              </div>

              {formMode === 'baru' && searchBarang.length > 1 && formSearchHits.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-[#E6DFD3] rounded-lg shadow-lg overflow-hidden">
                  <div className="px-3 py-2 bg-slate-50 border-b border-[#E6DFD3] text-xs font-semibold text-slate-500">
                    Barang Ditemukan (Klik untuk update stok)
                  </div>
                  {formSearchHits.map(hit => (
                    <div 
                      key={hit.sku} 
                      className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center"
                      onClick={() => selectExistingBarang(hit)}
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#051F20]">{hit.nama}</p>
                        <p className="text-xs text-slate-500">{hit.sku || hit.barcode || 'No SKU'} • Stok: {hit.stok_tersedia}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form id="smart-form" onSubmit={handleSubmit} className="space-y-4">
              {formMode === 'update' && (
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Edit className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Anda sedang melakukan <span className="font-bold">Update Barang</span>. Form di bawah telah terisi data lama. Silakan ubah harga (jika ada kenaikan) dan masukkan jumlah stok yang baru tiba.
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Barcode (Opsional)</label>
                <Input value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} placeholder="Scan barcode..." className="h-10 border-[#E6DFD3] focus-visible:ring-1 focus-visible:ring-[#8EB69B] bg-white text-sm" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Harga Modal <span className="text-rose-500">*</span></label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">Rp</span>
                    <Input type="number" min="0" value={formData.harga_beli} onChange={e => handleNumberChange('harga_beli', e.target.value)} required className="pl-9 h-10 border-[#E6DFD3] focus-visible:ring-1 focus-visible:ring-[#8EB69B] bg-white text-sm font-semibold" />
                  </div>
                  <div className="h-4">{renderMarginIndicator(Number(formData.harga_beli), refHargaBeli)}</div>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Harga Jual <span className="text-rose-500">*</span></label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">Rp</span>
                    <Input type="number" min="0" value={formData.harga_jual} onChange={e => handleNumberChange('harga_jual', e.target.value)} required className="pl-9 h-10 border-[#E6DFD3] focus-visible:ring-1 focus-visible:ring-[#8EB69B] bg-white text-sm font-semibold text-[#235347]" />
                  </div>
                  <div className="h-4">{renderMarginIndicator(Number(formData.harga_jual), refHargaJual)}</div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{formMode === 'update' ? 'Stok Tambahan Baru Masuk' : 'Stok Fisik Awal'} <span className="text-rose-500">*</span></label>
                  <Input type="number" min="0" value={formData.stok_fisik} onChange={e => handleNumberChange('stok_fisik', e.target.value)} required className="h-10 border-[#E6DFD3] focus-visible:ring-1 focus-visible:ring-[#8EB69B] bg-white text-sm font-semibold" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Batas Min</label>
                    <Input type="number" min="0" value={formData.stok_minimum} onChange={e => handleNumberChange('stok_minimum', e.target.value)} className="h-10 border-[#E6DFD3] focus-visible:ring-1 focus-visible:ring-[#8EB69B] bg-white text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Satuan</label>
                    <Input value={formData.satuan} onChange={e => setFormData({ ...formData, satuan: e.target.value })} placeholder="pcs/botol" required className="h-10 border-[#E6DFD3] focus-visible:ring-1 focus-visible:ring-[#8EB69B] bg-white text-sm" />
                  </div>
                </div>
              </div>
            </form>
          </div>
          
          <DialogFooter className="p-4 bg-white border-t border-[#E6DFD3] flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="w-full sm:w-auto h-10 rounded-lg border-[#E6DFD3] text-[#051F20]">Batal</Button>
            <Button type="submit" form="smart-form" disabled={isProcessing || !formData.nama} className="w-full sm:w-auto h-10 rounded-lg bg-[#235347] hover:bg-[#051F20] text-white transition-colors">
              {isProcessing ? 'Menyimpan...' : (formMode === 'update' ? 'Update & Tambah Stok' : 'Simpan Barang Baru')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] bg-white border border-[#E6DFD3] shadow-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-rose-600 font-semibold text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> Hapus Barang Ini?</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-slate-500 font-medium leading-relaxed">
            Barang yang dihapus tidak akan muncul lagi di halaman pencarian kasir dan mekanik. Data transaksi masa lalu yang memuat barang ini akan tetap aman.
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="w-full sm:w-auto h-10 rounded-lg border-[#E6DFD3] text-[#051F20]">Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isProcessing} className="w-full sm:w-auto h-10 rounded-lg bg-rose-600 hover:bg-rose-700">
              {isProcessing ? 'Menghapus...' : 'Ya, Hapus Barang'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
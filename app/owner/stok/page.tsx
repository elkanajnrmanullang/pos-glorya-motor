"use client"

import { useState } from 'react'
import { useOwnerStok, BarangOwner } from '@/hooks/use-owner-stok'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Search, Loader2, Boxes, AlertTriangle, TrendingUp, Wallet, ArrowRight, Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function PantauanStokOwnerPage() {
  const { 
    barang, totalAsetModal, potensiOmzet, estimasiLabaKotor, lowStockCount, 
    isLoading, tambahBarang, updateBarang, hapusBarang, isProcessing 
  } = useOwnerStok()
  
  const [search, setSearch] = useState('')

  // DIALOG STATES
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  
  // FORM STATES
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nama: '',
    barcode: '',
    harga_beli: '',
    harga_jual: '',
    stok_fisik: '',
    stok_minimum: '',
    satuan: 'pcs'
  })

  // FILTER DATA
  const filteredBarang = barang.filter(b => 
    b.nama.toLowerCase().includes(search.toLowerCase()) ||
    (b.barcode && b.barcode.toLowerCase().includes(search.toLowerCase()))
  )

  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0)

  // HANDLERS DIALOG
  const openAddForm = () => {
    setEditingId(null)
    setFormData({ nama: '', barcode: '', harga_beli: '', harga_jual: '', stok_fisik: '0', stok_minimum: '5', satuan: 'pcs' })
    setIsFormOpen(true)
  }

  const openEditForm = (item: BarangOwner) => {
    setEditingId(item.id)
    setFormData({
      nama: item.nama,
      barcode: item.barcode || '',
      harga_beli: item.harga_beli.toString(),
      harga_jual: item.harga_jual.toString(),
      stok_fisik: item.stok_fisik.toString(),
      stok_minimum: item.stok_minimum.toString(),
      satuan: item.satuan || 'pcs'
    })
    setIsFormOpen(true)
  }

  const openDeleteForm = (id: string) => {
    setDeletingId(id)
    setIsDeleteOpen(true)
  }

  // SUBMIT HANDLERS
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nama || !formData.harga_beli || !formData.harga_jual) {
      return toast.error('Nama, Harga Modal, dan Harga Jual wajib diisi!')
    }

    const payload = {
      nama: formData.nama,
      barcode: formData.barcode || null,
      harga_beli: Number(formData.harga_beli),
      harga_jual: Number(formData.harga_jual),
      stok_fisik: Number(formData.stok_fisik),
      stok_minimum: Number(formData.stok_minimum),
      satuan: formData.satuan
    }

    try {
      if (editingId) {
        await updateBarang({ id: editingId, ...payload })
        toast.success('Data barang berhasil diperbarui!')
      } else {
        await tambahBarang(payload)
        toast.success('Barang baru berhasil ditambahkan!')
      }
      setIsFormOpen(false)
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan barang')
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await hapusBarang(deletingId)
      toast.success('Barang berhasil dihapus dari sistem.')
      setIsDeleteOpen(false)
    } catch (error) {
      toast.error('Gagal menghapus. Barang mungkin sedang terkait dengan transaksi.')
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#051F20] tracking-tight">Pantauan Stok & Aset</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Kelola inventaris dan pantau valuasi aset barang di gudang Anda.</p>
        </div>
        <Button onClick={openAddForm} className="bg-[#163832] hover:bg-[#051F20] text-white shadow-md">
          <Plus className="w-4 h-4 mr-2" /> Tambah Barang Baru
        </Button>
      </div>

      {/* KARTU RINGKASAN ASET (Tetap Sama) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-[#DAF1DE] bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Aset Modal</p>
                <h3 className="text-2xl font-black text-[#051F20]">{formatRupiah(totalAsetModal)}</h3>
              </div>
              <div className="w-10 h-10 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#DAF1DE] bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Potensi Omzet</p>
                <h3 className="text-2xl font-black text-[#235347]">{formatRupiah(potensiOmzet)}</h3>
              </div>
              <div className="w-10 h-10 bg-[#E1EFE6] text-[#235347] rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#DAF1DE] bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimasi Laba Kotor</p>
                <h3 className="text-2xl font-black text-emerald-600">{formatRupiah(estimasiLabaKotor)}</h3>
              </div>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <ArrowRight className="w-5 h-5 -rotate-45" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-[#DAF1DE] shadow-sm ${lowStockCount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white'}`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className={`text-xs font-bold uppercase tracking-wider ${lowStockCount > 0 ? 'text-rose-700' : 'text-slate-400'}`}>Perlu Restock</p>
                <h3 className={`text-2xl font-black ${lowStockCount > 0 ? 'text-rose-700' : 'text-[#051F20]'}`}>{lowStockCount} Item</h3>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${lowStockCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABEL RINCIAN ASET GUDANG */}
      <Card className="border-[#DAF1DE] bg-white shadow-sm overflow-hidden">
        <CardHeader className="border-b border-[#DAF1DE]/50 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-sm font-bold flex items-center text-[#051F20]">
            <Boxes className="w-5 h-5 mr-2 text-[#235347]" /> Daftar Inventaris Barang
          </CardTitle>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="Cari nama barang atau barcode..." 
              value={search} onChange={e => setSearch(e.target.value)} 
              className="pl-9 h-10 text-sm bg-slate-50" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto w-full">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#235347]" /></div>
          ) : (
            <Table className="min-w-[900px]">
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold text-[#163832] pl-6">Nama & Barcode</TableHead>
                  <TableHead className="font-bold text-[#163832] text-center">Tersedia</TableHead>
                  <TableHead className="font-bold text-[#163832] text-right">Harga Modal</TableHead>
                  <TableHead className="font-bold text-[#163832] text-right">Harga Jual</TableHead>
                  <TableHead className="font-bold text-[#163832] text-right">Total Aset</TableHead>
                  <TableHead className="font-bold text-[#163832] text-right pr-6 w-[100px]">Opsi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBarang.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-500 font-medium">Barang tidak ditemukan.</TableCell></TableRow>
                ) : (
                  filteredBarang.map((item) => {
                    const isLowStock = item.stok_tersedia <= item.stok_minimum
                    const asetItem = item.stok_fisik * item.harga_beli
                    
                    return (
                      <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="pl-6">
                          <div className="font-bold text-[#051F20] text-sm">{item.nama}</div>
                          <div className="text-[10px] text-slate-400 font-bold tracking-wider mt-0.5">{item.barcode || 'NO BARCODE'}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className={`text-sm font-black ${isLowStock ? 'text-rose-600' : 'text-[#051F20]'}`}>
                            {item.stok_tersedia} <span className="text-[10px] font-bold text-slate-400">{item.satuan}</span>
                          </div>
                          {isLowStock && <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">Restock</span>}
                        </TableCell>
                        <TableCell className="text-right text-slate-600 font-semibold text-sm">
                          {formatRupiah(item.harga_beli)}
                        </TableCell>
                        <TableCell className="text-right text-emerald-700 font-black text-sm">
                          {formatRupiah(item.harga_jual)}
                        </TableCell>
                        <TableCell className="text-right font-black text-[#235347] text-sm">
                          {formatRupiah(asetItem)}
                        </TableCell>
                        <TableCell className="text-right pr-6 space-x-1 whitespace-nowrap">
                          <Button variant="ghost" size="icon" onClick={() => openEditForm(item)} className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteForm(item.id)} className="h-8 w-8 text-rose-600 hover:bg-rose-50">
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

      {/* DIALOG FORM TAMBAH/UBAH BARANG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#051F20]">{editingId ? 'Edit Data Barang' : 'Tambah Barang Baru'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-bold text-[#163832] uppercase">Nama Barang</label>
                <Input value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-bold text-[#163832] uppercase">Barcode (Opsional)</label>
                <Input value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} placeholder="Scan atau ketik barcode..." />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#163832] uppercase">Harga Modal (Beli)</label>
                <Input type="number" value={formData.harga_beli} onChange={e => setFormData({ ...formData, harga_beli: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#163832] uppercase">Harga Jual</label>
                <Input type="number" value={formData.harga_jual} onChange={e => setFormData({ ...formData, harga_jual: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#163832] uppercase">Stok Fisik Awal</label>
                <Input type="number" value={formData.stok_fisik} onChange={e => setFormData({ ...formData, stok_fisik: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#163832] uppercase">Batas Minimum Stok</label>
                <Input type="number" value={formData.stok_minimum} onChange={e => setFormData({ ...formData, stok_minimum: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-bold text-[#163832] uppercase">Satuan (Misal: pcs, botol, liter)</label>
                <Input value={formData.satuan} onChange={e => setFormData({ ...formData, satuan: e.target.value })} required />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isProcessing} className="bg-[#163832] text-white hover:bg-[#051F20]">
                {isProcessing ? 'Menyimpan...' : 'Simpan Data Barang'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG KONFIRMASI HAPUS */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-rose-600">Hapus Barang Ini?</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-slate-600 font-medium">
            Barang yang dihapus tidak akan muncul lagi di halaman pencarian kasir dan mekanik. Apakah Anda yakin?
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isProcessing}>
              {isProcessing ? 'Menghapus...' : 'Ya, Hapus Barang'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
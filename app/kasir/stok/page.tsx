'use client'

import { useState } from 'react'
import { useBarang, TBarang } from '@/hooks/use-barang'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Boxes, Search, Loader2, Edit2, Trash2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function StokPage() {
  const { 
    barang, isBarangLoading, 
    addBarang, isAddingBarang,
    updateBarang, isUpdatingBarang,
    deleteBarang, isDeletingBarang
  } = useBarang()
  
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  const initialFormState: TBarang = { nama: '', harga_beli: 0, harga_jual: 0, stok_fisik: 0, stok_minimum: 5 }
  const [formData, setFormData] = useState<TBarang>(initialFormState)

  const filteredBarang = barang?.filter(b => b.nama.toLowerCase().includes(search.toLowerCase()))

  const handleOpenCreate = () => {
    setFormData(initialFormState)
    setIsOpen(true)
  }

  const handleOpenEdit = (item: any) => {
    setFormData({
      id: item.id,
      nama: item.nama,
      harga_beli: item.harga_beli,
      harga_jual: item.harga_jual,
      stok_fisik: item.stok_fisik,
      stok_minimum: item.stok_minimum
    })
    setIsOpen(true)
  }

  const handleOpenDelete = (id: string) => {
    setSelectedId(id)
    setIsDeleteOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.harga_beli > formData.harga_jual) {
      toast.error('Harga jual tidak boleh lebih kecil dari harga beli.')
      return
    }

    try {
      if (formData.id) {
        await updateBarang(formData)
        toast.success('Data barang berhasil diperbarui!')
      } else {
        await addBarang(formData)
        toast.success('Barang baru berhasil ditambahkan ke katalog!')
      }
      setIsOpen(false)
    } catch (error) {
      toast.error('Gagal menyimpan data barang. Silakan coba kembali.')
    }
  }

  const handleDelete = async () => {
    if (!selectedId) return
    try {
      await deleteBarang(selectedId)
      toast.success('Barang telah dihapus dari sistem.')
      setIsDeleteOpen(false)
      setSelectedId(null)
    } catch (error) {
      toast.error('Gagal menghapus barang. Mungkin barang ini sedang digunakan di transaksi.')
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-light text-[#051F20] tracking-tight">Katalog <span className="font-bold">Barang</span></h1>
          <p className="text-[#235347] mt-1 text-sm font-medium">Manajemen stok sparepart dan pengaturan harga.</p>
        </div>

        <Button onClick={handleOpenCreate} className="bg-[#235347] hover:bg-[#0B2B26] text-white">
          <Plus className="w-4 h-4 mr-2" /> TAMBAH BARANG
        </Button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-[#051F20]">
                {formData.id ? 'Perbarui Data Barang' : 'Tambah Barang Baru'}
              </DialogTitle>
              <DialogDescription>Pastikan stok fisik sesuai dengan jumlah barang di gudang saat ini.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#163832] uppercase">Nama / Merek Sparepart</label>
                <Input required placeholder="Contoh: Oli Yamalube 800ml" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#163832] uppercase">Harga Modal (Rp)</label>
                  <Input type="number" required min="0" value={formData.harga_beli || ''} onChange={e => setFormData({ ...formData, harga_beli: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#163832] uppercase">Harga Jual (Rp)</label>
                  <Input type="number" required min="0" value={formData.harga_jual || ''} onChange={e => setFormData({ ...formData, harga_jual: Number(e.target.value) })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#163832] uppercase">Stok Awal Fisik</label>
                  <Input type="number" required min="0" value={formData.stok_fisik === 0 && !formData.id ? '' : formData.stok_fisik} onChange={e => setFormData({ ...formData, stok_fisik: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#163832] uppercase">Peringatan Stok Minimum</label>
                  <Input type="number" required min="1" value={formData.stok_minimum || ''} onChange={e => setFormData({ ...formData, stok_minimum: Number(e.target.value) })} />
                </div>
              </div>

              <Button type="submit" disabled={isAddingBarang || isUpdatingBarang} className="w-full bg-[#235347] text-white">
                {isAddingBarang || isUpdatingBarang ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isAddingBarang || isUpdatingBarang ? 'PROSES...' : 'SIMPAN BARANG'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> Hapus Barang</DialogTitle>
            <DialogDescription>Apakah Anda yakin ingin menghapus barang ini? Ini akan memengaruhi riwayat stok.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>BATAL</Button>
            <Button disabled={isDeletingBarang} onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              {isDeletingBarang ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'HAPUS BARANG'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-[#DAF1DE] shadow-sm">
        <CardHeader className="border-b border-[#DAF1DE]/50 pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center text-[#051F20]"><Boxes className="w-4 h-4 mr-2 text-[#8EB69B]" /> Daftar Stok</CardTitle>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Cari nama barang..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isBarangLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#8EB69B]" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="font-semibold text-[#163832]">Nama Barang</TableHead>
                  <TableHead className="font-semibold text-[#163832]">Harga Jual</TableHead>
                  <TableHead className="font-semibold text-[#163832] text-center">Stok Fisik</TableHead>
                  <TableHead className="font-semibold text-[#163832] text-center">Tersedia (Bisa Dijual)</TableHead>
                  <TableHead className="font-semibold text-[#163832] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBarang?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">Katalog kosong atau barang tidak ditemukan.</TableCell></TableRow>
                ) : (
                  filteredBarang?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-[#051F20]">{item.nama}</TableCell>
                      <TableCell className="text-[#163832]">Rp {item.harga_jual.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-center font-bold">{item.stok_fisik}</TableCell>
                      {/* Stok tersedia diambil otomatis dari Database (stok_fisik - stok_reserved) */}
                      <TableCell className="text-center text-green-700 font-bold">{item.stok_tersedia}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(item)} className="h-8 w-8 text-blue-600"><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDelete(item.id)} className="h-8 w-8 text-red-600"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
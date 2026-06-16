"use client"

import { useState } from 'react'
import { useKatalogJasa, KatalogJasa } from '@/hooks/use-katalog-jasa'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Search, Loader2, Plus, Edit, Trash2, Wrench } from 'lucide-react'
import { toast } from 'sonner'

export default function MasterJasaPage() {
  const { jasaList, isLoading, tambahJasa, updateJasa, hapusJasa, isProcessing } = useKatalogJasa()
  
  const [search, setSearch] = useState('')
  
  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // Form States
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ nama: '', harga: '' })
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // FORMATTER
  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0)
  
  const filteredJasa = jasaList.filter(j => j.nama_jasa.toLowerCase().includes(search.toLowerCase()))

  // HANDLERS
  const openAddDialog = () => {
    setEditingId(null)
    setFormData({ nama: '', harga: '' })
    setIsDialogOpen(true)
  }

  const openEditDialog = (jasa: KatalogJasa) => {
    setEditingId(jasa.id)
    setFormData({ nama: jasa.nama_jasa, harga: jasa.harga_jasa.toString() })
    setIsDialogOpen(true)
  }

  const openDeleteDialog = (id: string) => {
    setDeletingId(id)
    setIsDeleteDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nama || !formData.harga) return toast.error('Nama dan harga wajib diisi!')

    const payload = {
      nama_jasa: formData.nama,
      harga_jasa: Number(formData.harga)
    }

    try {
      if (editingId) {
        await updateJasa({ id: editingId, ...payload })
        toast.success('Harga jasa berhasil diperbarui!')
      } else {
        await tambahJasa(payload)
        toast.success('Jasa servis baru ditambahkan ke katalog!')
      }
      setIsDialogOpen(false)
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan')
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await hapusJasa(deletingId)
      toast.success('Jasa berhasil dihapus dari sistem.')
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.error('Gagal menghapus jasa. Pastikan jasa ini tidak sedang terpakai pada transaksi aktif.')
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#051F20] tracking-tight">Katalog Jasa Servis</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Kelola standar harga jasa agar merata di seluruh nota mekanik.</p>
        </div>
        <Button onClick={openAddDialog} className="bg-[#163832] hover:bg-[#051F20] text-white">
          <Plus className="w-4 h-4 mr-2" /> Tambah Jasa Baru
        </Button>
      </div>

      {/* KARTU DAFTAR JASA */}
      <Card className="border-[#DAF1DE] bg-white shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-sm font-bold text-[#051F20] flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#235347]" /> Master Data Jasa
          </CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Cari nama jasa..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9 h-10 bg-slate-50" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#235347]" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-semibold text-[#163832] pl-6 w-[10px]">No</TableHead>
                  <TableHead className="font-semibold text-[#163832]">Nama Jasa / Pengerjaan</TableHead>
                  <TableHead className="font-semibold text-[#163832] text-right">Tarif Harga (Rp)</TableHead>
                  <TableHead className="font-semibold text-[#163832] text-right pr-6 w-[120px]">Opsi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJasa.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">Katalog jasa tidak ditemukan.</TableCell>
                  </TableRow>
                ) : (
                  filteredJasa.map((jasa, index) => (
                    <TableRow key={jasa.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="pl-6 text-slate-500 font-medium">{index + 1}</TableCell>
                      <TableCell className="font-bold text-[#051F20]">{jasa.nama_jasa}</TableCell>
                      <TableCell className="text-right font-black text-[#235347]">{formatRupiah(jasa.harga_jasa)}</TableCell>
                      <TableCell className="text-right pr-6 space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(jasa)} className="text-blue-600 hover:bg-blue-50">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(jasa.id)} className="text-rose-600 hover:bg-rose-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* DIALOG TAMBAH/UBAH */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#051F20]">{editingId ? 'Ubah Tarif Jasa' : 'Tambah Jasa Baru'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#163832] uppercase">Nama Jasa (Katalog)</label>
              <Input 
                value={formData.nama} 
                onChange={e => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: Ganti Oli Mesin"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#163832] uppercase">Patokan Harga</label>
              <Input 
                type="number"
                value={formData.harga} 
                onChange={e => setFormData({ ...formData, harga: e.target.value })}
                placeholder="15000"
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isProcessing} className="bg-[#163832] text-white hover:bg-[#051F20]">
                {isProcessing ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG KONFIRMASI HAPUS */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-rose-600">Hapus Jasa Ini?</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-slate-600 font-medium">
            Jasa yang dihapus tidak akan bisa dipilih lagi oleh mekanik di sistem. Apakah Anda yakin?
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isProcessing}>
              {isProcessing ? 'Menghapus...' : 'Ya, Hapus Jasa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
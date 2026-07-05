"use client"

import { useState } from 'react'
import { useKatalogJasa, KatalogJasa } from '@/hooks/use-katalog-jasa'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
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

  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0)
  
  const filteredJasa = jasaList.filter(j => j.nama_jasa.toLowerCase().includes(search.toLowerCase()))

  const openAddDialog = () => {
    setEditingId(null)
    setFormData({ nama: '', harga: '' })
    setIsDialogOpen(true)
  }

  const openEditDialog = (jasa: KatalogJasa) => {
    setEditingId(jasa.id)
    setFormData({ nama: jasa.nama_jasa, harga: jasa.harga_dasar.toString()})
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
      harga_dasar: Number(formData.harga)
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
      toast.error('Gagal menghapus jasa. Pastikan jasa ini tidak terpakai pada transaksi aktif.')
    }
  }

  return (
    <div className="w-full space-y-6 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#051F20] tracking-tight">Katalog Master Jasa</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola standar harga dasar jasa untuk perhitungan otomatis di kasir.</p>
        </div>
        <Button onClick={openAddDialog} className="w-full sm:w-auto bg-[#235347] hover:bg-[#051F20] text-white shadow-sm h-10 rounded-lg">
          <Plus className="w-4 h-4 mr-2" /> Tambah Jasa Baru
        </Button>
      </div>

      <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="border-b border-[#E6DFD3] pb-4 pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white">
          <CardTitle className="text-sm font-semibold flex items-center text-[#051F20]">
            <Wrench className="w-4 h-4 mr-2 text-[#8EB69B]" /> Daftar Master Jasa
          </CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Cari nama jasa..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9 h-10 text-sm bg-slate-50 border border-[#E6DFD3] focus-visible:ring-1 focus-visible:ring-[#8EB69B] rounded-lg w-full" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto w-full">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#8EB69B]" /></div>
          ) : (
            <Table className="min-w-[600px]">
              <TableHeader className="bg-slate-50">
                <TableRow className="border-[#E6DFD3] hover:bg-transparent">
                  <TableHead className="font-medium text-slate-500 pl-6 w-16 text-xs">No</TableHead>
                  <TableHead className="font-medium text-slate-500 text-xs">Nama Jasa / Pengerjaan</TableHead>
                  <TableHead className="font-medium text-slate-500 text-right text-xs">Harga Dasar (Mudah)</TableHead>
                  <TableHead className="font-medium text-slate-500 text-right pr-6 w-28 text-xs">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJasa.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-400 text-sm">Katalog jasa tidak ditemukan.</TableCell></TableRow>
                ) : (
                  filteredJasa.map((jasa, index) => (
                    <TableRow key={jasa.id} className="hover:bg-slate-50 transition-colors border-[#E6DFD3]">
                      <TableCell className="pl-6 text-slate-500 font-medium text-sm">{index + 1}</TableCell>
                      <TableCell className="font-semibold text-[#051F20] text-sm">{jasa.nama_jasa}</TableCell>
                      <TableCell className="text-right font-semibold text-[#235347] text-sm">{formatRupiah(jasa.harga_dasar)}</TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(jasa)} className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(jasa.id)} className="h-8 w-8 text-rose-600 hover:bg-rose-50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] rounded-xl bg-white border border-[#E6DFD3] shadow-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#051F20]">
              {editingId ? 'Ubah Harga Jasa' : 'Tambah Jasa Baru'}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Harga dasar ini otomatis bertambah sesuai CC motor dan kesulitan pengerjaan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Nama Jasa (Katalog)</label>
              <Input 
                value={formData.nama} 
                onChange={e => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: Ganti Oli Mesin"
                className="h-10 bg-white border border-[#E6DFD3] shadow-sm rounded-lg focus-visible:ring-1 focus-visible:ring-[#8EB69B] text-sm text-[#051F20]" 
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Harga Dasar (Rp)</label>
              <Input 
                type="number"
                value={formData.harga} 
                onChange={e => setFormData({ ...formData, harga: e.target.value })}
                placeholder="15000"
                className="h-10 bg-white border border-[#E6DFD3] shadow-sm rounded-lg focus-visible:ring-1 focus-visible:ring-[#8EB69B] text-sm text-[#051F20]" 
                required
              />
            </div>
            <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" className="w-full sm:w-auto h-10 border-[#E6DFD3] text-[#051F20] rounded-lg" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isProcessing} className="w-full sm:w-auto h-10 bg-[#235347] text-white hover:bg-[#051F20] rounded-lg transition-all">
                {isProcessing ? 'Menyimpan...' : 'Simpan Data'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] rounded-xl border border-[#E6DFD3] shadow-sm bg-white">
          <DialogHeader>
            <DialogTitle className="text-rose-600 font-semibold text-lg">Hapus Jasa Ini?</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1.5">
              Jasa yang dihapus tidak akan bisa dipilih lagi oleh kasir pada transaksi baru.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto h-10 border-[#E6DFD3] text-[#051F20] rounded-lg" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isProcessing} className="w-full sm:w-auto h-10 bg-rose-600 hover:bg-rose-700 rounded-lg">
              {isProcessing ? 'Menghapus...' : 'Ya, Hapus Jasa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
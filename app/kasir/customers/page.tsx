'use client'

import { useState } from 'react'
import { useCustomers } from '@/hooks/use-customers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Users, Search, Loader2, Edit2, Trash2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function CustomersPage() {
  const { 
    customers, 
    isCustomersLoading, 
    addCustomer, 
    isAddingCustomer,
    updateCustomer,
    isUpdatingCustomer,
    deleteCustomer,
    isDeletingCustomer
  } = useCustomers()
  
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ id: '', nama: '', no_telp: '' })

  const filteredCustomers = customers?.filter(c => 
    c.nama.toLowerCase().includes(search.toLowerCase()) || 
    c.no_telp.includes(search)
  )

  const handleOpenCreate = () => {
    setFormData({ id: '', nama: '', no_telp: '' })
    setIsOpen(true)
  }

  const handleOpenEdit = (customer: { id: string; nama: string; no_telp: string }) => {
    setFormData({ id: customer.id, nama: customer.nama, no_telp: customer.no_telp })
    setIsOpen(true)
  }

  const handleOpenDelete = (id: string) => {
    setSelectedId(id)
    setIsDeleteOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nama || !formData.no_telp) {
      toast.error('Harap isi Nama dan Nomor WhatsApp pelanggan.')
      return
    }

    try {
      if (formData.id) {
        await updateCustomer(formData)
        toast.success('Data pelanggan berhasil diperbarui!')
      } else {
        await addCustomer({ nama: formData.nama, no_telp: formData.no_telp })
        toast.success('Pelanggan baru berhasil didaftarkan!')
      }
      setIsOpen(false)
      setFormData({ id: '', nama: '', no_telp: '' })
    } catch (error: any) {
      if (error.message === 'DUPLICATE_DATA') {
        toast.error('Nama (kembar) atau Nomor WhatsApp ini sudah terdaftar di sistem.')
      } else {
        toast.error('Gagal menyimpan data pelanggan.')
      }
    }
  }

  const handleDelete = async () => {
    if (!selectedId) return

    try {
      await deleteCustomer(selectedId)
      toast.success('Data pelanggan telah dihapus dari sistem.')
      setIsDeleteOpen(false)
      setSelectedId(null)
    } catch (error: any) {
      toast.error('Gagal menghapus data pelanggan. Data ini mungkin terikat dengan riwayat transaksi servis.')
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-light text-[#051F20] tracking-tight">Data <span className="font-bold">Pelanggan</span></h1>
          <p className="text-[#235347] mt-1 text-sm font-medium">Kelola informasi buku tamu dan WhatsApp pelanggan servis.</p>
        </div>

        {/* UPDATE: Tombol melebar di HP (w-full) dan menyesuaikan isi di tablet/desktop (sm:w-auto) */}
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto bg-[#235347] hover:bg-[#0B2B26] text-white">
          <Plus className="w-4 h-4 mr-2" />
          TAMBAH PELANGGAN
        </Button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md w-[95vw] rounded-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#051F20]">
                {formData.id ? 'Perbarui Data Pelanggan' : 'Daftarkan Pelanggan Baru'}
              </DialogTitle>
              <DialogDescription>
                {formData.id ? 'Ubah informasi detail nama atau nomor kontak pelanggan.' : 'Masukkan nama lengkap dan nomor WhatsApp aktif.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#163832] uppercase">Nama Lengkap</label>
                <Input 
                  placeholder="Contoh: Budi Santoso" 
                  value={formData.nama}
                  onChange={e => setFormData({ ...formData, nama: e.target.value })}
                  className="border-[#8EB69B]/30 focus-visible:ring-[#235347]"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#163832] uppercase">Nomor WhatsApp</label>
                <Input 
                  placeholder="Contoh: 081234567890" 
                  value={formData.no_telp}
                  onChange={e => setFormData({ ...formData, no_telp: e.target.value })}
                  className="border-[#8EB69B]/30 focus-visible:ring-[#235347]"
                  required
                />
              </div>
              <Button type="submit" disabled={isAddingCustomer || isUpdatingCustomer} className="w-full bg-[#235347] hover:bg-[#051F20] text-white">
                {isAddingCustomer || isUpdatingCustomer ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isAddingCustomer || isUpdatingCustomer ? 'PROSES...' : 'SIMPAN DATA'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Hapus Data Pelanggan
            </DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin menghapus pelanggan ini dari sistem?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsDeleteOpen(false)}>
              BATAL
            </Button>
            <Button disabled={isDeletingCustomer} onClick={handleDelete} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white">
              {isDeletingCustomer ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isDeletingCustomer ? 'MENGHAPUS...' : 'HAPUS DATA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-[#DAF1DE] shadow-sm overflow-hidden">
        {/* UPDATE: Header Card ditumpuk di HP, Search bar lebar penuh di HP */}
        <CardHeader className="border-b border-[#DAF1DE]/50 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-sm font-semibold flex items-center text-[#051F20]">
            <Users className="w-4 h-4 mr-2 text-[#8EB69B]" /> Daftar Pelanggan
          </CardTitle>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="Cari nama / no. WA..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-gray-50/50 w-full"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto w-full">
          {isCustomersLoading ? (
            <div className="flex justify-center items-center py-12 text-[#8EB69B]">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <Table className="min-w-[600px]">
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="font-semibold text-[#163832]">Nama Pelanggan</TableHead>
                  <TableHead className="font-semibold text-[#163832]">Nomor WhatsApp</TableHead>
                  <TableHead className="font-semibold text-[#163832]">Tanggal Terdaftar</TableHead>
                  <TableHead className="font-semibold text-[#163832] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      Tidak ada data pelanggan yang ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers?.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-medium text-[#051F20]">{customer.nama}</TableCell>
                      <TableCell className="text-[#163832]">{customer.no_telp}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(customer.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleOpenEdit(customer)}
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleOpenDelete(customer.id)}
                            className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
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
    </div>
  )
}
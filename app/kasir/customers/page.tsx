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

// COMPONENT_CUSTOMERS_PAGE
export default function CustomersPage() {
  const { 
    customers, isCustomersLoading, addCustomer, isAddingCustomer,
    updateCustomer, isUpdatingCustomer, deleteCustomer, isDeletingCustomer
  } = useCustomers()
  
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ id: '', nama: '', no_telp: '' })

  // FILTER_CUSTOMERS_STATE
  const filteredCustomers = customers?.filter(c => 
    c.nama.toLowerCase().includes(search.toLowerCase()) || 
    c.no_telp.includes(search) ||
    c.id?.toLowerCase().includes(search.toLowerCase())
  )

  // HANDLE_MODAL_CREATE
  const handleOpenCreate = () => {
    setFormData({ id: '', nama: '', no_telp: '' })
    setIsOpen(true)
  }

  // HANDLE_MODAL_EDIT
  const handleOpenEdit = (customer: { id: string; nama: string; no_telp: string }) => {
    setFormData({ id: customer.id, nama: customer.nama, no_telp: customer.no_telp })
    setIsOpen(true)
  }

  // HANDLE_MODAL_DELETE
  const handleOpenDelete = (id: string) => {
    setSelectedId(id)
    setIsDeleteOpen(true)
  }

  // HANDLE_SUBMIT_FORM
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
    } catch (error: any) {
      if (error.message === 'DUPLICATE_DATA') {
        toast.error('Nama atau Nomor WhatsApp ini sudah terdaftar.')
      } else {
        toast.error('Gagal menyimpan data pelanggan.')
      }
    }
  }

  // HANDLE_DELETE_CONFIRM
  const handleDelete = async () => {
    if (!selectedId) return
    try {
      await deleteCustomer(selectedId)
      toast.success('Data pelanggan telah dihapus.')
      setIsDeleteOpen(false)
    } catch (error: any) {
      toast.error('Gagal menghapus data pelanggan. Data terikat dengan transaksi.')
    }
  }

  // COMPONENT_RENDER
  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#051F20] tracking-tight">Database Pelanggan</h1>
          <p className="text-[#163832] mt-1 text-sm font-medium">Buku tamu dan manajemen ID Pelanggan Glorya Motor.</p>
        </div>

        <Button onClick={handleOpenCreate} className="w-full sm:w-auto bg-[#235347] hover:bg-[#0B2B26] text-white h-12 rounded-2xl font-black tracking-widest px-6 shadow-md">
          <Plus className="w-5 h-5 mr-2" />
          TAMBAH PELANGGAN BARU
        </Button>

        {/* COMPONENT_MODAL_FORM */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md w-[95vw] rounded-3xl bg-[#FAF7F2] border-0 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-[#051F20]">
                {formData.id ? 'Perbarui Data Pelanggan' : 'Daftarkan Pelanggan Baru'}
              </DialogTitle>
              <DialogDescription className="font-medium text-[#163832]">
                {formData.id ? `Mengubah data untuk ID: ${formData.id}` : 'ID Pelanggan (seperti AND123) akan dibuat otomatis oleh sistem.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 mt-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#163832] uppercase tracking-widest">Nama Lengkap</label>
                <Input 
                  placeholder="Contoh: Budi Santoso" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })}
                  className="h-14 bg-white border-0 shadow-sm rounded-2xl focus-visible:ring-2 focus-visible:ring-[#8EB69B] text-base font-bold text-[#051F20]" required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#163832] uppercase tracking-widest">Nomor WhatsApp Aktif</label>
                <Input 
                  placeholder="Contoh: 081234567890" value={formData.no_telp} onChange={e => setFormData({ ...formData, no_telp: e.target.value })}
                  className="h-14 bg-white border-0 shadow-sm rounded-2xl focus-visible:ring-2 focus-visible:ring-[#8EB69B] text-base font-bold text-[#051F20]" required
                />
              </div>
              <Button type="submit" disabled={isAddingCustomer || isUpdatingCustomer} className="w-full h-14 bg-[#235347] hover:bg-[#051F20] text-white rounded-2xl font-black tracking-widest mt-2 shadow-md">
                {isAddingCustomer || isUpdatingCustomer ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                {isAddingCustomer || isUpdatingCustomer ? 'MEMPROSES...' : 'SIMPAN KE DATABASE'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* COMPONENT_MODAL_DELETE */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] rounded-3xl border-0 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2 font-black text-xl">
              <AlertCircle className="w-6 h-6" /> Hapus Data Pelanggan
            </DialogTitle>
            <DialogDescription className="font-medium">Tindakan ini tidak dapat dibatalkan. Yakin hapus?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button variant="outline" className="w-full sm:w-auto h-12 rounded-xl font-bold" onClick={() => setIsDeleteOpen(false)}>BATAL</Button>
            <Button disabled={isDeletingCustomer} onClick={handleDelete} className="w-full sm:w-auto h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black tracking-widest shadow-md">
              {isDeletingCustomer ? 'MENGHAPUS...' : 'HAPUS DATA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* COMPONENT_TABLE_CUSTOMERS */}
      <Card className="bg-white border-0 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-[#E6DFD3]/50 pb-5 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#FAF7F2]">
          <CardTitle className="text-base font-black flex items-center text-[#051F20] tracking-wider uppercase">
            <Users className="w-5 h-5 mr-2 text-[#8EB69B]" /> Daftar Member Glorya
          </CardTitle>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Cari ID, Nama, atau WA..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-11 h-12 text-sm w-full bg-white border-0 shadow-sm focus-visible:ring-2 focus-visible:ring-[#8EB69B] rounded-2xl font-medium"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto w-full">
          {isCustomersLoading ? (
            <div className="flex justify-center items-center py-16 text-[#8EB69B]"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : (
            <Table className="min-w-[700px]">
              <TableHeader className="bg-white">
                <TableRow className="border-[#E6DFD3]/40">
                  <TableHead className="font-bold text-[#163832] pl-6">ID Member</TableHead>
                  <TableHead className="font-bold text-[#163832]">Nama Pelanggan</TableHead>
                  <TableHead className="font-bold text-[#163832]">Nomor WhatsApp</TableHead>
                  <TableHead className="font-bold text-[#163832]">Bergabung Sejak</TableHead>
                  <TableHead className="font-bold text-[#163832] text-right pr-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-400 font-medium">Tidak ada data pelanggan yang ditemukan.</TableCell></TableRow>
                ) : (
                  filteredCustomers?.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-[#FAF7F2] transition-colors border-[#E6DFD3]/40">
                      <TableCell className="font-black text-[#8EB69B] tracking-widest pl-6 py-4">{customer.id}</TableCell>
                      <TableCell className="font-black text-[#051F20] text-base">{customer.nama}</TableCell>
                      <TableCell className="text-[#163832] font-semibold">{customer.no_telp}</TableCell>
                      <TableCell className="text-sm font-medium text-slate-500">
                        {new Date(customer.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(customer)} className="h-10 w-10 text-blue-600 hover:bg-blue-100 rounded-xl"><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDelete(customer.id)} className="h-10 w-10 text-red-600 hover:bg-red-100 rounded-xl"><Trash2 className="w-4 h-4" /></Button>
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
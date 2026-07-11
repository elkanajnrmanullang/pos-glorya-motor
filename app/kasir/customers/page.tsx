'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useCustomers } from '@/hooks/use-customers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Users, Search, Loader2, Edit2, Trash2, AlertCircle, Eye, Activity, History } from 'lucide-react'
import { toast } from 'sonner'

// COMPONENT_CUSTOMER_DETAIL_MODAL
function CustomerDetailModal({ customerId, isOpen, onClose, customerName }: { customerId: string | null, isOpen: boolean, onClose: () => void, customerName: string }) {
  const supabase = createClient()

  const { data: detailData, isLoading } = useQuery({
    queryKey: ['customer-detail', customerId],
    queryFn: async () => {
      if (!customerId) return null

      const { data: kendaraan } = await supabase
        .from('kendaraan_pelanggan')
        .select('plat_nomor, master_motor(merk, model, cc)')
        .eq('customer_id', customerId)

      const { data: riwayat } = await supabase
        .from('tiket_servis')
        .select(`
          id, waktu_masuk, plat_motor, total_akhir, keluhan, status, saran_mekanik,
          tiket_jasa ( nama_jasa ),
          tiket_items ( qty, barang ( nama ) )
        `)
        .eq('customer_id', customerId)
        .eq('status', 'lunas')
        .order('waktu_masuk', { ascending: false })

      const totalPengeluaran = (riwayat || []).reduce((acc, curr) => acc + Number(curr.total_akhir || 0), 0)

      return {
        kendaraan: kendaraan || [],
        riwayat: riwayat || [],
        totalKunjungan: riwayat?.length || 0,
        totalPengeluaran
      }
    },
    enabled: !!customerId && isOpen
  })

  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col rounded-2xl bg-[#FAF7F2] border border-[#E6DFD3] shadow-sm p-0 gap-0">
        <div className="p-6 bg-white border-b border-[#E6DFD3] flex items-center gap-3">
          <Users className="w-5 h-5 text-[#8EB69B]" />
          <DialogTitle className="text-xl font-semibold text-[#051F20]">
            Profil Detail: {customerName}
          </DialogTitle>
          <DialogDescription className="hidden">Detail profil pelanggan</DialogDescription>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#8EB69B]" /></div>
          ) : !detailData ? (
            <div className="text-center py-8 text-slate-500 text-sm">Data tidak ditemukan.</div>
          ) : (
            <>
              {/* RINGKASAN ATAS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-white border border-[#E6DFD3] shadow-sm rounded-xl">
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                    <Activity className="w-6 h-6 text-[#8EB69B] mb-3" />
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Total Kunjungan</p>
                    <p className="text-3xl font-semibold text-[#051F20]">{detailData.totalKunjungan} <span className="text-sm font-medium text-slate-500">Kali</span></p>
                  </CardContent>
                </Card>
                <Card className="bg-white border border-[#E6DFD3] shadow-sm rounded-xl">
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                    <History className="w-6 h-6 text-[#8EB69B] mb-3" />
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Total Pembayaran (Omzet)</p>
                    <p className="text-3xl font-semibold text-[#051F20]">{formatRupiah(detailData.totalPengeluaran)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* DAFTAR KENDARAAN */}
              <div>
                <h3 className="text-sm font-semibold text-[#051F20] mb-3">Daftar Kendaraan Terdaftar</h3>
                {detailData.kendaraan.length === 0 ? (
                  <p className="text-sm text-slate-500 bg-white p-4 rounded-xl border border-[#E6DFD3]">Belum ada kendaraan yang diregistrasikan.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* TS ANY CAST & ARRAY CHECK AGAR BUILD VERCEL LOLOS */}
                    {detailData.kendaraan.map((mtr: any, idx: number) => {
                      const motor = Array.isArray(mtr.master_motor) ? mtr.master_motor[0] : mtr.master_motor;
                      return (
                        <div key={idx} className="bg-white p-4 rounded-xl border border-[#E6DFD3] flex items-center justify-between shadow-sm">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#051F20] text-sm">{motor?.merk} {motor?.model}</span>
                            <span className="text-xs text-slate-500 mt-0.5">{motor?.cc ? `${motor.cc}cc` : 'CC tidak diketahui'}</span>
                          </div>
                          <span className="px-3 py-1.5 bg-[#E1EFE6] text-[#235347] font-semibold text-xs rounded-md">{mtr.plat_nomor}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* RIWAYAT TRANSAKSI LENGKAP */}
              <div>
                <h3 className="text-sm font-semibold text-[#051F20] mb-3">Riwayat Kunjungan Servis & Transaksi</h3>
                {detailData.riwayat.length === 0 ? (
                  <p className="text-sm text-slate-500 bg-white p-4 rounded-xl border border-[#E6DFD3]">Belum ada riwayat transaksi lunas.</p>
                ) : (
                  <div className="space-y-4">
                    {detailData.riwayat.map((trx) => (
                      <div key={trx.id} className="bg-white p-6 rounded-xl shadow-sm border border-[#E6DFD3]">
                        {/* Header Riwayat (Tanggal, Plat, Total) */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 border-b border-[#E6DFD3] pb-4 gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-md">
                              {formatDate(trx.waktu_masuk)}
                            </span>
                            <span className="text-xs font-semibold text-[#235347] bg-[#E1EFE6] px-3 py-1.5 rounded-md">
                              {trx.plat_motor}
                            </span>
                          </div>
                          <span className="font-semibold text-[#051F20] text-lg">{formatRupiah(Number(trx.total_akhir))}</span>
                        </div>
                        
                        <div className="text-sm space-y-5">
                          {/* Keluhan & Saran Mekanik */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {trx.keluhan && (
                              <div>
                                <p className="font-semibold text-xs text-slate-500 uppercase tracking-wide mb-1.5">Keluhan Awal Konsumen</p>
                                <p className="text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-100 text-sm leading-relaxed">{trx.keluhan}</p>
                              </div>
                            )}
                            {trx.saran_mekanik && (
                              <div>
                                <p className="font-semibold text-xs text-slate-500 uppercase tracking-wide mb-1.5">Catatan & Saran Mekanik</p>
                                <p className="text-slate-700 bg-[#E1EFE6]/30 p-3.5 rounded-lg border border-[#8EB69B]/30 text-sm leading-relaxed">{trx.saran_mekanik}</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Daftar Pekerjaan & Suku Cadang */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div>
                              <p className="font-semibold text-xs text-slate-500 uppercase tracking-wide mb-2">Jasa Dikerjakan</p>
                              {trx.tiket_jasa?.length ? (
                                <ul className="list-disc pl-4 space-y-1 text-slate-700 text-sm">
                                  {trx.tiket_jasa.map((j: any, i: number) => <li key={i}>{j.nama_jasa}</li>)}
                                </ul>
                              ) : <span className="text-sm text-slate-400 italic bg-slate-50 px-3 py-2 rounded-lg block">Tidak ada jasa layanan</span>}
                            </div>
                            <div>
                              <p className="font-semibold text-xs text-slate-500 uppercase tracking-wide mb-2">Suku Cadang Diganti</p>
                              {trx.tiket_items?.length ? (
                                <ul className="list-disc pl-4 space-y-1 text-slate-700 text-sm">
                                  {trx.tiket_items.map((it: any, i: number) => <li key={i}>{it.barang?.nama} <span className="text-slate-400 text-xs ml-1">(x{it.qty})</span></li>)}
                                </ul>
                              ) : <span className="text-sm text-slate-400 italic bg-slate-50 px-3 py-2 rounded-lg block">Tidak ada pergantian suku cadang</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// COMPONENT_CUSTOMERS_PAGE
export default function CustomersPage() {
  const { 
    customers, isCustomersLoading, addCustomer, isAddingCustomer,
    updateCustomer, isUpdatingCustomer, deleteCustomer, isDeletingCustomer
  } = useCustomers()
  
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState<string>('')
  const [formData, setFormData] = useState({ id: '', nama: '', no_telp: '' })

  const filteredCustomers = customers?.filter(c => 
    c.nama.toLowerCase().includes(search.toLowerCase()) || 
    c.no_telp.includes(search) ||
    c.id?.toLowerCase().includes(search.toLowerCase())
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

  const handleOpenDetail = (id: string, nama: string) => {
    setSelectedId(id)
    setSelectedName(nama)
    setIsDetailOpen(true)
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
    } catch (error: any) {
      if (error.message === 'DUPLICATE_DATA') {
        toast.error('Nama atau Nomor WhatsApp ini sudah terdaftar.')
      } else {
        toast.error('Gagal menyimpan data pelanggan.')
      }
    }
  }

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

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#051F20] tracking-tight">Database Pelanggan</h1>
          <p className="text-slate-500 mt-1 text-sm">Buku tamu dan manajemen ID Pelanggan Glorya Motor.</p>
        </div>

        <Button onClick={handleOpenCreate} className="w-full sm:w-auto bg-[#235347] hover:bg-[#0B2B26] text-white h-10 rounded-lg font-medium px-4 shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Pelanggan Baru
        </Button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md w-[95vw] rounded-xl bg-[#FAF7F2] border border-[#E6DFD3] shadow-sm">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-[#051F20]">
                {formData.id ? 'Perbarui Data Pelanggan' : 'Daftarkan Pelanggan Baru'}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                {formData.id ? `Mengubah data untuk ID: ${formData.id}` : 'ID Pelanggan akan dibuat otomatis.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Nama Lengkap</label>
                <Input 
                  placeholder="Contoh: Budi Santoso" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })}
                  className="h-10 bg-white border border-[#E6DFD3] shadow-sm rounded-lg focus-visible:ring-1 focus-visible:ring-[#8EB69B] text-sm text-[#051F20]" required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Nomor WhatsApp Aktif</label>
                <Input 
                  placeholder="Contoh: 081234567890" value={formData.no_telp} onChange={e => setFormData({ ...formData, no_telp: e.target.value })}
                  className="h-10 bg-white border border-[#E6DFD3] shadow-sm rounded-lg focus-visible:ring-1 focus-visible:ring-[#8EB69B] text-sm text-[#051F20]" required
                />
              </div>
              <Button type="submit" disabled={isAddingCustomer || isUpdatingCustomer} className="w-full h-10 bg-[#235347] hover:bg-[#051F20] text-white rounded-lg font-medium mt-2 shadow-sm transition-all">
                {isAddingCustomer || isUpdatingCustomer ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isAddingCustomer || isUpdatingCustomer ? 'Memproses...' : 'Simpan Data'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] rounded-xl border border-[#E6DFD3] shadow-sm bg-white">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2 font-semibold text-lg">
              <AlertCircle className="w-5 h-5" /> Hapus Data Pelanggan
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">Tindakan ini tidak dapat dibatalkan. Yakin hapus?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button variant="outline" className="w-full sm:w-auto h-10 rounded-lg font-medium border-[#E6DFD3] text-[#051F20]" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
            <Button disabled={isDeletingCustomer} onClick={handleDelete} className="w-full sm:w-auto h-10 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-sm">
              {isDeletingCustomer ? 'Menghapus...' : 'Hapus Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CustomerDetailModal customerId={selectedId} customerName={selectedName} isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} />

      <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="border-b border-[#E6DFD3] pb-4 pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white">
          <CardTitle className="text-sm font-semibold flex items-center text-[#051F20]">
            <Users className="w-4 h-4 mr-2 text-[#8EB69B]" /> Daftar Member Glorya
          </CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Cari ID, Nama, atau WA..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10 text-sm w-full bg-slate-50 border border-[#E6DFD3] focus-visible:ring-1 focus-visible:ring-[#8EB69B] rounded-lg"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto w-full">
          {isCustomersLoading ? (
            <div className="flex justify-center items-center py-16 text-[#8EB69B]"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : (
            <Table className="min-w-[700px]">
              <TableHeader className="bg-slate-50">
                <TableRow className="border-[#E6DFD3] hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-500 pl-6 text-xs">ID Member</TableHead>
                  <TableHead className="font-semibold text-slate-500 text-xs">Nama Pelanggan</TableHead>
                  <TableHead className="font-semibold text-slate-500 text-xs">Nomor WhatsApp</TableHead>
                  <TableHead className="font-semibold text-slate-500 text-xs">Bergabung Sejak</TableHead>
                  <TableHead className="font-semibold text-slate-500 text-right pr-6 text-xs">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-400 text-sm">Tidak ada data pelanggan yang ditemukan.</TableCell></TableRow>
                ) : (
                  filteredCustomers?.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-slate-50 transition-colors border-[#E6DFD3]">
                      <TableCell className="font-semibold text-[#8EB69B] pl-6 py-4 text-sm">{customer.id}</TableCell>
                      <TableCell className="font-semibold text-[#051F20] text-sm">{customer.nama}</TableCell>
                      <TableCell className="text-slate-600 text-sm">{customer.no_telp}</TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {new Date(customer.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDetail(customer.id, customer.nama)} className="h-8 w-8 text-[#235347] hover:bg-[#E1EFE6] rounded-lg"><Eye className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(customer)} className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDelete(customer.id)} className="h-8 w-8 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></Button>
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
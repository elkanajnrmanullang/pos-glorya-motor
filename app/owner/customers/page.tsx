"use client"

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Search, Loader2, Users, Eye, Activity, History } from 'lucide-react'

// COMPONENT DETAIL POPUP (Sama persis seperti desain clean Kasir)
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
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Total Omzet Customer</p>
                    <p className="text-3xl font-semibold text-[#051F20]">{formatRupiah(detailData.totalPengeluaran)}</p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#051F20] mb-3">Daftar Kendaraan Terdaftar</h3>
                {detailData.kendaraan.length === 0 ? (
                  <p className="text-sm text-slate-500 bg-white p-4 rounded-xl border border-[#E6DFD3]">Belum ada kendaraan yang diregistrasikan.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

              <div>
                <h3 className="text-sm font-semibold text-[#051F20] mb-3">Riwayat Transaksi Servis</h3>
                {detailData.riwayat.length === 0 ? (
                  <p className="text-sm text-slate-500 bg-white p-4 rounded-xl border border-[#E6DFD3]">Belum ada riwayat transaksi lunas.</p>
                ) : (
                  <div className="space-y-4">
                    {detailData.riwayat.map((trx) => (
                      <div key={trx.id} className="bg-white p-6 rounded-xl shadow-sm border border-[#E6DFD3]">
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

export default function OwnerCustomersPage() {
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState<string>('')

  // FETCH CUSTOMERS LANGSUNG (READ-ONLY)
  const { data: customers, isLoading } = useQuery({
    queryKey: ['owner-customers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })

  const filteredCustomers = customers?.filter(c => 
    c.nama.toLowerCase().includes(search.toLowerCase()) || 
    c.no_telp.includes(search) ||
    c.id.toLowerCase().includes(search.toLowerCase())
  ) || []

  const handleOpenDetail = (id: string, nama: string) => {
    setSelectedId(id)
    setSelectedName(nama)
    setIsDetailOpen(true)
  }

  return (
    <div className="w-full space-y-6 pb-12 font-sans">
      <div>
        <h1 className="text-2xl font-semibold text-[#051F20] tracking-tight">Database Pelanggan</h1>
        <p className="text-slate-500 text-sm mt-1">Pantau seluruh database member dan riwayat omzet konsumen.</p>
      </div>

      <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="border-b border-[#E6DFD3] pb-4 pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white">
          <CardTitle className="text-sm font-semibold flex items-center text-[#051F20]">
            <Users className="w-4 h-4 mr-2 text-[#8EB69B]" /> Daftar Konsumen Aktif
          </CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Cari ID, Nama, atau No. HP..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10 text-sm bg-slate-50 border border-[#E6DFD3] focus-visible:ring-1 focus-visible:ring-[#8EB69B] rounded-lg w-full"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto w-full">
          {isLoading ? (
            <div className="flex justify-center items-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#8EB69B]" /></div>
          ) : (
            <Table className="min-w-[700px]">
              <TableHeader className="bg-slate-50">
                <TableRow className="border-[#E6DFD3] hover:bg-transparent">
                  <TableHead className="font-medium text-slate-500 pl-6 text-xs w-32">ID Member</TableHead>
                  <TableHead className="font-medium text-slate-500 text-xs">Nama Pelanggan</TableHead>
                  <TableHead className="font-medium text-slate-500 text-xs">Nomor WhatsApp</TableHead>
                  <TableHead className="font-medium text-slate-500 text-xs">Tgl Daftar</TableHead>
                  <TableHead className="font-medium text-slate-500 text-right pr-6 w-24 text-xs">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-400 text-sm">Tidak ada data pelanggan yang ditemukan.</TableCell></TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-slate-50 transition-colors border-[#E6DFD3]">
                      <TableCell className="font-semibold text-[#8EB69B] pl-6 py-4 text-sm">{customer.id}</TableCell>
                      <TableCell className="font-semibold text-[#051F20] text-sm">{customer.nama}</TableCell>
                      <TableCell className="text-slate-600 text-sm">{customer.no_telp}</TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {new Date(customer.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleOpenDetail(customer.id, customer.nama)} 
                          className="h-8 text-xs font-semibold text-[#235347] border-[#E6DFD3] hover:bg-[#E1EFE6] rounded-lg shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> Lihat Detail
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

      <CustomerDetailModal customerId={selectedId} customerName={selectedName} isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} />
    </div>
  )
}
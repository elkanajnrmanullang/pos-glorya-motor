"use client"

import { useState } from 'react'
import { useKaryawan, Karyawan } from '@/hooks/use-karyawan'
import { buatAkunKaryawan } from './actions'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2, Users, Plus, Edit, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

export default function ManajemenKaryawanPage() {
  const { karyawanList, isLoading, updateKaryawan, isUpdating } = useKaryawan()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [editingData, setEditingData] = useState<{ id: string; full_name: string; role: string } | null>(null)

  const filteredKaryawan = karyawanList.filter(k => 
    k.full_name.toLowerCase().includes(search.toLowerCase()) || 
    k.role.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    
    const result = await buatAkunKaryawan(formData)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Akun Karyawan baru berhasil didaftarkan!')
      queryClient.invalidateQueries({ queryKey: ['owner-daftar-karyawan'] })
      setIsAddOpen(false)
    }
    setIsSubmitting(false)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingData) return
    try {
      await updateKaryawan(editingData)
      toast.success('Data profil karyawan diperbarui.')
      setIsEditOpen(false)
    } catch {
      toast.error('Gagal memperbarui profil.')
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#051F20] tracking-tight">Akun Karyawan</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Kelola akses sistem untuk kasir dan mekanik Anda.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-[#163832] hover:bg-[#051F20] text-white shadow-md">
          <Plus className="w-4 h-4 mr-2" /> Pendaftaran Akun Baru
        </Button>
      </div>

      <Card className="border-[#DAF1DE] bg-white shadow-sm overflow-hidden">
        <CardHeader className="border-b border-[#DAF1DE]/50 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-sm font-bold flex items-center text-[#051F20]">
            <Users className="w-5 h-5 mr-2 text-[#235347]" /> Daftar Tim Glorya Motor
          </CardTitle>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="Cari nama karyawan..." 
              value={search} onChange={e => setSearch(e.target.value)} 
              className="pl-9 h-10 text-sm bg-slate-50" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto w-full">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#235347]" /></div>
          ) : (
            <Table className="min-w-[600px]">
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold text-[#163832] pl-6">Nama Karyawan</TableHead>
                  <TableHead className="font-bold text-[#163832]">Hak Akses (Role)</TableHead>
                  <TableHead className="font-bold text-[#163832]">Tanggal Bergabung</TableHead>
                  <TableHead className="font-bold text-[#163832] text-right pr-6 w-[100px]">Opsi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKaryawan.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-500 font-medium">Data tidak ditemukan.</TableCell></TableRow>
                ) : (
                  filteredKaryawan.map((user) => (
                    <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="pl-6 font-bold text-[#051F20]">{user.full_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-bold uppercase tracking-wider text-[10px] ${
                          user.role === 'owner' ? 'bg-slate-900 text-white border-slate-900' :
                          user.role === 'kasir' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 font-medium">
                        {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button 
                          variant="ghost" size="icon" 
                          onClick={() => { setEditingData({ id: user.id, full_name: user.full_name, role: user.role }); setIsEditOpen(true); }}
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
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

      {/* DIALOG TAMBAH AKUN */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#051F20]">Daftarkan Akun Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] font-semibold text-amber-800 leading-tight">Akun langsung aktif. Kasir atau Mekanik bisa langsung menggunakan Email dan Kata Sandi ini untuk Login.</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#163832] uppercase">Nama Lengkap</label>
              <Input name="fullName" placeholder="Masukkan nama..." required className="border-[#8EB69B]/40 focus-visible:ring-[#235347]" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#163832] uppercase">Email Login</label>
              <Input type="email" name="email" placeholder="karyawan@gloryamotor.com" required className="border-[#8EB69B]/40 focus-visible:ring-[#235347]" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#163832] uppercase">Kata Sandi Akses</label>
              <Input type="password" name="password" placeholder="Minimal 6 karakter..." required minLength={6} className="border-[#8EB69B]/40 focus-visible:ring-[#235347]" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#163832] uppercase">Hak Akses (Role)</label>
              <select name="role" required className="flex h-10 w-full rounded-md border border-[#8EB69B]/40 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#235347]">
                <option value="kasir">Kasir (Transaksi & Laporan)</option>
                <option value="mekanik">Mekanik (Panel Pengerjaan)</option>
              </select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#163832] text-white hover:bg-[#051F20]">
                {isSubmitting ? 'Membuat Akun...' : 'Daftarkan Akun'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG EDIT PROFIL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#051F20]">Edit Profil Karyawan</DialogTitle>
          </DialogHeader>
          {editingData && (
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#163832] uppercase">Nama Lengkap</label>
                <Input 
                  value={editingData.full_name} 
                  onChange={e => setEditingData({ ...editingData, full_name: e.target.value })}
                  required className="border-[#8EB69B]/40" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#163832] uppercase">Hak Akses (Role)</label>
                <select 
                  value={editingData.role}
                  onChange={e => setEditingData({ ...editingData, role: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-[#8EB69B]/40 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#235347]"
                >
                  <option value="kasir">Kasir</option>
                  <option value="mekanik">Mekanik</option>
                  <option value="owner">Owner / Pemilik</option>
                </select>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
                <Button type="submit" disabled={isUpdating} className="bg-[#163832] text-white hover:bg-[#051F20]">
                  {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
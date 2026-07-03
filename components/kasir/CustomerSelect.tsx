"use client"

import { useState, useRef, useEffect } from 'react'
import { useCreateCustomer, Customer } from '@/hooks/use-customers'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { UserPlus, Search, Check, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

interface CustomerSelectProps {
  onSelect: (customer: Customer | null) => void
  selectedCustomer: Customer | null
}

export function CustomerSelect({ onSelect, selectedCustomer }: CustomerSelectProps) {
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [newNama, setNewNama] = useState('')
  const [newPhone, setNewPhone] = useState('')

  // FETCH CUSTOMERS INLINE
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['customers', searchTerm],
    queryFn: async () => {
      let q = supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(10)
      if (searchTerm.length > 0) {
        q = q.or(`nama.ilike.%${searchTerm}%,no_telp.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`)
      }
      const { data, error } = await q
      if (error) throw error
      return data as Customer[]
    }
  })

  const createCustomer = useCreateCustomer()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [wrapperRef])

  const handleCreateNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newNama || !newPhone) {
      toast.error('Nama dan Nomor HP wajib diisi')
      return
    }

    try {
      const newCust = await createCustomer.mutateAsync({
        nama: newNama,
        no_telp: newPhone
      })
      toast.success('Customer berhasil didaftarkan')
      onSelect(newCust)
      setIsModalOpen(false)
      setSearchTerm('')
      setIsOpen(false)
      setNewNama('')
      setNewPhone('')
    } catch (error: any) {
      toast.error(error.message || 'Gagal mendaftarkan customer. Nomor HP mungkin sudah terdaftar.')
    }
  }

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {selectedCustomer ? (
        <div className="flex items-center justify-between p-3 bg-[#E1EFE6]/40 border border-[#8EB69B] rounded-lg">
          <div>
            <p className="text-sm font-bold text-[#051F20]">{selectedCustomer.nama} <span className="text-[#8EB69B]">({selectedCustomer.id})</span></p>
            <p className="text-xs font-medium text-[#163832] mt-0.5">{selectedCustomer.no_telp}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onSelect(null)}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2"
          >
            <X className="w-4 h-4 mr-1" /> Ganti
          </Button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8EB69B]" />
          <Input
            type="text"
            placeholder="Cari ID, Nama, atau No. HP..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            onClick={() => setIsOpen(true)}
            className="pl-9 border-[#8EB69B]/40 focus-visible:ring-[#235347] bg-white text-[#051F20]"
          />

          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-[#E6DFD3] rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center p-4 text-sm text-[#8EB69B]">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Memuat...
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                <ul className="py-1">
                  {searchResults.map((cust) => (
                    <li 
                      key={cust.id}
                      onClick={() => {
                        onSelect(cust)
                        setIsOpen(false)
                        setSearchTerm('')
                      }}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-[#FAF7F2] cursor-pointer border-b border-slate-50 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-bold text-[#051F20]">{cust.nama} <span className="text-xs text-[#8EB69B]">({cust.id})</span></p>
                        <p className="text-xs text-[#163832]">{cust.no_telp}</p>
                      </div>
                      <Check className="w-4 h-4 text-[#235347] opacity-0 hover:opacity-100" />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-sm text-[#163832] mb-3">Customer tidak ditemukan.</p>
                </div>
              )}
              
              <div className="p-2 border-t border-[#E6DFD3] bg-[#FAF7F2]">
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full text-xs font-bold text-[#235347] border-[#8EB69B] hover:bg-[#E1EFE6]"
                  onClick={() => setIsModalOpen(true)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Daftarkan Customer Baru
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#FAF7F2] border-[#E6DFD3]">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#051F20]">Daftar Customer Baru</DialogTitle>
            <DialogDescription className="hidden">Isi form berikut.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateNewCustomer} className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#163832] uppercase">Nama Lengkap</label>
              <Input 
                required
                value={newNama}
                onChange={(e) => setNewNama(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="border-[#8EB69B]/40 focus-visible:ring-[#235347] bg-white text-[#051F20]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#163832] uppercase">Nomor HP / WhatsApp</label>
              <Input 
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="border-[#8EB69B]/40 focus-visible:ring-[#235347] bg-white text-[#051F20]"
              />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="text-[#163832]">Batal</Button>
              <Button type="submit" disabled={createCustomer.isPending} className="bg-[#235347] hover:bg-[#051F20] text-white">
                {createCustomer.isPending ? 'Menyimpan...' : 'Simpan & Pilih'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSesiKasir } from '@/hooks/use-sesi-kasir'
import { useSearchBarangPOS, useCheckoutTakeaway } from '@/hooks/use-takeaway'
import { Customer } from '@/hooks/use-customers'
import { CustomerSelect } from '@/components/kasir/CustomerSelect'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ShoppingBag, Plus, Minus, Trash2, Printer, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

// Interface Keranjang
interface CartItem {
  id: string
  nama: string
  harga_jual: number
  qty: number
  maxQty: number
}

export default function TakeawayPOSPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id)
    }
    getUser()
  }, [supabase])

  const { sesiAktif, isSesiLoading } = useSesiKasir(userId)
  const checkoutMutation = useCheckoutTakeaway()

  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [metodeBayar, setMetodeBayar] = useState<'tunai' | 'qris' | 'transfer'>('tunai')
  const [uangDibayar, setUangDibayar] = useState<number>(0)
  const [trxSukses, setTrxSukses] = useState<any>(null)

  // Query Pencarian Barang
  const { data: searchResults, isLoading: isSearching } = useSearchBarangPOS(searchTerm)

  // Manajemen Keranjang
  const addToCart = (barang: any) => {
    const tersedia = barang.stok_fisik - barang.stok_reserved
    if (tersedia <= 0) return

    setCart(prev => {
      const existing = prev.find(item => item.id === barang.id)
      if (existing) {
        if (existing.qty >= tersedia) {
          toast.error('Stok maksimal tercapai')
          return prev
        }
        return prev.map(item => item.id === barang.id ? { ...item, qty: item.qty + 1 } : item)
      }
      return [...prev, {
        id: barang.id,
        nama: barang.nama,
        harga_jual: barang.harga_jual,
        qty: 1,
        maxQty: tersedia
      }]
    })
    setSearchTerm('')
  }

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta
        if (newQty > 0 && newQty <= item.maxQty) return { ...item, qty: newQty }
      }
      return item
    }))
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  // Kalkulasi Total
  const totalAkhir = cart.reduce((acc, item) => acc + (item.harga_jual * item.qty), 0)
  const kembalian = uangDibayar - totalAkhir

  // Fungsi Submit Pembayaran
  const handleCheckout = async () => {
    if (!sesiAktif) return toast.error('Sesi kasir tidak aktif')
    if (cart.length === 0) return toast.error('Keranjang kosong')
    if (metodeBayar === 'tunai' && uangDibayar < totalAkhir) return toast.error('Uang tunai kurang')

    try {
      const result = await checkoutMutation.mutateAsync({
        kasir_id: userId!,
        sesi_id: sesiAktif.id,
        cabang_id: sesiAktif.cabang_id,
        customer_id: selectedCustomer?.id || null,
        metode_bayar: metodeBayar,
        total: totalAkhir,
        items: cart
      })
      
      setTrxSukses(result)
      toast.success('Transaksi Takeaway Berhasil!')
      setCart([])
      setUangDibayar(0)
      setSelectedCustomer(null)
    } catch (error: any) {
      toast.error(error.message || 'Gagal memproses transaksi')
    }
  }

  // Reset Form untuk Transaksi Baru
  const handleTransaksiBaru = () => {
    setTrxSukses(null)
    setMetodeBayar('tunai')
  }

  // Format Ribuan Input Kasir
  const formatInputRibuan = (val: number) => val ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ''
  const parseInputRibuan = (val: string) => isNaN(parseInt(val.replace(/[^0-9]/g, ''), 10)) ? 0 : parseInt(val.replace(/[^0-9]/g, ''), 10)
  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

  if (isSesiLoading) return <div className="p-8 text-[#163832]">Memuat POS Takeaway...</div>

  // Layar Sukses Transaksi
  if (trxSukses) {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 bg-white border border-emerald-200 rounded-2xl shadow-sm text-center space-y-6">
        <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto" />
        <div>
          <h2 className="text-2xl font-black text-[#051F20]">Pembayaran Lunas!</h2>
          <p className="text-slate-500 mt-1">Struk {trxSukses.nomor_struk}</p>
        </div>
        <div className="p-4 bg-emerald-50 rounded-xl text-emerald-900 font-bold text-xl">
          Total: {formatRupiah(trxSukses.total)}
        </div>
        <div className="grid gap-3 pt-4">
          <Button className="h-12 w-full bg-[#051F20] hover:bg-black font-bold tracking-widest text-white">
            <Printer className="w-4 h-4 mr-2" /> CETAK STRUK THERMAL
          </Button>
          <Button variant="outline" className="h-12 w-full border-[#8EB69B] text-[#235347] font-bold" onClick={handleTransaksiBaru}>
            TRANSAKSI BARU
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#051F20] flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-[#8EB69B]" />
          POS Penjualan Takeaway
        </h2>
        <p className="text-sm text-[#163832] mt-1">Pembelian sparepart & aksesoris tanpa layanan servis mekanik.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* Kiri: Katalog & Pencarian Barang */}
        <Card className="lg:col-span-7 bg-[#FAF7F2] border-[#E6DFD3] min-h-[600px] flex flex-col">
          <CardHeader className="border-b border-[#E6DFD3]/60 bg-white/40 pb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8EB69B]" />
              <Input
                type="text"
                placeholder="Scan atau ketik nama barang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-base sm:text-lg border-[#8EB69B]/40 focus-visible:ring-[#235347] bg-white text-[#051F20] shadow-sm rounded-xl w-full"
                autoFocus
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 overflow-y-auto">
            {isSearching ? (
              <div className="text-center py-8 text-[#163832]">Memuat katalog barang...</div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {searchResults.map(b => (
                  <div 
                    key={b.id} 
                    onClick={() => addToCart(b)}
                    className="p-4 bg-white border border-[#E6DFD3] hover:border-[#8EB69B] hover:shadow-md cursor-pointer rounded-xl transition-all flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-[#051F20]">{b.nama}</h4>
                      <p className="text-xs text-slate-500 mb-2">{b.barcode || 'Tanpa Barcode'}</p>
                    </div>
                    <div className="flex justify-between items-end mt-3">
                      <span className="font-black text-[#235347]">{formatRupiah(b.harga_jual)}</span>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">Fisik: {b.stok_fisik}</span>
                        <span className="text-xs font-bold bg-[#E1EFE6] text-[#163832] px-2 py-1 rounded">Tersedia: {b.stok_fisik - b.stok_reserved}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[#8EB69B] opacity-60">
                <ShoppingBag className="w-16 h-16 mb-4" />
                <p className="font-medium text-center">
                  {searchTerm ? 'Barang tidak ditemukan atau stok sedang kosong.' : 'Katalog kosong atau stok habis.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kanan: Keranjang & Pembayaran */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Opsi Customer */}
          <Card className="bg-[#FAF7F2] border-[#E6DFD3] overflow-visible">
            <CardContent className="p-4 space-y-2">
              <label className="text-xs font-bold text-[#163832] uppercase flex justify-between">
                <span>Pelanggan (Opsional)</span>
              </label>
              <CustomerSelect 
                selectedCustomer={selectedCustomer} 
                onSelect={setSelectedCustomer} 
              />
            </CardContent>
          </Card>

          {/* Keranjang Belanja */}
          <Card className="bg-[#FAF7F2] border-[#E6DFD3]">
            <CardHeader className="py-3 border-b border-[#E6DFD3]/60 bg-white/40">
              <CardTitle className="text-sm font-bold text-[#051F20]">Keranjang ({cart.length} Item)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[300px] overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">Keranjang masih kosong</div>
                ) : (
                  <div className="divide-y divide-[#E6DFD3]/60">
                    {cart.map(item => (
                      <div key={item.id} className="p-4 bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div className="flex-1">
                          <p className="font-bold text-[#051F20] text-sm leading-tight">{item.nama}</p>
                          <p className="font-semibold text-[#235347] text-xs mt-1">{formatRupiah(item.harga_jual)}</p>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-0 pt-2 sm:pt-0 border-slate-100">
                          <div className="flex items-center bg-[#E1EFE6] rounded-lg">
                            <button onClick={() => updateQty(item.id, -1)} className="p-2 sm:p-1.5 text-[#235347] hover:bg-[#8EB69B]/30 rounded-l-lg"><Minus className="w-4 h-4" /></button>
                            <span className="w-10 sm:w-8 text-center font-bold text-sm text-[#051F20]">{item.qty}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="p-2 sm:p-1.5 text-[#235347] hover:bg-[#8EB69B]/30 rounded-r-lg"><Plus className="w-4 h-4" /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="p-2 sm:p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-5 h-5 sm:w-4 sm:h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Eksekusi Bayar */}
              <div className="p-4 border-t border-[#E6DFD3]/60 bg-white space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-[#163832]">TOTAL TAGIHAN</span>
                  <span className="text-2xl font-black text-[#051F20]">{formatRupiah(totalAkhir)}</span>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <Button type="button" variant={metodeBayar === 'tunai' ? 'default' : 'outline'} className={`text-xs h-10 font-bold ${metodeBayar === 'tunai' ? 'bg-[#235347] text-white hover:bg-[#051F20]' : 'border-[#8EB69B]/40 text-[#163832]'}`} onClick={() => setMetodeBayar('tunai')}>CASH</Button>
                    <Button type="button" variant={metodeBayar === 'qris' ? 'default' : 'outline'} className={`text-xs h-10 font-bold ${metodeBayar === 'qris' ? 'bg-[#235347] text-white hover:bg-[#051F20]' : 'border-[#8EB69B]/40 text-[#163832]'}`} onClick={() => setMetodeBayar('qris')}>QRIS</Button>
                    <Button type="button" variant={metodeBayar === 'transfer' ? 'default' : 'outline'} className={`text-xs h-10 font-bold ${metodeBayar === 'transfer' ? 'bg-[#235347] text-white hover:bg-[#051F20]' : 'border-[#8EB69B]/40 text-[#163832]'}`} onClick={() => setMetodeBayar('transfer')}>BANK</Button>
                  </div>
                </div>

                {metodeBayar === 'tunai' && (
                  <div className="space-y-1.5 pt-2 border-t border-[#E6DFD3]/60">
                    <label className="text-xs font-bold text-[#163832] uppercase">Uang Diterima</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-semibold">Rp</span>
                      <Input 
                        type="text"
                        value={formatInputRibuan(uangDibayar)}
                        onChange={(e) => setUangDibayar(parseInputRibuan(e.target.value))}
                        placeholder="0"
                        className="pl-9 h-12 font-bold text-lg bg-[#FAF7F2] text-[#051F20] border-[#8EB69B]/50 focus-visible:ring-[#235347] w-full"
                      />
                    </div>
                    {uangDibayar >= totalAkhir && totalAkhir > 0 && (
                      <div className="flex justify-between items-center text-sm pt-1">
                        <span className="font-semibold text-[#163832]">Kembalian:</span>
                        <span className="font-black text-emerald-600">{formatRupiah(kembalian)}</span>
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || checkoutMutation.isPending || (metodeBayar === 'tunai' && uangDibayar < totalAkhir)}
                  className="w-full h-14 mt-4 font-black tracking-widest bg-[#235347] hover:bg-[#051F20] text-white shadow-md"
                >
                  {checkoutMutation.isPending ? 'MEMPROSES...' : 'BAYAR LUNAS & POTONG STOK'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
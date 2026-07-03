"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { useSesiKasir } from '@/hooks/use-sesi-kasir'
import { useCheckoutTakeaway } from '@/hooks/use-takeaway'
import { Customer } from '@/hooks/use-customers'
import { CustomerSelect } from '@/components/kasir/CustomerSelect'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ShoppingBag, Plus, Minus, Trash2, Printer, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface CartItem {
  id: string
  nama: string
  harga_jual: number
  qty: number
  maxQty: number
}

// COMPONENT_TAKEAWAY_POS_PAGE
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

  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [metodeBayar, setMetodeBayar] = useState<'tunai' | 'qris' | 'transfer'>('tunai')
  const [uangDibayar, setUangDibayar] = useState<number>(0)
  const [trxSukses, setTrxSukses] = useState<any>(null)

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['katalog-takeaway', searchTerm],
    queryFn: async () => {
      let q = supabase.from('barang').select('*').eq('aktif', true).order('nama')
      if (searchTerm) {
        q = q.or(`nama.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
      } else {
        q = q.limit(20)
      }
      const { data, error } = await q
      if (error) throw error
      return data || []
    }
  })

  const addToCart = (barang: any) => {
    const tersedia = barang.stok_fisik - barang.stok_reserved
    if (tersedia <= 0) return

    setCart(prev => {
      const existing = prev.find(item => item.id === barang.id || item.id === barang.sku)
      if (existing) {
        if (existing.qty >= tersedia) {
          toast.error('Stok maksimal tercapai')
          return prev
        }
        return prev.map(item => (item.id === barang.id || item.id === barang.sku) ? { ...item, qty: item.qty + 1 } : item)
      }
      return [...prev, {
        id: barang.sku || barang.id,
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

  const totalAkhir = cart.reduce((acc, item) => acc + (item.harga_jual * item.qty), 0)
  const kembalian = uangDibayar - totalAkhir

  const handleCheckout = async () => {
    if (!sesiAktif) return toast.error('Sesi kasir tidak aktif')
    if (cart.length === 0) return toast.error('Keranjang kosong')
    if (!selectedCustomer) return toast.error('Pelanggan wajib dipilih untuk transaksi ini')
    if (metodeBayar === 'tunai' && uangDibayar < totalAkhir) return toast.error('Uang tunai kurang')

    try {
      const result = await checkoutMutation.mutateAsync({
        kasir_id: userId!,
        sesi_id: sesiAktif.id,
        cabang_id: sesiAktif.cabang_id,
        customer_id: selectedCustomer.id,
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

  const handleTransaksiBaru = () => {
    setTrxSukses(null)
    setMetodeBayar('tunai')
  }

  const formatInputRibuan = (val: number) => val ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ''
  const parseInputRibuan = (val: string) => isNaN(parseInt(val.replace(/[^0-9]/g, ''), 10)) ? 0 : parseInt(val.replace(/[^0-9]/g, ''), 10)
  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

  if (isSesiLoading) return <div className="p-8 text-slate-500 font-medium">Memuat POS Takeaway...</div>

  if (trxSukses) {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 bg-white border border-[#E6DFD3] rounded-xl shadow-sm text-center space-y-6">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
        <div>
          <h2 className="text-xl font-bold text-[#051F20]">Pembayaran Lunas!</h2>
          <p className="text-slate-500 mt-1 text-sm">Struk {trxSukses.nomor_struk}</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl text-[#051F20] font-bold text-xl border border-[#E6DFD3]">
          Total: {formatRupiah(trxSukses.total)}
        </div>
        <div className="grid gap-3 pt-4">
          <Button className="h-10 w-full bg-[#051F20] hover:bg-[#163832] font-semibold text-white rounded-lg">
            <Printer className="w-4 h-4 mr-2" /> Cetak Struk Thermal
          </Button>
          <Button variant="outline" className="h-10 w-full border-[#E6DFD3] text-[#051F20] font-semibold rounded-lg" onClick={handleTransaksiBaru}>
            Transaksi Baru
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-12">
      <div>
        <h2 className="text-2xl font-semibold text-[#051F20] tracking-tight flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-[#8EB69B]" />
          POS Penjualan Takeaway
        </h2>
        <p className="text-sm text-slate-500 mt-1">Pembelian sparepart & aksesoris tanpa layanan servis mekanik.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <Card className="lg:col-span-7 bg-white border-[#E6DFD3] shadow-sm rounded-xl min-h-[600px] flex flex-col">
          <CardHeader className="border-b border-[#E6DFD3] bg-[#FAF7F2] pb-4 pt-4 rounded-t-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Scan atau ketik nama barang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 text-sm border-[#E6DFD3] focus-visible:ring-1 focus-visible:ring-[#8EB69B] bg-white text-[#051F20] shadow-sm rounded-lg w-full"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 overflow-y-auto bg-slate-50">
            {isSearching ? (
              <div className="text-center py-8 text-slate-500 text-sm font-medium">Memuat katalog barang...</div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {searchResults.map(b => (
                  <div 
                    key={b.id || b.sku} 
                    onClick={() => addToCart(b)}
                    className="p-4 bg-white border border-[#E6DFD3] hover:border-[#8EB69B] shadow-sm cursor-pointer rounded-xl transition-all flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="font-semibold text-[#051F20] text-sm line-clamp-1" title={b.nama}>{b.nama}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{b.barcode || b.sku}</p>
                    </div>
                    <div className="flex justify-between items-end mt-4">
                      <span className="font-bold text-[#235347]">{formatRupiah(b.harga_jual)}</span>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Fisik: {b.stok_fisik}</span>
                        <span className="text-xs font-semibold bg-[#E1EFE6] text-[#235347] px-2 py-1 rounded">Tersedia: {b.stok_fisik - b.stok_reserved}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 pt-12">
                <ShoppingBag className="w-12 h-12 mb-3 opacity-20" />
                <p className="font-medium text-center text-sm">
                  {searchTerm ? 'Barang tidak ditemukan.' : 'Katalog kosong atau stok habis.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-5 space-y-4">
          <Card className={`bg-white border ${!selectedCustomer ? 'border-rose-300' : 'border-[#E6DFD3]'} overflow-visible shadow-sm rounded-xl`}>
            <CardContent className="p-4 space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex justify-between">
                <span>Pelanggan (Wajib) <span className="text-rose-500">*</span></span>
              </label>
              <CustomerSelect 
                selectedCustomer={selectedCustomer} 
                onSelect={setSelectedCustomer} 
              />
            </CardContent>
          </Card>

          <Card className="bg-white border-[#E6DFD3] shadow-sm rounded-xl">
            <CardHeader className="py-3 border-b border-[#E6DFD3] bg-[#FAF7F2] rounded-t-xl">
              <CardTitle className="text-sm font-semibold text-[#051F20]">Keranjang Belanja ({cart.length} Item)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[300px] overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">Keranjang masih kosong</div>
                ) : (
                  <div className="divide-y divide-[#E6DFD3]">
                    {cart.map(item => (
                      <div key={item.id} className="p-4 bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-slate-50 transition-colors">
                        <div className="flex-1">
                          <p className="font-semibold text-[#051F20] text-sm">{item.nama}</p>
                          <p className="font-semibold text-[#8EB69B] text-xs mt-0.5">{formatRupiah(item.harga_jual)}</p>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-0 pt-2 sm:pt-0 border-slate-100">
                          <div className="flex items-center border border-[#E6DFD3] rounded-lg bg-white">
                            <button onClick={() => updateQty(item.id, -1)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-l-lg"><Minus className="w-3.5 h-3.5" /></button>
                            <span className="w-8 text-center font-semibold text-sm text-[#051F20]">{item.qty}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-r-lg"><Plus className="w-3.5 h-3.5" /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-[#E6DFD3] bg-[#FAF7F2] space-y-4 rounded-b-xl">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-semibold text-slate-500">TOTAL TAGIHAN</span>
                  <span className="text-xl font-bold text-[#051F20]">{formatRupiah(totalAkhir)}</span>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <Button type="button" variant={metodeBayar === 'tunai' ? 'default' : 'outline'} className={`text-xs h-10 font-semibold rounded-lg ${metodeBayar === 'tunai' ? 'bg-[#235347] text-white hover:bg-[#051F20]' : 'border-[#E6DFD3] text-slate-600 bg-white'}`} onClick={() => setMetodeBayar('tunai')}>Tunai</Button>
                    <Button type="button" variant={metodeBayar === 'qris' ? 'default' : 'outline'} className={`text-xs h-10 font-semibold rounded-lg ${metodeBayar === 'qris' ? 'bg-[#235347] text-white hover:bg-[#051F20]' : 'border-[#E6DFD3] text-slate-600 bg-white'}`} onClick={() => setMetodeBayar('qris')}>QRIS</Button>
                    <Button type="button" variant={metodeBayar === 'transfer' ? 'default' : 'outline'} className={`text-xs h-10 font-semibold rounded-lg ${metodeBayar === 'transfer' ? 'bg-[#235347] text-white hover:bg-[#051F20]' : 'border-[#E6DFD3] text-slate-600 bg-white'}`} onClick={() => setMetodeBayar('transfer')}>Bank</Button>
                  </div>
                </div>

                {metodeBayar === 'tunai' && (
                  <div className="space-y-1.5 pt-2 border-t border-[#E6DFD3]">
                    <label className="text-xs font-semibold text-slate-500">Uang Diterima</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">Rp</span>
                      <Input 
                        type="text"
                        value={formatInputRibuan(uangDibayar)}
                        onChange={(e) => setUangDibayar(parseInputRibuan(e.target.value))}
                        placeholder="0"
                        className="pl-9 h-10 font-semibold text-base bg-white text-[#051F20] border-[#E6DFD3] focus-visible:ring-1 focus-visible:ring-[#8EB69B] rounded-lg w-full"
                      />
                    </div>
                    {uangDibayar >= totalAkhir && totalAkhir > 0 && (
                      <div className="flex justify-between items-center text-sm pt-1.5">
                        <span className="font-semibold text-slate-500">Kembalian:</span>
                        <span className="font-bold text-emerald-600">{formatRupiah(kembalian)}</span>
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || checkoutMutation.isPending || (metodeBayar === 'tunai' && uangDibayar < totalAkhir) || !selectedCustomer}
                  className={`w-full h-12 mt-2 font-semibold text-white shadow-sm transition-colors rounded-lg ${(!selectedCustomer && cart.length > 0) ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#235347] hover:bg-[#051F20]'}`}
                >
                  {checkoutMutation.isPending ? 'Memproses...' : (!selectedCustomer && cart.length > 0 ? 'Pilih Pelanggan Dulu' : 'Selesaikan Pembayaran')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
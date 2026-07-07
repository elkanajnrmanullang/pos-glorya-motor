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
import { Search, ShoppingBag, Plus, Minus, Trash2, CheckCircle2, FileDown, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

// INTERFACE KERANJANG
interface CartItem {
  sku: string
  nama: string
  harga_jual: number
  qty: number
  maxQty: number
}

// COMPONENT TAKEAWAY POS PAGE
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
  
  // STATE MENYIMPAN DATA SUKSES
  const [trxSukses, setTrxSukses] = useState<any>(null)

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['katalog-takeaway', searchTerm],
    queryFn: async () => {
      let q = supabase.from('barang').select('*').eq('aktif', true).order('nama')
      if (searchTerm) {
        q = q.or(`nama.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,barcode.eq.${searchTerm}`)
      } else {
        q = q.limit(20)
      }
      const { data, error } = await q
      if (error) throw error
      return data || []
    }
  })

  // HANDLER KERANJANG
  const addToCart = (barang: any) => {
    const tersedia = barang.stok_fisik - barang.stok_reserved
    if (tersedia <= 0) return

    const itemSku = barang.sku || barang.id

    setCart(prev => {
      const existing = prev.find(item => item.sku === itemSku)
      if (existing) {
        if (existing.qty >= tersedia) {
          toast.error('Stok maksimal tercapai')
          return prev
        }
        return prev.map(item => item.sku === itemSku ? { ...item, qty: item.qty + 1 } : item)
      }
      return [...prev, {
        sku: itemSku,
        nama: barang.nama,
        harga_jual: barang.harga_jual,
        qty: 1,
        maxQty: tersedia
      }]
    })
    setSearchTerm('')
  }

  const updateQty = (sku: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.sku === sku) {
        const newQty = item.qty + delta
        if (newQty > 0 && newQty <= item.maxQty) return { ...item, qty: newQty }
      }
      return item
    }))
  }

  const removeFromCart = (sku: string) => {
    setCart(prev => prev.filter(item => item.sku !== sku))
  }

  const totalAkhir = cart.reduce((acc, item) => acc + (item.harga_jual * item.qty), 0)
  const kembalian = uangDibayar - totalAkhir

  // HANDLER CHECKOUT
  const handleCheckout = async () => {
    if (!sesiAktif) return toast.error('Sesi kasir tidak aktif')
    if (cart.length === 0) return toast.error('Keranjang kosong')
    if (!selectedCustomer) return toast.error('Pelanggan wajib dipilih untuk transaksi ini (Butuh WA)')
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
      
      setTrxSukses({
        ...result,
        customer: selectedCustomer,
        cartItems: cart,
        uangDibayar: metodeBayar === 'tunai' ? uangDibayar : totalAkhir,
        kembalian: metodeBayar === 'tunai' ? kembalian : 0
      })
      
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

  // EXPORT PDF GENERATOR
  const unduhPDF = async () => {
    const element = document.getElementById('nota-hidden-print')
    if (!element) return toast.error('Gagal memproses nota')

    try {
      element.style.display = 'block'
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' })
      element.style.display = 'none'

      const imgData = canvas.toDataURL('image/png')
      // Format kertas struk thermal standar 80mm
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 150] })
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Struk_${trxSukses.nomor_struk}.pdf`)
      
      toast.success('PDF berhasil diunduh')
    } catch (error) {
      console.error(error)
      toast.error('Terjadi kesalahan saat membuat PDF')
    }
  }

  // KIRIM PESAN WA DIRECT
  const kirimWA = () => {
    if (!trxSukses?.customer?.no_telp) return toast.error('Nomor WA pelanggan tidak ditemukan')
    
    // Format nomor HP (Ganti awalan 0 menjadi 62)
    let phone = trxSukses.customer.no_telp.replace(/\D/g, '')
    if (phone.startsWith('0')) phone = '62' + phone.substring(1)

    // Menyusun isi pesan struk teks
    let pesan = `*GLORYA MOTOR*\nJl. Raya Bengkel No. 123\n\n`
    pesan += `*STRUK PEMBELIAN (TAKEAWAY)*\n`
    pesan += `No: ${trxSukses.nomor_struk}\n`
    pesan += `Tanggal: ${new Date(trxSukses.created_at).toLocaleString('id-ID')}\n`
    pesan += `Pelanggan: ${trxSukses.customer.nama}\n`
    pesan += `----------------------------------\n`
    
    trxSukses.cartItems.forEach((item: CartItem) => {
      pesan += `${item.nama}\n${item.qty} x ${formatRupiah(item.harga_jual)} = ${formatRupiah(item.qty * item.harga_jual)}\n`
    })
    
    pesan += `----------------------------------\n`
    pesan += `*Total: ${formatRupiah(trxSukses.total)}*\n`
    pesan += `Metode: ${trxSukses.metode_bayar.toUpperCase()}\n\n`
    pesan += `Terima kasih telah berbelanja di Glorya Motor!`

    // Buka tab WhatsApp
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(pesan)}`, '_blank')
  }

  // FORMATTER
  const formatInputRibuan = (val: number) => val ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ''
  const parseInputRibuan = (val: string) => isNaN(parseInt(val.replace(/[^0-9]/g, ''), 10)) ? 0 : parseInt(val.replace(/[^0-9]/g, ''), 10)
  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

  // RENDER LOADING SESI
  if (isSesiLoading) return <div className="p-8 text-slate-500 font-medium">Memuat POS Takeaway...</div>

  // RENDER TRANSAKSI SUKSES (TAMPILAN E-NOTA)
  if (trxSukses) {
    return (
      <div className="max-w-md mx-auto mt-8 relative">
        {/* TAMPILAN SUKSES DI LAYAR KASIR */}
        <div className="p-8 bg-white border border-[#E6DFD3] rounded-xl shadow-sm text-center space-y-6 relative z-10">
          <CheckCircle2 className="w-16 h-16 text-[#8EB69B] mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-[#051F20]">Pembayaran Berhasil!</h2>
            <p className="text-slate-500 mt-1 text-sm font-medium">Struk {trxSukses.nomor_struk}</p>
          </div>
          <div className="p-4 bg-[#FAF7F2] rounded-xl text-[#051F20] border border-[#E6DFD3]">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Diterima</p>
            <p className="font-black text-2xl">{formatRupiah(trxSukses.total)}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#E6DFD3]">
            <Button onClick={unduhPDF} variant="outline" className="h-12 w-full border-[#E6DFD3] text-[#051F20] font-semibold rounded-lg flex flex-col items-center justify-center p-0 gap-1 hover:bg-[#FAF7F2]">
              <FileDown className="w-4 h-4 text-blue-600" /> <span className="text-[10px]">Unduh PDF</span>
            </Button>
            <Button onClick={kirimWA} variant="outline" className="h-12 w-full border-[#E6DFD3] text-[#051F20] font-semibold rounded-lg flex flex-col items-center justify-center p-0 gap-1 hover:bg-[#FAF7F2]">
              <MessageCircle className="w-4 h-4 text-emerald-600" /> <span className="text-[10px]">Kirim ke WA</span>
            </Button>
            <Button onClick={handleTransaksiBaru} className="h-12 w-full col-span-2 bg-[#235347] hover:bg-[#051F20] font-semibold text-white rounded-lg mt-2">
              Lanjut Transaksi Baru
            </Button>
          </div>
        </div>

        {/* CONTAINER RENDER PDF */}
        <div id="nota-hidden-print" className="bg-white p-4 w-[280px] hidden text-black mx-auto absolute top-0 left-0 -z-50" style={{ fontFamily: 'monospace' }}>
          <div className="text-center pb-4 border-b border-dashed border-gray-400">
            <h1 className="text-xl font-bold">GLORYA MOTOR</h1>
            <p className="text-[10px] mt-1">Jl. Raya Bengkel No. 123</p>
          </div>
          <div className="py-2 text-[10px] border-b border-dashed border-gray-400 space-y-1">
            <div className="flex justify-between"><span>No</span><span>{trxSukses.nomor_struk}</span></div>
            <div className="flex justify-between"><span>Tgl</span><span>{new Date(trxSukses.created_at).toLocaleString('id-ID')}</span></div>
            <div className="flex justify-between"><span>Plg</span><span>{trxSukses.customer.nama}</span></div>
            <div className="flex justify-between"><span>Ksr</span><span>{userId?.substring(0,6).toUpperCase()}</span></div>
          </div>
          <div className="py-2 border-b border-dashed border-gray-400">
            {trxSukses.cartItems.map((item: CartItem, i: number) => (
              <div key={i} className="mb-2 text-[10px]">
                <div>{item.nama}</div>
                <div className="flex justify-between">
                  <span>{item.qty} x {formatRupiah(item.harga_jual)}</span>
                  <span>{formatRupiah(item.qty * item.harga_jual)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="py-2 text-[10px] space-y-1">
            <div className="flex justify-between font-bold"><span>Total</span><span>{formatRupiah(trxSukses.total)}</span></div>
            <div className="flex justify-between"><span>Bayar ({trxSukses.metode_bayar})</span><span>{formatRupiah(trxSukses.uangDibayar)}</span></div>
            {trxSukses.metode_bayar === 'tunai' && (
              <div className="flex justify-between"><span>Kembali</span><span>{formatRupiah(trxSukses.kembalian)}</span></div>
            )}
          </div>
          <div className="text-center text-[10px] mt-4 pt-2 border-t border-dashed border-gray-400">
            <p>Terima kasih atas kunjungannya!</p>
            <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</p>
          </div>
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
                placeholder="Scan atau ketik nama barang/SKU..."
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
                    key={b.sku} 
                    onClick={() => addToCart(b)}
                    className="p-4 bg-white border border-[#E6DFD3] hover:border-[#8EB69B] shadow-sm cursor-pointer rounded-xl transition-all flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="font-semibold text-[#051F20] text-sm line-clamp-1" title={b.nama}>{b.nama}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{b.sku}</p>
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
                <span>Pelanggan (Wajib No. WA) <span className="text-rose-500">*</span></span>
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
                      <div key={item.sku} className="p-4 bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-slate-50 transition-colors">
                        <div className="flex-1">
                          <p className="font-semibold text-[#051F20] text-sm">{item.nama}</p>
                          <p className="font-semibold text-[#8EB69B] text-xs mt-0.5">{formatRupiah(item.harga_jual)}</p>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-0 pt-2 sm:pt-0 border-slate-100">
                          <div className="flex items-center border border-[#E6DFD3] rounded-lg bg-white">
                            <button onClick={() => updateQty(item.sku, -1)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-l-lg"><Minus className="w-3.5 h-3.5" /></button>
                            <span className="w-8 text-center font-semibold text-sm text-[#051F20]">{item.qty}</span>
                            <button onClick={() => updateQty(item.sku, 1)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-r-lg"><Plus className="w-3.5 h-3.5" /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.sku)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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
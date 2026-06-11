import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// 1. Hook Pencarian Barang (Langsung Muncul Default)
export function useSearchBarangPOS(searchQuery: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['search-barang-pos', searchQuery],
    queryFn: async () => {
      let query = supabase.from('barang').select('*').eq('aktif', true)
      
      // Jika ada teks pencarian, baru jalankan filter
      if (searchQuery && searchQuery.length >= 1) {
        query = query.or(`nama.ilike.%${searchQuery}%,barcode.eq.${searchQuery}`)
      }
      
      // Batasi 50 barang untuk default view agar browser tidak berat
      const { data, error } = await query.order('nama', { ascending: true }).limit(50)
      
      if (error) throw error

      // Filter ketat: Hanya tampilkan barang yang stok tersedia (fisik - reserved) > 0
      return data.filter(b => (b.stok_fisik - b.stok_reserved) > 0)
    }
  })
}

// Interface Payload Checkout
export interface CheckoutTakeawayPayload {
  kasir_id: string
  sesi_id: string
  cabang_id?: string | null
  customer_id?: string | null
  metode_bayar: 'tunai' | 'qris' | 'transfer'
  total: number
  items: { id: string; qty: number; harga_jual: number }[]
}

// 2. Hook Eksekusi Checkout & Pemotongan Stok
export function useCheckoutTakeaway() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CheckoutTakeawayPayload) => {
      // Generate Nomor Struk
      const noStruk = `TW-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`

      // A. Insert Header Transaksi Takeaway
      const { data: trx, error: trxErr } = await supabase
        .from('transaksi_takeaway')
        .insert({
          nomor_struk: noStruk,
          kasir_id: payload.kasir_id,
          sesi_id: payload.sesi_id,
          cabang_id: payload.cabang_id || null,
          customer_id: payload.customer_id || null,
          metode_bayar: payload.metode_bayar,
          total: payload.total
        })
        .select()
        .single()

      if (trxErr) throw trxErr

      // B. Insert Detail Items (Barang yang dibeli)
      const itemsPayload = payload.items.map(item => ({
        transaksi_id: trx.id,
        barang_id: item.id,
        qty: item.qty,
        harga_snapshot: item.harga_jual
      }))

      const { error: itemsErr } = await supabase
        .from('transaksi_takeaway_items')
        .insert(itemsPayload)

      if (itemsErr) throw itemsErr

      // C. Update Stok Fisik Secara Permanen (BYPASS RPC UNTUK MENGHINDARI CORS PATCH)
      for (const item of payload.items) {
        // Memanggil fungsi PostgreSQL secara langsung via metode POST
        const { error: updateErr } = await supabase.rpc('kurangi_stok_barang', {
          item_id: item.id,
          qty_potong: item.qty
        })
          
        if (updateErr) throw updateErr
      }

      return trx
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-barang-pos'] })
      queryClient.invalidateQueries({ queryKey: ['metrics-sesi'] })
      
      queryClient.invalidateQueries({ queryKey: ['barang'] })
      queryClient.invalidateQueries({ queryKey: ['stok'] })
    }
  })
}
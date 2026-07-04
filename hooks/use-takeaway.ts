import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// HOOK PENCARIAN BARANG POS
export function useSearchBarangPOS(searchQuery: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['search-barang-pos', searchQuery],
    queryFn: async () => {
      let query = supabase.from('barang').select('*').eq('aktif', true)
      
      if (searchQuery && searchQuery.length >= 1) {
        query = query.or(`nama.ilike.%${searchQuery}%,barcode.eq.${searchQuery},sku.ilike.%${searchQuery}%`)
      }
      
      const { data, error } = await query.order('nama', { ascending: true }).limit(50)
      
      if (error) throw error

      return data.filter(b => (b.stok_fisik - b.stok_reserved) > 0)
    }
  })
}

// INTERFACE PAYLOAD CHECKOUT
export interface CheckoutTakeawayPayload {
  kasir_id: string
  sesi_id: string
  cabang_id?: string | null
  customer_id?: string | null
  metode_bayar: 'tunai' | 'qris' | 'transfer'
  total: number
  items: { sku: string; qty: number; harga_jual: number }[]
}

// HOOK EKSEKUSI CHECKOUT & PEMOTONGAN STOK
export function useCheckoutTakeaway() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CheckoutTakeawayPayload) => {
      const noStruk = `TW-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`

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

      const itemsPayload = payload.items.map(item => ({
        transaksi_id: trx.id,
        barang_sku: item.sku,
        qty: item.qty,
        harga_snapshot: item.harga_jual
      }))

      const { error: itemsErr } = await supabase
        .from('transaksi_takeaway_items')
        .insert(itemsPayload)

      if (itemsErr) throw itemsErr

      for (const item of payload.items) {
        const { error: updateErr } = await supabase.rpc('kurangi_stok_barang', {
          item_sku: item.sku,
          qty_potong: item.qty
        })
          
        if (updateErr) throw updateErr
      }

      return trx
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-barang-pos'] })
      queryClient.invalidateQueries({ queryKey: ['metrics-sesi'] })
      queryClient.invalidateQueries({ queryKey: ['owner-stok-v3'] })
      queryClient.invalidateQueries({ queryKey: ['owner-dashboard'] })
    }
  })
}
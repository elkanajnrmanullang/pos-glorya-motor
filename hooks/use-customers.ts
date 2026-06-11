import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface Customer {
  id: string
  nama: string
  no_telp: string
  cabang_id: string | null
}

// 1. Hook Utama untuk Halaman Data Customer 
export function useCustomers() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Customer[]
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] })
  })

  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<Customer> & { id: string }) => {
      const { error } = await supabase.from('customers').update(payload).eq('id', payload.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] })
  })

  return {
    customers: query.data,
    isLoading: query.isLoading,
    deleteCustomer: deleteMutation.mutateAsync,
    isDeletingCustomer: deleteMutation.isPending,
    updateCustomer: updateMutation.mutateAsync,
    isUpdatingCustomer: updateMutation.isPending,
  }
}

// 2. Hook Pencarian Dropdown POS
export function useSearchCustomers(searchQuery: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['customers-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return []

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`nama.ilike.%${searchQuery}%,no_telp.ilike.%${searchQuery}%`)
        .limit(10)

      if (error) throw error
      return data as Customer[]
    },
    enabled: searchQuery.length >= 2,
  })
}

// 3. Hook Buat Customer Baru di POS
export function useCreateCustomer() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ nama, no_telp, cabang_id }: { nama: string, no_telp: string, cabang_id?: string }) => {
      const { data, error } = await supabase
        .from('customers')
        .insert({ nama, no_telp, cabang_id: cabang_id || null })
        .select()
        .single()

      if (error) throw error
      return data as Customer
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] })
  })
}
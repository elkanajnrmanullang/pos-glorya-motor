import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// INTERFACE CUSTOMER
export interface Customer {
  id: string
  nama: string
  no_telp: string
  cabang_id: string | null
  created_at: string
}

// HOOK UTAMA CUSTOMER
export function useCustomers() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // QUERY FETCH CUSTOMER
  const query = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Customer[]
    }
  })

  // MUTATION CREATE CUSTOMER
  const createMutation = useMutation({
    mutationFn: async (payload: { nama: string, no_telp: string }) => {
      const { data, error } = await supabase.from('customers').insert(payload).select().single()
      if (error) {
        if (error.code === '23505') throw new Error('DUPLICATE_DATA')
        throw error
      }
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] })
  })

  // MUTATION UPDATE CUSTOMER
  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<Customer> & { id: string }) => {
      const { error } = await supabase.rpc('update_customer_aman', {
        p_id: payload.id,
        p_nama: payload.nama,
        p_no_telp: payload.no_telp
      })
      if (error) {
        if (error.code === '23505') throw new Error('DUPLICATE_DATA')
        throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] })
  })

  // MUTATION DELETE CUSTOMER
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] })
  })

  return {
    customers: query.data,
    isCustomersLoading: query.isLoading,
    addCustomer: createMutation.mutateAsync,
    isAddingCustomer: createMutation.isPending,
    updateCustomer: updateMutation.mutateAsync,
    isUpdatingCustomer: updateMutation.isPending,
    deleteCustomer: deleteMutation.mutateAsync,
    isDeletingCustomer: deleteMutation.isPending,
  }
}

// HOOK SEARCH PADA TAKEAWAY/TIKET
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

// HOOK CREATE DARI MODAL POS TAKEAWAY
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
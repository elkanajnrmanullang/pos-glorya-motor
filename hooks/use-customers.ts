import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useCustomers() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: customers, isLoading: isCustomersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }
  })

  const addCustomerMutation = useMutation({
    mutationFn: async (newCustomer: { nama: string; no_telp: string }) => {
      const cleanPhone = newCustomer.no_telp.replace(/\D/g, '')
      
      const { data: existing, error: checkError } = await supabase
        .from('customers')
        .select('id')
        .eq('no_telp', cleanPhone)
        .maybeSingle()

      if (checkError) throw checkError
      if (existing) throw new Error('DUPLICATE_PHONE')

      const { data, error } = await supabase
        .from('customers')
        .insert({ 
          nama: newCustomer.nama, 
          no_telp: cleanPhone 
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
  })

  const updateCustomerMutation = useMutation({
    mutationFn: async (updatedCustomer: { id: string; nama: string; no_telp: string }) => {
      const cleanPhone = updatedCustomer.no_telp.replace(/\D/g, '')

      const { data: existing, error: checkError } = await supabase
        .from('customers')
        .select('id')
        .eq('no_telp', cleanPhone)
        .neq('id', updatedCustomer.id)
        .maybeSingle()

      if (checkError) throw checkError
      if (existing) throw new Error('DUPLICATE_PHONE')

      const { data, error } = await supabase
        .from('customers')
        .update({
          nama: updatedCustomer.nama,
          no_telp: cleanPhone,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedCustomer.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
  })

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
  })

  return {
    customers,
    isCustomersLoading,
    addCustomer: addCustomerMutation.mutateAsync,
    isAddingCustomer: addCustomerMutation.isPending,
    updateCustomer: updateCustomerMutation.mutateAsync,
    isUpdatingCustomer: updateCustomerMutation.isPending,
    deleteCustomer: deleteCustomerMutation.mutateAsync,
    isDeletingCustomer: deleteCustomerMutation.isPending
  }
}
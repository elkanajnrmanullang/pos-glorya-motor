'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function loginAction(formData: FormData) {
  const supabase = createClient()
  const email = (formData.get('email') as string).trim()
  const password = formData.get('password') as string

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    redirect(`/login?error=Auth Error: ${authError.message}`)
  }
  
  if (!authData.user) {
    redirect('/login?error=Sistem gagal memuat data user')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profile) {
    redirect(`/login?error=Database Error: ${profileError?.message || 'Profil tidak ditemukan'}`)
  }

revalidatePath('/', 'layout')
  
  if (profile.role === 'owner') redirect('/owner/dashboard')
  if (profile.role === 'kasir') redirect('/kasir/dashboard')
  if (profile.role === 'mekanik') redirect('/mekanik/dashboard')
  
  redirect('/')
}
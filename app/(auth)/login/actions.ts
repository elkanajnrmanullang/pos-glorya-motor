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
    redirect(`/login?error=Email atau kata sandi yang Anda masukkan salah.`)
  }
  
  if (!authData.user) {
    redirect('/login?error=Sistem sedang sibuk. Silakan coba beberapa saat lagi.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profile) {
    redirect(`/login?error=Akun Anda belum memiliki akses peran. Silakan lapor ke Owner.`)
  }

  revalidatePath('/', 'layout')
  
  if (profile.role === 'owner') redirect('/owner/dashboard')
  if (profile.role === 'kasir') redirect('/kasir/dashboard')
  if (profile.role === 'mekanik') redirect('/mekanik/dashboard')
  
  redirect('/')
}

export async function logoutAction() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
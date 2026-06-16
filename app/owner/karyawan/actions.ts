'use server'

import { createClient } from '@supabase/supabase-js'

export async function buatAkunKaryawan(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const role = formData.get('role') as string

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return { error: 'Kunci rahasia SUPABASE_SERVICE_ROLE_KEY belum diatur di server (.env.local).' }
  }

  // Inisialisasi klien dengan akses Bypass 
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // 1. Buat Pengguna di Supabase Auth 
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true 
    })

    if (authError) throw authError

    if (authData.user) {
      // 2. Update tabel profiles 
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: fullName,
          role: role
        })
        .eq('id', authData.user.id)

      if (updateError) throw updateError
    }

    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Gagal membuat akun karyawan.' }
  }
}
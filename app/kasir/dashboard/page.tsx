"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CashierDashboard() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/kasir/tiket/aktif')
  }, [router])

  return null
}
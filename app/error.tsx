'use client' 

import { useEffect } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("System Error Caught:", error)
  }, [error])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#FAFCFB] p-6 text-center space-y-6">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-10 h-10 text-red-600" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-[#051F20] tracking-tight">Terjadi Kesalahan</h2>
        <p className="text-[#163832] max-w-md mx-auto">
          {error.message || "Sistem gagal memproses permintaan Anda. Silakan coba lagi."}
        </p>
      </div>

      <Button 
        onClick={() => reset()} 
        className="h-12 px-8 bg-[#235347] hover:bg-[#0B2B26] text-white tracking-widest font-bold transition-all"
      >
        <RefreshCcw className="w-4 h-4 mr-2" />
        COBA LAGI
      </Button>
    </div>
  )
}
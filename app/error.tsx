'use client' 

import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

// COMPONENT_GLOBAL_ERROR_SANITIZED
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#FAFCFB] p-6 text-center space-y-6">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-10 h-10 text-red-600" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-[#051F20] tracking-tight">Terjadi Kesalahan</h2>
        <p className="text-[#163832] font-medium max-w-md mx-auto">
          Sistem tidak dapat memproses permintaan Anda saat ini. Silakan coba muat ulang halaman.
        </p>
      </div>

      <Button 
        onClick={() => reset()} 
        className="h-14 px-8 bg-[#235347] hover:bg-[#0B2B26] rounded-2xl text-white tracking-widest font-black transition-all shadow-md mt-4"
      >
        <RefreshCcw className="w-5 h-5 mr-2" />
        MUAT ULANG
      </Button>
    </div>
  )
}
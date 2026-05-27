'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button 
      type="submit" 
      disabled={pending}
      className="w-full h-12 text-sm font-bold tracking-widest bg-[#235347] hover:bg-[#051F20] text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 rounded-lg disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          MEMVALIDASI...
        </span>
      ) : (
        "MASUK KE SISTEM"
      )}
    </Button>
  )
}
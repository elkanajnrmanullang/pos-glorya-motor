import { Loader2 } from "lucide-react"

export default function GlobalLoading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#FAFCFB] space-y-4">
      {/* Spinner menggunakan warna elegan Glorya Motor */}
      <Loader2 className="w-12 h-12 animate-spin text-[#235347]" />
      <p className="text-[#163832] text-sm font-bold tracking-[0.3em] animate-pulse uppercase">
        Memuat Sistem...
      </p>
    </div>
  )
}
import { loginAction } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="flex min-h-screen w-full bg-[#FAFCFB] font-sans selection:bg-[#8EB69B] selection:text-[#051F20]">
      {/* Sisi Kiri: Branding & Visual Elegan */}
      <div className="hidden lg:flex w-1/2 bg-[#051F20] flex-col justify-between p-12 relative overflow-hidden">
        {/* Efek Gradasi/Cahaya Halus */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#163832] rounded-full blur-[120px] opacity-60 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#0B2B26] rounded-full blur-[100px] opacity-80 translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10">
          <h1 className="text-3xl tracking-[0.2em] font-light text-white">
            GLORYA<span className="font-bold text-[#8EB69B]">MOTOR</span>
          </h1>
        </div>
        
        <div className="relative z-10 space-y-6 max-w-md">
          <h2 className="text-4xl font-light text-white leading-tight">
            Sistem Operasional <br/> <span className="font-bold">Glorya Motor Bogor</span>
          </h2>
          <p className="text-[#8EB69B] text-lg font-light leading-relaxed">
            Kelola antrean servis, manajemen stok, dan pantau laporan finansial dalam satu platform elegan yang dirancang khusus untuk efisiensi bisnis Anda.
          </p>
        </div>
        
        <div className="relative z-10 text-xs text-[#8EB69B] tracking-widest uppercase font-semibold">
          © {new Date().getFullYear()} Glorya Motor Management
        </div>
      </div>

      {/* Sisi Kanan: Form Login */}
      <div className="flex flex-1 items-center justify-center p-8 bg-[#DAF1DE]/30">
        <div className="w-full max-w-sm bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-[#DAF1DE]/50">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#051F20] tracking-tight mb-2">Selamat Datang</h2>
            <p className="text-[#163832] text-sm">Masukkan kredensial untuk mengakses panel Anda.</p>
          </div>

          <form action={loginAction} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#163832] uppercase tracking-wider" htmlFor="email">Email</label>
                <Input 
                  id="email" name="email" type="email" required 
                  placeholder="nama@gloryamotor.com" 
                  className="h-12 border-[#8EB69B]/30 focus-visible:ring-[#235347] bg-[#DAF1DE]/10 transition-all hover:border-[#8EB69B]" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#163832] uppercase tracking-wider" htmlFor="password">Kata Sandi</label>
                <Input 
                  id="password" name="password" type="password" required 
                  className="h-12 border-[#8EB69B]/30 focus-visible:ring-[#235347] bg-[#DAF1DE]/10 transition-all hover:border-[#8EB69B]" 
                />
              </div>
            </div>

            {searchParams?.error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg font-medium text-center">
                {searchParams.error}
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-sm font-bold tracking-widest bg-[#235347] hover:bg-[#051F20] text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 rounded-lg">
              MASUK KE SISTEM
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
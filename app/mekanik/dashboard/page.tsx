import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function MekanikDashboard() {
  return (
    <div className="w-full space-y-8"> {/* <-- max-w-5xl dihapus, diganti w-full */}
      <div>
        <h1 className="text-2xl font-light text-[#051F20] tracking-tight">Area Kerja <span className="font-bold">Mekanik</span></h1>
        <p className="text-[#235347] mt-1 text-sm font-medium">Pantau antrean motor dan selesaikan pekerjaan Anda.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-[#DAF1DE] shadow-sm hover:shadow-md hover:border-[#8EB69B] transition-all duration-300 group bg-white">
          <CardHeader className="border-b border-[#DAF1DE]/50 pb-4 bg-[#DAF1DE]/10">
            <CardTitle className="text-[#163832] text-sm uppercase tracking-widest font-bold">Sedang Dikerjakan</CardTitle>
          </CardHeader>
          <CardContent className="pt-8 text-center">
            <p className="text-sm text-[#8EB69B] mb-8 font-medium">Belum ada motor yang sedang Anda kerjakan saat ini.</p>
            <Button className="w-full bg-[#235347] hover:bg-[#0B2B26] text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
              Ambil Antrean Baru <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-[#DAF1DE] shadow-sm hover:shadow-md transition-all duration-300 bg-white">
          <CardHeader className="border-b border-[#DAF1DE]/50 pb-4">
            <CardTitle className="text-[#8EB69B] text-sm uppercase tracking-widest font-bold">Selesai Hari Ini</CardTitle>
          </CardHeader>
          <CardContent className="pt-16 pb-16 text-center">
            <p className="text-sm text-[#8EB69B] font-medium">Belum ada pekerjaan yang diselesaikan.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
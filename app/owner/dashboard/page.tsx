"use client"; // Wajib ditambahkan karena grafik recharts membutuhkan client-side rendering

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts'

// Data Dummy untuk testing UI (Nanti diganti query dari database)
const dataPendapatan = [
  { name: 'Sen', total: 1200000 },
  { name: 'Sel', total: 2100000 },
  { name: 'Rab', total: 1800000 },
  { name: 'Kam', total: 2500000 },
  { name: 'Jum', total: 3200000 },
  { name: 'Sab', total: 4500000 },
  { name: 'Min', total: 3800000 },
];

const dataServis = [
  { name: 'Ringan', unit: 24 },
  { name: 'Berat', unit: 8 },
  { name: 'Ganti Oli', unit: 45 },
  { name: 'Kelistrikan', unit: 12 },
];

export default function OwnerDashboard() {
  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-light text-[#051F20] tracking-tight">Dashboard <span className="font-bold">Owner</span></h1>
        <p className="text-[#235347] mt-1 text-sm font-medium">Ringkasan performa finansial dan operasional bengkel.</p>
      </div>

      {/* Top Level Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-[#DAF1DE] shadow-sm hover:-translate-y-1 hover:shadow-lg hover:border-[#8EB69B] transition-all duration-300 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#8EB69B] text-[10px] uppercase tracking-widest font-bold">Pendapatan Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light text-[#051F20] tracking-tight">Rp 3.8M</div>
            <p className="text-xs text-[#235347] font-medium mt-2">+12% dari kemarin</p>
          </CardContent>
        </Card>

        <Card className="border border-[#DAF1DE] shadow-sm hover:-translate-y-1 hover:shadow-lg hover:border-[#8EB69B] transition-all duration-300 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#8EB69B] text-[10px] uppercase tracking-widest font-bold">Motor Diservis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light text-[#051F20] tracking-tight">89</div>
            <p className="text-xs text-[#235347] font-medium mt-2">Unit dalam minggu ini</p>
          </CardContent>
        </Card>

        <Card className="border border-[#DAF1DE] shadow-sm hover:-translate-y-1 hover:shadow-lg hover:border-[#8EB69B] transition-all duration-300 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#8EB69B] text-[10px] uppercase tracking-widest font-bold">Stok Menipis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light text-[#051F20] tracking-tight">12</div>
            <p className="text-xs text-[#235347] font-medium mt-2 text-red-500">Item butuh restock segera</p>
          </CardContent>
        </Card>

        <Card className="border border-[#DAF1DE] shadow-sm hover:-translate-y-1 hover:shadow-lg hover:border-[#8EB69B] transition-all duration-300 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#8EB69B] text-[10px] uppercase tracking-widest font-bold">Efisiensi Mekanik</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light text-[#051F20] tracking-tight">94%</div>
            <p className="text-xs text-[#235347] font-medium mt-2">Rasio penyelesaian target</p>
          </CardContent>
        </Card>
      </div>

      {/* Bagian Grafik */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Grafik Pendapatan Mingguan (Lebar 4 kolom) */}
        <Card className="lg:col-span-4 border border-[#DAF1DE] shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-[#051F20] text-sm font-semibold">Tren Pendapatan (Minggu Ini)</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataPendapatan} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DAF1DE" vertical={false} />
                  <XAxis dataKey="name" stroke="#8EB69B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis 
                    stroke="#8EB69B" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `Rp${value / 1000000}M`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#051F20', borderRadius: '8px', border: 'none', color: '#DAF1DE' }}
                    itemStyle={{ color: '#8EB69B' }}
                    formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
                  />
                  <Line type="monotone" dataKey="total" stroke="#235347" strokeWidth={3} dot={{ r: 4, fill: '#051F20' }} activeDot={{ r: 6, fill: '#8EB69B' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Grafik Kategori Servis (Lebar 3 kolom) */}
        <Card className="lg:col-span-3 border border-[#DAF1DE] shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-[#051F20] text-sm font-semibold">Distribusi Kategori Servis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataServis} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DAF1DE" vertical={false} />
                  <XAxis dataKey="name" stroke="#8EB69B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8EB69B" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#DAF1DE', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#051F20', borderRadius: '8px', border: 'none', color: '#DAF1DE' }}
                  />
                  <Bar dataKey="unit" fill="#8EB69B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
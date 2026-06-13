"use client"

import { useState } from 'react'
import { useRiwayatMekanik } from '@/hooks/use-riwayat-mekanik'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, History, Loader2, CheckCircle2 } from 'lucide-react'

// MAIN COMPONENT
export default function RiwayatPekerjaanMekanik() {
  const { riwayat, isLoading } = useRiwayatMekanik()
  const [search, setSearch] = useState('')

  // FILTER PENCARIAN
  const filteredRiwayat = riwayat.filter(item => 
    item.plat_motor.toLowerCase().includes(search.toLowerCase()) ||
    item.merk_motor.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-full space-y-6 pb-20">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-md">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Riwayat Pekerjaan</h1>
          <p className="text-slate-500 font-medium text-sm">Daftar motor yang telah Anda selesaikan.</p>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Total Diselesaikan: {riwayat.length} Motor
          </CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Cari plat motor..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9 h-10 bg-slate-50/50" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
          ) : filteredRiwayat.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium">
              Tidak ada riwayat pekerjaan yang ditemukan.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredRiwayat.map((tiket) => (
                <Card key={tiket.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-slate-50/30 overflow-hidden">
                  <CardContent className="p-0 flex flex-col h-full">
                    {/* INFO ATAS */}
                    <div className="p-4 flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-wide">{tiket.plat_motor}</h3>
                        <p className="text-sm font-bold text-slate-500 uppercase">{tiket.merk_motor}</p>
                        <p className="text-xs font-medium text-slate-400 mt-1">Pelanggan: {tiket.customers?.nama || '-'}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1.5">
                        <Badge variant="outline" className={`font-bold uppercase text-[10px] ${tiket.status === 'lunas' ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-emerald-200 text-emerald-700 bg-emerald-50'}`}>
                          {tiket.status}
                        </Badge>
                        <p className="text-[11px] text-slate-500 font-semibold">
                          {new Date(tiket.waktu_selesai || tiket.waktu_masuk).toLocaleDateString('id-ID', { 
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                    
                    {/* RINCIAN JASA */}
                    <div className="mt-auto bg-slate-100/50 border-t border-slate-100 p-3">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Jasa Yang Dikerjakan:</p>
                      {tiket.tiket_jasa && tiket.tiket_jasa.length > 0 ? (
                        <ul className="space-y-1">
                          {tiket.tiket_jasa.map((jasa, idx) => (
                            <li key={idx} className="flex justify-between items-center text-xs">
                              <span className="font-medium text-slate-700 flex-1 truncate pr-2">• {jasa.nama_jasa}</span>
                              <span className="text-slate-500 font-semibold">Rp {jasa.harga_jasa.toLocaleString('id-ID')}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Tidak ada tindakan jasa tercatat.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
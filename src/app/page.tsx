import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

// 1. Definisikan tipe data TypeScript
interface SesiGym {
  sesi_id: string;
  nama_sesi: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  kapasitas_max: number;
  terisi: number;
  sisa_kuota: number;
  penuh: boolean;
}

export default async function Home() {
  const supabase = await createClient()

  // 2. Ambil data
  const { data: sesiGym, error } = await supabase
    .from('v_kuota_sesi')
    .select('*')
    .order('tanggal', { ascending: true })
    .order('jam_mulai', { ascending: true })

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      
      {/* ── Navigation Bar ──────────────────────────────────────────────── */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Logo / Brand */}
              <Link href="/" className="text-2xl font-extrabold text-blue-700 hover:text-blue-800 transition-colors">
                IPB Wellness
              </Link>
              
              {/* Menu Navigasi */}
              <div className="hidden sm:ml-10 sm:flex sm:space-x-4">
                <Link 
                  href="/" 
                  className="bg-blue-50 text-blue-700 px-3 py-2 rounded-md text-sm font-semibold"
                >
                  Dashboard Gym
                </Link>
                <Link 
                  href="/kelola-modul" 
                  className="text-gray-500 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Kelola Modul (Admin)
                </Link>
              </div>
            </div>
            
            <div className="flex items-center">
              {/* Placeholder untuk tombol Login nanti */}
              <button className="text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded-lg transition-colors">
                Masuk / SSO
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Konten Utama ────────────────────────────────────────────────── */}
      <div className="p-8 max-w-6xl mx-auto">
        <header className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Jadwal Sesi Gym
          </h1>
          <p className="text-gray-600">Pantau ketersediaan dan reservasi sesi gym IPB.</p>
        </header>

        {error ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow">
            <p className="font-bold">Gagal mengambil data</p>
            <p>{error.message}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sesiGym?.map((sesi: SesiGym) => (
                <div 
                  key={sesi.sesi_id} 
                  className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-300"
                >
                  <div className={`p-4 border-b ${sesi.penuh ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-lg text-gray-800">{sesi.nama_sesi}</h3>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        sesi.penuh ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {sesi.penuh ? 'Penuh' : 'Tersedia'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="mb-4 space-y-2 text-sm text-gray-600">
                      <p className="flex items-center">
                        <span className="mr-2">📅</span> 
                        {new Date(sesi.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <p className="flex items-center">
                        <span className="mr-2">⏰</span> 
                        {sesi.jam_mulai.slice(0, 5)} - {sesi.jam_selesai.slice(0, 5)} WIB
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status Kuota</p>
                          <p className="font-medium text-gray-800">
                            Terisi: <span className={sesi.penuh ? 'text-red-600' : 'text-blue-600'}>{sesi.terisi}</span> / {sesi.kapasitas_max}
                          </p>
                        </div>
                        <button 
                          disabled={sesi.penuh}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            sesi.penuh 
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                          }`}
                        >
                          {sesi.penuh ? 'Ditutup' : 'Reservasi'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {sesiGym?.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                <p className="text-gray-500 text-lg">Belum ada sesi gym yang dijadwalkan.</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

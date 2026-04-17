import { createClient } from '@/utils/supabase/server'

// 1. Definisikan tipe data TypeScript sesuai dengan VIEW SQL kamu
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

  // 2. Ambil data dan pastikan tipenya sesuai
  const { data: sesiGym, error } = await supabase
    .from('v_kuota_sesi')
    .select('*')
    .order('tanggal', { ascending: true }) // Urutkan dari tanggal terdekat
    .order('jam_mulai', { ascending: true })

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-blue-700 mb-2">
            IPB Wellness Hub
          </h1>
          <p className="text-gray-600">Sistem Reservasi & Monitoring Kuota Gym</p>
        </header>

        {error ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow">
            <p className="font-bold">Gagal mengambil data</p>
            <p>{error.message}</p>
          </div>
        ) : (
          <>
            {/* 3. Render Data ke dalam Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sesiGym?.map((sesi: SesiGym) => (
                <div 
                  key={sesi.sesi_id} 
                  className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className={`p-4 border-b ${sesi.penuh ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-lg text-gray-800">{sesi.nama_sesi}</h3>
                      {/* Badge Status */}
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
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                              : 'bg-blue-600 text-white hover:bg-blue-700'
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

            {/* Empty State jika belum ada jadwal sama sekali */}
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

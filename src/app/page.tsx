import { createClient } from '@/utils/supabase/server'

export default async function Home() {
  // Inisialisasi klien Supabase dari sisi server
  const supabase = await createClient()

  // Mengambil data dari view v_kuota_sesi
  const { data: sesiGym, error } = await supabase
    .from('v_kuota_sesi')
    .select('*')

  return (
    <main className="p-8 font-sans">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">
        IPB Wellness Hub
      </h1>
      <h2 className="text-xl mb-4">Status Koneksi Supabase:</h2>
      
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p><strong>Error:</strong> {error.message}</p>
        </div>
      ) : (
        <div className="bg-gray-900 text-green-400 p-6 rounded-lg overflow-auto">
          <p className="mb-2 text-white">✅ Berhasil terhubung! Data Sesi Gym:</p>
          <pre>{JSON.stringify(sesiGym, null, 2)}</pre>
        </div>
      )}
    </main>
  )
}

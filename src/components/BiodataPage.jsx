import React, { useState } from "react";

export default function IsiBiodata() {
  // State tanpa type annotations
  const [namaLengkap, setNamaLengkap] = useState("");
  const [gender, setGender] = useState(null);
  const [tanggalLahir, setTanggalLahir] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [email, setEmail] = useState("");
  const [nomorTelepon, setNomorTelepon] = useState("");
  const [berat, setBerat] = useState("");
  const [tinggi, setTinggi] = useState("");

  // Date picker state
  const [tempDay, setTempDay] = useState(9);
  const [tempMonth, setTempMonth] = useState(4); // 0-indexed, 4 = Mei
  const [tempYear, setTempYear] = useState(2000);

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 50 }, (_, i) => 1980 + i);

  const handleDateDone = () => {
    setTanggalLahir(new Date(tempYear, tempMonth, tempDay));
    setShowDatePicker(false);
  };

  const formatDate = (date) => {
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex flex-col items-center px-4 py-6 relative">
      {/* Logo */}
      <div className="absolute top-4 right-4">
        <div className="w-12 h-12 flex items-center justify-center">
          <svg viewBox="0 0 60 60" className="w-full h-full">
            <circle cx="30" cy="30" r="28" fill="none" stroke="#1e3a5f" strokeWidth="1" strokeDasharray="2 2" />
            <g transform="translate(30, 30)">
              {[...Array(7)].map((_, i) => (
                <circle
                  key={i}
                  cx={Math.cos((i * 2 * Math.PI) / 7 - Math.PI / 2) * 20}
                  cy={Math.sin((i * 2 * Math.PI) / 7 - Math.PI / 2) * 20}
                  r="2"
                  fill="#1e3a5f"
                />
              ))}
            </g>
            <path
              d="M30 15 L30 35 M25 20 L30 15 L35 20 M22 35 L30 35 L38 35 M25 35 L25 45 M35 35 L35 45"
              stroke="#8b0000"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <p className="text-[8px] text-center text-blue-900 font-semibold">NUTRIGYM<br />CLUB</p>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-amber-500 mt-8 mb-6" style={{ fontFamily: "serif" }}>
        Isi Biodata
      </h1>

      {/* Informasi Pribadi Section */}
      <div className="w-full max-w-md mb-4">
        <div className="bg-gradient-to-b from-amber-200 to-amber-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-4 py-3">
            <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" />
                <path d="M12 14c-6 0-8 3-8 6v2h16v-2c0-3-2-6-8-6z" />
              </svg>
            </div>
            <span className="text-amber-800 font-semibold">Informasi Pribadi</span>
          </div>
          <div className="bg-white/80 rounded-2xl mx-2 mb-2 p-4 space-y-3">
            {/* Nama Lengkap */}
            <div className="flex items-center gap-3 bg-white rounded-full px-4 py-3 border border-gray-200">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" />
                <path d="M12 14c-6 0-8 3-8 6v2h16v-2c0-3-2-6-8-6z" />
              </svg>
              <input
                type="text"
                placeholder="Nama Lengkap"
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
                className="flex-1 bg-transparent outline-none text-gray-600 placeholder-gray-400"
              />
            </div>

            {/* Gender Selection */}
            <div className="flex gap-3">
              <button
                onClick={() => setGender("laki-laki")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full border transition-all ${
                  gender === "laki-laki"
                    ? "bg-amber-400 border-amber-400 text-white"
                    : "bg-white border-gray-200 text-gray-500"
                }`}
              >
                <span>Laki-laki</span>
              </button>
              <button
                onClick={() => setGender("perempuan")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full border transition-all ${
                  gender === "perempuan"
                    ? "bg-amber-400 border-amber-400 text-white"
                    : "bg-white border-gray-200 text-gray-500"
                }`}
              >
                <span>Perempuan</span>
              </button>
            </div>

            {/* Tanggal Lahir */}
            <button
              onClick={() => setShowDatePicker(true)}
              className="w-full flex items-center justify-between bg-white rounded-full px-4 py-3 border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" />
                </svg>
                <span className={tanggalLahir ? "text-gray-700" : "text-gray-400"}>
                  {tanggalLahir ? formatDate(tanggalLahir) : "Tanggal Lahir"}
                </span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Kontak Section */}
      <div className="w-full max-w-md mb-4">
        <div className="bg-gradient-to-b from-amber-200 to-amber-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-4 py-3">
            <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeWidth="2" />
              </svg>
            </div>
            <span className="text-amber-800 font-semibold">Kontak</span>
          </div>
          <div className="bg-white/80 rounded-2xl mx-2 mb-2 p-4 space-y-3">
            <div className="flex items-center gap-3 bg-white rounded-full px-4 py-3 border border-gray-200">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent outline-none text-gray-600 placeholder-gray-400"
              />
            </div>
            <div className="flex items-center gap-3 bg-white rounded-full px-4 py-3 border border-gray-200">
              <input
                type="tel"
                placeholder="Nomor Telepon"
                value={nomorTelepon}
                onChange={(e) => setNomorTelepon(e.target.value)}
                className="flex-1 bg-transparent outline-none text-gray-600 placeholder-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fisik Section */}
      <div className="w-full max-w-md mb-6">
        <div className="bg-gradient-to-b from-amber-200 to-amber-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-4 py-3">
            <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeWidth="2" />
              </svg>
            </div>
            <span className="text-amber-800 font-semibold">Fisik</span>
          </div>
          <div className="bg-white/80 rounded-2xl mx-2 mb-2 p-4">
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-3 bg-white rounded-full px-4 py-3 border border-gray-200">
                <input
                  type="number"
                  placeholder="Berat (kg)"
                  value={berat}
                  onChange={(e) => setBerat(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-gray-600 placeholder-gray-400 w-full"
                />
              </div>
              <div className="flex-1 flex items-center gap-3 bg-white rounded-full px-4 py-3 border border-gray-200">
                <input
                  type="number"
                  placeholder="Tinggi (cm)"
                  value={tinggi}
                  onChange={(e) => setTinggi(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-gray-600 placeholder-gray-400 w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button className="w-full max-w-md bg-amber-400 hover:bg-amber-500 text-white font-semibold py-4 rounded-full shadow-lg transition-all">
        Submit
      </button>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-t-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <button onClick={() => setShowDatePicker(false)} className="text-red-500 font-medium">Cancel</button>
              <span className="font-semibold text-gray-800">Tanggal Lahir</span>
              <button onClick={handleDateDone} className="text-gray-800 font-medium">Done</button>
            </div>
            <div className="flex h-52 relative">
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-10 bg-amber-100 rounded-lg pointer-events-none" />
              
              {/* Day */}
              <div className="flex-1 overflow-y-auto snap-y snap-mandatory scrollbar-hide">
                <div className="h-20" />
                {days.map(day => (
                  <div key={day} onClick={() => setTempDay(day)} className={`h-10 flex items-center justify-center snap-center cursor-pointer ${tempDay === day ? "text-gray-900 font-semibold" : "text-gray-400"}`}>
                    {day}
                  </div>
                ))}
                <div className="h-20" />
              </div>

              {/* Month */}
              <div className="flex-1 overflow-y-auto snap-y snap-mandatory scrollbar-hide">
                <div className="h-20" />
                {months.map((month, idx) => (
                  <div key={month} onClick={() => setTempMonth(idx)} className={`h-10 flex items-center justify-center snap-center cursor-pointer ${tempMonth === idx ? "text-gray-900 font-semibold" : "text-gray-400"}`}>
                    {month}
                  </div>
                ))}
                <div className="h-20" />
              </div>

              {/* Year */}
              <div className="flex-1 overflow-y-auto snap-y snap-mandatory scrollbar-hide">
                <div className="h-20" />
                {years.map(year => (
                  <div key={year} onClick={() => setTempYear(year)} className={`h-10 flex items-center justify-center snap-center cursor-pointer ${tempYear === year ? "text-gray-900 font-semibold" : "text-gray-400"}`}>
                    {year}
                  </div>
                ))}
                <div className="h-20" />
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
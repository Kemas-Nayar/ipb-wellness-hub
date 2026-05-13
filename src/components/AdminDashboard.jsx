import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import '../styles/AdminDashboard.css';

const fmt = (t) => t?.slice(0, 5).replace(':', '.') || '-';
const fmtDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d + 'T00:00:00');
  const days   = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'];
  return `${days[dt.getDay()]}, ${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
};

const getStatusClass = (status) => ({
  'checked-in': 'status-approved',
  hadir:        'status-approved',
  dibatalkan:   'status-rejected',
  cancelled:    'status-rejected',
}[status] ?? 'status-pending');

const getStatusLabel = (status) => ({
  'checked-in': 'Hadir',
  hadir:        'Hadir',
  dibatalkan:   'Dibatalkan',
  cancelled:    'Dibatalkan',
}[status] ?? 'Upcoming');

const AdminDashboard = ({ onNavigate }) => {
  const [list,    setList]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data, error: err } = await supabase
        .from('reservations')
        .select('id, user_id, date, start_time, end_time, gym_name, notes, status, checked_in_at, created_at')
        .order('date',       { ascending: false })
        .order('start_time', { ascending: false });
      if (err) throw err;
      setList(data || []);
    } catch (e) {
      setError('Gagal memuat data: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('admin-reservations')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'reservations' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setList(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setList(prev => prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r));
          } else if (payload.eventType === 'DELETE') {
            setList(prev => prev.filter(r => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const updateStatus = async (id, newStatus) => {
    const update = { status: newStatus };
    if (newStatus === 'checked-in') update.checked_in_at = new Date().toISOString();

    const { error: err } = await supabase
      .from('reservations')
      .update(update)
      .eq('id', id);

    if (err) { alert('Gagal update: ' + err.message); return; }
    setList(prev => prev.map(r => r.id === id ? { ...r, ...update } : r));
  };

  const deleteReservation = async (id) => {
    if (!window.confirm('Hapus reservasi ini?')) return;
    const { error: err } = await supabase.from('reservations').delete().eq('id', id);
    if (err) { alert('Gagal hapus: ' + err.message); return; }
    setList(prev => prev.filter(r => r.id !== id));
  };

  const filtered = list.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.notes?.toLowerCase().includes(q) ||
      r.gym_name?.toLowerCase().includes(q) ||
      r.date?.includes(q) ||
      r.status?.toLowerCase().includes(q)
    );
  });

  const stats = {
    total:    list.length,
    hadir:    list.filter(r => r.status === 'checked-in' || r.status === 'hadir').length,
    upcoming: list.filter(r => !r.status || r.status === 'upcoming').length,
  };

  return (
    <div className="admin-page">
      <div className="admin-sidebar">
        <h2>IPB Wellness Admin</h2>
        <ul className="admin-menu">
          <li className="active">Reservasi</li>
        </ul>
        <button className="admin-logout-btn" onClick={() => onNavigate('home')}>
          ← Kembali
        </button>
      </div>

      <div className="admin-content">
        <div className="admin-header">
          <h1>Daftar Reservasi Gym</h1>
          <button className="refresh-btn" onClick={fetchData}>🔄 Segarkan</button>
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:12, marginBottom:16 }}>
          {[
            { label:'Total', val: stats.total,    color:'#2F5DAA' },
            { label:'Hadir', val: stats.hadir,    color:'#27AE60' },
            { label:'Upcoming', val: stats.upcoming, color:'#F2994A' },
          ].map(s => (
            <div key={s.label} style={{ flex:1, background:'#fff', borderRadius:10,
              padding:'12px 16px', boxShadow:'0 1px 4px rgba(0,0,0,.08)' }}>
              <p style={{ fontSize:22, fontWeight:800, color:s.color, margin:0 }}>{s.val}</p>
              <p style={{ fontSize:11, color:'#888', margin:0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <input
          placeholder="Cari sesi, tanggal, status..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width:'100%', padding:'8px 12px', border:'1px solid #e5e5e5',
            borderRadius:8, fontSize:13, marginBottom:12, boxSizing:'border-box' }}
        />

        {error && <p style={{ color:'#C8102E', marginBottom:12 }}>{error}</p>}

        <div className="admin-card">
          {loading ? (
            <p style={{ padding:24, textAlign:'center', color:'#999' }}>Memuat data...</p>
          ) : filtered.length === 0 ? (
            <p style={{ padding:24, textAlign:'center', color:'#999' }}>Tidak ada data</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Sesi</th>
                  <th>Gym</th>
                  <th>Check-in</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>{fmtDate(item.date)}</td>
                    <td>{fmt(item.start_time)} – {fmt(item.end_time)}</td>
                    <td>{item.gym_name || item.notes || '-'}</td>
                    <td style={{ fontSize:11, color:'#27AE60' }}>
                      {item.checked_in_at
                        ? new Date(item.checked_in_at).toLocaleTimeString('id-ID',
                            { hour:'2-digit', minute:'2-digit' })
                        : '-'}
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="action-btn approve"
                        onClick={() => updateStatus(item.id, 'checked-in')}
                        disabled={item.status === 'checked-in' || item.status === 'hadir'}
                      >
                        Tandai Hadir
                      </button>
                      <button
                        className="action-btn reject"
                        onClick={() => updateStatus(item.id, 'dibatalkan')}
                        disabled={item.status === 'dibatalkan'}
                        style={{ marginLeft:4 }}
                      >
                        Batalkan
                      </button>
                      <button
                        onClick={() => deleteReservation(item.id)}
                        style={{ marginLeft:4, background:'none', border:'1px solid #ddd',
                          borderRadius:6, padding:'4px 8px', cursor:'pointer', fontSize:11, color:'#999' }}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
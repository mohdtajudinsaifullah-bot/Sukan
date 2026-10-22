import React, { useState, useEffect } from 'react';
import { Trophy, Medal, RefreshCw, Lock, LogOut, Plus, Edit, Trash2, Award } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "https://script.google.com/macros/s/AKfycbxDbzkwtItpfcg1rrE8z9rAZSB86ceKOdmS8osgYcg-KSdIk4KisMfXJxJKqoCYxNcnfg/exec";

export default function App() {
  const [activeTab, setActiveTab] = useState('public');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSukan, setSelectedSukan] = useState('');

  const [sukanList, setSukanList] = useState([]);
  const [jadualList, setJadualList] = useState([]);

  // State Form Admin
  const [newSukan, setNewSukan] = useState({ id: '', nama: '', kategori: '', status: 'Belum Mula' });
  const [isEditSukan, setIsEditSukan] = useState(false);
  const [newJadual, setNewJadual] = useState({ sukan: '', peringkat: 'Separuh Akhir 1', pasukanA: '', pasukanB: '', skorA: 0, skorB: 0, pemenang: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();

      if (data.sukan && data.sukan.length > 1) {
        const formattedSukan = data.sukan.slice(1).map(row => ({ id: row[0], nama: row[1], kategori: row[2], status: row[3] }));
        setSukanList(formattedSukan);
        if (formattedSukan.length > 0 && !selectedSukan) {
          setSelectedSukan(formattedSukan[0].nama);
        }
      } else {
        setSukanList([]);
      }

      if (data.jadual && data.jadual.length > 1) {
        const loadedJadual = data.jadual.slice(1).map(row => ({
          id: row[0], sukan: row[1], peringkat: row[2], pasukanA: row[3], pasukanB: row[4], skorA: Number(row[5] || 0), skorB: Number(row[6] || 0), pemenang: row[7]
        }));
        setJadualList(loadedJadual);

        const defaultSukan = selectedSukan || (data.sukan[1] && data.sukan[1][1]) || '';
        if (defaultSukan) {
          populateFormWithExistingData(defaultSukan, 'Separuh Akhir 1', loadedJadual);
        }
      } else {
        setJadualList([]);
      }
    } catch (err) {
      console.error("Ralat ambil data:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // AUTO-KIRA CARTA PUNGUTAN PINGAT & MATA DARI JADUAL PERLAWANAN
  const calculateLeaderboard = () => {
    const teams = {};

    const initTeam = (tName) => {
      if (!tName || tName === 'TBD' || tName === 'Seri') return;
      if (!teams[tName]) {
        teams[tName] = { pasukan: tName, emas: 0, perak: 0, gangsa: 0, mata: 0 };
      }
    };

    // Ambil semua perlawanan Akhir dan Tempat Ke-3
    sukanList.forEach(s => {
      const sJadual = jadualList.filter(j => j.sukan === s.nama);
      const matchAkhir = sJadual.find(j => j.peringkat === 'Akhir');
      const matchT3 = sJadual.find(j => j.peringkat === 'Tempat Ke-3');

      // Pengiraan Perlawanan Akhir (Emas & Perak)
      if (matchAkhir && matchAkhir.pemenang && matchAkhir.pemenang !== 'Seri') {
        const johan = matchAkhir.pemenang;
        const naibJohan = matchAkhir.pemenang === matchAkhir.pasukanA ? matchAkhir.pasukanB : matchAkhir.pasukanA;

        initTeam(johan);
        initTeam(naibJohan);

        if (teams[johan]) {
          teams[johan].emas += 1;
          teams[johan].mata += 5; // 5 mata untuk Emas
        }
        if (teams[naibJohan]) {
          teams[naibJohan].perak += 1;
          teams[naibJohan].mata += 3; // 3 mata untuk Perak
        }
      }

      // Pengiraan Tempat Ke-3 (Gangsa)
      if (matchT3 && matchT3.pemenang && matchT3.pemenang !== 'Seri') {
        const tempat3 = matchT3.pemenang;

        initTeam(tempat3);

        if (teams[tempat3]) {
          teams[tempat3].gangsa += 1;
          teams[tempat3].mata += 1; // 1 mata untuk Gangsa
        }
      }
    });

    return Object.values(teams).sort((a, b) => b.mata - a.mata || b.emas - a.emas || b.perak - a.perak);
  };

  const mataList = calculateLeaderboard();

  // Helper untuk Form Admin
  const populateFormWithExistingData = (sukanTarget, peringkatTarget, currentJadual = jadualList) => {
    const matched = currentJadual.find(j => j.sukan === sukanTarget && j.peringkat === peringkatTarget);
    const sf1Match = currentJadual.find(j => j.sukan === sukanTarget && j.peringkat === 'Separuh Akhir 1');
    const sf2Match = currentJadual.find(j => j.sukan === sukanTarget && j.peringkat === 'Separuh Akhir 2');

    const getLoserTeam = (m) => {
      if (!m || !m.pemenang || m.pemenang === 'Seri') return '';
      return m.pemenang === m.pasukanA ? m.pasukanB : m.pasukanA;
    };

    let pA = matched ? matched.pasukanA : '';
    let pB = matched ? matched.pasukanB : '';

    if (peringkatTarget === 'Akhir') {
      pA = matched?.pasukanA || sf1Match?.pemenang || '';
      pB = matched?.pasukanB || sf2Match?.pemenang || '';
    } else if (peringkatTarget === 'Tempat Ke-3') {
      pA = matched?.pasukanA || getLoserTeam(sf1Match);
      pB = matched?.pasukanB || getLoserTeam(sf2Match);
    }

    const sA = matched ? matched.skorA : 0;
    const sB = matched ? matched.skorB : 0;
    const win = calculateWinner(sA, sB, pA, pB);

    setNewJadual({
      sukan: sukanTarget,
      peringkat: peringkatTarget,
      pasukanA: pA,
      pasukanB: pB,
      skorA: sA,
      skorB: sB,
      pemenang: win
    });
  };

  const handleSukanSelectChange = (sukanVal) => {
    populateFormWithExistingData(sukanVal, newJadual.peringkat);
  };

  const handlePeringkatSelectChange = (peringkatVal) => {
    populateFormWithExistingData(newJadual.sukan, peringkatVal);
  };

  const calculateWinner = (sAVal, sBVal, pA, pB) => {
    const sA = Number(sAVal);
    const sB = Number(sBVal);
    if (sA > sB && pA) return pA;
    if (sB > sA && pB) return pB;
    if (sA === sB && (sA > 0 || sB > 0)) return 'Seri';
    return '';
  };

  const handleSkorChange = (skorAVal, skorBVal) => {
    const sA = Number(skorAVal);
    const sB = Number(skorBVal);
    const win = calculateWinner(sA, sB, newJadual.pasukanA, newJadual.pasukanB);

    setNewJadual(prev => ({
      ...prev,
      skorA: sA,
      skorB: sB,
      pemenang: win
    }));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'suk@njksm2026') setIsLoggedIn(true);
    else alert('Kata laluan salah!');
  };

  const handleAddSukan = async (e) => {
    e.preventDefault();
    setLoading(true);
    const actionType = isEditSukan ? 'updateSukan' : 'addSukan';
    const payload = {
      action: actionType,
      id: newSukan.id || ('SK' + Date.now().toString().slice(-4)),
      nama: newSukan.nama,
      kategori: newSukan.kategori,
      status: newSukan.status
    };

    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    setNewSukan({ id: '', nama: '', kategori: '', status: 'Belum Mula' });
    setIsEditSukan(false);
    await fetchData();
  };

  const handleDeleteSukan = async (id) => {
    if (!window.confirm("Adakah anda pasti nak padam sukan ini?")) return;
    setLoading(true);
    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'deleteSukan', id })
    });
    await fetchData();
  };

  const handleEditSukanClick = (sukan) => {
    setNewSukan(sukan);
    setIsEditSukan(true);
  };

  const handleAddJadual = async (e) => {
    e.preventDefault();
    setLoading(true);
    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'updateSkor', id: 'M' + Date.now().toString().slice(-4), ...newJadual })
    });
    await fetchData();
  };

  // Logik Bracket Awam
  const viewJadual = jadualList.filter(j => j.sukan === selectedSukan);
  const viewSF1 = viewJadual.find(j => j.peringkat === 'Separuh Akhir 1') || { pasukanA: '', pasukanB: '', skorA: 0, skorB: 0, pemenang: '' };
  const viewSF2 = viewJadual.find(j => j.peringkat === 'Separuh Akhir 2') || { pasukanA: '', pasukanB: '', skorA: 0, skorB: 0, pemenang: '' };

  const getLoser = (match) => {
    if (!match.pemenang || match.pemenang === 'Seri') return '';
    return match.pemenang === match.pasukanA ? match.pasukanB : match.pasukanA;
  };

  const viewAkhir = viewJadual.find(j => j.peringkat === 'Akhir') || { 
    pasukanA: viewSF1.pemenang || '', 
    pasukanB: viewSF2.pemenang || '', 
    skorA: 0, skorB: 0, pemenang: '' 
  };

  const viewT3 = viewJadual.find(j => j.peringkat === 'Tempat Ke-3') || { 
    pasukanA: getLoser(viewSF1) || '', 
    pasukanB: getLoser(viewSF2) || '', 
    skorA: 0, skorB: 0, pemenang: '' 
  };

  // Cari Kedudukan Akhir Pemenang Acara Sukan
  const johanSukan = viewAkhir.pemenang && viewAkhir.pemenang !== 'Seri' ? viewAkhir.pemenang : '-';
  const naibJohanSukan = viewAkhir.pemenang && viewAkhir.pemenang !== 'Seri' ? (viewAkhir.pemenang === viewAkhir.pasukanA ? viewAkhir.pasukanB : viewAkhir.pasukanA) : '-';
  const tempatKe3Sukan = viewT3.pemenang && viewT3.pemenang !== 'Seri' ? viewT3.pemenang : '-';
  const tempatKe4Sukan = viewT3.pemenang && viewT3.pemenang !== 'Seri' ? (viewT3.pemenang === viewT3.pasukanA ? viewT3.pasukanB : viewT3.pasukanA) : '-';

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <header className="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Trophy className="text-yellow-400 w-8 h-8" />
            <h1 className="text-xl font-bold tracking-wide">KEJOHANAN SUKAN TAHUNAN JKSM</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setActiveTab('public')} className={`px-4 py-2 rounded-lg font-semibold ${activeTab === 'public' ? 'bg-blue-600' : 'bg-slate-700'}`}>
              Keputusan
            </button>
            <button onClick={() => setActiveTab('admin')} className={`px-4 py-2 rounded-lg font-semibold ${activeTab === 'admin' ? 'bg-emerald-600' : 'bg-slate-700'}`}>
              Admin Portal
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
        {activeTab === 'public' && (
          <>
            {/* CARTA PUNGUTAN PINGAT & MATA AUTOMATIK */}
            <section className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-400">
                <Medal /> CARTA PUNGUTAN PINGAT & MATA TERKINI
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="p-3">Kedudukan</th>
                      <th className="p-3">Pasukan</th>
                      <th className="p-3 text-center">🥇 Emas</th>
                      <th className="p-3 text-center">🥈 Perak</th>
                      <th className="p-3 text-center">🥉 Gangsa</th>
                      <th className="p-3 text-right">Jumlah Mata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mataList.length > 0 ? mataList.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="p-3 font-bold text-slate-300">#{idx + 1}</td>
                        <td className="p-3 font-semibold">{item.pasukan}</td>
                        <td className="p-3 text-center font-bold text-yellow-400">{item.emas}</td>
                        <td className="p-3 text-center font-bold text-slate-300">{item.perak}</td>
                        <td className="p-3 text-center font-bold text-amber-600">{item.gangsa}</td>
                        <td className="p-3 text-right font-black text-xl text-emerald-400">{item.mata}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="6" className="text-center p-4 text-slate-500">Belum ada perlawanan tamat. Kemaskini skor di Admin Portal.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* BRACKET PERLAWANAN */}
            <section className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-blue-400">⚽ CARTA PERLAWANAN (KALAH MATI)</h2>
                {sukanList.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-400">Pilih Acara:</span>
                    <select 
                      value={selectedSukan} 
                      onChange={(e) => setSelectedSukan(e.target.value)}
                      className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-white font-bold"
                    >
                      {sukanList.map((s, i) => <option key={i} value={s.nama}>{s.nama}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 overflow-x-auto">
                <div className="min-w-[650px] grid grid-cols-2 gap-8 items-center">
                  
                  {/* SEPARUH AKHIR */}
                  <div className="space-y-8">
                    <h3 className="text-center font-black text-slate-400 tracking-wider">SEPARUH AKHIR</h3>
                    
                    <div className="bg-slate-900 border-2 border-slate-700 rounded-lg p-3 shadow-md space-y-2 min-h-[80px]">
                      <div className="flex justify-between items-center">
                        <span className={`font-bold ${viewSF1.pemenang && viewSF1.pemenang === viewSF1.pasukanA ? 'text-yellow-400' : 'text-slate-200'}`}>{viewSF1.pasukanA || '-'}</span>
                        <span className="bg-slate-800 px-3 py-1 rounded font-bold text-amber-400">{viewSF1.skorA || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`font-bold ${viewSF1.pemenang && viewSF1.pemenang === viewSF1.pasukanB ? 'text-yellow-400' : 'text-slate-200'}`}>{viewSF1.pasukanB || '-'}</span>
                        <span className="bg-slate-800 px-3 py-1 rounded font-bold text-amber-400">{viewSF1.skorB || 0}</span>
                      </div>
                    </div>

                    <div className="bg-slate-900 border-2 border-slate-700 rounded-lg p-3 shadow-md space-y-2 min-h-[80px]">
                      <div className="flex justify-between items-center">
                        <span className={`font-bold ${viewSF2.pemenang && viewSF2.pemenang === viewSF2.pasukanA ? 'text-yellow-400' : 'text-slate-200'}`}>{viewSF2.pasukanA || '-'}</span>
                        <span className="bg-slate-800 px-3 py-1 rounded font-bold text-amber-400">{viewSF2.skorA || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`font-bold ${viewSF2.pemenang && viewSF2.pemenang === viewSF2.pasukanB ? 'text-yellow-400' : 'text-slate-200'}`}>{viewSF2.pasukanB || '-'}</span>
                        <span className="bg-slate-800 px-3 py-1 rounded font-bold text-amber-400">{viewSF2.skorB || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* AKHIR & TEMPAT KE-3 / KE-4 */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-center font-black text-yellow-400 tracking-wider mb-2">🥇 PERLAWANAN AKHIR</h3>
                      <div className="bg-slate-900 border-2 border-yellow-500/50 rounded-lg p-3 shadow-xl space-y-2 min-h-[80px]">
                        <div className="flex justify-between items-center">
                          <span className={`font-bold ${viewAkhir.pemenang && viewAkhir.pemenang === viewAkhir.pasukanA ? 'text-yellow-400' : 'text-slate-200'}`}>{viewAkhir.pasukanA || ''}</span>
                          <span className="bg-slate-800 px-3 py-1 rounded font-bold text-amber-400">{viewAkhir.pasukanA ? viewAkhir.skorA : '-'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`font-bold ${viewAkhir.pemenang && viewAkhir.pemenang === viewAkhir.pasukanB ? 'text-yellow-400' : 'text-slate-200'}`}>{viewAkhir.pasukanB || ''}</span>
                          <span className="bg-slate-800 px-3 py-1 rounded font-bold text-amber-400">{viewAkhir.pasukanB ? viewAkhir.skorB : '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-center font-black text-amber-600 tracking-wider mb-2">🥉 TEMPAT KE-3 & KE-4</h3>
                      <div className="bg-slate-900 border-2 border-amber-700/40 rounded-lg p-3 shadow-lg space-y-2 min-h-[80px]">
                        <div className="flex justify-between items-center">
                          <span className={`font-bold ${viewT3.pemenang && viewT3.pemenang === viewT3.pasukanA ? 'text-yellow-400' : 'text-slate-200'}`}>{viewT3.pasukanA || ''}</span>
                          <span className="bg-slate-800 px-3 py-1 rounded font-bold text-amber-400">{viewT3.pasukanA ? viewT3.skorA : '-'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`font-bold ${viewT3.pemenang && viewT3.pemenang === viewT3.pasukanB ? 'text-yellow-400' : 'text-slate-200'}`}>{viewT3.pasukanB || ''}</span>
                          <span className="bg-slate-800 px-3 py-1 rounded font-bold text-amber-400">{viewT3.pasukanB ? viewT3.skorB : '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* RINGKASAN PEMENANG KEDUDUKAN AKHIR ACA RA SUKAN */}
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-700">
                <h3 className="text-md font-bold text-emerald-400 mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" /> KEDUDUKAN AKHIR ({selectedSukan.toUpperCase()})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-800/80 p-3 rounded-lg border border-yellow-500/40 text-center">
                    <span className="text-xs text-slate-400 uppercase font-bold block">🥇 JOHAN</span>
                    <span className="text-lg font-black text-yellow-400">{johanSukan}</span>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-400/40 text-center">
                    <span className="text-xs text-slate-400 uppercase font-bold block">🥈 NAIB JOHAN</span>
                    <span className="text-lg font-black text-slate-200">{naibJohanSukan}</span>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-lg border border-amber-600/40 text-center">
                    <span className="text-xs text-slate-400 uppercase font-bold block">🥉 TEMPAT KE-3</span>
                    <span className="text-lg font-black text-amber-500">{tempatKe3Sukan}</span>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-600/40 text-center">
                    <span className="text-xs text-slate-400 uppercase font-bold block">TEMPAT KE-4</span>
                    <span className="text-lg font-black text-slate-400">{tempatKe4Sukan}</span>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ADMIN PORTAL */}
        {activeTab === 'admin' && (
          !isLoggedIn ? (
            <div className="max-w-md mx-auto bg-slate-800 p-8 rounded-xl border border-slate-700 text-center shadow-2xl">
              <Lock className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-4">Log Masuk Admin</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <input 
                  type="password" 
                  placeholder="Masukkan Kata Laluan" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-lg font-bold">
                  Log Masuk
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-emerald-400">Panel Kawalan Admin</h2>
                <button onClick={() => setIsLoggedIn(false)} className="flex items-center gap-1 bg-rose-600 px-3 py-1.5 rounded-lg text-sm font-bold">
                  <LogOut className="w-4 h-4" /> Keluar
                </button>
              </div>

              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Plus className="text-emerald-400" /> {isEditSukan ? 'Kemaskini Sukan' : 'Tambah Acara Sukan'}
                </h3>
                <form onSubmit={handleAddSukan} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input 
                    type="text" 
                    placeholder="Nama Sukan (cth: Bola Sepak)" 
                    value={newSukan.nama} 
                    onChange={(e) => setNewSukan({...newSukan, nama: e.target.value})} 
                    required 
                    className="p-3 bg-slate-900 border border-slate-700 rounded-lg" 
                  />
                  <input 
                    type="text" 
                    placeholder="Kategori (cth: Lelaki A)" 
                    value={newSukan.kategori} 
                    onChange={(e) => setNewSukan({...newSukan, kategori: e.target.value})} 
                    required 
                    className="p-3 bg-slate-900 border border-slate-700 rounded-lg" 
                  />
                  <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 font-bold p-3 rounded-lg">
                    {isEditSukan ? 'Kemaskini Sukan' : 'Simpan Sukan'}
                  </button>
                </form>

                <div className="mt-4 border-t border-slate-700 pt-4">
                  <h4 className="text-sm font-bold text-slate-400 mb-2">Senarai Sukan Sedia Ada:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sukanList.map((s) => (
                      <div key={s.id} className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white">{s.nama}</p>
                          <p className="text-xs text-slate-400">{s.kategori}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleEditSukanClick(s)} className="p-2 bg-blue-600/30 text-blue-400 hover:bg-blue-600/50 rounded-lg" title="Kemaskini">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteSukan(s.id)} className="p-2 bg-rose-600/30 text-rose-400 hover:bg-rose-600/50 rounded-lg" title="Padam">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Plus className="text-emerald-400" /> Kemaskini Perlawanan / Bracket
                </h3>
                <form onSubmit={handleAddJadual} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Acara Sukan</label>
                      <select 
                        value={newJadual.sukan} 
                        onChange={(e) => handleSukanSelectChange(e.target.value)} 
                        required 
                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg"
                      >
                        {sukanList.map((s, i) => <option key={i} value={s.nama}>{s.nama}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Peringkat</label>
                      <select 
                        value={newJadual.peringkat} 
                        onChange={(e) => handlePeringkatSelectChange(e.target.value)} 
                        required 
                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg"
                      >
                        <option value="Separuh Akhir 1">Separuh Akhir 1</option>
                        <option value="Separuh Akhir 2">Separuh Akhir 2</option>
                        <option value="Akhir">Akhir (Johan / Naib Johan)</option>
                        <option value="Tempat Ke-3">Tempat Ke-3 & Ke-4</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-2 space-y-3">
                      <div className="flex gap-2 items-center">
                        <input 
                          type="text" 
                          placeholder="Pasukan A" 
                          value={newJadual.pasukanA} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewJadual(prev => ({ 
                              ...prev, 
                              pasukanA: val, 
                              pemenang: calculateWinner(prev.skorA, prev.skorB, val, prev.pasukanB) 
                            }));
                          }} 
                          required 
                          className="w-3/4 p-3 bg-slate-900 border border-slate-700 rounded-lg" 
                        />
                        <input 
                          type="number" 
                          value={newJadual.skorA} 
                          onChange={(e) => handleSkorChange(e.target.value, newJadual.skorB)} 
                          className="w-1/4 p-3 bg-slate-900 border border-slate-700 rounded-lg text-center font-bold" 
                        />
                      </div>

                      <div className="flex gap-2 items-center">
                        <input 
                          type="text" 
                          placeholder="Pasukan B" 
                          value={newJadual.pasukanB} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewJadual(prev => ({ 
                              ...prev, 
                              pasukanB: val, 
                              pemenang: calculateWinner(prev.skorA, prev.skorB, prev.pasukanA, val) 
                            }));
                          }} 
                          required 
                          className="w-3/4 p-3 bg-slate-900 border border-slate-700 rounded-lg" 
                        />
                        <input 
                          type="number" 
                          value={newJadual.skorB} 
                          onChange={(e) => handleSkorChange(newJadual.skorA, e.target.value)} 
                          className="w-1/4 p-3 bg-slate-900 border border-slate-700 rounded-lg text-center font-bold" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-emerald-400 mb-1">Pemenang Automatik</label>
                      <div className="p-7 bg-slate-950 border border-emerald-500/50 rounded-lg text-emerald-400 font-bold text-center">
                        {newJadual.pemenang || 'Auto berdasarkan skor'}
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold p-3 rounded-lg">
                    {loading ? 'Menghantar...' : 'Kemaskini Perlawanan'}
                  </button>
                </form>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}
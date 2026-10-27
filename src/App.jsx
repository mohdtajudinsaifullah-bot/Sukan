import React, { useState, useEffect } from 'react';
import { Trophy, Medal, RefreshCw, Lock, LogOut, Plus, Edit, Trash2, Award, UserPlus, Dices, Play, Forward, Printer, RotateCcw, ShieldCheck, UserCheck } from 'lucide-react';

const API_URL = "https://script.google.com/macros/s/AKfycbxDbzkwtItpfcg1rrE8z9rAZSB86ceKOdmS8osgYcg-KSdIk4KisMfXJxJKqoCYxNcnfg/exec";

export default function App() {
  const [activeTab, setActiveTab] = useState('public'); // 'public', 'undian', 'admin'
  const [loading, setLoading] = useState(false);
  const [selectedSukan, setSelectedSukan] = useState('');

  // Sesi Pengguna Admin
  const [currentUser, setCurrentUser] = useState(null); // { email, name, role, allowedSports }
  const [inputEmail, setInputEmail] = useState('');
  const [loginError, setLoginError] = useState('');

  // Data Senarai Utama
  const [sukanList, setSukanList] = useState([]);
  const [jadualList, setJadualList] = useState([]);
  const [bolingList, setBolingList] = useState([]);
  const [bolingIndividuList, setBolingIndividuList] = useState([]);
  const [adminList, setAdminList] = useState([]);

  // Data Undian
  const [tournamentDraws, setTournamentDraws] = useState({});
  const [teams, setTeams] = useState(["Merah", "Biru", "Hijau", "Kuning"]);
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedSportUndian, setSelectedSportUndian] = useState('');
  const [groupCountUndian, setGroupCountUndian] = useState(2);
  const [drawDisplay, setDrawDisplay] = useState('-- SEDIA --');
  const [drawStatusLabel, setDrawStatusLabel] = useState('MENUNGGU CABUTAN BERMULA');
  const [isRolling, setIsRolling] = useState(false);

  // Form State Admin Sukan & Skor
  const [newSukan, setNewSukan] = useState({ id: '', nama: '', kategori: '', status: 'Belum Mula' });
  const [isEditSukan, setIsEditSukan] = useState(false);
  const [formatSukan, setFormatSukan] = useState('kalah_mati');
  const [newJadual, setNewJadual] = useState({ sukan: '', peringkat: 'Separuh Akhir 1', pasukanA: '', pasukanB: '', skorA: 0, skorB: 0, pemenang: '' });

  // Form Daftar Admin Baharu (Oleh Master Admin)
  const [newAdmin, setNewAdmin] = useState({ email: '', name: '', role: 'SUKAN', allowedSports: '' });

  const [bolingPasukanRows, setBolingPasukanRows] = useState([
    { pasukan: 'Pasukan Merah', jumlahPin: 0 },
    { pasukan: 'Pasukan Biru', jumlahPin: 0 }
  ]);
  const [bolingIndividuRows, setBolingIndividuRows] = useState([
    { namaPemain: '', pasukan: '', pinIndividu: 0 }
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();

      if (data && data.sukan && data.sukan.length > 1) {
        const formattedSukan = data.sukan.slice(1).map(row => ({ 
          id: String(row[0] || ''), nama: String(row[1] || ''), kategori: String(row[2] || ''), status: String(row[3] || '') 
        })).filter(s => s.nama.trim() !== '');

        setSukanList(formattedSukan);
        if (formattedSukan.length > 0) {
          const firstSport = formattedSukan[0].nama;
          setSelectedSukan(prev => prev || firstSport);
          setSelectedSportUndian(prev => prev || firstSport);
        }
      }

      if (data && data.jadual && data.jadual.length > 1) {
        setJadualList(data.jadual.slice(1).map(row => ({
          id: String(row[0] || ''), sukan: String(row[1] || ''), peringkat: String(row[2] || ''), 
          pasukanA: String(row[3] || ''), pasukanB: String(row[4] || ''), skorA: Number(row[5] || 0), 
          skorB: Number(row[6] || 0), pemenang: String(row[7] || '')
        })).filter(j => j.sukan.trim() !== ''));
      }

      if (data && data.boling && data.boling.length > 1) {
        setBolingList(data.boling.slice(1).map(row => ({
          id: String(row[0] || ''), sukan: String(row[1] || ''), pasukan: String(row[2] || ''), jumlahPin: Number(row[3] || 0)
        })).filter(b => b.sukan.trim() !== ''));
      }

      if (data && data.bolingIndividu && data.bolingIndividu.length > 1) {
        setBolingIndividuList(data.bolingIndividu.slice(1).map(row => ({
          id: String(row[0] || ''), sukan: String(row[1] || ''), namaPemain: String(row[2] || ''), pasukan: String(row[3] || ''), pinIndividu: Number(row[4] || 0)
        })).filter(bi => bi.sukan.trim() !== ''));
      }

      if (data && data.undian && data.undian.length > 1) {
        const newDraws = {};
        data.undian.slice(1).forEach(row => {
          const sp = String(row[1] || '').trim();
          const gr = String(row[2] || '').trim();
          const tm = String(row[3] || '').trim();
          if (sp && gr && tm) {
            if (!newDraws[sp]) newDraws[sp] = {};
            if (!newDraws[sp][gr]) newDraws[sp][gr] = [];
            if (!newDraws[sp][gr].includes(tm)) newDraws[sp][gr].push(tm);
          }
        });
        setTournamentDraws(newDraws);
      }

      if (data && data.admins && data.admins.length > 1) {
        setAdminList(data.admins.slice(1).map(row => ({
          email: String(row[0] || ''), name: String(row[1] || ''), role: String(row[2] || ''), allowedSports: String(row[3] || '')
        })));
      }
    } catch (err) {
      console.error("Ralat ambil data:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    const saved = localStorage.getItem('jksm_user_session');
    if (saved) {
      try { setCurrentUser(JSON.parse(saved)); } catch (e) {}
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedSukan.toLowerCase().includes('boling') || selectedSukan.toLowerCase().includes('bowling')) {
      setFormatSukan('boling');
    }
  }, [selectedSukan]);

  // Log In Semakan Emel
  const handleLoginByEmail = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!inputEmail.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=checkLogin&email=${encodeURIComponent(inputEmail.trim())}`);
      const data = await res.json();

      if (data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('jksm_user_session', JSON.stringify(data.user));
        setInputEmail('');
      } else {
        setLoginError('Emel tidak dijumpai dalam rekod Helaian Admin! Sila hubungi Master Admin.');
      }
    } catch (err) {
      setLoginError('Ralat rangkaian semasa memeriksa emel.');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('jksm_user_session');
  };

  // Penapisan Sukan Mengikut Kelayakan Admin Sukan
  const getAllowedSportsList = () => {
    if (!currentUser) return [];
    if (currentUser.role === 'MASTER') return sukanList;
    if (currentUser.role === 'SUKAN') {
      const allowed = currentUser.allowedSports.split(',').map(s => s.trim().toLowerCase());
      return sukanList.filter(s => allowed.includes(s.nama.toLowerCase()) || allowed.includes('semua'));
    }
    return [];
  };

  const allowedSportsForAdmin = getAllowedSportsList();

  // Kemaskini Dropdown jika admin sukan tiada akses pada sukan semasa
  useEffect(() => {
    if (currentUser && currentUser.role === 'SUKAN' && allowedSportsForAdmin.length > 0) {
      if (!allowedSportsForAdmin.some(s => s.nama === selectedSukan)) {
        setSelectedSukan(allowedSportsForAdmin[0].nama);
      }
    }
  }, [currentUser, allowedSportsForAdmin]);

  // Logik Skor & Pemenang
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
    setNewJadual(prev => ({ ...prev, skorA: sA, skorB: sB, pemenang: win }));
  };

  // Carta Pungutan Pingat
  const calculateLeaderboard = () => {
    const leaderTeams = {};
    const initTeam = (tName) => {
      if (!tName || tName === 'TBD' || tName === 'Seri' || tName === '-') return;
      if (!leaderTeams[tName]) leaderTeams[tName] = { pasukan: tName, emas: 0, perak: 0, gangsa: 0, mata: 0 };
    };

    sukanList.forEach(s => {
      if (s.nama.toLowerCase().includes('boling') || s.nama.toLowerCase().includes('bowling')) {
        const bRows = bolingList.filter(b => b.sukan === s.nama).sort((a, b) => b.jumlahPin - a.jumlahPin);
        if (bRows[0] && bRows[0].jumlahPin > 0) { initTeam(bRows[0].pasukan); leaderTeams[bRows[0].pasukan].emas += 1; leaderTeams[bRows[0].pasukan].mata += 5; }
        if (bRows[1] && bRows[1].jumlahPin > 0) { initTeam(bRows[1].pasukan); leaderTeams[bRows[1].pasukan].perak += 1; leaderTeams[bRows[1].pasukan].mata += 3; }
        if (bRows[2] && bRows[2].jumlahPin > 0) { initTeam(bRows[2].pasukan); leaderTeams[bRows[2].pasukan].gangsa += 1; leaderTeams[bRows[2].pasukan].mata += 1; }
      } else {
        const sJadual = jadualList.filter(j => j.sukan === s.nama);
        const matchAkhir = sJadual.find(j => j.peringkat === 'Akhir');
        const matchT3 = sJadual.find(j => j.peringkat === 'Tempat Ke-3');
        if (matchAkhir && matchAkhir.pemenang && matchAkhir.pemenang !== 'Seri') {
          const johan = matchAkhir.pemenang;
          const naib = matchAkhir.pemenang === matchAkhir.pasukanA ? matchAkhir.pasukanB : matchAkhir.pasukanA;
          initTeam(johan); initTeam(naib);
          if (leaderTeams[johan]) { leaderTeams[johan].emas += 1; leaderTeams[johan].mata += 5; }
          if (leaderTeams[naib]) { leaderTeams[naib].perak += 1; leaderTeams[naib].mata += 3; }
        }
        if (matchT3 && matchT3.pemenang && matchT3.pemenang !== 'Seri') {
          const t3 = matchT3.pemenang;
          initTeam(t3);
          if (leaderTeams[t3]) { leaderTeams[t3].gangsa += 1; leaderTeams[t3].mata += 1; }
        }
      }
    });

    return Object.values(leaderTeams).sort((a, b) => b.mata - a.mata || b.emas - a.emas || b.perak - a.perak);
  };
  const mataList = calculateLeaderboard();

  // Handler Hantar Data Skor
  const handleAddJadual = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(API_URL, {
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'updateSkor', id: 'M' + Date.now().toString().slice(-4), ...newJadual, sukan: selectedSukan })
      });
      setTimeout(() => fetchData(), 1200);
    } catch (err) { console.error(err); setLoading(false); }
  };

  const handleSaveBolingSeparate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(API_URL, {
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'updateBolingSeparate',
          sukan: selectedSukan,
          pasukanList: bolingPasukanRows,
          individuList: bolingIndividuRows
        })
      });
      setTimeout(() => fetchData(), 1200);
    } catch (err) { console.error(err); setLoading(false); }
  };

  // Handler Master Admin Mengurus Admin Lain
  const handleSaveNewAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(API_URL, {
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'saveAdminUser', ...newAdmin })
      });
      setNewAdmin({ email: '', name: '', role: 'SUKAN', allowedSports: '' });
      setTimeout(() => fetchData(), 1200);
    } catch (err) { console.error(err); setLoading(false); }
  };

  const handleDeleteAdmin = async (email) => {
    if (!window.confirm(`Adakah anda pasti mahu memadam admin ${email}?`)) return;
    setLoading(true);
    try {
      await fetch(API_URL, {
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'deleteAdminUser', email: email })
      });
      setTimeout(() => fetchData(), 1200);
    } catch (err) { console.error(err); setLoading(false); }
  };

  // Kebenaran Cabutan Undian
  const canManageUndian = currentUser && (currentUser.role === 'MASTER' || currentUser.role === 'UNDIAN');

  const mulakanCabutan = () => {
    if (!canManageUndian) return alert("Hanya Master Admin atau Admin Pengundian yang dibenarkan menjalankan cabutan.");
    if (!selectedSportUndian) return alert("Sila pilih sukan terlebih dahulu!");
    if (teams.length < 2) return alert("Sila masukkan sekurang-kurangnya 2 pasukan!");

    const groupNames = [];
    for (let i = 0; i < groupCountUndian; i++) {
      groupNames.push(groupCountUndian === 1 ? "Liga Kumpulan" : `Kumpulan ${String.fromCharCode(65 + i)}`);
    }

    const currentSportDraws = tournamentDraws[selectedSportUndian] || {};
    groupNames.forEach(g => { if (!currentSportDraws[g]) currentSportDraws[g] = []; });

    const drawnTeams = [];
    groupNames.forEach(g => drawnTeams.push(...currentSportDraws[g]));
    const remainingTeams = teams.filter(t => !drawnTeams.includes(t));

    if (remainingTeams.length === 0) return alert(`Semua pasukan telah selesai diundi bagi sukan ${selectedSportUndian}!`);

    const maxPerGroup = Math.ceil(teams.length / groupCountUndian);
    const availableGroups = groupNames.filter(g => currentSportDraws[g].length < maxPerGroup);
    if (availableGroups.length === 0) return alert(`Semua kumpulan bagi sukan ${selectedSportUndian} telah penuh!`);

    availableGroups.sort((a, b) => currentSportDraws[a].length - currentSportDraws[b].length);
    const targetGroup = availableGroups[0];

    setIsRolling(true);
    setDrawStatusLabel(`MENCABUT UNTUK ${targetGroup.toUpperCase()}...`);

    const interval = setInterval(() => {
      setDrawDisplay(remainingTeams[Math.floor(Math.random() * remainingTeams.length)]);
    }, 70);

    setTimeout(async () => {
      clearInterval(interval);
      setIsRolling(false);
      const chosen = remainingTeams[Math.floor(Math.random() * remainingTeams.length)];
      
      const updatedSportDraws = { ...currentSportDraws, [targetGroup]: [...currentSportDraws[targetGroup], chosen] };
      const updatedAll = { ...tournamentDraws, [selectedSportUndian]: updatedSportDraws };
      
      setTournamentDraws(updatedAll);
      setDrawDisplay(`🎯 ${chosen}`);
      setDrawStatusLabel(`BERJAYA DIMASUKKAN KE ${targetGroup.toUpperCase()}!`);
      
      // Simpan ke Google Sheets
      const sportResults = [];
      Object.keys(updatedSportDraws).forEach(grp => {
        updatedSportDraws[grp].forEach(team => {
          sportResults.push({ sport: selectedSportUndian, group: grp, team: team });
        });
      });
      await fetch(API_URL, {
        method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveSportResults", sportName: selectedSportUndian, results: sportResults })
      });
    }, 1800);
  };

  // Paparan Data Kalah Mati & Boling
  const viewJadual = jadualList.filter(j => j.sukan === selectedSukan);
  const viewSF1 = viewJadual.find(j => j.peringkat === 'Separuh Akhir 1') || { pasukanA: '', pasukanB: '', skorA: 0, skorB: 0, pemenang: '' };
  const viewSF2 = viewJadual.find(j => j.peringkat === 'Separuh Akhir 2') || { pasukanA: '', pasukanB: '', skorA: 0, skorB: 0, pemenang: '' };
  const getLoser = (match) => (!match.pemenang || match.pemenang === 'Seri') ? '' : (match.pemenang === match.pasukanA ? match.pasukanB : match.pasukanA);
  const viewAkhir = viewJadual.find(j => j.peringkat === 'Akhir') || { pasukanA: viewSF1.pemenang || '', pasukanB: viewSF2.pemenang || '', skorA: 0, skorB: 0, pemenang: '' };
  const viewT3 = viewJadual.find(j => j.peringkat === 'Tempat Ke-3') || { pasukanA: getLoser(viewSF1) || '', pasukanB: getLoser(viewSF2) || '', skorA: 0, skorB: 0, pemenang: '' };

  const currentBolingList = bolingList.filter(b => b.sukan === selectedSukan).sort((a, b) => b.jumlahPin - a.jumlahPin);
  const currentIndividuList = bolingIndividuList.filter(bi => bi.sukan === selectedSukan).sort((a, b) => b.pinIndividu - a.pinIndividu);

  return (
    <div className="min-h-screen text-white font-sans relative overflow-x-hidden">
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/bg-sukan.png')" }} />
      <div className="fixed inset-0 z-0 bg-slate-950/20" />

      <div className="relative z-10">
        <header className="bg-slate-900/80 border-b border-slate-700/60 backdrop-blur-md p-4 sticky top-0 z-20">
          <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <Trophy className="text-yellow-400 w-8 h-8" />
              <div>
                <h1 className="text-lg md:text-xl font-black tracking-wide uppercase">SUKAN TAHUNAN JKSM 2026</h1>
                <p className="text-[11px] text-amber-400/90 font-medium">Jabatan Kehakiman Syariah Malaysia</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={fetchData} className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => setActiveTab('public')} className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition ${activeTab === 'public' ? 'bg-blue-600 shadow' : 'bg-slate-800/80 border border-slate-700'}`}>
                🏆 Keputusan
              </button>
              <button onClick={() => setActiveTab('undian')} className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition ${activeTab === 'undian' ? 'bg-amber-600 shadow' : 'bg-slate-800/80 border border-slate-700'}`}>
                🎲 Undian
              </button>
              <button onClick={() => setActiveTab('admin')} className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition ${activeTab === 'admin' ? 'bg-emerald-600 shadow' : 'bg-slate-800/80 border border-slate-700'}`}>
                ⚙️ Admin Portal
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
          
          {/* TAB 1: KEPUTUSAN */}
          {activeTab === 'public' && (
            <>
              <section className="bg-slate-900/60 p-6 rounded-xl border border-slate-700/50 shadow-2xl backdrop-blur-md">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-400">
                  <Medal /> CARTA PUNGUTAN PINGAT & MATA TERKINI
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700/80 text-slate-300">
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
                        <tr key={idx} className="border-b border-slate-700/40 hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-slate-300">#{idx + 1}</td>
                          <td className="p-3 font-semibold">{item.pasukan}</td>
                          <td className="p-3 text-center font-bold text-yellow-400">{item.emas}</td>
                          <td className="p-3 text-center font-bold text-slate-300">{item.perak}</td>
                          <td className="p-3 text-center font-bold text-amber-500">{item.gangsa}</td>
                          <td className="p-3 text-right font-black text-xl text-emerald-400">{item.mata}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan="6" className="text-center p-4 text-slate-300 font-medium">Belum ada perlawanan tamat.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Paparan Bracket / Boling */}
              <section className="bg-slate-900/60 p-6 rounded-xl border border-slate-700/50 shadow-2xl space-y-6 backdrop-blur-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-blue-400">
                    {formatSukan === 'boling' ? '🎳 KEDUDUKAN & CARTA JATUHAN PIN BOLING' : '⚽ CARTA PERLAWANAN (KALAH MATI)'}
                  </h2>
                  {sukanList.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-300">Pilih Acara:</span>
                      <select value={selectedSukan} onChange={(e) => setSelectedSukan(e.target.value)} className="bg-slate-950/80 border border-slate-700/80 p-2 rounded-lg text-white font-bold">
                        {sukanList.map((s, i) => <option key={i} value={s.nama}>{s.nama}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                {formatSukan === 'boling' ? (
                  <div className="space-y-6">
                    <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800/80">
                      <h3 className="text-md font-bold text-yellow-400 mb-4 uppercase">Kategori Berpasukan ({selectedSukan})</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-slate-700 text-slate-400 text-sm">
                              <th className="p-3">Rank</th>
                              <th className="p-3">Pasukan</th>
                              <th className="p-3 text-right">Jumlah Jatuhan Pin</th>
                              <th className="p-3 text-center">Status Pingat</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentBolingList.map((b, idx) => (
                              <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                                <td className="p-3 font-bold text-slate-300">#{idx + 1}</td>
                                <td className="p-3 font-semibold">{b.pasukan}</td>
                                <td className="p-3 text-right font-black text-amber-400 text-lg">{b.jumlahPin} Pin</td>
                                <td className="p-3 text-center">
                                  {idx === 0 && <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 px-3 py-1 rounded-full text-xs font-bold">🥇 JOHAN (EMAS)</span>}
                                  {idx === 1 && <span className="bg-slate-400/20 text-slate-300 border border-slate-400/40 px-3 py-1 rounded-full text-xs font-bold">🥈 NAIB JOHAN (PERAK)</span>}
                                  {idx === 2 && <span className="bg-amber-600/20 text-amber-500 border border-amber-600/40 px-3 py-1 rounded-full text-xs font-bold">🥉 TEMPAT KE-3 (GANGSA)</span>}
                                  {idx > 2 && <span className="text-slate-500 text-xs font-semibold">Tempat Ke-{idx + 1}</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800/80">
                      <h3 className="text-md font-bold text-emerald-400 mb-4 uppercase">Kategori Individu / High Game ({selectedSukan})</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-slate-700 text-slate-400 text-sm">
                              <th className="p-3">Kedudukan</th>
                              <th className="p-3">Nama Pemain</th>
                              <th className="p-3">Pasukan</th>
                              <th className="p-3 text-right">Skor Pin Individu</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentIndividuList.map((bi, idx) => (
                              <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                                <td className="p-3 font-bold text-slate-300">#{idx + 1}</td>
                                <td className="p-3 font-bold text-white">{bi.namaPemain}</td>
                                <td className="p-3 text-slate-400">{bi.pasukan || '-'}</td>
                                <td className="p-3 text-right font-black text-emerald-400 text-lg">{bi.pinIndividu} Pin</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800/80 overflow-x-auto">
                    <div className="min-w-[650px] grid grid-cols-2 gap-8 items-center">
                      <div className="space-y-8">
                        <h3 className="text-center font-black text-slate-300 tracking-wider">SEPARUH AKHIR</h3>
                        <div className="bg-slate-900/70 border border-slate-700/80 rounded-lg p-3 shadow-lg space-y-2 min-h-[80px]">
                          <div className="flex justify-between items-center"><span className="font-bold">{viewSF1.pasukanA || '-'}</span><span className="bg-slate-950/80 px-3 py-1 rounded font-bold text-amber-400">{viewSF1.skorA || 0}</span></div>
                          <div className="flex justify-between items-center"><span className="font-bold">{viewSF1.pasukanB || '-'}</span><span className="bg-slate-950/80 px-3 py-1 rounded font-bold text-amber-400">{viewSF1.skorB || 0}</span></div>
                        </div>
                        <div className="bg-slate-900/70 border border-slate-700/80 rounded-lg p-3 shadow-lg space-y-2 min-h-[80px]">
                          <div className="flex justify-between items-center"><span className="font-bold">{viewSF2.pasukanA || '-'}</span><span className="bg-slate-950/80 px-3 py-1 rounded font-bold text-amber-400">{viewSF2.skorA || 0}</span></div>
                          <div className="flex justify-between items-center"><span className="font-bold">{viewSF2.pasukanB || '-'}</span><span className="bg-slate-950/80 px-3 py-1 rounded font-bold text-amber-400">{viewSF2.skorB || 0}</span></div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <h3 className="text-center font-black text-yellow-400 tracking-wider mb-2">🥇 PERLAWANAN AKHIR</h3>
                          <div className="bg-slate-900/70 border-2 border-yellow-500/50 rounded-lg p-3 shadow-xl space-y-2 min-h-[80px]">
                            <div className="flex justify-between items-center"><span className="font-bold">{viewAkhir.pasukanA || ''}</span><span className="bg-slate-950/80 px-3 py-1 rounded font-bold text-amber-400">{viewAkhir.pasukanA ? viewAkhir.skorA : '-'}</span></div>
                            <div className="flex justify-between items-center"><span className="font-bold">{viewAkhir.pasukanB || ''}</span><span className="bg-slate-950/80 px-3 py-1 rounded font-bold text-amber-400">{viewAkhir.pasukanB ? viewAkhir.skorB : '-'}</span></div>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-center font-black text-amber-500 tracking-wider mb-2">🥉 TEMPAT KE-3 & KE-4</h3>
                          <div className="bg-slate-900/70 border-2 border-amber-600/40 rounded-lg p-3 shadow-lg space-y-2 min-h-[80px]">
                            <div className="flex justify-between items-center"><span className="font-bold">{viewT3.pasukanA || ''}</span><span className="bg-slate-950/80 px-3 py-1 rounded font-bold text-amber-400">{viewT3.pasukanA ? viewT3.skorA : '-'}</span></div>
                            <div className="flex justify-between items-center"><span className="font-bold">{viewT3.pasukanB || ''}</span><span className="bg-slate-950/80 px-3 py-1 rounded font-bold text-amber-400">{viewT3.pasukanB ? viewT3.skorB : '-'}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}

          {/* TAB 2: PENTAS UNDIAN */}
          {activeTab === 'undian' && (
            <div className="space-y-6">
              <section className="bg-slate-900/60 p-6 rounded-xl border border-slate-700/50 shadow-2xl backdrop-blur-md">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-lg md:text-xl font-black text-amber-400 flex items-center gap-2">
                      <Dices className="text-amber-300" /> Pentas Cabutan Undian Langsung
                    </h2>
                    <p className="text-xs text-slate-300">Pancaran cabutan rasmi untuk tontonan atlet & kontinjen.</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <select value={selectedSportUndian} onChange={(e) => setSelectedSportUndian(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold">
                      {sukanList.map((s, i) => <option key={i} value={s.nama}>{s.nama}</option>)}
                    </select>
                    <select value={groupCountUndian} onChange={(e) => setGroupCountUndian(Number(e.target.value))} className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold">
                      <option value="1">1 Kumpulan (Liga)</option>
                      <option value="2">2 Kumpulan (A & B)</option>
                      <option value="3">3 Kumpulan (A, B, C)</option>
                      <option value="4">4 Kumpulan (A, B, C, D)</option>
                    </select>
                  </div>
                </div>

                <div className={`bg-slate-950/90 border rounded-2xl p-6 text-center my-4 transition shadow-2xl ${isRolling ? 'border-amber-400 scale-[1.02]' : 'border-slate-800'}`}>
                  <div className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">{drawStatusLabel}</div>
                  <div className="text-3xl md:text-5xl font-black text-emerald-400 py-3 tracking-wide drop-shadow-md">{drawDisplay}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button onClick={mulakanCabutan} disabled={isRolling || !canManageUndian} className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-40">
                    <Play className="w-4 h-4" /> Mulakan Cabutan Rawak
                  </button>
                  <button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5">
                    <Printer className="w-4 h-4" /> Cetak / Simpan PDF
                  </button>
                </div>

                {!canManageUndian && (
                  <p className="text-center mt-3 text-xs text-amber-400/90 italic">
                    ℹ️ Mod Atlet / Tontonan: Hanya Master Admin atau Admin Pengundian boleh memulakan cabutan.
                  </p>
                )}
              </section>

              {/* Grid Keputusan Undian */}
              <section className="bg-slate-900/60 p-6 rounded-xl border border-slate-700/50 shadow-2xl backdrop-blur-md">
                <h3 className="text-lg font-bold text-white mb-4">Keputusan Rasmi Undian Kumpulan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sukanList.map((s, idx) => {
                    const spDraws = tournamentDraws[s.nama] || {};
                    const groupKeys = Object.keys(spDraws);

                    return (
                      <div key={idx} className="bg-slate-950/80 rounded-2xl p-4 shadow-xl border border-white/10 flex flex-col justify-between">
                        <div>
                          <div className="text-xs font-black text-amber-400 mb-3 uppercase tracking-wider flex items-center justify-between border-b border-white/10 pb-2">
                            <span>🏆 {s.nama}</span>
                            <span className="text-[10px] text-slate-300 font-semibold">{s.kategori}</span>
                          </div>

                          {groupKeys.length === 0 ? (
                            <div className="text-[11px] text-slate-400 italic px-3 py-2 bg-slate-900/50 rounded-lg text-center">
                              Belum dibuat undian
                            </div>
                          ) : (
                            groupKeys.map((grpName, gIdx) => (
                              <div key={gIdx} className="mb-3 last:mb-0">
                                <div className="text-[11px] font-bold text-amber-300/90 mb-1 flex items-center justify-between">
                                  <span>{grpName}</span>
                                  <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-300">{spDraws[grpName].length} Pasukan</span>
                                </div>
                                <ul className="space-y-1">
                                  {spDraws[grpName].map((tm, tIdx) => (
                                    <li key={tIdx} className="flex items-center gap-2 text-xs bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-white font-medium">
                                      <span className="w-4 text-center font-bold text-amber-400">{tIdx + 1}.</span>
                                      <span>{tm}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* TAB 3: ADMIN PORTAL BERPERANAN (ROLE-BASED) */}
          {activeTab === 'admin' && (
            !currentUser ? (
              /* LOG MASUK BERASASKAN EMEL */
              <div className="max-w-md mx-auto bg-slate-900/70 p-8 rounded-xl border border-slate-700/60 text-center shadow-2xl backdrop-blur-md">
                <Lock className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Log Masuk Pegawai / Admin</h2>
                <p className="text-xs text-slate-400 mb-4">Sila masukkan emel rasmi anda yang telah didaftarkan.</p>
                
                <form onSubmit={handleLoginByEmail} className="space-y-4">
                  <input 
                    type="email" 
                    placeholder="nama@jksm.gov.my" 
                    value={inputEmail} 
                    onChange={(e) => setInputEmail(e.target.value)} 
                    required
                    className="w-full p-3 bg-slate-950/80 border border-slate-700/80 rounded-lg text-white focus:outline-none focus:border-emerald-500" 
                  />
                  
                  {loginError && (
                    <div className="p-2 text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg">
                      {loginError}
                    </div>
                  )}

                  <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-lg font-bold">
                    {loading ? 'Menyemak Emel...' : 'Log Masuk'}
                  </button>
                </form>
              </div>
            ) : (
              /* PANEL ADMIN APABILA SUDAH LOG MASUK */
              <div className="space-y-6">
                
                {/* Bar Profil & Status Peranan Admin */}
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{currentUser.name} ({currentUser.email})</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          currentUser.role === 'MASTER' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                          currentUser.role === 'UNDIAN' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          PERANAN: {currentUser.role}
                        </span>
                        {currentUser.role === 'SUKAN' && (
                          <span className="text-[11px] text-slate-300">
                            Acara Dibenarkan: <strong>{currentUser.allowedSports}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button onClick={handleLogout} className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 px-3 py-1.5 rounded-lg text-xs font-bold transition">
                    <LogOut className="w-3.5 h-3.5" /> Keluar
                  </button>
                </div>

                {/* 1. KHAS UNTUK MASTER ADMIN: PENGURUSAN ADMIN LAIN */}
                {currentUser.role === 'MASTER' && (
                  <div className="bg-slate-900/60 p-6 rounded-xl border border-amber-500/40 space-y-4 backdrop-blur-md">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-amber-400">
                      <UserCheck className="w-5 h-5" /> Pengurusan Pegawai & Hak Akses Admin (Master Admin Sahaja)
                    </h3>
                    
                    <form onSubmit={handleSaveNewAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                      <input 
                        type="email" 
                        placeholder="Emel Pegawai (cth: ali@jksm.gov.my)" 
                        value={newAdmin.email} 
                        onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})} 
                        required 
                        className="p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs" 
                      />
                      <input 
                        type="text" 
                        placeholder="Nama Pegawai" 
                        value={newAdmin.name} 
                        onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})} 
                        required 
                        className="p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs" 
                      />
                      <select 
                        value={newAdmin.role} 
                        onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})} 
                        className="p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-amber-400 font-bold"
                      >
                        <option value="SUKAN">Admin Sukan (Kemas Kini Skor)</option>
                        <option value="UNDIAN">Admin Pengundian (Urus Undian)</option>
                        <option value="MASTER">Master Admin (Semua Akses)</option>
                      </select>
                      <input 
                        type="text" 
                        placeholder="Acara Dibenarkan (cth: Futsal, Boling L)" 
                        value={newAdmin.allowedSports} 
                        onChange={(e) => setNewAdmin({...newAdmin, allowedSports: e.target.value})} 
                        className="p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs" 
                      />
                      <button type="submit" disabled={loading} className="md:col-span-4 bg-amber-600 hover:bg-amber-500 font-bold p-2.5 rounded-lg text-xs">
                        Daftar Pegawai / Admin Baharu
                      </button>
                    </form>

                    <div className="border-t border-slate-800 pt-3">
                      <h4 className="text-xs font-bold text-slate-300 mb-2">Senarai Pegawai Berdaftar:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {adminList.map((a, i) => (
                          <div key={i} className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                            <div>
                              <p className="font-bold text-white">{a.name} <span className="text-[10px] text-amber-400">({a.role})</span></p>
                              <p className="text-[11px] text-slate-400">{a.email}</p>
                              {a.role === 'SUKAN' && <p className="text-[10px] text-slate-400 italic">Acara: {a.allowedSports || 'Tiada'}</p>}
                            </div>
                            {a.role !== 'MASTER' && (
                              <button onClick={() => handleDeleteAdmin(a.email)} className="text-rose-400 hover:text-rose-300 p-1">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. KHAS MASTER ADMIN: PENGURUSAN ACARA SUKAN */}
                {currentUser.role === 'MASTER' && (
                  <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-700/50 space-y-4 backdrop-blur-md">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Plus className="text-emerald-400" /> Tambah / Edit Acara Sukan</h3>
                    <form onSubmit={handleAddSukan} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input type="text" placeholder="Nama Sukan (cth: Futsal / Boling L)" value={newSukan.nama} onChange={(e) => setNewSukan({...newSukan, nama: e.target.value})} required className="p-3 bg-slate-950/80 border border-slate-700/80 rounded-lg text-sm" />
                      <input type="text" placeholder="Kategori (cth: Lelaki / Terbuka)" value={newSukan.kategori} onChange={(e) => setNewSukan({...newSukan, kategori: e.target.value})} required className="p-3 bg-slate-950/80 border border-slate-700/80 rounded-lg text-sm" />
                      <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 font-bold p-3 rounded-lg text-sm">{isEditSukan ? 'Kemaskini Sukan' : 'Simpan Sukan'}</button>
                    </form>

                    <div className="mt-4 border-t border-slate-700/60 pt-4">
                      <h4 className="text-sm font-bold text-slate-300 mb-2">Senarai Sukan:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {sukanList.map((s) => (
                          <div key={s.id} className="bg-slate-950/60 p-3 rounded-lg border border-slate-700/60 flex justify-between items-center">
                            <div><p className="font-bold text-white text-sm">{s.nama}</p><p className="text-xs text-slate-300">{s.kategori}</p></div>
                            <div className="flex gap-2">
                              <button onClick={() => { setNewSukan(s); setIsEditSukan(true); }} className="p-2 bg-blue-600/40 text-blue-300 rounded-lg"><Edit className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteSukan(s.id)} className="p-2 bg-rose-600/40 text-rose-300 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. KEMAS KINI SKOR (DITAPIS MENGIKUT ACARA DIBENARKAN) */}
                {(currentUser.role === 'MASTER' || currentUser.role === 'SUKAN') && (
                  <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-700/50 space-y-4 backdrop-blur-md">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-yellow-400">
                      <Plus className="text-emerald-400" /> Kemaskini Skor Acara Sukan
                    </h3>

                    {allowedSportsForAdmin.length === 0 ? (
                      <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800 text-center text-sm text-slate-400">
                        Tiada acara sukan diberikan kepada emel anda. Sila hubungi Master Admin untuk mendapatkan hak akses.
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih Acara Sukan (Ditapis mengikut kebenaran)</label>
                            <select value={selectedSukan} onChange={(e) => setSelectedSukan(e.target.value)} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold">
                              {allowedSportsForAdmin.map((s, i) => <option key={i} value={s.nama}>{s.nama}</option>)}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">Format Pertandingan</label>
                            <select value={formatSukan} onChange={(e) => setFormatSukan(e.target.value)} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-amber-400 font-bold">
                              <option value="kalah_mati">Format Kalah Mati (Bracket)</option>
                              <option value="boling">Format Boling (Leaderboard Pin)</option>
                            </select>
                          </div>
                        </div>

                        {formatSukan === 'boling' ? (
                          <form onSubmit={handleSaveBolingSeparate} className="space-y-6 border-t border-slate-800 pt-4">
                            <div className="space-y-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                              <div className="flex justify-between items-center">
                                <h4 className="text-sm font-bold text-yellow-400 uppercase">1. Senarai Pasukan & Skor ({selectedSukan})</h4>
                                <button type="button" onClick={() => setBolingPasukanRows([...bolingPasukanRows, { pasukan: '', jumlahPin: 0 }])} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                                  <Plus className="w-3.5 h-3.5" /> Tambah Pasukan
                                </button>
                              </div>
                              {bolingPasukanRows.map((row, index) => (
                                <div key={index} className="p-3 bg-slate-950 rounded-lg border border-slate-700/80 flex items-center gap-3">
                                  <span className="text-xs font-bold text-slate-400 w-6">#{index + 1}</span>
                                  <input type="text" placeholder="Nama Pasukan" value={row.pasukan} onChange={(e) => { const copy = [...bolingPasukanRows]; copy[index].pasukan = e.target.value; setBolingPasukanRows(copy); }} required className="w-2/3 p-2 bg-slate-900 border border-slate-700 rounded-lg text-sm" />
                                  <input type="number" placeholder="Pin" value={row.jumlahPin} onChange={(e) => { const copy = [...bolingPasukanRows]; copy[index].jumlahPin = Number(e.target.value); setBolingPasukanRows(copy); }} required className="w-1/3 p-2 bg-slate-900 border border-slate-700 rounded-lg font-bold text-yellow-400 text-sm" />
                                  {bolingPasukanRows.length > 1 && (
                                    <button type="button" onClick={() => setBolingPasukanRows(bolingPasukanRows.filter((_, i) => i !== index))} className="text-rose-400"><Trash2 className="w-4 h-4" /></button>
                                  )}
                                </div>
                              ))}
                            </div>

                            <div className="space-y-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                              <div className="flex justify-between items-center">
                                <h4 className="text-sm font-bold text-emerald-400 uppercase">2. Senarai Pemain Individu ({selectedSukan})</h4>
                                <button type="button" onClick={() => setBolingIndividuRows([...bolingIndividuRows, { namaPemain: '', pasukan: '', pinIndividu: 0 }])} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                                  <UserPlus className="w-3.5 h-3.5" /> Tambah Pemain
                                </button>
                              </div>
                              {bolingIndividuRows.map((row, index) => (
                                <div key={index} className="p-3 bg-slate-950 rounded-lg border border-slate-700/80 grid grid-cols-1 md:grid-cols-3 gap-2">
                                  <input type="text" placeholder="Nama Pemain" value={row.namaPemain} onChange={(e) => { const copy = [...bolingIndividuRows]; copy[index].namaPemain = e.target.value; setBolingIndividuRows(copy); }} className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-sm" />
                                  <input type="text" placeholder="Pasukan" value={row.pasukan} onChange={(e) => { const copy = [...bolingIndividuRows]; copy[index].pasukan = e.target.value; setBolingIndividuRows(copy); }} className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-sm" />
                                  <div className="flex gap-2 items-center">
                                    <input type="number" placeholder="Pin" value={row.pinIndividu} onChange={(e) => { const copy = [...bolingIndividuRows]; copy[index].pinIndividu = Number(e.target.value); setBolingIndividuRows(copy); }} className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg font-bold text-emerald-400 text-sm" />
                                    {bolingIndividuRows.length > 1 && (
                                      <button type="button" onClick={() => setBolingIndividuRows(bolingIndividuRows.filter((_, i) => i !== index))} className="text-rose-400"><Trash2 className="w-4 h-4" /></button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold p-3 rounded-lg shadow-lg">Simpan Skor Boling</button>
                          </form>
                        ) : (
                          <form onSubmit={handleAddJadual} className="space-y-4 border-t border-slate-800 pt-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 mb-1">Peringkat / Pusingan</label>
                              <select value={newJadual.peringkat} onChange={(e) => setNewJadual({...newJadual, peringkat: e.target.value})} required className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-sm">
                                <option value="Separuh Akhir 1">Separuh Akhir 1</option>
                                <option value="Separuh Akhir 2">Separuh Akhir 2</option>
                                <option value="Akhir">Akhir (Johan / Naib Johan)</option>
                                <option value="Tempat Ke-3">Tempat Ke-3 & Ke-4</option>
                              </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                              <div className="md:col-span-2 space-y-3">
                                <div className="flex gap-2 items-center">
                                  <input type="text" placeholder="Pasukan A" value={newJadual.pasukanA} onChange={(e) => { const val = e.target.value; setNewJadual(prev => ({ ...prev, pasukanA: val, pemenang: calculateWinner(prev.skorA, prev.skorB, val, prev.pasukanB) })); }} required className="w-3/4 p-3 bg-slate-900 border border-slate-700 rounded-lg text-sm" />
                                  <input type="number" value={newJadual.skorA} onChange={(e) => handleSkorChange(e.target.value, newJadual.skorB)} className="w-1/4 p-3 bg-slate-900 border border-slate-700 rounded-lg text-center font-bold text-sm" />
                                </div>
                                <div className="flex gap-2 items-center">
                                  <input type="text" placeholder="Pasukan B" value={newJadual.pasukanB} onChange={(e) => { const val = e.target.value; setNewJadual(prev => ({ ...prev, pasukanB: val, pemenang: calculateWinner(prev.skorA, prev.skorB, prev.pasukanA, val) })); }} required className="w-3/4 p-3 bg-slate-900 border border-slate-700 rounded-lg text-sm" />
                                  <input type="number" value={newJadual.skorB} onChange={(e) => handleSkorChange(newJadual.skorA, e.target.value)} className="w-1/4 p-3 bg-slate-900 border border-slate-700 rounded-lg text-center font-bold text-sm" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-emerald-400 mb-1">Pemenang Automatik</label>
                                <div className="p-7 bg-slate-950 border border-emerald-500/50 rounded-lg text-emerald-400 font-bold text-center text-sm">{newJadual.pemenang || 'Auto skor'}</div>
                              </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold p-3 rounded-lg">Kemaskini Perlawanan</button>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
}
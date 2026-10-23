import React, { useState, useEffect } from 'react';
import { Trophy, Medal, RefreshCw, Lock, LogOut, Plus, Edit, Trash2, Award, UserPlus } from 'lucide-react';

const API_URL = "https://script.google.com/macros/s/AKfycbxDbzkwtItpfcg1rrE8z9rAZSB86ceKOdmS8osgYcg-KSdIk4KisMfXJxJKqoCYxNcnfg/exec";

export default function App() {
  const [activeTab, setActiveTab] = useState('public');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSukan, setSelectedSukan] = useState('');

  const [sukanList, setSukanList] = useState([]);
  const [jadualList, setJadualList] = useState([]);
  const [bolingList, setBolingList] = useState([]);
  const [bolingIndividuList, setBolingIndividuList] = useState([]);

  // Form State
  const [newSukan, setNewSukan] = useState({ id: '', nama: '', kategori: '', status: 'Belum Mula' });
  const [isEditSukan, setIsEditSukan] = useState(false);
  
  // Format Acara: 'kalah_mati', 'liga', atau 'boling'
  const [formatSukan, setFormatSukan] = useState('kalah_mati');
  const [newJadual, setNewJadual] = useState({ sukan: '', peringkat: 'Separuh Akhir 1', pasukanA: '', pasukanB: '', skorA: 0, skorB: 0, pemenang: '' });
  
  // Dynamic Rows Terasing untuk Boling: Pasukan vs Individu
  const [bolingPasukanRows, setBolingPasukanRows] = useState([
    { pasukan: 'Pasukan Merah', jumlahPin: 0 },
    { pasukan: 'Pasukan Biru', jumlahPin: 0 }
  ]);

  const [bolingIndividuRows, setBolingIndividuRows] = useState([
    { namaPemain: 'Pemain 1', pasukan: 'Pasukan Merah', pinIndividu: 0 }
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();

      if (data && data.sukan && data.sukan.length > 1) {
        const formattedSukan = data.sukan.slice(1).map(row => ({ 
          id: String(row[0] || ''), 
          nama: String(row[1] || ''), 
          kategori: String(row[2] || ''), 
          status: String(row[3] || '') 
        })).filter(s => s.nama.trim() !== '');

        setSukanList(formattedSukan);
        if (formattedSukan.length > 0) {
          const firstSport = formattedSukan[0].nama;
          setSelectedSukan(prev => prev || firstSport);
          setNewJadual(prev => ({ ...prev, sukan: prev.sukan || firstSport }));
        }
      } else {
        setSukanList([]);
      }

      if (data && data.jadual && data.jadual.length > 1) {
        const loadedJadual = data.jadual.slice(1).map(row => ({
          id: String(row[0] || ''), sukan: String(row[1] || ''), peringkat: String(row[2] || ''), 
          pasukanA: String(row[3] || ''), pasukanB: String(row[4] || ''), skorA: Number(row[5] || 0), 
          skorB: Number(row[6] || 0), pemenang: String(row[7] || '')
        })).filter(j => j.sukan.trim() !== '');
        setJadualList(loadedJadual);
      } else {
        setJadualList([]);
      }

      if (data && data.boling && data.boling.length > 1) {
        const loadedBoling = data.boling.slice(1).map(row => ({
          id: String(row[0] || ''), sukan: String(row[1] || ''), pasukan: String(row[2] || ''),
          jumlahPin: Number(row[3] || 0)
        })).filter(b => b.sukan.trim() !== '');
        setBolingList(loadedBoling);
      } else {
        setBolingList([]);
      }

      if (data && data.bolingIndividu && data.bolingIndividu.length > 1) {
        const loadedInd = data.bolingIndividu.slice(1).map(row => ({
          id: String(row[0] || ''), sukan: String(row[1] || ''), namaPemain: String(row[2] || ''),
          pasukan: String(row[3] || ''), pinIndividu: Number(row[4] || 0)
        })).filter(bi => bi.sukan.trim() !== '');
        setBolingIndividuList(loadedInd);
      } else {
        setBolingIndividuList([]);
      }
    } catch (err) {
      console.error("Ralat ambil data:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedSukan.toLowerCase().includes('boling') || selectedSukan.toLowerCase().includes('bowling')) {
      setFormatSukan('boling');
    }
  }, [selectedSukan]);

  // Kemaskini Dynamic Form bila tukar acara Boling
  useEffect(() => {
    if (formatSukan === 'boling') {
      const existingTeams = bolingList.filter(b => b.sukan === selectedSukan);
      if (existingTeams.length > 0) {
        setBolingPasukanRows(existingTeams.map(b => ({ pasukan: b.pasukan, jumlahPin: b.jumlahPin })));
      } else {
        setBolingPasukanRows([
          { pasukan: 'Pasukan Merah', jumlahPin: 0 },
          { pasukan: 'Pasukan Biru', jumlahPin: 0 }
        ]);
      }

      const existingInd = bolingIndividuList.filter(bi => bi.sukan === selectedSukan);
      if (existingInd.length > 0) {
        setBolingIndividuRows(existingInd.map(bi => ({ namaPemain: bi.namaPemain, pasukan: bi.pasukan, pinIndividu: bi.pinIndividu })));
      } else {
        setBolingIndividuRows([
          { namaPemain: '', pasukan: '', pinIndividu: 0 }
        ]);
      }
    }
  }, [selectedSukan, formatSukan, bolingList, bolingIndividuList]);

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

  const calculateLeaderboard = () => {
    const teams = {};

    const initTeam = (tName) => {
      if (!tName || tName === 'TBD' || tName === 'Seri' || tName === '-') return;
      if (!teams[tName]) {
        teams[tName] = { pasukan: tName, emas: 0, perak: 0, gangsa: 0, mata: 0 };
      }
    };

    sukanList.forEach(s => {
      if (s.nama.toLowerCase().includes('boling') || s.nama.toLowerCase().includes('bowling')) {
        const bRows = bolingList.filter(b => b.sukan === s.nama).sort((a, b) => b.jumlahPin - a.jumlahPin);
        if (bRows.length >= 1 && bRows[0].jumlahPin > 0) {
          initTeam(bRows[0].pasukan); teams[bRows[0].pasukan].emas += 1; teams[bRows[0].pasukan].mata += 5;
        }
        if (bRows.length >= 2 && bRows[1].jumlahPin > 0) {
          initTeam(bRows[1].pasukan); teams[bRows[1].pasukan].perak += 1; teams[bRows[1].pasukan].mata += 3;
        }
        if (bRows.length >= 3 && bRows[2].jumlahPin > 0) {
          initTeam(bRows[2].pasukan); teams[bRows[2].pasukan].gangsa += 1; teams[bRows[2].pasukan].mata += 1;
        }
      } else {
        const sJadual = jadualList.filter(j => j.sukan === s.nama);
        const matchAkhir = sJadual.find(j => j.peringkat === 'Akhir');
        const matchT3 = sJadual.find(j => j.peringkat === 'Tempat Ke-3');

        if (matchAkhir && matchAkhir.pemenang && matchAkhir.pemenang !== 'Seri' && matchAkhir.pemenang !== '') {
          const johan = matchAkhir.pemenang;
          const naibJohan = matchAkhir.pemenang === matchAkhir.pasukanA ? matchAkhir.pasukanB : matchAkhir.pasukanA;
          initTeam(johan); initTeam(naibJohan);
          if (teams[johan]) { teams[johan].emas += 1; teams[johan].mata += 5; }
          if (teams[naibJohan]) { teams[naibJohan].perak += 1; teams[naibJohan].mata += 3; }
        }

        if (matchT3 && matchT3.pemenang && matchT3.pemenang !== 'Seri' && matchT3.pemenang !== '') {
          const tempat3 = matchT3.pemenang;
          initTeam(tempat3);
          if (teams[tempat3]) { teams[tempat3].gangsa += 1; teams[tempat3].mata += 1; }
        }
      }
    });

    return Object.values(teams).sort((a, b) => b.mata - a.mata || b.emas - a.emas || b.perak - a.perak);
  };

  const mataList = calculateLeaderboard();

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'suk@njksm2026') setIsLoggedIn(true);
    else alert('Kata laluan salah!');
  };

  const handleAddSukan = async (e) => {
    e.preventDefault();
    setLoading(true);
    const actionType = isEditSukan ? 'updateSukan' : 'addSukan';
    try {
      await fetch(API_URL, {
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: actionType, id: newSukan.id || ('SK' + Date.now().toString().slice(-4)), nama: newSukan.nama, kategori: newSukan.kategori, status: newSukan.status })
      });
      setNewSukan({ id: '', nama: '', kategori: '', status: 'Belum Mula' });
      setIsEditSukan(false);
      setTimeout(() => fetchData(), 1200);
    } catch (err) { console.error(err); setLoading(false); }
  };

  const handleEditSukanClick = (sukan) => {
    setNewSukan(sukan);
    setIsEditSukan(true);
  };

  const handleDeleteSukan = async (id) => {
    if (!window.confirm("Adakah anda pasti nak padam sukan ini?")) return;
    setLoading(true);
    try {
      await fetch(API_URL, {
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'deleteSukan', id })
      });
      setTimeout(() => fetchData(), 1200);
    } catch (err) { console.error(err); setLoading(false); }
  };

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

  // Handler Pasukan Dynamic Rows
  const handleAddPasukanRow = () => {
    setBolingPasukanRows(prev => [...prev, { pasukan: '', jumlahPin: 0 }]);
  };
  const handleRemovePasukanRow = (index) => {
    setBolingPasukanRows(prev => prev.filter((_, i) => i !== index));
  };
  const handlePasukanRowChange = (index, field, value) => {
    setBolingPasukanRows(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  // Handler Pemain Individu Dynamic Rows
  const handleAddIndividuRow = () => {
    setBolingIndividuRows(prev => [...prev, { namaPemain: '', pasukan: '', pinIndividu: 0 }]);
  };
  const handleRemoveIndividuRow = (index) => {
    setBolingIndividuRows(prev => prev.filter((_, i) => i !== index));
  };
  const handleIndividuRowChange = (index, field, value) => {
    setBolingIndividuRows(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
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

  const currentBolingList = bolingList.filter(b => b.sukan === selectedSukan).sort((a, b) => b.jumlahPin - a.jumlahPin);
  const currentIndividuList = bolingIndividuList.filter(bi => bi.sukan === selectedSukan).sort((a, b) => b.pinIndividu - a.pinIndividu);

  const viewJadual = jadualList.filter(j => j.sukan === selectedSukan);
  const viewSF1 = viewJadual.find(j => j.peringkat === 'Separuh Akhir 1') || { pasukanA: '', pasukanB: '', skorA: 0, skorB: 0, pemenang: '' };
  const viewSF2 = viewJadual.find(j => j.peringkat === 'Separuh Akhir 2') || { pasukanA: '', pasukanB: '', skorA: 0, skorB: 0, pemenang: '' };
  const getLoser = (match) => (!match.pemenang || match.pemenang === 'Seri') ? '' : (match.pemenang === match.pasukanA ? match.pasukanB : match.pasukanA);
  const viewAkhir = viewJadual.find(j => j.peringkat === 'Akhir') || { pasukanA: viewSF1.pemenang || '', pasukanB: viewSF2.pemenang || '', skorA: 0, skorB: 0, pemenang: '' };
  const viewT3 = viewJadual.find(j => j.peringkat === 'Tempat Ke-3') || { pasukanA: getLoser(viewSF1) || '', pasukanB: getLoser(viewSF2) || '', skorA: 0, skorB: 0, pemenang: '' };

  return (
    <div className="min-h-screen text-white font-sans relative overflow-x-hidden">
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/bg-sukan.png')" }} />
      <div className="fixed inset-0 z-0 bg-slate-950/20" />

      <div className="relative z-10">
        <header className="bg-slate-900/80 border-b border-slate-700/60 backdrop-blur-md p-4 sticky top-0 z-20">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Trophy className="text-yellow-400 w-8 h-8" />
              <h1 className="text-xl font-bold tracking-wide">KEJOHANAN SUKAN TAHUNAN JKSM</h1>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={fetchData} className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => setActiveTab('public')} className={`px-4 py-2 rounded-lg font-semibold transition ${activeTab === 'public' ? 'bg-blue-600' : 'bg-slate-800/80 border border-slate-700'}`}>
                Keputusan
              </button>
              <button onClick={() => setActiveTab('admin')} className={`px-4 py-2 rounded-lg font-semibold transition ${activeTab === 'admin' ? 'bg-emerald-600' : 'bg-slate-800/80 border border-slate-700'}`}>
                Admin Portal
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
          {activeTab === 'public' && (
            <>
              {/* CARTA PUNGUTAN PINGAT */}
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
                        <tr><td colSpan="6" className="text-center p-4 text-slate-300 font-medium">Belum ada perlawanan tamat. Kemaskini skor di Admin Portal.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* PAPARAN AWAM */}
              <section className="bg-slate-900/60 p-6 rounded-xl border border-slate-700/50 shadow-2xl space-y-6 backdrop-blur-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-blue-400">
                    {formatSukan === 'boling' ? '🎳 KEDUDUKAN & CARTA JATUHAN PIN BOLING' : (formatSukan === 'liga' ? '📊 CARTA KEDUDUKAN LIGA' : '⚽ CARTA PERLAWANAN (KALAH MATI)')}
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
                    {/* BERPASUKAN */}
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
                            {currentBolingList.length > 0 ? currentBolingList.map((b, idx) => (
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
                            )) : (
                              <tr><td colSpan="4" className="text-center p-4 text-slate-500">Belum ada skor jatuhan pin dimasukkan.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* INDIVIDU / HIGH GAME LIST */}
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
                            {currentIndividuList.length > 0 ? currentIndividuList.map((bi, idx) => (
                              <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                                <td className="p-3 font-bold text-slate-300">#{idx + 1}</td>
                                <td className="p-3 font-bold text-white">{bi.namaPemain}</td>
                                <td className="p-3 text-slate-400">{bi.pasukan || '-'}</td>
                                <td className="p-3 text-right font-black text-emerald-400 text-lg">{bi.pinIndividu} Pin</td>
                              </tr>
                            )) : (
                              <tr><td colSpan="4" className="text-center p-4 text-slate-500">Belum ada rekod pemain individu dimasukkan.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* KALAH MATI */
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

          {/* ADMIN PORTAL */}
          {activeTab === 'admin' && (
            !isLoggedIn ? (
              <div className="max-w-md mx-auto bg-slate-900/70 p-8 rounded-xl border border-slate-700/60 text-center shadow-2xl backdrop-blur-md">
                <Lock className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-4">Log Masuk Admin</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                  <input type="password" placeholder="Masukkan Kata Laluan" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-slate-950/80 border border-slate-700/80 rounded-lg text-white" />
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-lg font-bold">Log Masuk</button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-emerald-400">Panel Kawalan Admin</h2>
                  <button onClick={() => setIsLoggedIn(false)} className="flex items-center gap-1 bg-rose-600 px-3 py-1.5 rounded-lg text-sm font-bold"><LogOut className="w-4 h-4" /> Keluar</button>
                </div>

                {/* 1. SEKSYEN TAMBAH & SENARAI ACARA SUKAN */}
                <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-700/50 space-y-4 backdrop-blur-md">
                  <h3 className="text-lg font-bold flex items-center gap-2"><Plus className="text-emerald-400" /> {isEditSukan ? 'Kemaskini Sukan' : 'Tambah Acara Sukan'}</h3>
                  <form onSubmit={handleAddSukan} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="text" placeholder="Nama Sukan (cth: Bola Sepak / Boling L)" value={newSukan.nama} onChange={(e) => setNewSukan({...newSukan, nama: e.target.value})} required className="p-3 bg-slate-950/80 border border-slate-700/80 rounded-lg" />
                    <input type="text" placeholder="Kategori (cth: Lelaki)" value={newSukan.kategori} onChange={(e) => setNewSukan({...newSukan, kategori: e.target.value})} required className="p-3 bg-slate-950/80 border border-slate-700/80 rounded-lg" />
                    <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 font-bold p-3 rounded-lg">{isEditSukan ? 'Kemaskini Sukan' : 'Simpan Sukan'}</button>
                  </form>

                  <div className="mt-4 border-t border-slate-700/60 pt-4">
                    <h4 className="text-sm font-bold text-slate-300 mb-2">Senarai Sukan Sedia Ada:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {sukanList.map((s) => (
                        <div key={s.id} className="bg-slate-950/60 p-3 rounded-lg border border-slate-700/60 flex justify-between items-center backdrop-blur-sm">
                          <div>
                            <p className="font-bold text-white">{s.nama}</p>
                            <p className="text-xs text-slate-300">{s.kategori}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleEditSukanClick(s)} className="p-2 bg-blue-600/40 text-blue-300 hover:bg-blue-600/60 rounded-lg" title="Kemaskini">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteSukan(s.id)} className="p-2 bg-rose-600/40 text-rose-300 hover:bg-rose-600/60 rounded-lg" title="Padam">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. SEKSYEN KEMASKINI SKOR ACARA SUKAN */}
                <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-700/50 space-y-4 backdrop-blur-md">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-yellow-400">
                    <Plus className="text-emerald-400" /> Kemaskini Skor Acara Sukan
                  </h3>
                  
                  <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">1. Pilih Acara Sukan</label>
                        <select value={selectedSukan} onChange={(e) => setSelectedSukan(e.target.value)} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold">
                          {sukanList.map((s, i) => <option key={i} value={s.nama}>{s.nama}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">2. Pilih Format Pertandingan</label>
                        <select value={formatSukan} onChange={(e) => setFormatSukan(e.target.value)} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-amber-400 font-bold">
                          <option value="kalah_mati">Format Kalah Mati (Bracket)</option>
                          <option value="liga">Format Liga (Mata Kumpulan)</option>
                          <option value="boling">Format Boling (Leaderboard Pin)</option>
                        </select>
                      </div>
                    </div>

                    {/* DYNAMIC FORM FOR BOLING WITH SEPARATE PASUKAN AND PEMAIN INDIVIDU */}
                    {formatSukan === 'boling' ? (
                      <form onSubmit={handleSaveBolingSeparate} className="space-y-6 border-t border-slate-800 pt-4">
                        
                        {/* 1. SEKSYEN BAHAGIAN ATAS: TAMBAH PASUKAN & SKOR */}
                        <div className="space-y-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-bold text-yellow-400 uppercase">1. Senarai Pasukan & Skor Jatuhan Pin ({selectedSukan})</h4>
                            <button type="button" onClick={handleAddPasukanRow} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold">
                              <Plus className="w-4 h-4" /> Tambah Pasukan
                            </button>
                          </div>

                          {bolingPasukanRows.map((row, index) => (
                            <div key={index} className="p-3 bg-slate-950 rounded-lg border border-slate-700/80 flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-400 w-6">#{index + 1}</span>
                              <input 
                                type="text" 
                                placeholder="Nama Pasukan / Rumah" 
                                value={row.pasukan} 
                                onChange={(e) => handlePasukanRowChange(index, 'pasukan', e.target.value)} 
                                required 
                                className="w-2/3 p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm" 
                              />
                              <input 
                                type="number" 
                                placeholder="0" 
                                value={row.jumlahPin} 
                                onChange={(e) => handlePasukanRowChange(index, 'jumlahPin', Number(e.target.value))} 
                                required 
                                className="w-1/3 p-2.5 bg-slate-900 border border-slate-700 rounded-lg font-bold text-yellow-400 text-sm" 
                              />
                              {bolingPasukanRows.length > 1 && (
                                <button type="button" onClick={() => handleRemovePasukanRow(index)} className="text-rose-400 hover:text-rose-300 p-2">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* 2. SEKSYEN BAHAGIAN BAWAH: TAMBAH PEMAIN INDIVIDU & SKOR */}
                        <div className="space-y-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-bold text-emerald-400 uppercase">2. Senarai Pemain Individu / High Game ({selectedSukan})</h4>
                            <button type="button" onClick={handleAddIndividuRow} className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold">
                              <UserPlus className="w-4 h-4" /> Tambah Pemain
                            </button>
                          </div>

                          {bolingIndividuRows.map((row, index) => (
                            <div key={index} className="p-3 bg-slate-950 rounded-lg border border-slate-700/80 grid grid-cols-1 md:grid-cols-3 gap-2 relative">
                              <input 
                                type="text" 
                                placeholder="Nama Pemain" 
                                value={row.namaPemain} 
                                onChange={(e) => handleIndividuRowChange(index, 'namaPemain', e.target.value)} 
                                className="p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm" 
                              />
                              <input 
                                type="text" 
                                placeholder="Pasukan / Rumah" 
                                value={row.pasukan} 
                                onChange={(e) => handleIndividuRowChange(index, 'pasukan', e.target.value)} 
                                className="p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm" 
                              />
                              <div className="flex gap-2 items-center">
                                <input 
                                  type="number" 
                                  placeholder="Pin Individu" 
                                  value={row.pinIndividu} 
                                  onChange={(e) => handleIndividuRowChange(index, 'pinIndividu', Number(e.target.value))} 
                                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg font-bold text-emerald-400 text-sm" 
                                />
                                {bolingIndividuRows.length > 1 && (
                                  <button type="button" onClick={() => handleRemoveIndividuRow(index)} className="text-rose-400 hover:text-rose-300 p-2">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold p-3 rounded-lg shadow-lg">
                          {loading ? 'Menghantar Data...' : 'Simpan Semua Skor Boling (Pasukan & Pemain)'}
                        </button>
                      </form>
                    ) : (
                      /* FORM INPUT KALAH MATI */
                      <form onSubmit={handleAddJadual} className="space-y-4 border-t border-slate-800 pt-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Peringkat / Pusingan</label>
                          <select value={newJadual.peringkat} onChange={(e) => setNewJadual({...newJadual, peringkat: e.target.value})} required className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg">
                            <option value="Separuh Akhir 1">Separuh Akhir 1</option>
                            <option value="Separuh Akhir 2">Separuh Akhir 2</option>
                            <option value="Akhir">Akhir (Johan / Naib Johan)</option>
                            <option value="Tempat Ke-3">Tempat Ke-3 & Ke-4</option>
                          </select>
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
                    )}
                  </div>
                </div>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
}
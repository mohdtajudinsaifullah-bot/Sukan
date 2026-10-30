import React, { useState, useEffect } from 'react';
import { Trophy, Medal, RefreshCw, Lock, LogOut, Plus, Trash2, Award, Dices, Play, Forward, Printer, RotateCcw, ShieldCheck, Users, ChevronDown, ChevronUp } from 'lucide-react';

const API_URL = "https://script.google.com/macros/s/AKfycbxDbzkwtItpfcg1rrE8z9rAZSB86ceKOdmS8osgYcg-KSdIk4KisMfXJxJKqoCYxNcnfg/exec";

export default function App() {
  const [activeTab, setActiveTab] = useState('public');
  const [loading, setLoading] = useState(false);
  const [selectedSukan, setSelectedSukan] = useState('');

  // Sesi Admin
  const [currentUser, setCurrentUser] = useState(null);
  const [inputEmail, setInputEmail] = useState('');
  const [loginError, setLoginError] = useState('');

  // Data Senarai Utama
  const [acaraList, setAcaraList] = useState([]);
  const [jadualList, setJadualList] = useState([]);
  const [jadualSubList, setJadualSubList] = useState([]);
  const [bolingList, setBolingList] = useState([]);
  const [bolingIndividuList, setBolingIndividuList] = useState([]);

  // Data Pasukan (Dinamik)
  const [teams, setTeams] = useState(["Gemini", "Meta", "Gamma", "Copilot"]);
  const [newTeamInput, setNewTeamInput] = useState("");

  // Data Undian
  const [tournamentDraws, setTournamentDraws] = useState({});
  const [selectedSportUndian, setSelectedSportUndian] = useState('');
  const [groupCountUndian, setGroupCountUndian] = useState(2);
  const [drawDisplay, setDrawDisplay] = useState('-- SEDIA --');
  const [drawStatusLabel, setDrawStatusLabel] = useState('MENUNGGU CABUTAN BERMULA');
  const [isRolling, setIsRolling] = useState(false);

  // Form State Tambah Acara & Skor
  const [newAcara, setNewAcara] = useState({ nama: '', format: 'Kalah Mati (Berpasukan)', kumpulan: 2 });
  const [newJadual, setNewJadual] = useState({ peringkat: 'Separuh Akhir 1', pasukanA: '', pasukanB: '', skorA: 0, skorB: 0, pemenang: '' });
  
  // State Sub-Acara Dinamik (Boleh ditambah/dipadam oleh Admin secara bebas)
  const [subMatches, setSubMatches] = useState([
    { kategori: 'Perseorangan Lelaki', skorA: 0, skorB: 0, pemenangSub: '' },
    { kategori: 'Perseorangan Wanita', skorA: 0, skorB: 0, pemenangSub: '' },
    { kategori: 'Beregu Lelaki', skorA: 0, skorB: 0, pemenangSub: '' }
  ]);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  const [bolingPasukanRows, setBolingPasukanRows] = useState([]);
  const [bolingIndividuRows, setBolingIndividuRows] = useState([
    { namaPemain: '', pasukan: '', pinIndividu: 0 }
  ]);

  const [expandedTie, setExpandedTie] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();

      // 1. Tarik Tab Acara
      if (data && Array.isArray(data.acara) && data.acara.length > 1) {
        const formatted = data.acara.slice(1).map(row => ({
          nama: String(row[0] || '').trim(),
          format: String(row[1] || 'Kalah Mati').trim(),
          kumpulan: Number(row[2]) || 2
        })).filter(a => a.nama !== '');
        
        setAcaraList(formatted);
        if (formatted.length > 0) {
          setSelectedSukan(prev => prev || formatted[0].nama);
          setSelectedSportUndian(prev => prev || formatted[0].nama);
        }
      }

      // 2. Tarik Tab Pasukan
      if (data && Array.isArray(data.pasukan) && data.pasukan.length > 1) {
        const loadedTeams = data.pasukan.slice(1).map(row => String(row[0] || '').trim()).filter(t => t !== '');
        if (loadedTeams.length > 0) {
          setTeams(loadedTeams);
        }
      }

      // 3. Tarik Tab Jadual
      if (data && Array.isArray(data.jadual) && data.jadual.length > 1) {
        setJadualList(data.jadual.slice(1).map(row => ({
          id: String(row[0] || '').trim(),
          sukan: String(row[1] || '').trim(),
          peringkat: String(row[2] || '').trim(),
          pasukanA: String(row[3] || '').trim(),
          pasukanB: String(row[4] || '').trim(),
          skorA: Number(row[5] || 0),
          skorB: Number(row[6] || 0),
          pemenang: String(row[7] || '').trim()
        })).filter(j => j.sukan !== ''));
      }

      // 4. Tarik Tab JadualSub
      if (data && Array.isArray(data.jadualSub) && data.jadualSub.length > 1) {
        setJadualSubList(data.jadualSub.slice(1).map(row => ({
          sukan: String(row[0] || '').trim(),
          peringkat: String(row[1] || '').trim(),
          kategori: String(row[2] || '').trim(),
          skorA: Number(row[3] || 0),
          skorB: Number(row[4] || 0),
          pemenangSub: String(row[5] || '').trim()
        })).filter(s => s.sukan !== ''));
      }

      // 5. Tarik Tab Boling
      if (data && Array.isArray(data.boling) && data.boling.length > 1) {
        setBolingList(data.boling.slice(1).map(row => ({
          sukan: String(row[1] || '').trim(),
          pasukan: String(row[2] || '').trim(),
          jumlahPin: Number(row[3] || 0)
        })).filter(b => b.sukan !== ''));
      }

      // 6. Tarik Tab Boling Individu
      if (data && Array.isArray(data.bolingIndividu) && data.bolingIndividu.length > 1) {
        setBolingIndividuList(data.bolingIndividu.slice(1).map(row => ({
          sukan: String(row[1] || '').trim(),
          namaPemain: String(row[2] || '').trim(),
          pasukan: String(row[3] || '').trim(),
          pinIndividu: Number(row[4] || 0)
        })).filter(bi => bi.sukan !== ''));
      }

      // 7. Tarik Tab Keputusan Undian
      if (data && Array.isArray(data.keputusan) && data.keputusan.length > 1) {
        const newDraws = {};
        data.keputusan.slice(1).forEach(row => {
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

  const currentSportObj = acaraList.find(a => a.nama.toLowerCase() === selectedSukan.toLowerCase()) || { format: 'Kalah Mati' };
  const isTeamMatchFormat = currentSportObj.format.toLowerCase().includes('berpasukan');
  const isLeaderboardFormat = (currentSportObj.format.toLowerCase().includes('boling') || 
                              currentSportObj.format.toLowerCase().includes('liga') ||
                              selectedSukan.toLowerCase().includes('menembak') ||
                              selectedSukan.toLowerCase().includes('golf') ||
                              selectedSukan.toLowerCase().includes('memanah')) && !isTeamMatchFormat;

  useEffect(() => {
    const sp = acaraList.find(a => a.nama.toLowerCase() === selectedSportUndian.toLowerCase());
    if (sp && sp.kumpulan) {
      setGroupCountUndian(Number(sp.kumpulan));
    }
  }, [selectedSportUndian, acaraList]);

  const simpanPasukanKeSheets = async (updatedTeams) => {
    try {
      await fetch(API_URL, {
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'saveTeamsList', teams: updatedTeams })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTeam = async () => {
    const name = newTeamInput.trim();
    if (!name) return;
    if (teams.map(t => t.toLowerCase()).includes(name.toLowerCase())) return alert("Pasukan sudah wujud!");
    const updated = [...teams, name];
    setTeams(updated);
    setNewTeamInput("");
    await simpanPasukanKeSheets(updated);
  };

  const handleRemoveTeam = async (index) => {
    if (teams.length <= 2) return alert("Perlu sekurang-kurangnya 2 pasukan!");
    const updated = teams.filter((_, i) => i !== index);
    setTeams(updated);
    await simpanPasukanKeSheets(updated);
  };

  // Auto-populate skor form admin
  useEffect(() => {
    if (!selectedSukan) return;

    if (isLeaderboardFormat) {
      const existingBoling = bolingList.filter(b => b.sukan.toLowerCase() === selectedSukan.toLowerCase());
      const drawn = tournamentDraws[selectedSukan] || {};
      const allDrawnTeams = [];
      Object.keys(drawn).forEach(grp => {
        drawn[grp].forEach(t => { if (!allDrawnTeams.includes(t)) allDrawnTeams.push(t); });
      });

      const baseTeams = allDrawnTeams.length > 0 ? allDrawnTeams : teams;
      const combined = baseTeams.map(t => {
        const found = existingBoling.find(b => b.pasukan.toLowerCase() === t.toLowerCase());
        return { pasukan: t, jumlahPin: found ? found.jumlahPin : 0 };
      });
      setBolingPasukanRows(combined);
      return;
    }

    const matched = jadualList.find(j => j.sukan.toLowerCase() === selectedSukan.toLowerCase() && j.peringkat === newJadual.peringkat);
    
    // Ambil sub-acara jika ada rekod simpanan di Google Sheets
    const existingSubs = jadualSubList.filter(s => s.sukan.toLowerCase() === selectedSukan.toLowerCase() && s.peringkat === newJadual.peringkat);
    if (existingSubs.length > 0) {
      setSubMatches(existingSubs.map(es => ({
        kategori: es.kategori,
        skorA: es.skorA,
        skorB: es.skorB,
        pemenangSub: es.pemenangSub
      })));
    }

    if (matched) {
      setNewJadual(prev => ({
        ...prev,
        pasukanA: matched.pasukanA,
        pasukanB: matched.pasukanB,
        skorA: matched.skorA,
        skorB: matched.skorB,
        pemenang: matched.pemenang
      }));
    } else {
      const sportDraw = tournamentDraws[selectedSukan] || {};
      const kumpA = sportDraw["Kumpulan A"] || sportDraw["Liga Kumpulan"] || [];
      const kumpB = sportDraw["Kumpulan B"] || [];

      let pA = "";
      let pB = "";

      if (newJadual.peringkat === 'Separuh Akhir 1') {
        pA = kumpA[0] || (teams[0] || 'Pasukan 1');
        pB = kumpA[1] || (teams[1] || 'Pasukan 2');
      } else if (newJadual.peringkat === 'Separuh Akhir 2') {
        pA = kumpB[0] || (teams[2] || 'Pasukan 3');
        pB = kumpB[1] || (teams[3] || 'Pasukan 4');
      } else if (newJadual.peringkat === 'Akhir') {
        const sf1 = jadualList.find(j => j.sukan.toLowerCase() === selectedSukan.toLowerCase() && j.peringkat === 'Separuh Akhir 1');
        const sf2 = jadualList.find(j => j.sukan.toLowerCase() === selectedSukan.toLowerCase() && j.peringkat === 'Separuh Akhir 2');
        pA = sf1?.pemenang || '';
        pB = sf2?.pemenang || '';
      } else if (newJadual.peringkat === 'Tempat Ke-3') {
        const sf1 = jadualList.find(j => j.sukan.toLowerCase() === selectedSukan.toLowerCase() && j.peringkat === 'Separuh Akhir 1');
        const sf2 = jadualList.find(j => j.sukan.toLowerCase() === selectedSukan.toLowerCase() && j.peringkat === 'Separuh Akhir 2');
        const getLoser = (m) => (!m?.pemenang || m?.pemenang === 'Seri') ? '' : (m.pemenang === m.pasukanA ? m.pasukanB : m.pasukanA);
        pA = getLoser(sf1);
        pB = getLoser(sf2);
      }

      setNewJadual(prev => ({
        ...prev,
        pasukanA: pA,
        pasukanB: pB,
        skorA: 0,
        skorB: 0,
        pemenang: ''
      }));
    }
  }, [selectedSukan, newJadual.peringkat, tournamentDraws, jadualList, jadualSubList, isLeaderboardFormat, isTeamMatchFormat, bolingList, teams]);

  // Tambah / Buang Kategori Sub-Acara Dinamik
  const handleAddCustomCategory = () => {
    const name = customCategoryInput.trim();
    if (!name) return;
    if (subMatches.some(m => m.kategori.toLowerCase() === name.toLowerCase())) {
      return alert("Kategori ini sudah ada dalam senarai!");
    }
    const updated = [...subMatches, { kategori: name, skorA: 0, skorB: 0, pemenangSub: '' }];
    setSubMatches(updated);
    setCustomCategoryInput('');
    recalculateTeamWinner(updated);
  };

  const handleRemoveCustomCategory = (idx) => {
    if (subMatches.length <= 1) return alert("Perlu ada sekurang-kurangnya 1 kategori acara!");
    const updated = subMatches.filter((_, i) => i !== idx);
    setSubMatches(updated);
    recalculateTeamWinner(updated);
  };

  const recalculateTeamWinner = (matchesList) => {
    let countA = 0;
    let countB = 0;
    matchesList.forEach(m => {
      if (m.pemenangSub === newJadual.pasukanA) countA++;
      else if (m.pemenangSub === newJadual.pasukanB) countB++;
    });

    const majorityNeeded = Math.ceil(matchesList.length / 2);
    let overallWinner = '';
    if (countA >= majorityNeeded) overallWinner = newJadual.pasukanA;
    else if (countB >= majorityNeeded) overallWinner = newJadual.pasukanB;
    else if (countA > countB) overallWinner = newJadual.pasukanA;
    else if (countB > countA) overallWinner = newJadual.pasukanB;

    setNewJadual(prev => ({
      ...prev,
      skorA: countA,
      skorB: countB,
      pemenang: overallWinner
    }));
  };

  const handleSubWinnerSelect = (index, winnerName) => {
    const updated = [...subMatches];
    updated[index].pemenangSub = winnerName;
    setSubMatches(updated);
    recalculateTeamWinner(updated);
  };

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
        setLoginError('Emel tidak dijumpai dalam rekod Helaian Admin!');
      }
    } catch (err) {
      setLoginError('Ralat sambungan rangkaian ke Google Sheets.');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('jksm_user_session');
  };

  const getAllowedSports = () => {
    if (!currentUser) return [];
    if (currentUser.role === 'MASTER') return acaraList;
    if (currentUser.role === 'SUKAN') {
      const allowed = (currentUser.allowedSports || '').split(',').map(s => s.trim().toLowerCase());
      return acaraList.filter(a => allowed.includes(a.nama.toLowerCase()) || allowed.includes('semua'));
    }
    return [];
  };

  const allowedSports = getAllowedSports();

  const calculateWinner = (sA, sB, pA, pB) => {
    const a = Number(sA);
    const b = Number(sB);
    if (a > b && pA) return pA;
    if (b > a && pB) return pB;
    if (a === b && (a > 0 || b > 0)) return 'Seri';
    return '';
  };

  const handleSkorChange = (sA, sB) => {
    const win = calculateWinner(sA, sB, newJadual.pasukanA, newJadual.pasukanB);
    setNewJadual(prev => ({ ...prev, skorA: Number(sA), skorB: Number(sB), pemenang: win }));
  };

  // Carta Pungutan Pingat (Emas 10, Perak 7, Gangsa 5)
  const calculateLeaderboard = () => {
    const leaderTeams = {};
    const initTeam = (rawName) => {
      if (!rawName) return null;
      const tName = String(rawName).trim();
      if (!tName || tName === 'TBD' || tName === 'Seri' || tName === '-') return null;
      
      const key = tName.toLowerCase();
      if (!leaderTeams[key]) {
        leaderTeams[key] = { pasukan: tName, emas: 0, perak: 0, gangsa: 0, mata: 0 };
      }
      return key;
    };

    acaraList.forEach(s => {
      const sFormat = s.format.toLowerCase();
      const sNama = s.nama.toLowerCase();
      
      if (sFormat.includes('boling') || sFormat.includes('liga') || sNama.includes('menembak') || sNama.includes('golf') || sNama.includes('memanah')) {
        const bRows = bolingList.filter(b => b.sukan.toLowerCase() === s.nama.toLowerCase()).sort((a, b) => b.jumlahPin - a.jumlahPin);
        
        if (bRows[0] && bRows[0].jumlahPin > 0) {
          const k = initTeam(bRows[0].pasukan);
          if (k) { leaderTeams[k].emas += 1; leaderTeams[k].mata += 10; }
        }
        if (bRows[1] && bRows[1].jumlahPin > 0) {
          const k = initTeam(bRows[1].pasukan);
          if (k) { leaderTeams[k].perak += 1; leaderTeams[k].mata += 7; }
        }
        if (bRows[2] && bRows[2].jumlahPin > 0) {
          const k = initTeam(bRows[2].pasukan);
          if (k) { leaderTeams[k].gangsa += 1; leaderTeams[k].mata += 5; }
        }
      } else {
        const sJadual = jadualList.filter(j => j.sukan.toLowerCase() === s.nama.toLowerCase());
        const matchAkhir = sJadual.find(j => j.peringkat === 'Akhir');
        const matchT3 = sJadual.find(j => j.peringkat === 'Tempat Ke-3');

        if (matchAkhir && matchAkhir.pemenang && matchAkhir.pemenang !== 'Seri') {
          const johanKey = initTeam(matchAkhir.pemenang);
          const naibNama = matchAkhir.pemenang.trim() === matchAkhir.pasukanA.trim() ? matchAkhir.pasukanB : matchAkhir.pasukanA;
          const naibKey = initTeam(naibNama);

          if (johanKey) { leaderTeams[johanKey].emas += 1; leaderTeams[johanKey].mata += 10; }
          if (naibKey) { leaderTeams[naibKey].perak += 1; leaderTeams[naibKey].mata += 7; }
        }

        if (matchT3 && matchT3.pemenang && matchT3.pemenang !== 'Seri') {
          const t3Key = initTeam(matchT3.pemenang);
          if (t3Key) { leaderTeams[t3Key].gangsa += 1; leaderTeams[t3Key].mata += 5; }
        }
      }
    });

    return Object.values(leaderTeams).sort((a, b) => b.mata - a.mata || b.emas - a.emas || b.perak - a.perak);
  };

  const mataList = calculateLeaderboard();

  const handleAddAcara = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(API_URL, {
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'addAcara', ...newAcara })
      });
      setNewAcara({ nama: '', format: 'Kalah Mati (Berpasukan)', kumpulan: 2 });
      setTimeout(fetchData, 1200);
    } catch (err) { console.error(err); setLoading(false); }
  };

  const handleDeleteAcara = async (nama) => {
    if (!window.confirm(`Adakah anda pasti mahu memadam acara ${nama}?`)) return;
    setLoading(true);
    try {
      await fetch(API_URL, {
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'deleteAcara', nama })
      });
      setTimeout(fetchData, 1200);
    } catch (err) { console.error(err); setLoading(false); }
  };

  const handleAddJadual = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(API_URL, {
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ 
          action: 'updateSkor', 
          id: 'M' + Date.now().toString().slice(-4), 
          ...newJadual, 
          sukan: selectedSukan,
          subMatches: isTeamMatchFormat ? subMatches : []
        })
      });
      setTimeout(fetchData, 1200);
    } catch (err) { console.error(err); setLoading(false); }
  };

  const handleSaveBoling = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(API_URL, {
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'updateBolingSeparate', sukan: selectedSukan, pasukanList: bolingPasukanRows, individuList: bolingIndividuRows })
      });
      setTimeout(fetchData, 1200);
    } catch (err) { console.error(err); setLoading(false); }
  };

  const canManageUndian = currentUser && (currentUser.role === 'MASTER' || currentUser.role === 'UNDIAN');

  // Cabutan Rawak Satu Demi Satu (Kumpulan Dipisahkan Secara Bersih Mengikut Had Acara)
  const mulakanCabutan = () => {
    if (!canManageUndian) return alert("Hanya Urusetia Pengundian / Master Admin dibenarkan membuat undian.");
    if (!selectedSportUndian) return alert("Pilih sukan dahulu!");
    if (teams.length < 2) return alert("Masukkan sekurang-kurangnya 2 pasukan!");

    const groupNames = [];
    for (let i = 0; i < groupCountUndian; i++) {
      groupNames.push(groupCountUndian === 1 ? "Liga Kumpulan" : `Kumpulan ${String.fromCharCode(65 + i)}`);
    }

    const currentSportDraws = tournamentDraws[selectedSportUndian] || {};
    
    // Pastikan hanya ambil kumpulan yang sah
    const drawnTeams = [];
    groupNames.forEach(g => {
      if (currentSportDraws[g]) drawnTeams.push(...currentSportDraws[g]);
    });
    
    const remainingTeams = teams.filter(t => !drawnTeams.includes(t));

    if (remainingTeams.length === 0) return alert(`Semua pasukan telah diundi bagi ${selectedSportUndian}!`);

    const maxPerGroup = Math.ceil(teams.length / groupCountUndian);
    const availableGroups = groupNames.filter(g => (currentSportDraws[g] || []).length < maxPerGroup);
    if (availableGroups.length === 0) return alert("Semua kumpulan telah penuh!");

    availableGroups.sort((a, b) => ((currentSportDraws[a] || []).length) - ((currentSportDraws[b] || []).length));
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
      
      const cleanSportDraws = {};
      groupNames.forEach(g => { cleanSportDraws[g] = [...(currentSportDraws[g] || [])]; });
      cleanSportDraws[targetGroup].push(chosen);

      const updatedAll = { ...tournamentDraws, [selectedSportUndian]: cleanSportDraws };
      setTournamentDraws(updatedAll);
      setDrawDisplay(`🎯 ${chosen}`);
      setDrawStatusLabel(`MASUK KE ${targetGroup.toUpperCase()}!`);
      
      const sportResults = [];
      Object.keys(cleanSportDraws).forEach(grp => {
        cleanSportDraws[grp].forEach(team => {
          sportResults.push({ sport: selectedSportUndian, group: grp, team: team });
        });
      });

      await fetch(API_URL, {
        method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveSportResults", sportName: selectedSportUndian, results: sportResults })
      });
    }, 1800);
  };

  // Undi Sukan Ini Terus (Sekaligus Bersih Tanpa Campur Kumpulan Lama)
  const undiSemuaSekaligus = async () => {
    if (!canManageUndian) return alert("Hanya Urusetia Pengundian / Master Admin dibenarkan membuat undian.");
    if (!selectedSportUndian) return alert("Pilih sukan dahulu!");
    if (teams.length < 2) return alert("Masukkan sekurang-kurangnya 2 pasukan!");

    const groupNames = [];
    for (let i = 0; i < groupCountUndian; i++) {
      groupNames.push(groupCountUndian === 1 ? "Liga Kumpulan" : `Kumpulan ${String.fromCharCode(65 + i)}`);
    }

    const updatedSportDraws = {};
    groupNames.forEach(g => updatedSportDraws[g] = []);

    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    shuffled.forEach((tm, idx) => {
      updatedSportDraws[groupNames[idx % groupNames.length]].push(tm);
    });

    const updatedAll = { ...tournamentDraws, [selectedSportUndian]: updatedSportDraws };
    setTournamentDraws(updatedAll);
    setDrawDisplay("🎯 SELESAI!");
    setDrawStatusLabel(`SEMUA PASUKAN TELAH DIUNDI KE ${groupCountUndian} KUMPULAN`);

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
  };

  const resetUndianSukanIni = async () => {
    if (!canManageUndian) return;
    if (!selectedSportUndian) return alert("Pilih sukan dahulu!");
    if (!window.confirm(`Padam keputusan undian bagi sukan ${selectedSportUndian}?`)) return;

    const copy = { ...tournamentDraws };
    delete copy[selectedSportUndian];
    setTournamentDraws(copy);
    setDrawDisplay("-- SEDIA --");
    setDrawStatusLabel("MENUNGGU CABUTAN BERMULA");

    await fetch(API_URL, {
      method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: "resetSingleSportUndian", sportName: selectedSportUndian })
    });
  };

  // Logik Bracket
  const sportDrawForView = tournamentDraws[selectedSukan] || {};
  const kumpA_view = sportDrawForView["Kumpulan A"] || sportDrawForView["Liga Kumpulan"] || [];
  const kumpB_view = sportDrawForView["Kumpulan B"] || [];

  const viewJadual = jadualList.filter(j => j.sukan.toLowerCase() === selectedSukan.toLowerCase());
  const sf1Match = viewJadual.find(j => j.peringkat === 'Separuh Akhir 1');
  const sf2Match = viewJadual.find(j => j.peringkat === 'Separuh Akhir 2');

  const viewSF1 = {
    pasukanA: sf1Match?.pasukanA || kumpA_view[0] || '-',
    pasukanB: sf1Match?.pasukanB || kumpA_view[1] || '-',
    skorA: sf1Match?.skorA ?? 0,
    skorB: sf1Match?.skorB ?? 0,
    pemenang: sf1Match?.pemenang || ''
  };

  const viewSF2 = {
    pasukanA: sf2Match?.pasukanA || kumpB_view[0] || '-',
    pasukanB: sf2Match?.pasukanB || kumpB_view[1] || '-',
    skorA: sf2Match?.skorA ?? 0,
    skorB: sf2Match?.skorB ?? 0,
    pemenang: sf2Match?.pemenang || ''
  };

  const getLoser = (m) => (!m.pemenang || m.pemenang === 'Seri') ? '' : (m.pemenang === m.pasukanA ? m.pasukanB : m.pasukanA);
  const akhMatch = viewJadual.find(j => j.peringkat === 'Akhir');
  const t3Match = viewJadual.find(j => j.peringkat === 'Tempat Ke-3');

  const viewAkhir = {
    pasukanA: akhMatch?.pasukanA || viewSF1.pemenang || '',
    pasukanB: akhMatch?.pasukanB || viewSF2.pemenang || '',
    skorA: akhMatch?.skorA ?? 0,
    skorB: akhMatch?.skorB ?? 0,
    pemenang: akhMatch?.pemenang || ''
  };

  const viewT3 = {
    pasukanA: t3Match?.pasukanA || getLoser(viewSF1) || '',
    pasukanB: t3Match?.pasukanB || getLoser(viewSF2) || '',
    skorA: t3Match?.skorA ?? 0,
    skorB: t3Match?.skorB ?? 0,
    pemenang: t3Match?.pemenang || ''
  };

  const getLeaderboardTableData = () => {
    const existingScores = bolingList.filter(b => b.sukan.toLowerCase() === selectedSukan.toLowerCase());
    const drawn = tournamentDraws[selectedSukan] || {};
    const drawnTeamsList = [];
    Object.keys(drawn).forEach(grp => {
      drawn[grp].forEach(t => { 
        const cleanT = t.trim();
        if (!drawnTeamsList.includes(cleanT)) drawnTeamsList.push(cleanT); 
      });
    });

    const activeList = drawnTeamsList.length > 0 ? drawnTeamsList : teams;

    const listWithScores = activeList.map(teamName => {
      const match = existingScores.find(s => s.pasukan.toLowerCase() === teamName.toLowerCase());
      return {
        pasukan: teamName,
        jumlahPin: match ? match.jumlahPin : 0
      };
    });

    listWithScores.sort((a, b) => b.jumlahPin - a.jumlahPin);
    return listWithScores;
  };

  const currentBolingList = getLeaderboardTableData();

  const getMedalWinners = () => {
    if (isLeaderboardFormat) {
      const sorted = [...currentBolingList].filter(b => b.jumlahPin > 0);
      return {
        emas: sorted[0]?.pasukan || '-',
        perak: sorted[1]?.pasukan || '-',
        gangsa: sorted[2]?.pasukan || '-'
      };
    } else {
      const emas = viewAkhir.pemenang && viewAkhir.pemenang !== 'Seri' ? viewAkhir.pemenang : '-';
      let perak = '-';
      if (viewAkhir.pemenang && viewAkhir.pemenang !== 'Seri' && viewAkhir.pasukanA && viewAkhir.pasukanB) {
        perak = viewAkhir.pemenang === viewAkhir.pasukanA ? viewAkhir.pasukanB : viewAkhir.pasukanA;
      }
      const gangsa = viewT3.pemenang && viewT3.pemenang !== 'Seri' ? viewT3.pemenang : '-';
      return { emas, perak, gangsa };
    }
  };

  const winners = getMedalWinners();

  const getSubListForStage = (peringkat) => {
    return jadualSubList.filter(s => s.sukan.toLowerCase() === selectedSukan.toLowerCase() && s.peringkat === peringkat);
  };

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
              {/* Carta Pungutan Pingat */}
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
                        <th className="p-3 text-center">🥇 Emas (10)</th>
                        <th className="p-3 text-center">🥈 Perak (7)</th>
                        <th className="p-3 text-center">🥉 Gangsa (5)</th>
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

              {/* Perlawanan / Kedudukan Mata Pasukan */}
              <section className="bg-slate-900/60 p-6 rounded-xl border border-slate-700/50 shadow-2xl space-y-6 backdrop-blur-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-blue-400 tracking-wide uppercase">
                      {isLeaderboardFormat ? 'KEDUDUKAN MATA PASUKAN' : (isTeamMatchFormat ? '🏆 CARTA PERLAWANAN BERPASUKAN' : '⚽ CARTA PERLAWANAN')}
                    </h2>
                    {isTeamMatchFormat && (
                      <p className="text-xs text-amber-300/90 font-medium mt-0.5">
                        * Pemenang ditentukan melalui majoriti kemenangan kategori yang dipertandingkan.
                      </p>
                    )}
                  </div>
                  {acaraList.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-300">Pilih Acara:</span>
                      <select value={selectedSukan} onChange={(e) => setSelectedSukan(e.target.value)} className="bg-slate-950/80 border border-slate-700/80 p-2 rounded-lg text-white font-bold">
                        {acaraList.map((s, i) => <option key={i} value={s.nama}>{s.nama}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                {isLeaderboardFormat ? (
                  <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800/80">
                    <h3 className="text-md font-bold text-yellow-400 mb-4 uppercase">Kategori Berpasukan ({selectedSukan})</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-700 text-slate-400 text-sm">
                            <th className="p-3">Rank</th>
                            <th className="p-3">Pasukan</th>
                            <th className="p-3 text-right">Jumlah Mata / Skor</th>
                            <th className="p-3 text-center">Status Pingat</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentBolingList.map((b, idx) => (
                            <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                              <td className="p-3 font-bold text-slate-300">#{idx + 1}</td>
                              <td className="p-3 font-semibold">{b.pasukan}</td>
                              <td className="p-3 text-right font-black text-amber-400 text-lg">{b.jumlahPin} Mata</td>
                              <td className="p-3 text-center">
                                {b.jumlahPin > 0 ? (
                                  <>
                                    {idx === 0 && <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 px-3 py-1 rounded-full text-xs font-bold">🥇 EMAS</span>}
                                    {idx === 1 && <span className="bg-slate-400/20 text-slate-300 border border-slate-400/40 px-3 py-1 rounded-full text-xs font-bold">🥈 PERAK</span>}
                                    {idx === 2 && <span className="bg-amber-600/20 text-amber-500 border border-amber-600/40 px-3 py-1 rounded-full text-xs font-bold">🥉 GANGSA</span>}
                                    {idx > 2 && <span className="text-slate-500 text-xs font-semibold">Tempat Ke-{idx + 1}</span>}
                                  </>
                                ) : (
                                  <span className="text-slate-500 text-xs font-semibold">Belum Mula</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800/80 overflow-x-auto">
                    <div className="min-w-[650px] grid grid-cols-2 gap-8 items-start">
                      
                      {/* SEPARUH AKHIR: MEDAN 1 & MEDAN 2 */}
                      <div className="space-y-6">
                        <h3 className="text-center font-black text-slate-300 tracking-wider">SEPARUH AKHIR</h3>
                        
                        {/* MEDAN 1 (KUMPULAN A) */}
                        <div className="bg-slate-900/70 border border-slate-700/80 rounded-lg p-3 shadow-lg space-y-2">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-400 border-b border-slate-800 pb-1">
                            <span>Separuh Akhir 1 (Kumpulan A)</span>
                            {isTeamMatchFormat && (
                              <button onClick={() => setExpandedTie(expandedTie === 'SF1' ? null : 'SF1')} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[11px]">
                                {expandedTie === 'SF1' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                {expandedTie === 'SF1' ? 'Tutup Perincian' : 'Lihat Kategori Acara'}
                              </button>
                            )}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={`font-bold ${viewSF1.pemenang && viewSF1.pemenang === viewSF1.pasukanA ? 'text-yellow-400' : 'text-slate-100'}`}>
                              {viewSF1.pasukanA}
                            </span>
                            <span className="bg-slate-950/80 px-3 py-1 rounded font-bold text-amber-400">{viewSF1.skorA}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={`font-bold ${viewSF1.pemenang && viewSF1.pemenang === viewSF1.pasukanB ? 'text-yellow-400' : 'text-slate-100'}`}>
                              {viewSF1.pasukanB}
                            </span>
                            <span className="bg-slate-950/80 px-3 py-1 rounded font-bold text-amber-400">{viewSF1.skorB}</span>
                          </div>

                          {isTeamMatchFormat && expandedTie === 'SF1' && (
                            <div className="mt-2 pt-2 border-t border-slate-800 space-y-1 bg-slate-950/60 p-2 rounded">
                              {getSubListForStage('Separuh Akhir 1').length > 0 ? getSubListForStage('Separuh Akhir 1').map((sub, i) => (
                                <div key={i} className="flex justify-between items-center text-[11px] text-slate-300 border-b border-slate-900 pb-0.5 last:border-0">
                                  <span>{sub.kategori}</span>
                                  <span className="font-bold text-yellow-400">{sub.pemenangSub ? `Pemenang: ${sub.pemenangSub}` : 'Belum selesai'}</span>
                                </div>
                              )) : (
                                <p className="text-[11px] text-slate-500 italic text-center">Keputusan kategori acara belum dikemaskini oleh PIC.</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* MEDAN 2 (KUMPULAN B) */}
                        <div className="bg-slate-900/70 border border-slate-700/80 rounded-lg p-3 shadow-lg space-y-2">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-400 border-b border-slate-800 pb-1">
                            <span>Separuh Akhir 2 (Kumpulan B)</span>
                            {isTeamMatchFormat && (
                              <button onClick={() => setExpandedTie(expandedTie === 'SF2' ? null : 'SF2')} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[11px]">
                                {expandedTie === 'SF2' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                {expandedTie === 'SF2' ? 'Tutup Perincian' : 'Lihat Kategori Acara'}
                              </button>
                            )}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={`font-bold ${viewSF2.pemenang && viewSF2.pemenang === viewSF2.pasukanA ? 'text-yellow-400' : 'text-slate-100'}`}>
                              {viewSF2.pasukanA}
                            </span>
                            <span className="bg-slate-950/80 px-3 py-1 rounded font-bold text-amber-400">{viewSF2.skorA}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={`font-bold ${viewSF2.pemenang && viewSF2.pemenang === viewSF2.pasukanB ? 'text-yellow-400' : 'text-slate-100'}`}>
                              {viewSF2.pasukanB}
                            </span>
                            <span className="bg-slate-950/80 px-3 py-1 rounded font-bold text-amber-400">{viewSF2.skorB}</span>
                          </div>

                          {isTeamMatchFormat && expandedTie === 'SF2' && (
                            <div className="mt-2 pt-2 border-t border-slate-800 space-y-1 bg-slate-950/60 p-2 rounded">
                              {getSubListForStage('Separuh Akhir 2').length > 0 ? getSubListForStage('Separuh Akhir 2').map((sub, i) => (
                                <div key={i} className="flex justify-between items-center text-[11px] text-slate-300 border-b border-slate-900 pb-0.5 last:border-0">
                                  <span>{sub.kategori}</span>
                                  <span className="font-bold text-yellow-400">{sub.pemenangSub ? `Pemenang: ${sub.pemenangSub}` : 'Belum selesai'}</span>
                                </div>
                              )) : (
                                <p className="text-[11px] text-slate-500 italic text-center">Keputusan kategori acara belum dikemaskini oleh PIC.</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AKHIR & TEMPAT KE-3 */}
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-center font-black text-yellow-400 tracking-wider mb-2">🥇 PERLAWANAN AKHIR</h3>
                          <div className="bg-slate-900/70 border-2 border-yellow-500/50 rounded-lg p-3 shadow-xl space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold text-yellow-500/80 border-b border-slate-800 pb-1">
                              <span>Perebutan Emas & Perak</span>
                              {isTeamMatchFormat && (
                                <button onClick={() => setExpandedTie(expandedTie === 'AKH' ? null : 'AKH')} className="text-yellow-400 hover:text-yellow-300 flex items-center gap-1 text-[11px]">
                                  {expandedTie === 'AKH' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  {expandedTie === 'AKH' ? 'Tutup' : 'Lihat Kategori'}
                                </button>
                              )}
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`font-bold ${viewAkhir.pemenang && viewAkhir.pemenang === viewAkhir.pasukanA ? 'text-yellow-400' : 'text-slate-100'}`}>
                                {viewAkhir.pasukanA || '-'}
                              </span>
                              <span className="bg-slate-950/80 px-3 py-1 rounded font-bold text-amber-400">{viewAkhir.pasukanA ? viewAkhir.skorA : '-'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`font-bold ${viewAkhir.pemenang && viewAkhir.pemenang === viewAkhir.pasukanB ? 'text-yellow-400' : 'text-slate-100'}`}>
                                {viewAkhir.pasukanB || '-'}
                              </span>
                              <span className="bg-slate-950/80 px-3 py-1 rounded font-bold text-amber-400">{viewAkhir.pasukanB ? viewAkhir.skorB : '-'}</span>
                            </div>

                            {isTeamMatchFormat && expandedTie === 'AKH' && (
                              <div className="mt-2 pt-2 border-t border-slate-800 space-y-1 bg-slate-950/60 p-2 rounded">
                                {getSubListForStage('Akhir').length > 0 ? getSubListForStage('Akhir').map((sub, i) => (
                                  <div key={i} className="flex justify-between items-center text-[11px] text-slate-300 border-b border-slate-900 pb-0.5 last:border-0">
                                    <span>{sub.kategori}</span>
                                    <span className="font-bold text-yellow-400">{sub.pemenangSub ? `Pemenang: ${sub.pemenangSub}` : 'Belum selesai'}</span>
                                  </div>
                                )) : (
                                  <p className="text-[11px] text-slate-500 italic text-center">Keputusan perlawanan belum dikemaskini oleh PIC.</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-center font-black text-amber-500 tracking-wider mb-2">🥉 TEMPAT KE-3 & KE-4</h3>
                          <div className="bg-slate-900/70 border-2 border-amber-600/40 rounded-lg p-3 shadow-lg space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold text-amber-500/80 border-b border-slate-800 pb-1">
                              <span>Perebutan Gangsa</span>
                              {isTeamMatchFormat && (
                                <button onClick={() => setExpandedTie(expandedTie === 'T3' ? null : 'T3')} className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px]">
                                  {expandedTie === 'T3' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  {expandedTie === 'T3' ? 'Tutup' : 'Lihat Kategori'}
                                </button>
                              )}
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`font-bold ${viewT3.pemenang && viewT3.pemenang === viewT3.pasukanA ? 'text-yellow-400' : 'text-slate-100'}`}>
                                {viewT3.pasukanA || '-'}
                              </span>
                              <span className="bg-slate-950/80 px-3 py-1 rounded font-bold text-amber-400">{viewT3.pasukanA ? viewT3.skorA : '-'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`font-bold ${viewT3.pemenang && viewT3.pemenang === viewT3.pasukanB ? 'text-yellow-400' : 'text-slate-100'}`}>
                                {viewT3.pasukanB || '-'}
                              </span>
                              <span className="bg-slate-950/80 px-3 py-1 rounded font-bold text-amber-400">{viewT3.pasukanB ? viewT3.skorB : '-'}</span>
                            </div>

                            {isTeamMatchFormat && expandedTie === 'T3' && (
                              <div className="mt-2 pt-2 border-t border-slate-800 space-y-1 bg-slate-950/60 p-2 rounded">
                                {getSubListForStage('Tempat Ke-3').length > 0 ? getSubListForStage('Tempat Ke-3').map((sub, i) => (
                                  <div key={i} className="flex justify-between items-center text-[11px] text-slate-300 border-b border-slate-900 pb-0.5 last:border-0">
                                    <span>{sub.kategori}</span>
                                    <span className="font-bold text-yellow-400">{sub.pemenangSub ? `Pemenang: ${sub.pemenangSub}` : 'Belum selesai'}</span>
                                  </div>
                                )) : (
                                  <p className="text-[11px] text-slate-500 italic text-center">Keputusan perlawanan belum dikemaskini oleh PIC.</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* KEPUTUSAN PINGAT ACARA TERPILIH */}
                <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-700/80 mt-6 backdrop-blur-md">
                  <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2 uppercase tracking-wide">
                    <Award className="w-5 h-5 text-yellow-400" /> KEPUTUSAN PINGAT KESELURUHAN ({selectedSukan})
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-950/70 p-3.5 rounded-xl border border-yellow-500/40 text-center shadow-lg">
                      <span className="text-[11px] text-yellow-400/90 uppercase font-black tracking-wider block mb-1">
                        🥇 JOHAN (EMAS - 10 MATA)
                      </span>
                      <span className="text-lg font-black text-white block">
                        {winners.emas}
                      </span>
                    </div>

                    <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-400/40 text-center shadow-lg">
                      <span className="text-[11px] text-slate-300 uppercase font-black tracking-wider block mb-1">
                        🥈 NAIB JOHAN (PERAK - 7 MATA)
                      </span>
                      <span className="text-lg font-black text-white block">
                        {winners.perak}
                      </span>
                    </div>

                    <div className="bg-slate-950/70 p-3.5 rounded-xl border border-amber-600/40 text-center shadow-lg">
                      <span className="text-[11px] text-amber-500 uppercase font-black tracking-wider block mb-1">
                        🥉 TEMPAT KE-3 (GANGSA - 5 MATA)
                      </span>
                      <span className="text-lg font-black text-white block">
                        {winners.gangsa}
                      </span>
                    </div>
                  </div>
                </div>

              </section>
            </>
          )}

          {/* TAB 2: PENTAS UNDIAN */}
          {activeTab === 'undian' && (
            <div className="space-y-6">
              <section className="bg-slate-900/60 p-6 rounded-xl border border-blue-500/40 shadow-2xl backdrop-blur-md">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    <h2 className="text-sm md:text-base font-bold text-white uppercase tracking-wide">
                      Senarai Pasukan / Kontinjen (Urusetia Sahaja)
                    </h2>
                  </div>
                  <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full font-bold">
                    {teams.length} Pasukan Berdaftar
                  </span>
                </div>

                {canManageUndian ? (
                  <div className="flex gap-2 mb-4">
                    <input 
                      type="text" 
                      placeholder="Tambah nama kontinjen / pasukan" 
                      value={newTeamInput} 
                      onChange={(e) => setNewTeamInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddTeam(); }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500" 
                    />
                    <button onClick={handleAddTeam} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow">
                      <Plus className="w-4 h-4" /> Tambah
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mb-3 italic">
                    Log masuk sebagai Urusetia Pengundian / Master Admin untuk menambah atau memadam pasukan.
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {teams.map((tm, idx) => (
                    <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-slate-950 border border-slate-700 text-slate-200 font-semibold shadow-sm">
                      {tm}
                      {canManageUndian && (
                        <button onClick={() => handleRemoveTeam(idx)} className="text-slate-400 hover:text-rose-400 ml-1 transition" title="Padam Pasukan">
                          ✕
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </section>

              {/* Pentas Cabutan Undian Langsung */}
              <section className="bg-slate-900/60 p-6 rounded-xl border border-slate-700/50 shadow-2xl backdrop-blur-md">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-lg md:text-xl font-black text-amber-400 flex items-center gap-2">
                      <Dices className="text-amber-300" /> Pentas Cabutan Undian Langsung
                    </h2>
                    <p className="text-xs text-slate-300">Pancaran cabutan rasmi kumpulan.</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <select value={selectedSportUndian} onChange={(e) => setSelectedSportUndian(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold">
                      {acaraList.map((s, i) => <option key={i} value={s.nama}>{s.nama}</option>)}
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
                  <div className="text-3xl md:text-5xl font-black text-emerald-400 py-3 tracking-wide">{drawDisplay}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <button onClick={mulakanCabutan} disabled={isRolling || !canManageUndian} className="sm:col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-40">
                    <Play className="w-4 h-4" /> Mulakan Cabutan Rawak
                  </button>
                  <button onClick={undiSemuaSekaligus} disabled={isRolling || !canManageUndian} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 disabled:opacity-40">
                    <Forward className="w-4 h-4" /> Undi Sukan Ini Terus
                  </button>
                </div>

                <div className="flex justify-between items-center mt-3 pt-2">
                  <span className="text-xs text-amber-400/90 italic">
                    {!canManageUndian ? "ℹ️ Mod Atlet: Hanya tontonan langsung. Log masuk Admin untuk membuat cabutan." : ""}
                  </span>
                  {canManageUndian && (
                    <button onClick={resetUndianSukanIni} className="text-xs text-rose-400 hover:text-rose-300 underline flex items-center gap-1">
                      <RotateCcw className="w-3.5 h-3.5" /> Reset Undian Sukan Ini ({selectedSportUndian})
                    </button>
                  )}
                </div>
              </section>

              {/* Grid Keputusan Undian Kumpulan di Tab Undian */}
              <section className="bg-slate-900/60 p-6 rounded-xl border border-slate-700/50 shadow-2xl backdrop-blur-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">Keputusan Rasmi Undian Kumpulan</h3>
                  <button onClick={() => window.print()} className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-1.5">
                    <Printer className="w-4 h-4" /> Cetak / PDF
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {acaraList.map((s, idx) => {
                    const spDraws = tournamentDraws[s.nama] || {};
                    const validGroups = [];
                    const count = Number(s.kumpulan) || 1;
                    for (let g = 0; g < count; g++) {
                      validGroups.push(count === 1 ? "Liga Kumpulan" : `Kumpulan ${String.fromCharCode(65 + g)}`);
                    }

                    const hasDraws = validGroups.some(grp => (spDraws[grp] || []).length > 0);

                    return (
                      <div key={idx} className="bg-slate-950/80 rounded-2xl p-4 shadow-xl border border-white/10">
                        <div className="text-xs font-black text-amber-400 mb-3 uppercase tracking-wider flex items-center justify-between border-b border-white/10 pb-2">
                          <span>🏆 {s.nama}</span>
                          <span className="text-[10px] text-slate-300">{s.format}</span>
                        </div>

                        {!hasDraws ? (
                          <div className="text-[11px] text-slate-400 italic px-3 py-2 bg-slate-900/50 rounded-lg text-center">
                            Belum dibuat undian
                          </div>
                        ) : (
                          validGroups.map((grpName, gIdx) => {
                            const teamList = spDraws[grpName] || [];
                            return (
                              <div key={gIdx} className="mb-3 last:mb-0">
                                <div className="text-[11px] font-bold text-amber-300 mb-1 flex items-center justify-between">
                                  <span>{grpName}</span>
                                  <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-300">{teamList.length} Pasukan</span>
                                </div>
                                <ul className="space-y-1">
                                  {teamList.map((tm, tIdx) => (
                                    <li key={tIdx} className="flex items-center gap-2 text-xs bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-white">
                                      <span className="w-4 text-center font-bold text-amber-400">{tIdx + 1}.</span>
                                      <span>{tm}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* TAB 3: ADMIN PORTAL */}
          {activeTab === 'admin' && (
            !currentUser ? (
              <div className="max-w-md mx-auto bg-slate-900/70 p-8 rounded-xl border border-slate-700/60 text-center shadow-2xl backdrop-blur-md">
                <Lock className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Log Masuk Pegawai</h2>
                <p className="text-xs text-slate-400 mb-4">Masukkan emel berdaftar dalam helaian Admin.</p>
                
                <form onSubmit={handleLoginByEmail} className="space-y-4">
                  <input 
                    type="email" 
                    placeholder="nama@jksm.gov.my" 
                    value={inputEmail} 
                    onChange={(e) => setInputEmail(e.target.value)} 
                    required
                    className="w-full p-3 bg-slate-950/80 border border-slate-700/80 rounded-lg text-white" 
                  />
                  {loginError && <div className="p-2 text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg">{loginError}</div>}
                  <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-lg font-bold">
                    {loading ? 'Menyemak...' : 'Log Masuk'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{currentUser.name} ({currentUser.email})</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          PERANAN: {currentUser.role}
                        </span>
                        {currentUser.role === 'SUKAN' && (
                          <span className="text-[11px] text-slate-300">Dibenarkan: <strong>{currentUser.allowedSports}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 px-3 py-1.5 rounded-lg text-xs font-bold">
                    <LogOut className="w-3.5 h-3.5" /> Keluar
                  </button>
                </div>

                {/* KHAS MASTER ADMIN: DAFTAR ACARA */}
                {currentUser.role === 'MASTER' && (
                  <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-700/50 space-y-4 backdrop-blur-md">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Plus className="text-emerald-400" /> Daftar Acara Sukan (Tab Acara)</h3>
                    <form onSubmit={handleAddAcara} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <input type="text" placeholder="Nama Sukan (cth: Badminton Berpasukan)" value={newAcara.nama} onChange={(e) => setNewAcara({...newAcara, nama: e.target.value})} required className="p-3 bg-slate-950/80 border border-slate-700/80 rounded-lg text-sm" />
                      <select value={newAcara.format} onChange={(e) => setNewAcara({...newAcara, format: e.target.value})} className="p-3 bg-slate-950/80 border border-slate-700/80 rounded-lg text-sm text-amber-400 font-bold">
                        <option value="Kalah Mati (Berpasukan)">Kalah Mati (Berpasukan)</option>
                        <option value="Kalah Mati">Kalah Mati (Individu / Biasa)</option>
                        <option value="Boling">Boling / Mata Pasukan</option>
                      </select>
                      <input type="number" placeholder="Bil Kumpulan" value={newAcara.kumpulan} onChange={(e) => setNewAcara({...newAcara, kumpulan: e.target.value})} className="p-3 bg-slate-950/80 border border-slate-700/80 rounded-lg text-sm" />
                      <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 font-bold p-3 rounded-lg text-sm">Simpan Acara</button>
                    </form>

                    <div className="mt-4 border-t border-slate-700/60 pt-4">
                      <h4 className="text-sm font-bold text-slate-300 mb-2">Senarai Acara Sedia Ada:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {acaraList.map((s, i) => (
                          <div key={i} className="bg-slate-950/60 p-3 rounded-lg border border-slate-700/60 flex justify-between items-center">
                            <div><p className="font-bold text-white text-sm">{s.nama}</p><p className="text-xs text-slate-300">{s.format} ({s.kumpulan} Kumpulan)</p></div>
                            <button onClick={() => handleDeleteAcara(s.nama)} className="p-2 bg-rose-600/40 text-rose-300 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* KEMASKINI SKOR */}
                {(currentUser.role === 'MASTER' || currentUser.role === 'SUKAN') && (
                  <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-700/50 space-y-4 backdrop-blur-md">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-yellow-400">
                      <Plus className="text-emerald-400" /> Kemaskini Skor Acara
                    </h3>

                    {allowedSports.length === 0 ? (
                      <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800 text-center text-sm text-slate-400">
                        Tiada sukan diberikan kepada emel anda.
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800 space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih Acara Sukan</label>
                          <select value={selectedSukan} onChange={(e) => setSelectedSukan(e.target.value)} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold">
                            {allowedSports.map((s, i) => <option key={i} value={s.nama}>{s.nama} ({s.format})</option>)}
                          </select>
                        </div>

                        {isLeaderboardFormat ? (
                          <form onSubmit={handleSaveBoling} className="space-y-4 border-t border-slate-800 pt-4">
                            <h4 className="text-sm font-bold text-yellow-400 uppercase">
                              KEDUDUKAN MATA PASUKAN ({selectedSukan})
                            </h4>
                            {bolingPasukanRows.map((row, index) => (
                              <div key={index} className="flex items-center gap-3">
                                <input type="text" placeholder="Pasukan" value={row.pasukan} onChange={(e) => { const cp = [...bolingPasukanRows]; cp[index].pasukan = e.target.value; setBolingPasukanRows(cp); }} className="w-2/3 p-2 bg-slate-900 border border-slate-700 rounded-lg text-sm" />
                                <input 
                                  type="number" 
                                  placeholder="Mata" 
                                  value={row.jumlahPin} 
                                  onChange={(e) => { const cp = [...bolingPasukanRows]; cp[index].jumlahPin = Number(e.target.value); setBolingPasukanRows(cp); }} 
                                  className="w-1/3 p-2 bg-slate-900 border border-slate-700 rounded-lg font-bold text-yellow-400 text-sm" 
                                />
                              </div>
                            ))}
                            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold p-3 rounded-lg">
                              Simpan Skor Pasukan
                            </button>
                          </form>
                        ) : (
                          <form onSubmit={handleAddJadual} className="space-y-4 border-t border-slate-800 pt-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 mb-1">Peringkat</label>
                              <select value={newJadual.peringkat} onChange={(e) => setNewJadual({...newJadual, peringkat: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-sm">
                                <option value="Separuh Akhir 1">Separuh Akhir 1</option>
                                <option value="Separuh Akhir 2">Separuh Akhir 2</option>
                                <option value="Akhir">Akhir (Johan / Naib Johan)</option>
                                <option value="Tempat Ke-3">Tempat Ke-3 & Ke-4</option>
                              </select>
                            </div>

                            {/* FORMAT BERPASUKAN: ADMIN BEBAS TAMBAH / PADAM KATEGORI ACARA */}
                            {isTeamMatchFormat ? (
                              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                  <span className="text-xs font-bold text-yellow-400 uppercase">
                                    Kategori Perlawanan: {newJadual.pasukanA || 'A'} vs {newJadual.pasukanB || 'B'}
                                  </span>
                                  <span className="text-xs font-bold text-emerald-400">
                                    Mata Semasa: {newJadual.skorA} - {newJadual.skorB}
                                  </span>
                                </div>

                                {/* Form Tambah Kategori Acara Sendiri oleh Admin */}
                                <div className="flex gap-2 pt-1">
                                  <input 
                                    type="text" 
                                    placeholder="Tambah nama kategori (cth: Beregu Campuran / Single Lelaki)"
                                    value={customCategoryInput}
                                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomCategory(); }}}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                                  />
                                  <button type="button" onClick={handleAddCustomCategory} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap">
                                    + Tambah Kategori
                                  </button>
                                </div>

                                {/* Senarai Kategori Perlawanan */}
                                <div className="space-y-2 pt-2">
                                  {subMatches.map((item, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-2.5 bg-slate-900/80 rounded-lg text-xs border border-slate-800">
                                      <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => handleRemoveCustomCategory(idx)} className="text-rose-400 hover:text-rose-300" title="Padam Kategori Ini">
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="font-semibold text-slate-200">{item.kategori}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-slate-400">Pemenang:</span>
                                        <select 
                                          value={item.pemenangSub} 
                                          onChange={(e) => handleSubWinnerSelect(idx, e.target.value)}
                                          className="p-1.5 bg-slate-950 border border-slate-700 rounded text-amber-400 font-bold text-xs"
                                        >
                                          <option value="">-- Pilih Pemenang --</option>
                                          <option value={newJadual.pasukanA}>{newJadual.pasukanA}</option>
                                          <option value={newJadual.pasukanB}>{newJadual.pasukanB}</option>
                                        </select>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="p-3 bg-slate-900 border border-emerald-500/50 rounded-lg text-emerald-400 font-bold text-center text-sm">
                                  Pemenang Keseluruhan Perlawanan: {newJadual.pemenang || 'Belum Ditentukan (Perlu Majoriti)'}
                                </div>
                              </div>
                            ) : (
                              /* FORMAT KALAH MATI BIASA */
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex gap-2">
                                  <input type="text" placeholder="Pasukan A" value={newJadual.pasukanA} onChange={(e) => { const v = e.target.value; setNewJadual(p => ({ ...p, pasukanA: v, pemenang: calculateWinner(p.skorA, p.skorB, v, p.pasukanB) })); }} className="w-3/4 p-3 bg-slate-900 border border-slate-700 rounded-lg text-sm font-semibold text-white" />
                                  <input type="number" value={newJadual.skorA} onChange={(e) => handleSkorChange(e.target.value, newJadual.skorB)} className="w-1/4 p-3 bg-slate-900 border border-slate-700 rounded-lg text-center font-bold text-sm text-yellow-400" />
                                </div>
                                <div className="flex gap-2">
                                  <input type="text" placeholder="Pasukan B" value={newJadual.pasukanB} onChange={(e) => { const v = e.target.value; setNewJadual(p => ({ ...p, pasukanB: v, pemenang: calculateWinner(p.skorA, p.skorB, p.pasukanA, v) })); }} className="w-3/4 p-3 bg-slate-900 border border-slate-700 rounded-lg text-sm font-semibold text-white" />
                                  <input type="number" value={newJadual.skorB} onChange={(e) => handleSkorChange(newJadual.skorA, e.target.value)} className="w-1/4 p-3 bg-slate-900 border border-slate-700 rounded-lg text-center font-bold text-sm text-yellow-400" />
                                </div>
                              </div>
                            )}

                            {!isTeamMatchFormat && (
                              <div className="p-3 bg-slate-950 border border-emerald-500/50 rounded-lg text-emerald-400 font-bold text-center text-sm">
                                Pemenang: {newJadual.pemenang || '-'}
                              </div>
                            )}

                            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold p-3 rounded-lg">
                              Kemaskini Perlawanan
                            </button>
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
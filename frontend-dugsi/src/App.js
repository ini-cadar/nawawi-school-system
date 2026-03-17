import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Markaad Render saarayso, tani waxay ka dhigaysaa mid toos u shaqaysa
const API = window.location.hostname === "localhost" ? "http://localhost:3000/api" : "/api";

const FASALLADA = ["Xadaano", "1aad", "2aad", "3aad", "4aad", "5aad", "6aad", "7aad", "8aad", "9aad", "10aad", "11aad", "12aad"];
const WEEK_DAYS = ["Sabti", "Axad", "Isniin", "Talaado", "Arbaco", "Khamiis"];

const SUBJECTS = {
  "Xadaano": ["Hifdi", "Farshaxan", "Xisaab Mini", "Af-Somali", "English Mini"],
  "Primary": ["Af-Somali", "Carabi", "Xisaab", "Tarbiya", "Saynis", "English", "Social Studies"],
  "Secondary": ["Physics", "Chemistry", "Biology", "Math", "English", "History", "Geography", "Culuunta Diinta"]
};

export default function App() {
  const [user, setUser] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [view, setView] = useState("classes");
  const [activeFasal, setActiveFasal] = useState("");
  const [adminTab, setAdminTab] = useState("attendance");
  const [studentTab, setStudentTab] = useState("exam");
  const [form, setForm] = useState({ id: "", pass: "" });
  const [search, setSearch] = useState("");
  const [showAttButtons, setShowAttButtons] = useState(false);

  useEffect(() => { 
    if (user?.role === 'admin') load(); 
  }, [user]);

  const load = () => {
    axios.get(`${API}/data`).then(res => setAllStudents(res.data));
  };

  const login = () => {
    axios.post(`${API}/login`, form)
      .then(res => setUser(res.data))
      .catch(() => alert("ID ama Pass khaldan!"));
  };

  const saveChange = async (student) => {
    await axios.post(`${API}/update-student`, student);
    if (user.role === 'admin') load();
  };

  const addStudent = (f) => {
    const n = prompt("Magaca Saddexan:");
    const id = prompt("ID-ga Ardayga:");
    if(n && id) {
      const s = { id, pass: "123", magaca: n, fasalka: f, exams: {}, att: {}, fee: "Ma bixin" };
      saveChange(s);
    }
  };

  const getSubs = (f) => {
    if (f === "Xadaano") return SUBJECTS["Xadaano"];
    if (["1aad", "2aad", "3aad", "4aad", "5aad", "6aad", "7aad", "8aad"].includes(f)) return SUBJECTS["Primary"];
    return SUBJECTS["Secondary"];
  };

  if (!user) return (
    <div style={st.loginBg}><div style={st.card}>
      <h1 style={{color:'#1a2a6c'}}>NAWAWI SCHOOL</h1>
      <input style={st.in} placeholder="ID Number" onChange={e => setForm({...form, id: e.target.value})} />
      <input style={st.in} type="password" placeholder="Password" onChange={e => setForm({...form, pass: e.target.value})} />
      <button style={st.btn} onClick={login}>SOO GAL</button>
    </div></div>
  );

  return (
    <div style={{display:'flex', height:'100vh', background:'#f8f9fa'}}>
      {/* SIDEBAR - Midig ayay ku fiican tahay haddii Af-Somali yahay laakiin bidix aan ku deyno */}
      <div style={st.sidebar}>
        <div style={st.profile}><h2>NAWAWI</h2><p>{user.magaca}</p></div>
        <div style={st.nav}>
          {user.role === 'admin' ? (
            <>
              <button style={st.navBtn} onClick={() => { setView("classes"); setShowAttButtons(false); }}>🏠 Dashboard</button>
              <button style={st.navBtn} onClick={() => setAdminTab("attendance")}>📅 Attendance</button>
              <button style={st.navBtn} onClick={() => setAdminTab("exams")}>📝 Exams</button>
              <button style={st.navBtn} onClick={() => setAdminTab("fees")}>💰 Fees</button>
            </>
          ) : (
            <>
              <button style={st.navBtn} onClick={() => setStudentTab("attendance")}>📅 Xadiriska</button>
              <button style={st.navBtn} onClick={() => setStudentTab("exam")}>📝 Natiijada</button>
            </>
          )}
        </div>
        <button style={st.out} onClick={() => setUser(null)}>Logout</button>
      </div>

      {/* CONTENT */}
      <div style={{flex:1, padding:'40px', overflowY:'auto'}}>
        {user.role === 'admin' ? (
          view === "classes" ? (
            <div style={st.grid}>
              {FASALLADA.map(f => (
                <div key={f} style={st.classBox} onClick={() => { setActiveFasal(f); setView("list"); }}>
                  <h3>{f}</h3>
                  <p>{allStudents.filter(s => s.fasalka === f).length} Arday</p>
                  <button style={st.addBtn} onClick={(e) => { e.stopPropagation(); addStudent(f); }}>+ Ku dar Arday</button>
                </div>
              ))}
            </div>
          ) : (
            <div style={st.whiteCard}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                <button onClick={() => setView("classes")} style={st.backBtn}>← Laabo</button>
                <input style={st.search} placeholder="Raadi ardayga..." onChange={e => setSearch(e.target.value)} />
                {adminTab === "attendance" && (
                  <button onClick={() => setShowAttButtons(!showAttButtons)} style={st.toggleBtn}>
                    {showAttButtons ? "Xidha Attendance" : "Fura Attendance"}
                  </button>
                )}
              </div>
              <h2 style={{color:'#1a2a6c'}}>{activeFasal} - {adminTab.toUpperCase()}</h2>
              <table style={st.table}>
                <thead>
                  <tr style={st.thead}>
                    <th>ID</th><th>Magaca</th>
                    {adminTab === "exams" ? getSubs(activeFasal).map(m => <th key={m}>{m}</th>) : <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {allStudents.filter(s => s.fasalka === activeFasal && s.magaca.toLowerCase().includes(search.toLowerCase())).map(s => (
                    <tr key={s.id} style={st.tr}>
                      <td>{s.id}</td><td>{s.magaca}</td>
                      {adminTab === "exams" ? getSubs(activeFasal).map(m => (
                        <td key={m}><input style={st.markIn} defaultValue={s.exams[m] || ""} onBlur={(e) => { s.exams[m] = e.target.value; saveChange(s); }} /></td>
                      )) : (
                        <td>
                          {adminTab === "attendance" && showAttButtons && (
                            <div style={{display:'flex', gap:'5px', justifyContent:'center'}}>
                              <button style={st.pBtn} onClick={() => { s.att[WEEK_DAYS[new Date().getDay()]] = "√"; saveChange(s); }}>√ Sax</button>
                              <button style={st.aBtn} onClick={() => { s.att[WEEK_DAYS[new Date().getDay()]] = "X"; saveChange(s); }}>X Qalad</button>
                            </div>
                          )}
                          {adminTab === "fees" && <select value={s.fee} onChange={(e) => { s.fee = e.target.value; saveChange(s); }}><option>Ma bixin</option><option>Bixiyey</option></select>}
                          <button onClick={async () => { if(window.confirm('Ma tirtirtaa?')) { await axios.delete(`${API}/student/${s.id}`); load(); } }} style={st.del}>Tirtir</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* STUDENT VIEW */
          <div style={st.stuCard}>
            <h1 style={{color:'#1a2a6c'}}>Nawawi Portal: {user.magaca}</h1>
            <p><strong>Fasalka:</strong> {user.fasalka}</p>
            {studentTab === "exam" && (
              <div style={st.markGrid}>
                {getSubs(user.fasalka).map(m => (
                  <div key={m} style={st.markBox}><b>{m}</b><br/>{user.exams[m] || "0"}</div>
                ))}
              </div>
            )}
            {studentTab === "attendance" && (
              <div style={st.attGrid}>
                {WEEK_DAYS.map(d => (
                  <div key={d} style={{...st.dayBox, background: user.att[d] === "√" ? '#2ecc71' : user.att[d] === "X" ? '#e74c3c' : '#fff', color: user.att[d] ? '#fff' : '#000'}}>
                    <b>{d}</b><br/>{user.att[d] || "-"}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Styling-ku sidii buu u yahay...
const st = {
    loginBg: { height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#1a2a6c' },
    card: { background:'white', padding:'40px', borderRadius:'15px', textAlign:'center', width:'350px' },
    in: { display:'block', width:'100%', padding:'12px', margin:'10px 0', borderRadius:'8px', border:'1px solid #ddd' },
    btn: { width:'100%', padding:'12px', background:'#1a2a6c', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold' },
    sidebar: { width:'240px', background:'#1c2833', color:'white', padding:'30px' },
    profile: { textAlign:'center', marginBottom:'40px', borderBottom:'1px solid #2c3e50', paddingBottom:'20px' },
    navBtn: { display:'block', width:'100%', padding:'15px', background:'transparent', border:'none', color:'#bdc3c7', textAlign:'left', cursor:'pointer' },
    grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'20px' },
    classBox: { background:'white', padding:'25px', borderRadius:'15px', textAlign:'center', cursor:'pointer', borderBottom:'5px solid #1a2a6c' },
    addBtn: { background:'#f39c12', color:'white', border:'none', padding:'5px 10px', borderRadius:'5px', marginTop:'10px', fontSize:'11px' },
    whiteCard: { background:'white', padding:'40px', borderRadius:'15px' },
    table: { width:'100%', borderCollapse:'collapse', marginTop:'20px' },
    thead: { background:'#f8f9fa', height:'45px' },
    tr: { borderBottom:'1px solid #eee', height:'60px', textAlign:'center' },
    markIn: { width:'40px', padding:'5px', textAlign:'center' },
    search: { padding:'10px', width:'250px', borderRadius:'8px', border:'1px solid #ddd' },
    toggleBtn: { background:'#27ae60', color:'white', border:'none', padding:'10px 15px', borderRadius:'8px', cursor:'pointer' },
    pBtn: { background:'#2ecc71', color:'white', border:'none', padding:'5px 10px', borderRadius:'4px' },
    aBtn: { background:'#e74c3c', color:'white', border:'none', padding:'5px 10px', borderRadius:'4px' },
    stuCard: { background:'white', padding:'40px', borderRadius:'20px' },
    markGrid: { display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'15px', marginTop:'20px' },
    markBox: { background:'#f8f9fa', padding:'15px', borderRadius:'10px', textAlign:'center', border:'1px solid #eee' },
    attGrid: { display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'10px', marginTop:'20px' },
    dayBox: { padding:'15px 5px', textAlign:'center', borderRadius:'10px', border:'1px solid #eee' },
    out: { padding:'12px', background:'#e74c3c', color:'white', border:'none', borderRadius:'8px', width:'100%', marginTop:'20px' },
    backBtn: { padding:'8px 15px', background:'#eee', border:'none', borderRadius:'5px', cursor:'pointer' },
    del: { color:'red', border:'none', background:'none', cursor:'pointer', marginLeft:'10px' }
  };
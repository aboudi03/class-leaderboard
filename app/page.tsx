"use client";

import {
  Award, BarChart3, Bell, BookOpen, Camera, ChevronDown, Crown, Dice5, Download, Gauge,
  Gem, Heart, History, Home, Menu, Minus, MoreHorizontal, Plus,
  Search, Settings, ShieldCheck, Sparkles, Star, Target, Trash2, TrendingUp,
  Trophy, UserPlus, Users, WandSparkles, X, Zap,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  AppData, CLASSES, getLevel, getProgress, LEVELS, levelIndex, NEGATIVE_REASONS,
  PointTransaction, POSITIVE_REASONS, seedData, Student, ThemeId,
} from "@/lib/game";

type View = "dashboard" | "classes" | "levels" | "tools" | "reports" | "settings";
type SortBy = "name" | "points" | "level" | "progress";
type PointModal = { student: Student; type: "positive" | "negative" } | null;
type Celebration = { student: string; from: string; to: string; final: boolean } | null;

const CLASS_KEY = "level-up-heroes-class-v1";

const navItems: Array<{ id: View; label: string; icon: typeof Home }> = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "classes", label: "Classes", icon: Users },
  { id: "levels", label: "Levels", icon: Star },
  { id: "tools", label: "Classroom Tools", icon: WandSparkles },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function Avatar({ student, theme, large = false, editable = false, onClick }: {
  student: Student; theme: ThemeId; large?: boolean; editable?: boolean; onClick?: () => void;
}) {
  return (
    <button className={`avatar ${large ? "avatar-large" : ""} ${editable ? "editable" : ""}`} onClick={onClick} type="button" aria-label={editable ? `Edit ${student.name}'s avatar` : `${student.name}'s avatar`}>
      {student.photo ? <img src={student.photo} alt="" /> : <span>{initials(student.name)}</span>}
      {theme === "neon" ? <i className="avatar-tech" /> : <><i className="avatar-spark s1">✦</i><i className="avatar-spark s2">✧</i></>}
      {editable && <span className="camera-dot"><Camera size={12} /></span>}
    </button>
  );
}

export default function HomePage() {
  const [data, setData] = useState<AppData>(() => seedData());
  const [hydrated, setHydrated] = useState(false);
  const [classId, setClassId] = useState("g3-boys");
  const [view, setView] = useState<View>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("points");
  const [pointModal, setPointModal] = useState<PointModal>(null);
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);
  const [studentModal, setStudentModal] = useState<{ mode: "add" | "edit"; student?: Student } | null>(null);
  const [randomStudent, setRandomStudent] = useState<Student | null>(null);
  const [celebration, setCelebration] = useState<Celebration>(null);
  const [toast, setToast] = useState<{ student: string; points: number } | null>(null);

  useEffect(() => {
    const savedClass = localStorage.getItem(CLASS_KEY);
    if (savedClass && CLASSES.some((item) => item.id === savedClass)) setClassId(savedClass);

    fetch("/api/data")
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json()).error ?? "Unable to load data.");
        return response.json() as Promise<AppData>;
      })
      .then(setData)
      .catch((error) => {
        console.error(error);
        window.alert("Could not load the leaderboard from MongoDB. Check MONGODB_URI and your Atlas network access.");
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(CLASS_KEY, classId);
  }, [classId, hydrated]);

  const currentClass = CLASSES.find((item) => item.id === classId)!;
  const theme = currentClass.theme;
  const classStudents = useMemo(() => data.students.filter((student) => student.classId === classId), [data.students, classId]);
  const visibleStudents = useMemo(() => {
    const filtered = classStudents.filter((student) => student.name.toLowerCase().includes(search.toLowerCase()));
    return [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "level") return levelIndex(b.points) - levelIndex(a.points);
      if (sortBy === "progress") return getProgress(b.points, theme).percent - getProgress(a.points, theme).percent;
      return b.points - a.points;
    });
  }, [classStudents, search, sortBy, theme]);

  const totalPoints = classStudents.reduce((sum, student) => sum + student.points, 0);
  const champions = classStudents.filter((student) => student.points >= 300).length;
  const average = classStudents.length ? Math.round(totalPoints / classStudents.length) : 0;
  const topStudents = [...classStudents].sort((a, b) => b.points - a.points).slice(0, 5);

  function switchClass(id: string) {
    setClassId(id);
    setSearch("");
    setSidebarOpen(false);
    setRandomStudent(null);
  }

  function pickRandomStudent() {
    if (!classStudents.length) return;

    const choices = classStudents.length > 1 && randomStudent
      ? classStudents.filter((student) => student.id !== randomStudent.id)
      : classStudents;
    setRandomStudent(choices[Math.floor(Math.random() * choices.length)]);
  }

  async function addPoints(student: Student, points: number, reason: string) {
    const beforeIndex = levelIndex(student.points);
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id, points, reason }),
      });
      if (!response.ok) throw new Error((await response.json()).error ?? "Unable to save points.");
      const result = await response.json() as { student: Student; transaction: PointTransaction };
      const afterIndex = levelIndex(result.student.points);
      setData((current) => ({
        students: current.students.map((item) => item.id === result.student.id ? result.student : item),
        transactions: [result.transaction, ...current.transactions],
      }));
      setPointModal(null);
      setToast({ student: result.student.name, points: result.transaction.points });
      window.setTimeout(() => setToast(null), 1800);
      if (afterIndex > beforeIndex) {
        const levels = LEVELS[theme];
        setCelebration({ student: result.student.name, from: levels[beforeIndex].name, to: levels[afterIndex].name, final: afterIndex === 6 });
      }
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : "Unable to save points.");
    }
  }

  async function saveStudent(name: string, photo: string | null, existing?: Student) {
    try {
      const response = await fetch(existing ? `/api/students/${existing.id}` : "/api/students", {
        method: existing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(existing ? { name, photo } : { classId, name, photo }),
      });
      if (!response.ok) throw new Error((await response.json()).error ?? "Unable to save student.");
      const saved = await response.json() as Student;
      setData((current) => ({
        ...current,
        students: existing
          ? current.students.map((item) => item.id === saved.id ? saved : item)
          : [...current.students, saved],
      }));
      setStudentModal(null);
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : "Unable to save student.");
    }
  }

  async function deleteStudent(student: Student) {
    const confirmed = window.confirm(
      `Delete ${student.name} and all of their point history? This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/students/${student.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json()).error ?? "Unable to delete student.");

      setData((current) => ({
        students: current.students.filter((item) => item.id !== student.id),
        transactions: current.transactions.filter((item) => item.studentId !== student.id),
      }));
      setStudentModal(null);
      setHistoryStudent((current) => current?.id === student.id ? null : current);
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : "Unable to delete student.");
    }
  }

  const pageTitle = navItems.find((item) => item.id === view)?.label ?? "Dashboard";

  return (
    <main className={`app theme-${theme}`}>
      <div className="ambient" aria-hidden="true"><i /><i /><i /></div>
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Zap size={22} fill="currentColor" /></div>
          <div><strong>LEVEL UP</strong><span>HEROES</span></div>
        </div>
        <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X /></button>
        <nav>
          <span className="nav-label">TEACHER PORTAL</span>
          {navItems.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => { setView(item.id); setSidebarOpen(false); }}><Icon size={19} /><span>{item.label}</span>{view === item.id && <i />}</button>;
          })}
        </nav>
        <div className="mission-card">
          <div className="mission-icon">{theme === "neon" ? <Target /> : <Crown />}</div>
          <span>CLASS MISSION</span>
          <strong>{champions ? `${champions} ultimate hero${champions > 1 ? "es" : ""}!` : "Reach the trophy"}</strong>
          <small>{Math.min(100, Math.round((totalPoints / Math.max(1, classStudents.length * 300)) * 100))}% class progress</small>
          <div className="mini-progress"><i style={{ width: `${Math.min(100, Math.round((totalPoints / Math.max(1, classStudents.length * 300)) * 100))}%` }} /></div>
        </div>
        <div className="teacher-mini"><div className="teacher-avatar">OS</div><div><strong>Ms. Oumama Saleh</strong><span>Class Teacher</span></div><MoreHorizontal size={18} /></div>
      </aside>
      {sidebarOpen && <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close menu overlay" />}

      <section className="main-shell">
        <header className="topbar">
          <button className="menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu /></button>
          <div className="heading"><span>{pageTitle === "Dashboard" ? "MISSION CONTROL" : pageTitle.toUpperCase()}</span><h1>{view === "dashboard" ? <>Welcome back, Teacher! <em>👋</em></> : pageTitle}</h1><p>{theme === "neon" ? "Your heroes are ready for today’s mission." : "A beautiful day to help every student shine."}</p></div>
          <div className="top-actions">
            <button className="notification" aria-label="Notifications"><Bell size={19} /><i>3</i></button>
            <div className="profile"><div className="teacher-avatar">OS</div><div><strong>Ms. Oumama Saleh</strong><span>Teacher</span></div><ChevronDown size={16} /></div>
          </div>
        </header>

        <ClassSelector classId={classId} onSelect={switchClass} theme={theme} />

        {view === "dashboard" && <Dashboard
          students={visibleStudents} allStudents={classStudents} theme={theme} totalPoints={totalPoints}
          champions={champions} average={average} topStudents={topStudents} search={search} setSearch={setSearch}
          sortBy={sortBy} setSortBy={setSortBy} onPoint={(student, type) => setPointModal({ student, type })}
          onHistory={setHistoryStudent} onEdit={(student) => setStudentModal({ mode: "edit", student })}
          onAdd={() => setStudentModal({ mode: "add" })} onRandom={pickRandomStudent} currentClass={currentClass.name}
        />}
        {view === "classes" && <ClassesView students={visibleStudents} hasStudents={classStudents.length > 0} theme={theme} search={search} setSearch={setSearch} sortBy={sortBy} setSortBy={setSortBy} onPoint={(student, type) => setPointModal({ student, type })} onHistory={setHistoryStudent} onEdit={(student) => setStudentModal({ mode: "edit", student })} onAdd={() => setStudentModal({ mode: "add" })} onRandom={pickRandomStudent} />}
        {view === "levels" && <LevelsView theme={theme} students={classStudents} />}
        {view === "tools" && <ToolsView students={classStudents} theme={theme} onPoint={(student) => setPointModal({ student, type: "positive" })} />}
        {view === "reports" && <ReportsView students={classStudents} transactions={data.transactions} theme={theme} total={totalPoints} average={average} champions={champions} />}
        {view === "settings" && <SettingsView theme={theme} />}
      </section>

      {pointModal && <PointPicker modal={pointModal} theme={theme} onClose={() => setPointModal(null)} onChoose={(points, reason) => addPoints(pointModal.student, points, reason)} />}
      {historyStudent && <HistoryModal student={data.students.find((item) => item.id === historyStudent.id) ?? historyStudent} transactions={data.transactions} theme={theme} onClose={() => setHistoryStudent(null)} />}
      {studentModal && <StudentModal mode={studentModal.mode} student={studentModal.student} theme={theme} onClose={() => setStudentModal(null)} onSave={saveStudent} onDelete={deleteStudent} />}
      {randomStudent && <RandomStudentModal student={randomStudent} theme={theme} className={currentClass.name} onPickAgain={pickRandomStudent} onClose={() => setRandomStudent(null)} />}
      {celebration && <Celebration data={celebration} theme={theme} onClose={() => setCelebration(null)} />}
      {toast && <div className={`point-toast ${toast.points < 0 ? "negative" : ""}`}><span>{toast.points > 0 ? theme === "neon" ? "⚡" : "✨" : "−"}</span><strong>{toast.points > 0 ? "+" : ""}{toast.points} POINTS</strong><small>{toast.student}</small></div>}
    </main>
  );
}

function ClassSelector({ classId, onSelect, theme }: { classId: string; onSelect: (id: string) => void; theme: ThemeId }) {
  return <section className="class-switcher"><div className="switcher-label"><span>SELECT CLASS</span><small>{theme === "neon" ? "Theme: Futuristic Neon" : "Theme: Dreamy Shine"}</small></div><div className="class-pills">{CLASSES.map((room) => <button key={room.id} onClick={() => onSelect(room.id)} className={room.id === classId ? "active" : ""}><span className="class-icon">{room.theme === "neon" ? <Zap size={17} /> : room.id === "g3-girls" ? <Sparkles size={17} /> : <Star size={17} />}</span><span><strong>{room.name}</strong><small>{room.room}</small></span>{room.id === classId && <i />}</button>)}</div></section>;
}

function Dashboard(props: {
  students: Student[]; allStudents: Student[]; theme: ThemeId; totalPoints: number; champions: number; average: number; topStudents: Student[];
  search: string; setSearch: (value: string) => void; sortBy: SortBy; setSortBy: (value: SortBy) => void;
  onPoint: (student: Student, type: "positive" | "negative") => void; onHistory: (student: Student) => void; onEdit: (student: Student) => void; onAdd: () => void; onRandom: () => void; currentClass: string;
}) {
  return <>
    <section className="stats-grid">
      <StatCard icon={<Star />} label="TOTAL POINTS" value={props.totalPoints.toLocaleString()} note="Earned by this class" accent="cyan" />
      <StatCard icon={<Users />} label="STUDENTS" value={props.allStudents.length.toString()} note={`Active in ${props.currentClass}`} accent="purple" />
      <StatCard icon={<Trophy />} label="ULTIMATE HEROES" value={props.champions.toString()} note="Reached 300+ points" accent="gold" />
      <StatCard icon={<TrendingUp />} label="CLASS AVERAGE" value={props.average.toString()} note="Points per student" accent="green" />
    </section>
    <Journey theme={props.theme} students={props.allStudents} />
    <section className="dashboard-columns">
      <div className="roster-panel panel">
        <div className="panel-heading"><div><span className="eyebrow">HERO ROSTER</span><h2>Students <b>{props.allStudents.length}</b></h2></div><div className="roster-actions"><button className="outline-button" onClick={props.onRandom} disabled={!props.allStudents.length}><Dice5 size={17} /> Random Student</button><button className="primary-button" onClick={props.onAdd}><UserPlus size={17} /> Add Student</button></div></div>
        <Filters search={props.search} setSearch={props.setSearch} sortBy={props.sortBy} setSortBy={props.setSortBy} />
        <div className="students-grid">{props.students.map((student) => <StudentCard key={student.id} student={student} theme={props.theme} onPoint={props.onPoint} onHistory={props.onHistory} onEdit={props.onEdit} />)}{!props.students.length && <EmptyState onAdd={props.onAdd} />}</div>
      </div>
      <Leaderboard students={props.topStudents} theme={props.theme} />
    </section>
  </>;
}

function StatCard({ icon, label, value, note, accent }: { icon: React.ReactNode; label: string; value: string; note: string; accent: string }) {
  return <article className={`stat-card accent-${accent}`}><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div><i className="stat-glow" /></article>;
}

function Journey({ theme, students }: { theme: ThemeId; students: Student[] }) {
  const levels = LEVELS[theme];
  const distribution = levels.map((_, index) => students.filter((student) => levelIndex(student.points) === index).length);
  return <section className="journey panel"><div className="journey-top"><div><span className="eyebrow">{theme === "neon" ? "LEVEL MAP // 01" : "A magical path to achievement"}</span><h2>{theme === "neon" ? <><Zap size={22} /> THE JOURNEY</> : <><Sparkles size={22} /> HER LEVEL-UP JOURNEY</>}</h2></div><div className="journey-key"><span><i /> 50 points per level</span><strong><Trophy size={16} /> Final goal: 300</strong></div></div><div className="level-track"><div className="track-line" />{levels.map((level, index) => <div className={`level-node ${index === 6 ? "final" : ""}`} key={level.name}><div className="level-orb" style={{ "--level-color": level.color } as React.CSSProperties}><span>{level.icon}</span>{distribution[index] > 0 && <b>{distribution[index]}</b>}</div><strong>{level.name}</strong><small>{index === 6 ? "300+" : `${index * 50}–${index * 50 + 49}`} pts</small></div>)}</div></section>;
}

function Filters({ search, setSearch, sortBy, setSortBy }: { search: string; setSearch: (value: string) => void; sortBy: SortBy; setSortBy: (value: SortBy) => void }) {
  return <div className="filters"><label><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search a student..." /></label><div className="sort-wrap"><span>Sort by</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)}><option value="points">Points</option><option value="name">Name</option><option value="level">Level</option><option value="progress">Progress</option></select><ChevronDown size={15} /></div></div>;
}

function StudentCard({ student, theme, onPoint, onHistory, onEdit }: { student: Student; theme: ThemeId; onPoint: (student: Student, type: "positive" | "negative") => void; onHistory: (student: Student) => void; onEdit: (student: Student) => void }) {
  const level = getLevel(student.points, theme);
  const progress = getProgress(student.points, theme);
  return <article className="student-card"><div className="card-top"><Avatar student={student} theme={theme} editable onClick={() => onEdit(student)} /><div className="student-name"><h3>{student.name}</h3><span style={{ color: level.color }}>{level.icon} {level.name}</span></div><button className="history-button" onClick={() => onHistory(student)} aria-label={`Open ${student.name}'s history`}><History size={17} /></button></div><div className="points-row"><span>{theme === "neon" ? <Zap size={16} /> : <Gem size={16} />} <b>{student.points}</b> POINTS</span><small>{progress.next ? `${student.points} / ${progress.target}` : `${student.points} / 300+`}</small></div><div className="student-progress"><i style={{ width: `${progress.percent}%`, background: level.color }} /></div><p>{progress.next ? <><b>{progress.remaining} points</b> to {progress.next.name}</> : <><Trophy size={14} /> Ultimate level achieved</>}</p><div className="point-actions"><button className="add-point" onClick={() => onPoint(student, "positive")}><Plus size={18} /> POINT</button><button className="remove-point" onClick={() => onPoint(student, "negative")}><Minus size={17} /> POINT</button></div></article>;
}

function Leaderboard({ students, theme }: { students: Student[]; theme: ThemeId }) {
  return <aside className="leaderboard panel"><div className="panel-heading"><div><span className="eyebrow">LIVE RANKING</span><h2>{theme === "neon" ? <Trophy size={21} /> : <Crown size={21} />} Top Champions</h2></div><span className="live-dot">LIVE</span></div><div className="podium-art" aria-hidden="true"><span>✦</span><Trophy /><i>✧</i></div><div className="ranking-list">{students.map((student, index) => <div className={`rank-row rank-${index + 1}`} key={student.id}><b>{index + 1}</b><Avatar student={student} theme={theme} /><div><strong>{student.name}</strong><span>{getLevel(student.points, theme).name}</span></div><em>{student.points}<small> pts</small></em></div>)}{!students.length && <p className="empty-copy">Add students to start the leaderboard.</p>}</div><button className="outline-button"><BarChart3 size={16} /> View full leaderboard</button></aside>;
}

function ClassesView(props: { students: Student[]; hasStudents: boolean; theme: ThemeId; search: string; setSearch: (v: string) => void; sortBy: SortBy; setSortBy: (v: SortBy) => void; onPoint: (s: Student, t: "positive" | "negative") => void; onHistory: (s: Student) => void; onEdit: (s: Student) => void; onAdd: () => void; onRandom: () => void }) {
  return <section className="panel full-panel"><div className="panel-heading"><div><span className="eyebrow">CLASS MANAGEMENT</span><h2>Student roster</h2></div><div className="roster-actions"><button className="outline-button" onClick={props.onRandom} disabled={!props.hasStudents}><Dice5 size={17} /> Random Student</button><button className="primary-button" onClick={props.onAdd}><UserPlus size={17} /> Add Student</button></div></div><Filters search={props.search} setSearch={props.setSearch} sortBy={props.sortBy} setSortBy={props.setSortBy} /><div className="students-grid wide">{props.students.map((student) => <StudentCard key={student.id} student={student} theme={props.theme} onPoint={props.onPoint} onHistory={props.onHistory} onEdit={props.onEdit} />)}{!props.students.length && <EmptyState onAdd={props.onAdd} />}</div></section>;
}

function LevelsView({ theme, students }: { theme: ThemeId; students: Student[] }) {
  return <><Journey theme={theme} students={students} /><section className="levels-cards">{LEVELS[theme].map((level, index) => { const count = students.filter((student) => levelIndex(student.points) === index).length; return <article className="level-detail panel" key={level.name}><div className="level-big-icon" style={{ "--level-color": level.color } as React.CSSProperties}>{level.icon}</div><span>LEVEL {index + 1}</span><h3>{level.name}</h3><p>{index === 6 ? "The ultimate achievement — points keep growing!" : `${index * 50}–${index * 50 + 49} points`}</p><div><Users size={15} /> {count} student{count !== 1 ? "s" : ""}</div></article>; })}</section></>;
}

function ToolsView({ students, theme, onPoint }: { students: Student[]; theme: ThemeId; onPoint: (student: Student) => void }) {
  const [query, setQuery] = useState("");
  const filtered = students.filter((student) => student.name.toLowerCase().includes(query.toLowerCase()));
  return <section className="quick-tools panel"><div className="quick-hero"><div className="quick-icon"><Zap /></div><span className="eyebrow">FAST TEACHING MODE</span><h2>Who did something great?</h2><p>Find a student and award points in two taps.</p><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Type a student’s name..." /></label></div><div className="quick-list">{filtered.map((student) => <button key={student.id} onClick={() => onPoint(student)}><Avatar student={student} theme={theme} /><span><strong>{student.name}</strong><small>{getLevel(student.points, theme).name} · {student.points} pts</small></span><i><Plus size={18} /></i></button>)}</div></section>;
}

function ReportsView({ students, transactions, theme, total, average, champions }: { students: Student[]; transactions: PointTransaction[]; theme: ThemeId; total: number; average: number; champions: number }) {
  const maximum = Math.max(1, ...students.map((student) => student.points));
  const classIds = new Set(students.map((student) => student.id));
  const recent = transactions.filter((transaction) => classIds.has(transaction.studentId)).slice(0, 6);
  return <><div className="report-header"><div><span className="eyebrow">CLASS INSIGHTS</span><h2>Progress Report</h2><p>Live performance for the selected class.</p></div><button className="outline-button" onClick={() => window.print()}><Download size={16} /> Export report</button></div><section className="report-summary"><StatCard icon={<Star />} label="POINTS EARNED" value={total.toLocaleString()} note="Current total" accent="cyan" /><StatCard icon={<Gauge />} label="CLASS AVERAGE" value={average.toString()} note="Points per student" accent="purple" /><StatCard icon={<Trophy />} label="FINAL LEVEL" value={champions.toString()} note="At 300+ points" accent="gold" /></section><section className="reports-grid"><article className="panel chart-panel"><div className="panel-heading"><div><span className="eyebrow">STUDENT POINTS</span><h2>Top performers</h2></div></div><div className="bar-chart">{[...students].sort((a,b) => b.points-a.points).slice(0, 8).map((student) => <div className="bar-row" key={student.id}><span>{student.name}</span><div><i style={{ width: `${student.points / maximum * 100}%` }} /></div><strong>{student.points}</strong></div>)}</div></article><article className="panel distribution"><div className="panel-heading"><div><span className="eyebrow">LEVEL DISTRIBUTION</span><h2>Students by level</h2></div></div>{LEVELS[theme].map((level, index) => { const count = students.filter((student) => levelIndex(student.points) === index).length; return <div className="distribution-row" key={level.name}><span style={{ background: level.color }}>{level.icon}</span><strong>{level.name}</strong><div><i style={{ width: `${students.length ? count / students.length * 100 : 0}%`, background: level.color }} /></div><b>{count}</b></div>; })}</article><article className="panel recent-log"><div className="panel-heading"><div><span className="eyebrow">POINT HISTORY</span><h2>Latest activity</h2></div></div>{recent.map((entry) => { const student = students.find((item) => item.id === entry.studentId); return <div className="log-row" key={entry.id}><span className={entry.points > 0 ? "positive" : "negative"}>{entry.points > 0 ? "+" : ""}{entry.points}</span><div><strong>{student?.name}</strong><small>{entry.reason}</small></div><time>{entry.date}<small>{entry.time}</small></time></div>; })}</article></section></>;
}

function SettingsView({ theme }: { theme: ThemeId }) {
  return <section className="settings-grid"><article className="panel profile-settings"><div className="settings-title"><div className="teacher-avatar large">OS</div><div><span className="eyebrow">TEACHER PROFILE</span><h2>Ms. Oumama Saleh</h2><p>Primary classroom teacher</p></div><button className="outline-button"><Camera size={16} /> Change avatar</button></div><div className="form-grid"><label>Display name<input defaultValue="Ms. Oumama Saleh" /></label><label>Email<input defaultValue="oumama.saleh@school.edu" type="email" /></label></div></article><article className="panel preference-card"><div className="settings-icon"><Settings /></div><h3>General preferences</h3><ToggleRow title="Point animations" copy="Celebrate positive moments" checked /><ToggleRow title="Level-up sound" copy="A short, gentle celebration" checked /><ToggleRow title="Confirm point removal" copy="Prevent accidental deductions" checked={false} /></article><article className="panel preference-card"><div className="settings-icon"><Award /></div><h3>Point system</h3><div className="setting-note"><ShieldCheck /><div><strong>50-point milestones</strong><span>Levels are calculated automatically.</span></div></div><div className="setting-note"><Trophy /><div><strong>300-point achievement</strong><span>Students keep earning after the final level.</span></div></div><small className="theme-note">Current experience: {theme === "neon" ? "Futuristic Neon" : "Dreamy Shine"}</small></article></section>;
}

function ToggleRow({ title, copy, checked }: { title: string; copy: string; checked: boolean }) { return <div className="toggle-row"><div><strong>{title}</strong><span>{copy}</span></div><button className={checked ? "on" : ""} role="switch" aria-checked={checked}><i /></button></div>; }

function PointPicker({ modal, theme, onClose, onChoose }: { modal: NonNullable<PointModal>; theme: ThemeId; onClose: () => void; onChoose: (points: number, reason: string) => void }) {
  const positive = modal.type === "positive";
  const options = positive ? POSITIVE_REASONS : NEGATIVE_REASONS;
  return <div className="modal-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className={`modal point-modal ${positive ? "positive-modal" : "negative-modal"}`} role="dialog" aria-modal="true" aria-label={positive ? "Award points" : "Remove points"}><button className="modal-close" onClick={onClose}><X /></button><div className="modal-hero"><div>{positive ? theme === "neon" ? <Zap /> : <Sparkles /> : <Minus />}</div><span>{positive ? "POSITIVE MOMENT" : "GENTLE CORRECTION"}</span><h2>{positive ? "Great job!" : "Remove points"}</h2><p>{positive ? `What did ${modal.student.name} do brilliantly?` : `Choose a reason for ${modal.student.name}.`}</p></div><div className="behavior-list">{options.map((option, index) => <button key={option.reason} onClick={() => onChoose(option.points, option.reason)}><span className="behavior-icon">{positive ? [<BookOpen key="a" />, <Heart key="b" />, <Sparkles key="c" />, <ShieldCheck key="d" />, <Plus key="e" />][index] : <Minus />}</span><span><strong>{option.reason}</strong><small>{positive ? "Positive behavior" : "Classroom reminder"}</small></span><b>{option.points > 0 ? "+" : ""}{option.points}</b></button>)}</div><small className="modal-foot">{positive ? "Points are added instantly" : "Points will never go below zero"}</small></section></div>;
}

function HistoryModal({ student, transactions, theme, onClose }: { student: Student; transactions: PointTransaction[]; theme: ThemeId; onClose: () => void }) {
  const items = transactions.filter((item) => item.studentId === student.id);
  return <div className="modal-layer" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal history-modal" role="dialog" aria-modal="true" aria-label={`${student.name} activity history`}><button className="modal-close" onClick={onClose}><X /></button><div className="history-header"><Avatar student={student} theme={theme} large /><div><span className="eyebrow">ACTIVITY HISTORY</span><h2>{student.name}</h2><p>{student.points} points · {getLevel(student.points, theme).name}</p></div></div><div className="history-list">{items.map((item) => <div key={item.id}><span className={item.points >= 0 ? "positive" : "negative"}>{item.points > 0 ? "+" : ""}{item.points}</span><div><strong>{item.reason}</strong><small>{item.type === "positive" ? "Positive behavior" : "Behavior reminder"}</small></div><time>{item.date}<small>{item.time}</small></time></div>)}{!items.length && <div className="empty-history"><History /><strong>No activity yet</strong><span>The next point change will appear here.</span></div>}</div></section></div>;
}

function StudentModal({ mode, student, theme, onClose, onSave, onDelete }: { mode: "add" | "edit"; student?: Student; theme: ThemeId; onClose: () => void; onSave: (name: string, photo: string | null, student?: Student) => void | Promise<void>; onDelete: (student: Student) => void | Promise<void> }) {
  const [name, setName] = useState(student?.name ?? "");
  const [photo, setPhoto] = useState<string | null>(student?.photo ?? null);
  function readPhoto(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setPhoto(String(reader.result)); reader.readAsDataURL(file); }
  const preview: Student = student ?? { id: "preview", classId: "", name: name || "New Hero", photo, points: 0, createdAt: "" };
  return <div className="modal-layer" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="modal student-modal" onSubmit={(event) => { event.preventDefault(); if (name.trim()) void onSave(name.trim(), photo, student); }}><button className="modal-close" type="button" onClick={onClose}><X /></button><span className="eyebrow">{mode === "add" ? "WELCOME A NEW HERO" : "STUDENT PROFILE"}</span><h2>{mode === "add" ? "Add student" : `Edit ${student?.name}`}</h2><div className="photo-editor"><Avatar student={{ ...preview, name: name || preview.name, photo }} theme={theme} large /><div><label className="upload-button"><Camera size={16} /> {photo ? "Replace photo" : "Upload photo"}<input type="file" accept="image/*" onChange={readPhoto} /></label>{photo && <button type="button" onClick={() => setPhoto(null)}><Trash2 size={15} /> Remove photo</button>}<small>JPG, PNG or WebP. Stored in MongoDB.</small></div></div><label className="field-label">Student name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter full name" required /></label><div className="modal-actions">{mode === "edit" && student && <button type="button" className="danger-button" onClick={() => void onDelete(student)}><Trash2 size={16} /> Delete student</button>}<button type="button" className="outline-button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit"><UserPlus size={16} /> {mode === "add" ? "Add student" : "Save changes"}</button></div></form></div>;
}

function RandomStudentModal({ student, theme, className, onPickAgain, onClose }: { student: Student; theme: ThemeId; className: string; onPickAgain: () => void; onClose: () => void }) {
  const level = getLevel(student.points, theme);
  return <div className="modal-layer" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal random-student-modal" role="dialog" aria-modal="true" aria-label="Random student"><button className="modal-close" onClick={onClose}><X /></button><span className="random-dice"><Dice5 /></span><span className="eyebrow">RANDOM STUDENT · {className.toUpperCase()}</span><Avatar student={student} theme={theme} large /><h2>{student.name}</h2><p style={{ color: level.color }}>{level.icon} {level.name} · {student.points} points</p><div className="random-student-actions"><button className="outline-button" onClick={onPickAgain}><Dice5 size={17} /> Pick Again</button><button className="primary-button" onClick={onClose}>Done</button></div></section></div>;
}

function Celebration({ data, theme, onClose }: { data: NonNullable<Celebration>; theme: ThemeId; onClose: () => void }) {
  return <div className="modal-layer celebration-layer"><div className="confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} />)}</div><section className={`celebration ${data.final ? "ultimate" : ""}`}><button className="modal-close" onClick={onClose}><X /></button><div className="celebration-rays" /><span className="celebration-trophy">{data.final ? "🏆" : theme === "neon" ? "⚡" : "🦋"}</span><small>{data.student.toUpperCase()}</small><h2>{data.final ? theme === "neon" ? "ULTIMATE CHAMPION!" : "ULTIMATE STAR!" : theme === "neon" ? "LEVEL UP!" : "YOU’RE SHINING!"}</h2><p>{data.from} <span>→</span> <strong>{data.to}</strong></p><button className="primary-button" onClick={onClose}>Keep shining!</button></section></div>;
}

function EmptyState({ onAdd }: { onAdd: () => void }) { return <div className="empty-state"><div><UserPlus /></div><h3>No heroes found</h3><p>Try another search or welcome a new student.</p><button className="primary-button" onClick={onAdd}>Add Student</button></div>; }

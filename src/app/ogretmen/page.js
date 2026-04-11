"use client";

import { useState, useEffect } from "react";
import { scenarios } from "@/lib/scenarios";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { verifyTeacherPassword, checkTeacherAuth, fetchTeacherResponses, logoutTeacher } from "./actions";

/* ── SVG Icons ── */
const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconEyeOff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const IconBarChart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
  </svg>
);

const IconRefresh = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const IconLogout = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const IconChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const IconChevronUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);

const IconUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconCheckCircle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const IconMessageSquare = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconBrain = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
);

const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconInbox = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
  </svg>
);

export default function TeacherDashboard() {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [expandedScenarios, setExpandedScenarios] = useState({});

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");

  const toggleScenario = (id) => {
    setExpandedScenarios((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    async function checkAuth() {
      const isAuth = await checkTeacherAuth();
      if (isAuth) {
        setIsAuthenticated(true);
        loadResponses();
      }
      setAuthChecking(false);
    }
    checkAuth();
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setAuthChecking(true);
    setAuthError("");
    const res = await verifyTeacherPassword(password);
    if (res.success) {
      setIsAuthenticated(true);
      loadResponses();
    } else {
      setAuthError(res.error);
    }
    setAuthChecking(false);
  }

  async function loadResponses() {
    setLoading(true);
    const result = await fetchTeacherResponses();
    if (result.error) {
      setIsAuthenticated(false);
    } else if (result.data) {
      setResponses(result.data);
    }
    setLoading(false);
  }

  async function handleLogout() {
    await logoutTeacher();
    setIsAuthenticated(false);
    setPassword("");
    setResponses([]);
  }

  const filtered = responses.filter((r) => {
    const matchesFilter = filter === "all" || r.scenario_number === parseInt(filter);
    const matchesSearch =
      !searchTerm || r.student_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalStudents = new Set(responses.map((r) => r.access_code_id)).size;
  const completedBoth = (() => {
    const byCode = {};
    responses.forEach((r) => {
      if (!byCode[r.access_code_id]) byCode[r.access_code_id] = new Set();
      byCode[r.access_code_id].add(r.scenario_number);
    });
    return Object.values(byCode).filter((s) => s.size === 2).length;
  })();

  const statsData = { doğru: 0, geliştirilebilir: 0, yanlış: 0 };
  responses.forEach((r) => {
    ["category_1", "category_2", "category_3"].forEach((catKey) => {
      const val = r[catKey]?.toLowerCase();
      if (val === "doğru") statsData.doğru++;
      else if (val === "yanlış") statsData.yanlış++;
      else if (val) statsData.geliştirilebilir++;
    });
  });

  const pieData = [
    { name: "Doğru", value: statsData.doğru, color: "#00B894" },
    { name: "Geliştirilebilir", value: statsData.geliştirilebilir, color: "#FDCB6E" },
    { name: "Yanlış", value: statsData.yanlış, color: "#E17055" },
  ].filter((d) => d.value > 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: "white",
            border: "1px solid var(--border-light)",
            padding: "8px 14px",
            borderRadius: "8px",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <p style={{ color: "var(--text-primary)", fontWeight: "600", margin: 0, fontSize: "0.85rem" }}>
            {`${payload[0].name}: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  // ── Auth Loading ──
  if (authChecking && !isAuthenticated) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="loading-dots">
          <span></span><span></span><span></span>
        </div>
      </main>
    );
  }

  // ── Login ──
  if (!isAuthenticated) {
    return (
      <main style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="card" style={{ maxWidth: 420, width: "100%", padding: 36 }}>
          <div className="login-icon">
            <IconLock />
          </div>
          <h1 className="title" style={{ textAlign: "center", fontSize: "1.5rem" }}>
            Öğretmen Girişi
          </h1>
          <p style={{ textAlign: "center", color: "var(--text-secondary)", marginBottom: 24, fontSize: "0.9rem" }}>
            Öğrenci verilerine ulaşmak için lütfen öğretmen şifrenizi girin.
          </p>
          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Öğretmen şifrenizi girin..."
                required
                style={{ paddingRight: "48px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
                aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
            {authError && <div className="error-msg">{authError}</div>}
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={authChecking}>
              {authChecking ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // ── Dashboard ──
  return (
    <main>
      {/* Stats Modal */}
      {showStats && (
        <div className="stats-overlay" onClick={(e) => e.target === e.currentTarget && setShowStats(false)}>
          <div className="card" style={{ width: "100%", maxWidth: 560, position: "relative" }}>
            <button onClick={() => setShowStats(false)} className="stats-close-btn">
              <IconClose />
            </button>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: "1.25rem", fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>
              Genel Sınıf İstatistikleri
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 24, fontSize: "0.9rem" }}>
              Tüm cevapların Yapay Zekâ tarafından sınıflandırılma oranları.
            </p>

            {pieData.length > 0 ? (
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      label
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
                Henüz yeterli değerlendirme verisi yok.
              </div>
            )}
          </div>
        </div>
      )}

      <div className="container" style={{ justifyContent: "flex-start", paddingTop: 32 }}>
        {/* Header Card */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="dashboard-header">
            <div>
              <h1 className="title" style={{ fontSize: "1.5rem" }}>Öğretmen Paneli</h1>
              <p className="subtitle" style={{ marginBottom: 0 }}>
                Öğrenci cevaplarını ve AI geri bildirimlerini görüntüle
              </p>
            </div>
            <div className="btn-group">
              <button className="btn btn-secondary" onClick={() => setShowStats(true)}>
                <span style={{ display: "inline-flex", width: 16, height: 16 }}><IconBarChart /></span>
                İstatistikler
              </button>
              <button className="btn btn-secondary" onClick={loadResponses}>
                <span style={{ display: "inline-flex", width: 16, height: 16 }}><IconRefresh /></span>
                Yenile
              </button>
              <button className="btn btn-secondary" onClick={handleLogout}>
                <span style={{ display: "inline-flex", width: 16, height: 16 }}><IconLogout /></span>
                Çıkış
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid" style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
            <div className="stat-card stat-card--primary">
              <div className="stat-card__value">{totalStudents}</div>
              <div className="stat-card__label">Katılan Öğrenci</div>
            </div>
            <div className="stat-card stat-card--success">
              <div className="stat-card__value">{completedBoth}</div>
              <div className="stat-card__label">İkisini de Tamamlayan</div>
            </div>
            <div className="stat-card stat-card--info">
              <div className="stat-card__value">{responses.length}</div>
              <div className="stat-card__label">Toplam Cevap</div>
            </div>
          </div>

          {/* Filters */}
          <div className="filters-row">
            <input
              className="form-input"
              placeholder="İsme göre ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="form-input"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Tüm Senaryolar</option>
              <option value="1">Senaryo 1</option>
              <option value="2">Senaryo 2</option>
            </select>
          </div>
        </div>

        {/* Responses */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-dots">
              <span></span><span></span><span></span>
            </div>
            <p className="loading-text">Veriler yükleniyor...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card empty-state">
            <div className="icon">
              <IconInbox />
            </div>
            <p style={{ fontWeight: 500 }}>Henüz cevap bulunmuyor.</p>
          </div>
        ) : (
          filtered.map((r) => {
            const scenario = scenarios[r.scenario_number - 1];
            return (
              <div className="response-card" key={r.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <h4>{scenario?.label}: {scenario?.title}</h4>
                  <button
                    onClick={() => toggleScenario(r.id)}
                    className="icon-btn"
                  >
                    {expandedScenarios[r.id] ? (
                      <>
                        <span style={{ display: "inline-flex", width: 14, height: 14 }}><IconChevronUp /></span>
                        Gizle
                      </>
                    ) : (
                      <>
                        <span style={{ display: "inline-flex", width: 14, height: 14 }}><IconChevronDown /></span>
                        Gör
                      </>
                    )}
                  </button>
                </div>

                {expandedScenarios[r.id] && (
                  <div style={{
                    margin: "12px 0 16px",
                    padding: "16px",
                    background: "var(--bg-card-alt)",
                    borderRadius: "var(--radius-md)",
                    borderLeft: "3px solid var(--accent-primary-light)",
                    fontSize: "0.9rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.7,
                  }}>
                    {scenario?.story}
                  </div>
                )}

                <div className="student-name">
                  {r.student_name}
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 400, marginLeft: 12 }}>
                    {new Date(r.created_at).toLocaleString("tr-TR")}
                  </span>
                </div>

                {(() => {
                  let fbArray = ["", "", ""];
                  if (r.ai_feedback) {
                    try { fbArray = JSON.parse(r.ai_feedback); } catch (e) {}
                  }

                  const cats = [r.category_1, r.category_2, r.category_3];

                  return [r.answer_1, r.answer_2, r.answer_3].map((ans, idx) => {
                    const catVal = cats[idx]?.toLowerCase() || "";
                    let catBadgeClass = "";
                    let catLabel = "Değerlendirilmedi";

                    if (catVal === "doğru") { catBadgeClass = "category-badge--dogru"; catLabel = "Doğru"; }
                    else if (catVal === "yanlış") { catBadgeClass = "category-badge--yanlis"; catLabel = "Yanlış"; }
                    else if (catVal === "geliştirilebilir") { catBadgeClass = "category-badge--gelistirilebilir"; catLabel = "Geliştirilebilir"; }

                    return (
                      <div className="answer-block" key={idx}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <div className="q-label">
                            {scenario?.questions[idx]?.tag} — Soru {idx + 1}
                          </div>
                          {catVal && (
                            <span className={`category-badge ${catBadgeClass}`}>
                              {catLabel}
                            </span>
                          )}
                        </div>
                        <p style={{ fontStyle: "italic", marginBottom: "8px", color: "var(--text-secondary)" }}>
                          &ldquo;{ans}&rdquo;
                        </p>

                        {fbArray[idx] && (
                          <div style={{
                            padding: "14px",
                            background: "var(--accent-primary-bg)",
                            borderLeft: "3px solid var(--accent-primary)",
                            borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                            marginTop: "8px",
                          }}>
                            <h5 style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-primary)", marginBottom: 6 }}>
                              <span style={{ display: "inline-flex", width: 14, height: 14 }}><IconBrain /></span>
                              AI Geri Bildirimi:
                            </h5>
                            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                              {fbArray[idx]}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}

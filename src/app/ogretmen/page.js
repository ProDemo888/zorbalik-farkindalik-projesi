"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { scenarios } from "@/lib/scenarios";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { verifyTeacherPassword } from "./actions";

export default function TeacherDashboard() {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); 
  const [searchTerm, setSearchTerm] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [expandedScenarios, setExpandedScenarios] = useState({});

  // Auth states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");

  const toggleScenario = (id) => {
    setExpandedScenarios(prev => ({...prev, [id]: !prev[id]}));
  };

  useEffect(() => {
    const isAuth = localStorage.getItem("teacher_auth") === "true";
    if (isAuth) {
      setIsAuthenticated(true);
      fetchResponses();
    }
    setAuthChecking(false);
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setAuthChecking(true);
    setAuthError("");
    const res = await verifyTeacherPassword(password);
    if (res.success) {
      setIsAuthenticated(true);
      localStorage.setItem("teacher_auth", "true");
      fetchResponses();
    } else {
      setAuthError(res.error);
    }
    setAuthChecking(false);
  }

  async function fetchResponses() {
    setLoading(true);
    const { data, error } = await supabase
      .from("responses")
      .select("*, access_codes(code)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setResponses(data);
    }
    setLoading(false);
  }

  const filtered = responses.filter((r) => {
    const matchesFilter = filter === "all" || r.scenario_number === parseInt(filter);
    const matchesSearch =
      !searchTerm ||
      r.student_name?.toLowerCase().includes(searchTerm.toLowerCase());
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
  responses.forEach(r => {
    ['category_1', 'category_2', 'category_3'].forEach(catKey => {
      const val = r[catKey]?.toLowerCase();
      if (val === 'doğru') statsData.doğru++;
      else if (val === 'yanlış') statsData.yanlış++;
      else if (val) statsData.geliştirilebilir++; // catch-all for missing/geliştirilebilir
    });
  });

  const pieData = [
    { name: 'Doğru', value: statsData.doğru, color: '#10b981' },
    { name: 'Geliştirilebilir', value: statsData.geliştirilebilir, color: '#f59e0b' },
    { name: 'Yanlış', value: statsData.yanlış, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: "var(--bg)", border: "1px solid var(--border-glass)", padding: "8px 12px", borderRadius: "8px" }}>
          <p style={{ color: "var(--text-primary)", fontWeight: "600", margin: 0 }}>{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  if (authChecking && !isAuthenticated) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="loading-dots"><span></span><span></span><span></span></div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="card" style={{ maxWidth: 400, width: "100%", padding: 32 }}>
          <div style={{ textAlign: "center", marginBottom: 24, fontSize: "3rem" }}>🔒</div>
          <h2 className="title" style={{ textAlign: "center", fontSize: "1.5rem" }}>Öğretmen Girişi</h2>
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
                style={{ paddingRight: "45px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  color: "var(--text-muted)",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {authError && <p style={{ color: "var(--accent-danger)", fontSize: "0.85rem", marginBottom: 16 }}>{authError}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={authChecking}>
              {authChecking ? "Giriş Yapılıyor..." : "Giriş Yap →"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main>
      {showStats && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
          background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", 
          alignItems: "center", justifyContent: "center", padding: 20
        }}>
          <div className="card" style={{ width: "100%", maxWidth: 600, position: "relative" }}>
            <button 
              onClick={() => setShowStats(false)}
              style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.5rem", cursor: "pointer" }}
            >
              ✕
            </button>
            <h2 style={{ marginBottom: 16 }}>📈 Genel Sınıf İstatistikleri</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>Tüm cevapların Yapay Zeka tarafından sınıflandırılma oranları (Doğru, Geliştirilebilir, Yanlış).</p>
            
            {pieData.length > 0 ? (
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label>
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
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Henüz yeterli değerlendirme verisi yok.</div>
            )}
          </div>
        </div>
      )}

      <div className="container" style={{ justifyContent: "flex-start", paddingTop: 32 }}>
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h1 className="title" style={{ fontSize: "1.5rem" }}>📊 Öğretmen Paneli</h1>
              <p className="subtitle" style={{ marginBottom: 0 }}>
                Öğrenci cevaplarını ve AI geri bildirimlerini görüntüle
              </p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-primary" onClick={() => setShowStats(true)} style={{ width: "auto", background: "rgba(124, 58, 237, 0.2)", color: "var(--text-primary)" }}>
                📈 İstatistikler
              </button>
              <button className="btn btn-secondary" onClick={fetchResponses} style={{ width: "auto" }}>
                🔄 Yenile
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
            <div style={{
              flex: 1,
              minWidth: 140,
              padding: "16px 20px",
              background: "rgba(124, 58, 237, 0.1)",
              borderRadius: "var(--radius-md)",
              border: "1px solid rgba(124, 58, 237, 0.2)",
            }}>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-primary-light)" }}>
                {totalStudents}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Katılan Öğrenci</div>
            </div>
            <div style={{
              flex: 1,
              minWidth: 140,
              padding: "16px 20px",
              background: "rgba(16, 185, 129, 0.1)",
              borderRadius: "var(--radius-md)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
            }}>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-success)" }}>
                {completedBoth}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>İkisini de Tamamlayan</div>
            </div>
            <div style={{
              flex: 1,
              minWidth: 140,
              padding: "16px 20px",
              background: "rgba(6, 182, 212, 0.1)",
              borderRadius: "var(--radius-md)",
              border: "1px solid rgba(6, 182, 212, 0.2)",
            }}>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-secondary)" }}>
                {responses.length}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Toplam Cevap</div>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <input
              className="form-input"
              placeholder="İsme göre ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, minWidth: 200 }}
            />
            <select
              className="form-input"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ width: "auto", minWidth: 160 }}
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
            <div className="icon">📭</div>
            <p>Henüz cevap bulunmuyor.</p>
          </div>
        ) : (
          filtered.map((r) => {
            const scenario = scenarios[r.scenario_number - 1];
            return (
              <div className="response-card" key={r.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4>{scenario?.label}: {scenario?.title}</h4>
                  <button 
                    onClick={() => toggleScenario(r.id)}
                    style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "var(--text-secondary)", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem" }}
                  >
                    Senaryoyu {expandedScenarios[r.id] ? "Gizle" : "Gör"}
                  </button>
                </div>
                
                {expandedScenarios[r.id] && (
                  <div style={{ margin: "16px 0", padding: "16px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", borderLeft: "3px solid var(--border-subtle)" }}>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{scenario?.story}</p>
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
                    let catColor = "#6b7280"; // neutral
                    let catLabel = "Değerlendirilmedi";
                    
                    if (catVal === "doğru") { catColor = "#10b981"; catLabel = "Doğru"; }
                    else if (catVal === "yanlış") { catColor = "#ef4444"; catLabel = "Yanlış"; }
                    else if (catVal === "geliştirilebilir") { catColor = "#f59e0b"; catLabel = "Geliştirilebilir"; }

                    return (
                      <div className="answer-block" key={idx} style={{ marginBottom: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <div className="q-label" style={{ color: "var(--text-primary)", margin: 0 }}>
                            {scenario?.questions[idx]?.tag} — Soru {idx + 1}
                          </div>
                          {catVal && (
                            <div style={{ fontSize: "0.7rem", fontWeight: "bold", background: `${catColor}20`, color: catColor, padding: "2px 8px", borderRadius: "12px", border: `1px solid ${catColor}40` }}>
                              {catLabel}
                            </div>
                          )}
                        </div>
                        <p style={{ fontStyle: "italic", marginBottom: "8px" }}>"{ans}"</p>
                        
                        {fbArray[idx] && (
                          <div style={{ padding: "12px", background: "rgba(124, 58, 237, 0.05)", borderLeft: "3px solid var(--accent-primary-light)", borderRadius: "4px" }}>
                            <h5 style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--accent-primary-light)", marginBottom: "4px" }}>🧠 AI Geri Bildirimi:</h5>
                            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{fbArray[idx]}</p>
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

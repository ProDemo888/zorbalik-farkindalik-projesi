"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { scenarios } from "@/lib/scenarios";

// Steps: 0=login, 1=scenario1, 2=feedback1, 3=scenario2, 4=feedback2, 5=thankyou
export default function Home() {
  const [step, setStep] = useState(0);
  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [codeId, setCodeId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Answers for each scenario
  const [answers, setAnswers] = useState({ 1: ["", "", ""], 2: ["", "", ""] });
  const [feedback, setFeedback] = useState({ 1: null, 2: null });

  // ============= LOGIN =============
  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate access code
      const { data, error: fetchError } = await supabase
        .from("access_codes")
        .select("*")
        .eq("code", code.trim().toUpperCase())
        .single();

      if (fetchError || !data) {
        setError("Geçersiz erişim kodu. Lütfen tekrar deneyin.");
        setLoading(false);
        return;
      }

      if (data.used) {
        setError("Bu erişim kodu zaten kullanılmış.");
        setLoading(false);
        return;
      }

      // Mark code as used
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      await supabase
        .from("access_codes")
        .update({
          used: true,
          used_at: new Date().toISOString(),
          student_name: fullName,
        })
        .eq("id", data.id);

      setCodeId(data.id);
      setStep(1);
    } catch (err) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    }

    setLoading(false);
  }

  // ============= SUBMIT ANSWERS =============
  async function handleSubmitAnswers(scenarioNum) {
    setLoading(true);
    const scenario = scenarios[scenarioNum - 1];
    const studentAnswers = answers[scenarioNum];
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    try {
      // Call our API route for AI feedback
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: {
            title: scenario.title,
            story: scenario.story,
            questions: scenario.questions.map((q) => q.text),
          },
          answers: studentAnswers,
          studentName: fullName,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "AI geri bildirimi alınamadı.");
        setLoading(false);
        return;
      }

      let parsedCat = ["geliştirilebilir", "geliştirilebilir", "geliştirilebilir"];
      try {
        if (result.category) parsedCat = JSON.parse(result.category);
      } catch (e) {
        console.warn("Kategori verisi okunamadı:", e);
      }

      // Save response to Supabase
      await supabase.from("responses").insert({
        access_code_id: codeId,
        student_name: fullName,
        scenario_number: scenarioNum,
        answer_1: studentAnswers[0],
        answer_2: studentAnswers[1],
        answer_3: studentAnswers[2],
        ai_feedback: result.feedback,
        category_1: parsedCat[0],
        category_2: parsedCat[1],
        category_3: parsedCat[2],
      });

      try {
        setFeedback((prev) => ({ ...prev, [scenarioNum]: JSON.parse(result.feedback) }));
      } catch (e) {
        setFeedback((prev) => ({ ...prev, [scenarioNum]: [result.feedback, "", ""] }));
      }

      // Move to feedback step
      if (scenarioNum === 1) setStep(2);
      else setStep(4);
    } catch (err) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    }

    setLoading(false);
  }

  // ============= HELPERS =============
  function updateAnswer(scenarioNum, questionIdx, value) {
    setAnswers((prev) => {
      const newA = { ...prev };
      newA[scenarioNum] = [...newA[scenarioNum]];
      newA[scenarioNum][questionIdx] = value;
      return newA;
    });
  }

  function canSubmit(scenarioNum) {
    return answers[scenarioNum].every((a) => a.trim().length > 15);
  }

  function getProgressSteps() {
    const steps = [
      { label: "1", status: step >= 1 ? (step > 2 ? "completed" : "active") : "inactive" },
      { label: "✓", status: step >= 2 ? (step > 2 ? "completed" : "active") : "inactive" },
      { label: "2", status: step >= 3 ? (step > 4 ? "completed" : "active") : "inactive" },
      { label: "✓", status: step >= 4 ? (step > 4 ? "completed" : "active") : "inactive" },
      { label: "🎉", status: step >= 5 ? "active" : "inactive" },
    ];
    return steps;
  }

  // ============= RENDER =============
  return (
    <main>
      <div className="container">
        {/* ====== LOGIN ====== */}
        {step === 0 && (
          <div className="card">
            <h1 className="title">Empati & Zorbalık Farkındalık</h1>
            <p className="subtitle">
              Bu aktivitede zorbalık senaryolarını okuyacak, soruları cevaplayacak ve yapay zekâdan
              kişisel geri bildirim alacaksın.
            </p>

            <form onSubmit={handleLogin}>
              <div className="name-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="firstName">Adın</label>
                  <input
                    id="firstName"
                    className="form-input"
                    type="text"
                    placeholder="Adınızı girin"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="lastName">Soyadın</label>
                  <input
                    id="lastName"
                    className="form-input"
                    type="text"
                    placeholder="Soyadınızı girin"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="accessCode">Erişim Kodu</label>
                <input
                  id="accessCode"
                  className="form-input"
                  type="text"
                  placeholder="Örn: A1B2C3"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  required
                  style={{ textTransform: "uppercase", letterSpacing: "3px", fontWeight: 700 }}
                />
              </div>

              {error && (
                <p style={{ color: "var(--accent-danger)", fontSize: "0.85rem", marginBottom: 16 }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !firstName.trim() || !lastName.trim() || !code.trim()}
              >
                {loading ? "Kontrol Ediliyor..." : "Aktiviteye Başla →"}
              </button>
            </form>
          </div>
        )}

        {/* ====== SCENARIO (1 or 2) ====== */}
        {(step === 1 || step === 3) && (
          <div className="card">
            <div className="progress-bar-container">
              <div className="progress-steps">
                {getProgressSteps().map((s, i) => (
                  <div key={i} className={`progress-step ${s.status}`}>
                    {s.label}
                  </div>
                ))}
              </div>
            </div>

            {(() => {
              const scenarioNum = step === 1 ? 1 : 2;
              const scenario = scenarios[scenarioNum - 1];
              return (
                <>
                  <span className="scenario-label">📋 {scenario.label}</span>
                  <h2 className="scenario-title">{scenario.title}</h2>
                  <div className="scenario-story">{scenario.story}</div>

                  {scenario.questions.map((q, idx) => (
                    <div className="form-group" key={idx}>
                      <label className="form-label">
                        <span className={`question-tag ${q.tagClass}`}>{q.tag}</span>
                        {q.text}
                      </label>
                      <textarea
                        className="form-textarea"
                        placeholder="Düşüncelerini buraya yaz..."
                        value={answers[scenarioNum][idx]}
                        onChange={(e) => updateAnswer(scenarioNum, idx, e.target.value)}
                      />
                    </div>
                  ))}

                  {error && (
                    <p style={{ color: "var(--accent-danger)", fontSize: "0.85rem", marginBottom: 16 }}>
                      {error}
                    </p>
                  )}

                  <button
                    className="btn btn-primary"
                    disabled={!canSubmit(scenarioNum) || loading}
                    onClick={() => handleSubmitAnswers(scenarioNum)}
                  >
                    {loading ? (
                      <>
                        <span className="loading-dots">
                          <span></span><span></span><span></span>
                        </span>
                        AI Analiz Ediyor...
                      </>
                    ) : (
                      "Cevaplarımı Gönder & Geri Bildirim Al →"
                    )}
                  </button>
                </>
              );
            })()}
          </div>
        )}

        {/* ====== AI FEEDBACK (1 or 2) ====== */}
        {(step === 2 || step === 4) && (
          <div className="card feedback-container">
            <div className="progress-bar-container">
              <div className="progress-steps">
                {getProgressSteps().map((s, i) => (
                  <div key={i} className={`progress-step ${s.status}`}>
                    {s.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="feedback-header">
              <div className="feedback-avatar">🧠</div>
              <div className="feedback-header-text">
                <h3>Rehberlik Öğretmeni</h3>
                <p>Yapay Zekâ Geri Bildirimi</p>
              </div>
            </div>

            <div className="feedback-body">
              {(() => {
                const scenarioNum = step === 2 ? 1 : 2;
                const scenario = scenarios[scenarioNum - 1];
                const fbArray = feedback[scenarioNum] || ["", "", ""];
                const studentAnswers = answers[scenarioNum];
                
                return fbArray.map((fb, idx) => {
                  if (!fb) return null;
                  return (
                    <div key={idx} style={{ marginBottom: "24px", padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                       <div style={{ marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px dashed var(--border-glass)"}}>
                         <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-muted)", marginBottom: "4px" }}>
                           Senin Cevabın (Soru {idx + 1}):
                         </div>
                         <div style={{ fontStyle: "italic", color: "var(--text-secondary)"}}>
                           "{studentAnswers[idx]}"
                         </div>
                       </div>
                       <div>
                         <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--accent-primary-light)", marginBottom: "4px" }}>
                           Rehberlik Yorumu:
                         </div>
                         <div>{fb}</div>
                       </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div style={{ marginTop: 32 }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setError("");
                  if (step === 2) setStep(3);
                  else setStep(5);
                }}
              >
                {step === 2 ? "Sonraki Senaryoya Geç →" : "Aktiviteyi Tamamla →"}
              </button>
            </div>
          </div>
        )}

        {/* ====== THANK YOU ====== */}
        {step === 5 && (
          <div className="card" style={{ textAlign: "center" }}>
            <div className="thankyou-icon">💜</div>
            <h1 className="title" style={{ marginBottom: 16 }}>Tebrikler!</h1>
            <p className="thankyou-message">
              Aktiviteyi başarıyla tamamladın. Bugün zorbalık senaryolarını analiz ederek
              empati kurma becerini geliştirdin.
              <br /><br />
              Unutma: <strong>Sessiz kalmak, zorbalığa ortak olmaktır.</strong> Herkes
              etrafındaki insanların duygularına duyarlı olduğunda, okullarımız ve
              dünyamız çok daha güvenli bir yer olur.
              <br /><br />
              <span style={{ color: "var(--accent-primary-light)" }}>
                Katılımın için teşekkür ederiz. 🙏
              </span>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

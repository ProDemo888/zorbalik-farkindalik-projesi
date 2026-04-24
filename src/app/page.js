"use client";

import { useState } from "react";
import { scenarios } from "@/lib/scenarios";
import { validateAndUseCode } from "@/app/actions";

// Steps: 0=login, (2k-1)=scenario k, (2k)=feedback k (k=1..N), (2N+1)=thankyou
const N = scenarios.length;
const THANKYOU_STEP = 2 * N + 1;

function isScenarioStep(s) { return s % 2 === 1 && s >= 1 && s <= 2 * N - 1; }
function isFeedbackStep(s) { return s % 2 === 0 && s >= 2 && s <= 2 * N; }
function scenarioNumFromStep(s) { return Math.ceil(s / 2); }

/* ── SVG Icons ── */
const IconBrain = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
);

const IconHeart = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const IconBook = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
  </svg>
);

const IconSend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const IconArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconStar = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

export default function Home() {
  const [step, setStep] = useState(0);
  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [codeId, setCodeId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [answers, setAnswers] = useState(() =>
    Object.fromEntries(scenarios.map((s) => [s.id, ["", "", ""]]))
  );
  const [feedback, setFeedback] = useState(() =>
    Object.fromEntries(scenarios.map((s) => [s.id, null]))
  );

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await validateAndUseCode(code, firstName, lastName);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setCodeId(result.codeId);

      if (result.resume && result.resume.length > 0) {
        // Restore feedback for each completed scenario
        const restoredFeedback = {};
        for (const r of result.resume) {
          try {
            restoredFeedback[r.scenario_number] = JSON.parse(r.ai_feedback);
          } catch {
            restoredFeedback[r.scenario_number] = [r.ai_feedback || "", "", ""];
          }
        }
        setFeedback((prev) => ({ ...prev, ...restoredFeedback }));

        // Jump to the next unfinished scenario, or thank-you if all done
        const completed = result.resume.map((r) => r.scenario_number);
        const lastCompleted = Math.max(...completed);
        setStep(lastCompleted >= N ? THANKYOU_STEP : 2 * lastCompleted + 1);
      } else {
        setStep(1);
      }
    } catch (err) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
    setLoading(false);
  }

  async function handleSubmitAnswers(scenarioNum) {
    setLoading(true);
    const scenario = scenarios[scenarioNum - 1];
    const studentAnswers = answers[scenarioNum];
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    try {
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
          accessCodeId: codeId,
          scenarioNumber: scenarioNum,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "AI geri bildirimi alınamadı.");
        setLoading(false);
        return;
      }

      try {
        setFeedback((prev) => ({ ...prev, [scenarioNum]: JSON.parse(result.feedback) }));
      } catch (e) {
        setFeedback((prev) => ({ ...prev, [scenarioNum]: [result.feedback, "", ""] }));
      }

      setStep(2 * scenarioNum);
    } catch (err) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
    setLoading(false);
  }

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
    const steps = [];
    for (let i = 1; i <= N; i++) {
      const scenarioStep = 2 * i - 1;
      const feedbackStep = 2 * i;
      steps.push({
        label: `${i}`,
        icon: null,
        status: step >= scenarioStep
          ? (step > feedbackStep ? "completed" : "active")
          : "inactive",
      });
      steps.push({
        label: null,
        icon: "check",
        status: step >= feedbackStep
          ? (step > feedbackStep ? "completed" : "active")
          : "inactive",
      });
    }
    steps.push({
      label: null,
      icon: "star",
      status: step >= THANKYOU_STEP ? "active" : "inactive",
    });
    return steps;
  }

  function renderProgressStepIcon(s) {
    if (s.icon === "check") return <IconCheck />;
    if (s.icon === "star") return <IconStar />;
    return s.label;
  }

  return (
    <main>
      <div className="container">
        {/* ====== LOGIN ====== */}
        {step === 0 && (
          <div className="card">
            <div className="login-icon">
              <IconBook />
            </div>
            <h1 className="title" style={{ textAlign: "center" }}>Empati & Zorbalık Farkındalık</h1>
            <p className="subtitle" style={{ textAlign: "center" }}>
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

              {error && <div className="error-msg">{error}</div>}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !firstName.trim() || !lastName.trim() || !code.trim()}
              >
                {loading ? (
                  "Kontrol Ediliyor..."
                ) : (
                  <>
                    Aktiviteye Başla
                    <span style={{ display: "inline-flex", width: 18, height: 18 }}><IconArrowRight /></span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ====== SCENARIO ====== */}
        {isScenarioStep(step) && (
          <div className="card">
            <div className="progress-bar-container">
              <div className="progress-steps">
                {getProgressSteps().map((s, i) => (
                  <div key={i} className={`progress-step ${s.status}`}>
                    {renderProgressStepIcon(s)}
                  </div>
                ))}
              </div>
            </div>

            {(() => {
              const scenarioNum = scenarioNumFromStep(step);
              const scenario = scenarios[scenarioNum - 1];
              return (
                <>
                  <span className="scenario-label">
                    <span style={{ display: "inline-flex", width: 14, height: 14 }}><IconBook /></span>
                    {scenario.label}
                  </span>
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

                  {error && <div className="error-msg">{error}</div>}

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
                      <>
                        <span style={{ display: "inline-flex", width: 18, height: 18 }}><IconSend /></span>
                        Cevaplarımı Gönder & Geri Bildirim Al
                      </>
                    )}
                  </button>
                </>
              );
            })()}
          </div>
        )}

        {/* ====== AI FEEDBACK ====== */}
        {isFeedbackStep(step) && (
          <div className="card feedback-container">
            <div className="progress-bar-container">
              <div className="progress-steps">
                {getProgressSteps().map((s, i) => (
                  <div key={i} className={`progress-step ${s.status}`}>
                    {renderProgressStepIcon(s)}
                  </div>
                ))}
              </div>
            </div>

            <div className="feedback-header">
              <div className="feedback-avatar">
                <IconBrain />
              </div>
              <div className="feedback-header-text">
                <h3>Rehberlik Öğretmeni</h3>
                <p>Yapay Zekâ Geri Bildirimi</p>
              </div>
            </div>

            <div className="feedback-body">
              {(() => {
                const scenarioNum = scenarioNumFromStep(step);
                const fbArray = feedback[scenarioNum] || ["", "", ""];
                const studentAnswers = answers[scenarioNum];

                return fbArray.map((fb, idx) => {
                  if (!fb) return null;
                  return (
                    <div className="feedback-item" key={idx}>
                      <div className="feedback-item-header">
                        <div className="feedback-item-label">
                          Senin Cevabın (Soru {idx + 1}):
                        </div>
                        <div className="feedback-item-answer">
                          &ldquo;{studentAnswers[idx]}&rdquo;
                        </div>
                      </div>
                      <div>
                        <div className="feedback-item-commentary">
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
                  const scenarioNum = scenarioNumFromStep(step);
                  if (scenarioNum < N) setStep(step + 1);
                  else setStep(THANKYOU_STEP);
                }}
              >
                {scenarioNumFromStep(step) < N ? (
                  <>
                    Sonraki Senaryoya Geç
                    <span style={{ display: "inline-flex", width: 18, height: 18 }}><IconArrowRight /></span>
                  </>
                ) : (
                  <>
                    Aktiviteyi Tamamla
                    <span style={{ display: "inline-flex", width: 18, height: 18 }}><IconCheck /></span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ====== THANK YOU ====== */}
        {step === THANKYOU_STEP && (
          <div className="card" style={{ textAlign: "center" }}>
            <div className="thankyou-icon">
              <IconHeart />
            </div>
            <h1 className="title" style={{ marginBottom: 16 }}>Tebrikler!</h1>
            <p className="thankyou-message">
              Aktiviteyi başarıyla tamamladın. Bugün zorbalık senaryolarını analiz ederek
              empati kurma becerini geliştirdin.
              <br /><br />
              Unutma: <strong>Sessiz kalmak, zorbalığa ortak olmaktır.</strong> Herkes
              etrafındaki insanların duygularına duyarlı olduğunda, okullarımız ve
              dünyamız çok daha güvenli bir yer olur.
              <br /><br />
              <span style={{ color: "var(--accent-primary)" }}>
                Katılımın için teşekkür ederiz.
              </span>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

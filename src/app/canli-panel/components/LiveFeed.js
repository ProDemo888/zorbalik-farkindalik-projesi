import { useState, useEffect, useMemo } from "react";
import StudentAvatar from "./StudentAvatar";

/* ── SVG Icons ── */
const IconChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconChevronUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const IconBrain = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
);

export default function LiveFeed({ responses, showAIFeedback, scenarios }) {
  const [expandedResponses, setExpandedResponses] = useState({});
  const [recentResponses, setRecentResponses] = useState(new Set());

  // Mark responses as recent (within 30 seconds)
  useEffect(() => {
    const now = new Date();
    const recent = new Set();

    responses.forEach((response) => {
      const responseTime = new Date(response.created_at);
      const diffMs = now - responseTime;
      const diffSeconds = Math.floor(diffMs / 1000);

      if (diffSeconds < 30) {
        recent.add(response.id);
      }
    });

    setRecentResponses(recent);

    // Remove "New!" badges after 30 seconds
    const timer = setTimeout(() => {
      setRecentResponses(new Set());
    }, 30000);

    return () => clearTimeout(timer);
  }, [responses]);

  const toggleResponse = (responseId) => {
    setExpandedResponses((prev) => ({
      ...prev,
      [responseId]: !prev[responseId],
    }));
  };

  if (!responses || responses.length === 0) {
    return null;
  }

  return (
    <div className="live-feed-container">
      {responses.map((response) => {
        const scenario = scenarios[response.scenario_number - 1];
        const isExpanded = expandedResponses[response.id];
        let fbArray = ["", "", ""];

        try {
          if (response.ai_feedback) {
            fbArray = JSON.parse(response.ai_feedback);
          }
        } catch (e) {
          console.error("Failed to parse AI feedback:", e);
        }

        return (
          <div className="card response-card" key={response.id} style={{ position: "relative" }}>
            {recentResponses.has(response.id) && (
              <div style={{
                position: "absolute",
                top: -8,
                right: -8,
                background: "var(--accent-primary)",
                color: "white",
                padding: "4px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.7rem",
                fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
                zIndex: 1,
                boxShadow: "0 2px 8px rgba(108, 92, 231, 0.3)",
                animation: "pulse 2s infinite",
              }}>
                YENİ!
              </div>
            )}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 16,
              paddingTop: recentResponses.has(response.id) ? 12 : 0
            }}>
              <div style={{ flex: 1 }}>
                <StudentAvatar
                  accessCodeId={response.access_code_id}
                  studentName={response.student_name}
                  size={36}
                />
                <div style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  marginTop: 4,
                  marginLeft: 48, // Align with avatar
                }}>
                  {scenario?.label} • {new Date(response.created_at).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <button
                onClick={() => toggleResponse(response.id)}
                className="icon-btn"
                style={{ flexShrink: 0 }}
              >
                {isExpanded ? (
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

            {isExpanded && (
              <div style={{
                marginTop: 12,
                padding: "16px",
                background: "var(--bg-card-alt)",
                borderRadius: "var(--radius-md)",
                borderLeft: "3px solid var(--accent-primary-light)",
              }}>
                <div style={{
                  marginBottom: 8,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}>
                  {scenario?.title}
                </div>

                {[response.answer_1, response.answer_2, response.answer_3].map((answer, idx) => {
                  const questionTag = scenario?.questions[idx]?.tag;
                  return (
                    <div key={idx} style={{ marginBottom: 12 }}>
                      <div style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "var(--accent-primary)",
                        marginBottom: 4,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}>
                        {questionTag} — Soru {idx + 1}
                      </div>
                      <div style={{
                        padding: "12px",
                        background: "white",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-light)",
                        fontStyle: "italic",
                        color: "var(--text-secondary)",
                        fontSize: "0.85rem",
                        lineHeight: 1.6,
                      }}>
                        "{answer}"
                      </div>

                      {showAIFeedback && fbArray[idx] && (
                        <div style={{
                          marginTop: 8,
                          padding: "14px",
                          background: "var(--accent-primary-bg)",
                          borderLeft: "3px solid var(--accent-primary)",
                          borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                        }}>
                          <h5 style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "var(--accent-primary)",
                            marginBottom: 6,
                            fontFamily: "'Poppins', sans-serif",
                          }}>
                            <span style={{ display: "inline-flex", width: 14, height: 14 }}><IconBrain /></span>
                            AI Geri Bildirimi:
                          </h5>
                          <p style={{
                            fontSize: "0.85rem",
                            color: "var(--text-secondary)",
                            lineHeight: 1.6,
                            margin: 0,
                          }}>
                            {fbArray[idx]}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
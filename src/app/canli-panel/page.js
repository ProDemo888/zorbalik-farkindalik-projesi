"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchInitialStats, verifyCompletion } from "./actions";
import { scenarios } from "@/lib/scenarios";
import LiveStats from "./components/LiveStats";
import LiveFeed from "./components/LiveFeed";
import ActivityChart from "./components/ActivityChart";
import { useRealtime } from "./hooks/useRealtime";

/* ── SVG Icons ── */
const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconWifi = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

const IconWifiOff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" /><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" /><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" /><path d="M10.71 5.05A16 16 0 0 1 22.58 9" /><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

export default function LivePanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [stats, setStats] = useState({
    totalAnswers: 0,
    completedStudents: 0,
    activeStudents: 0,
    recentResponses: [],
  });
  const [showAIFeedback, setShowAIFeedback] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connecting"); // connecting, connected, disconnected

  // Real-time hook
  const { newResponses, connectionStatus: rtConnectionStatus } = useRealtime();

  useEffect(() => {
    // Verify completion and fetch initial data
    async function initDashboard() {
      const urlParams = new URLSearchParams(window.location.search);
      const codeId = urlParams.get("codeId");

      if (!codeId) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      // Verify student completed all scenarios
      const verification = await verifyCompletion(codeId);
      if (!verification.completed) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      // Fetch initial statistics
      const initialData = await fetchInitialStats();
      if (initialData.error) {
        console.error("Error loading initial data:", initialData.error);
      } else {
        setStats(initialData);
      }

      setLoading(false);
    }

    initDashboard();
  }, []);

  // Update connection status from real-time hook
  useEffect(() => {
    if (rtConnectionStatus === "subscribed") {
      setConnectionStatus("connected");
    } else if (rtConnectionStatus === "error") {
      setConnectionStatus("disconnected");
    } else {
      setConnectionStatus("connecting");
    }
  }, [rtConnectionStatus]);

  // Combine initial responses with new real-time responses
  const allResponses = [
    ...stats.recentResponses,
    ...newResponses,
  ].slice(0, 50); // Limit to 50 for performance

  // Recalculate stats based on all responses
  const recalculatedStats = {
    totalAnswers: stats.totalAnswers + newResponses.length,
    completedStudents: stats.completedStudents,
    activeStudents: stats.activeStudents,
  };

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="loading-dots">
          <span></span><span></span><span></span>
        </div>
      </main>
    );
  }

  if (accessDenied) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="card" style={{ maxWidth: 420, width: "100%", padding: 36, textAlign: "center" }}>
          <h1 className="title" style={{ fontSize: "1.5rem", marginBottom: 16 }}>
            Erişim Reddedildi
          </h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
            Canlı panele erişmek için önce tüm senaryoları tamamlaman gerekmektedir.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => router.push("/")}
            style={{ width: "100%" }}
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="container" style={{ justifyContent: "flex-start", paddingTop: 32 }}>
        {/* Header */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24
          }}>
            <div>
              <h1 className="title" style={{ fontSize: "1.5rem", marginBottom: 8 }}>
                Canlı Sınıf Paneli
              </h1>
              <p className="subtitle" style={{ marginBottom: 0 }}>
                Sınıfının gerçek zamanlı aktivitesini görüntüle
              </p>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12
            }}>
              {/* Connection Status */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: "var(--radius-sm)",
                background: connectionStatus === "connected" ? "var(--success-bg)" : "var(--warning-bg)",
                fontSize: "0.85rem",
                fontWeight: 500,
              }}>
                {connectionStatus === "connected" ? (
                  <>
                    <span style={{ display: "inline-flex", width: 16, height: 16, color: "var(--success-color)" }}><IconWifi /></span>
                    Canlı
                  </>
                ) : (
                  <>
                    <span style={{ display: "inline-flex", width: 16, height: 16, color: "var(--warning-color)" }}><IconWifiOff /></span>
                    Bağlantı Kesik
                  </>
                )}
              </div>

              {/* Back Button */}
              <button
                className="btn btn-secondary"
                onClick={() => router.push("/")}
              >
                <span style={{ display: "inline-flex", width: 16, height: 16 }}><IconArrowLeft /></span>
                Dön
              </button>
            </div>
          </div>

          {/* Live Stats */}
          <LiveStats stats={recalculatedStats} />

          {/* Activity Chart */}
          <div style={{ marginTop: 24 }}>
            <h3 style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "1.1rem",
              fontWeight: 600,
              marginBottom: 16,
              color: "var(--text-primary)"
            }}>
              Aktivite Grafiği
            </h3>
            <ActivityChart responses={allResponses} />
          </div>
        </div>

        {/* AI Feedback Toggle */}
        <div style={{ marginBottom: 16 }}>
          <button
            className={`btn ${showAIFeedback ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setShowAIFeedback(!showAIFeedback)}
            style={{ width: "100%" }}
          >
            {showAIFeedback ? "AI Geri Bildirimlerini Gizle" : "AI Geri Bildirimlerini Göster"}
          </button>
        </div>

        {/* Live Feed */}
        <LiveFeed
          responses={allResponses}
          showAIFeedback={showAIFeedback}
          scenarios={scenarios}
        />

        {/* Empty State */}
        {allResponses.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: 64 }}>
            <div style={{
              width: 80,
              height: 80,
              margin: "0 auto 24",
              borderRadius: "50%",
              background: "var(--accent-primary-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem"
            }}>
              📊
            </div>
            <h3 style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "1.1rem",
              fontWeight: 600,
              marginBottom: 8,
              color: "var(--text-primary)"
            }}>
              Henüz aktivite yok
            </h3>
            <p style={{ color: "var(--text-secondary)" }}>
              Sınıf arkadaşların cevaplarını görmek için biraz beklemelisin.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
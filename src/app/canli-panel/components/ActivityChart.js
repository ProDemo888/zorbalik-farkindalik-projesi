"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const BUCKET_MS = 1 * 60 * 1000; // 1-minute buckets
const WINDOW_MS = 30 * 60 * 1000; // fixed 30-minute window

function roundToBucket(ms) {
  return Math.floor(ms / BUCKET_MS) * BUCKET_MS;
}

function formatBucketTime(ms) {
  return new Date(ms).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(26, 26, 46, 0.95)",
        border: "1px solid rgba(162, 155, 254, 0.25)",
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        backdropFilter: "blur(8px)",
      }}
    >
      <p style={{ color: "#A29BFE", fontSize: "0.75rem", fontWeight: 600, marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ color: "#EEEEF8", fontSize: "0.9rem", fontWeight: 700 }}>
        {payload[0].value} cevap
      </p>
    </div>
  );
};

export default function ActivityChart({ responses }) {
  const timelineData = useMemo(() => {
    const now = roundToBucket(Date.now());
    const windowStart = now - WINDOW_MS;

    // Build fixed-window buckets (16 buckets: 0..30 min)
    const buckets = new Map();
    for (let b = windowStart; b <= now; b += BUCKET_MS) {
      buckets.set(b, 0);
    }

    if (responses?.length) {
      responses.forEach((r) => {
        if (!r.created_at) return;
        const t = new Date(r.created_at).getTime();
        if (isNaN(t)) return;
        const bucket = roundToBucket(t);
        if (buckets.has(bucket)) {
          buckets.set(bucket, buckets.get(bucket) + 1);
        }
      });
    }

    return Array.from(buckets.entries()).map(([ms, count]) => ({
      ms,
      time: formatBucketTime(ms),
      responses: count,
    }));
  }, [responses]);

  // Show one label every 5 minutes to avoid overlap
  const ticks = timelineData
    .filter((_, i) => i % 5 === 0)
    .map((d) => d.time);

  const hasActivity = timelineData.some((d) => d.responses > 0);

  return (
    <div style={{ width: "100%", height: 200, position: "relative" }}>
      {!hasActivity && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Son 30 dakikada aktivite yok
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={timelineData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6C5CE7" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6C5CE7" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
            vertical={false}
          />

          <XAxis
            dataKey="time"
            ticks={ticks}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            tickLine={false}
          />

          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(162,155,254,0.3)", strokeWidth: 1 }} />

          <Area
            type="monotone"
            dataKey="responses"
            stroke="#6C5CE7"
            strokeWidth={2}
            fill="url(#areaGrad)"
            dot={false}
            activeDot={{ r: 5, fill: "#A29BFE", stroke: "#6C5CE7", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

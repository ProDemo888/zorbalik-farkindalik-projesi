import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ActivityChart({ responses }) {
  // Process responses into timeline data
  const timelineData = useMemo(() => {
    if (!responses || responses.length === 0) return [];

    // Group responses by 5-minute intervals
    const timeGroups = {};
    const now = new Date();

    // Initialize groups for the last 30 minutes
    for (let i = 30; i >= 0; i -= 5) {
      const time = new Date(now - i * 60000);
      const key = time.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
      timeGroups[key] = 0;
    }

    // Count responses in each time group
    responses.forEach((response) => {
      if (!response.created_at) return;

      const timeKey = response.created_at.slice(0, 16);
      if (timeGroups.hasOwnProperty(timeKey)) {
        timeGroups[timeKey]++;
      }
    });

    // Convert to array format for recharts
    return Object.entries(timeGroups).map(([time, count]) => ({
      time: new Date(time).toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      responses: count,
    }));
  }, [responses]);

  return (
    <div style={{ width: "100%", height: 200 }}>
      {timelineData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
            <XAxis
              dataKey="time"
              style={{
                fontSize: "0.75rem",
                fill: "var(--text-secondary)",
              }}
            />
            <YAxis
              style={{
                fontSize: "0.75rem",
                fill: "var(--text-secondary)",
              }}
            />
            <Tooltip
              contentStyle={{
                background: "white",
                border: "1px solid var(--border-light)",
                borderRadius: "8px",
                boxShadow: "var(--shadow-md)",
              }}
              itemStyle={{
                color: "var(--text-primary)",
                fontWeight: "600",
                fontSize: "0.85rem",
              }}
              labelStyle={{
                color: "var(--text-secondary)",
                fontSize: "0.85rem",
              }}
            />
            <Line
              type="monotone"
              dataKey="responses"
              stroke="var(--accent-primary)"
              strokeWidth={2}
              dot={{ fill: "var(--accent-primary)", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          fontSize: "0.9rem"
        }}>
          Aktivite verisi henüz yok
        </div>
      )}
    </div>
  );
}
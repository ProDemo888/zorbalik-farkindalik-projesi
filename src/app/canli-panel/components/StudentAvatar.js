import { useMemo } from "react";

// Generate consistent color from access_code_id
function generateColor(codeId) {
  if (!codeId) return "#6C5CE7"; // Default purple

  // Simple hash function to generate a consistent color
  let hash = 0;
  const str = String(codeId);

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Use hash to select from a predefined color palette
  const colors = [
    "#6C5CE7", // Purple
    "#00B894", // Green
    "#E17055", // Red
    "#FDCB6E", // Yellow
    "#0984E3", // Blue
    "#D63031", // Dark Red
    "#E84393", // Pink
    "#00CEC9", // Teal
    "#FD79A8", // Light Pink
    "#E17055", // Orange
  ];

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

// Generate initials from student name
function generateInitials(name) {
  if (!name) return "?";

  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  } else {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
}

// Generate partial name for privacy
function generatePartialName(name) {
  if (!name) return "Anonim";

  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0];
  } else {
    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
  }
}

export default function StudentAvatar({ accessCodeId, studentName, size = 40 }) {
  const color = useMemo(() => generateColor(accessCodeId), [accessCodeId]);
  const initials = useMemo(() => generateInitials(studentName), [studentName]);
  const partialName = useMemo(() => generatePartialName(studentName), [studentName]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: color,
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: size * 0.4,
          fontFamily: "'Poppins', sans-serif",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        {initials}
      </div>
      <div
        style={{
          fontSize: "0.9rem",
          fontWeight: 500,
          color: "var(--text-primary)",
        }}
      >
        {partialName}
      </div>
    </div>
  );
}
import { useState, useEffect, useRef } from "react";

export default function LiveStats({ stats }) {
  const [displayStats, setDisplayStats] = useState({
    totalAnswers: 0,
    completedStudents: 0,
    activeStudents: 0,
  });

  const animationFrameRef = useRef(null);
  const previousStatsRef = useRef({
    totalAnswers: 0,
    completedStudents: 0,
    activeStudents: 0,
  });

  // Animate number changes smoothly
  useEffect(() => {
    const { totalAnswers, completedStudents, activeStudents } = stats;
    const prev = previousStatsRef.current;

    // Skip if no change
    if (
      totalAnswers === prev.totalAnswers &&
      completedStudents === prev.completedStudents &&
      activeStudents === prev.activeStudents
    ) {
      return;
    }

    const animateValue = (start, end, setter) => {
      const duration = 1000; // 1 second animation
      const startTime = performance.now();

      const step = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

        const current = Math.floor(start + (end - start) * easeProgress);
        setter(current);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(step);
        }
      };

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(step);
    };

    animateValue(prev.totalAnswers, totalAnswers, (value) =>
      setDisplayStats((prev) => ({ ...prev, totalAnswers: value }))
    );

    animateValue(prev.completedStudents, completedStudents, (value) =>
      setDisplayStats((prev) => ({ ...prev, completedStudents: value }))
    );

    animateValue(prev.activeStudents, activeStudents, (value) =>
      setDisplayStats((prev) => ({ ...prev, activeStudents: value }))
    );

    previousStatsRef.current = stats;

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stats]);

  return (
    <div style={{
      display: "flex",
      gap: 16,
      flexWrap: "wrap",
    }}>
      {/* Total Answers */}
      <div className="stat-card stat-card--primary">
        <div className="stat-card__value">
          {displayStats.totalAnswers}
        </div>
        <div className="stat-card__label">Toplam Cevap</div>
      </div>

      {/* Completed Students */}
      <div className="stat-card stat-card--success">
        <div className="stat-card__value">
          {displayStats.completedStudents}
        </div>
        <div className="stat-card__label">Tümünü Tamamlayan</div>
      </div>

      {/* Active Students */}
      <div className="stat-card stat-card--info">
        <div className="stat-card__value">
          {displayStats.activeStudents}
        </div>
        <div className="stat-card__label">Aktif Öğrenci</div>
      </div>
    </div>
  );
}
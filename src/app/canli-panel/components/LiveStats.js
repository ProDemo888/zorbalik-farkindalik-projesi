export default function LiveStats({ stats }) {
  const { totalAnswers = 0, completedStudents = 0, totalStudents = 0 } = stats;

  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <div className="stat-card stat-card--primary">
        <div className="stat-card__value">{totalAnswers}</div>
        <div className="stat-card__label">Toplam Cevap</div>
      </div>

      <div className="stat-card stat-card--success">
        <div className="stat-card__value">{completedStudents}</div>
        <div className="stat-card__label">Tümünü Tamamlayan</div>
      </div>

      <div className="stat-card stat-card--info">
        <div className="stat-card__value">{totalStudents}</div>
        <div className="stat-card__label">Toplam Katılım</div>
      </div>
    </div>
  );
}

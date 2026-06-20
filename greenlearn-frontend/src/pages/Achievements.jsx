import { useEffect, useState } from 'react';
import { getAchievements } from '../api';

export default function Achievements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAchievements()
      .then(r => setItems(r.data.results || r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🏆 Достижения</h1>
        <p className="page-subtitle">Награды за выполнение заданий</p>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏅</div>
          <p className="empty-title">Достижений пока нет</p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Выполняйте задания, чтобы получить награды</p>
        </div>
      ) : (
        <div className="grid-auto">
          {items.map(a => (
            <div key={a.id} className="achievement-card">
              <div className="achievement-icon">{a.icon || '🌟'}</div>
              <div className="achievement-title">{a.title}</div>
              <div className="achievement-desc">{a.description}</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {a.required_points > 0 && (
                  <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>
                    ⭐ {a.required_points} баллов
                  </span>
                )}
                {a.required_missions_count > 0 && (
                  <span className="badge" style={{ background: '#dcfce7', color: '#14532d' }}>
                    ✅ {a.required_missions_count} заданий
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

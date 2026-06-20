import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Flame } from 'lucide-react';
import { getChildren } from '../api';

export default function Children() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChildren()
      .then(r => setChildren(r.data.results || r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">👶 Мои дети</h1>
          <p className="page-subtitle">Просмотр прогресса подключённых детей</p>
        </div>
      </div>

      {children.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔗</div>
          <p className="empty-title">Нет подключённых детей</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
            Создайте код приглашения и отправьте его ребёнку в Pingo
          </p>
          <Link to="/connect-child" className="btn btn-primary">Подключить ребёнка</Link>
        </div>
      ) : (
        <div className="grid-auto">
          {children.map(child => {
            const levelPct = Math.min(((child.total_points % 200) / 200) * 100, 100);
            return (
              <div key={child.id} className="child-card">
                <div className="child-avatar">{child.name[0]}</div>
                <div className="child-name">{child.name}</div>
                <div className="child-age">{child.age} лет • Уровень {child.level}</div>

                <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#d97706', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                      <Star size={14} fill="#d97706" /> {child.total_points}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Баллов</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                      <Flame size={14} /> {child.streak_days}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Серия</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>{child.points_balance}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Доступно</div>
                  </div>
                </div>

                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>До уровня {child.level + 1}</span>
                  <span>{Math.round(levelPct)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${levelPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

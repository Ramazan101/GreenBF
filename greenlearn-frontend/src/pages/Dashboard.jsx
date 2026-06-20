import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Trophy, Star, Flame } from 'lucide-react';
import { getDashboard } from '../api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const children = data?.children || [];
  const impact = data?.impact;
  const totalAchievements = children.reduce((s, c) => s + c.achievements_count, 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🌿 Главная</h1>
        <p className="page-subtitle">Обзор активности ваших детей</p>
      </div>

      {impact && (
        <div className="impact-band">
          <div className="impact-title">🌍 Вклад вашей семьи в планету</div>
          <div className="impact-grid">
            <div className="impact-item">
              <div className="impact-value">{impact.good_deeds}</div>
              <div className="impact-label">добрых дел</div>
            </div>
            <div className="impact-item">
              <div className="impact-value">{impact.total_points}</div>
              <div className="impact-label">GreenPoints</div>
            </div>
            <div className="impact-item">
              <div className="impact-value">≈ {impact.co2_saved_kg}<span className="impact-unit"> кг</span></div>
              <div className="impact-label">CO₂ сэкономлено</div>
            </div>
            <div className="impact-item">
              <div className="impact-value">🔥 {impact.best_streak}</div>
              <div className="impact-label">лучшая серия (дней)</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid-4" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-icon green"><Users size={22} /></div>
          <div>
            <div className="stat-value">{children.length}</div>
            <div className="stat-label">Детей</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Trophy size={22} /></div>
          <div>
            <div className="stat-value">{totalAchievements}</div>
            <div className="stat-label">Достижений</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Star size={22} /></div>
          <div>
            <div className="stat-value">{children.reduce((s, c) => s + (c.child?.total_points || 0), 0)}</div>
            <div className="stat-label">Всего баллов</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><Flame size={22} /></div>
          <div>
            <div className="stat-value">{impact?.best_streak ?? 0}</div>
            <div className="stat-label">Лучшая серия</div>
          </div>
        </div>
      </div>

      {children.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔗</div>
          <p className="empty-title">Подключите ребёнка</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
            Создайте код приглашения и отправьте его ребёнку в Pingo
          </p>
          <Link to="/connect-child" className="btn btn-primary">Подключить ребёнка</Link>
        </div>
      ) : (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Дети</h2>
          <div className="grid-auto">
            {children.map(({ child, pending_submissions, achievements_count }) => {
              const levelPct = Math.min(((child.total_points % 200) / 200) * 100, 100);
              return (
                <div key={child.id} className="child-card">
                  <div className="child-avatar">{child.name[0]}</div>
                  <div className="child-name">{child.name}</div>
                  <div className="child-age">{child.age} лет • Уровень {child.level}</div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)' }}>
                      <Star size={14} color="#d97706" fill="#d97706" />
                      {child.total_points} баллов
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)' }}>
                      <Flame size={14} color="#ef4444" />
                      {child.streak_days} дней
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      🏆 {achievements_count}
                    </div>
                  </div>

                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${levelPct}%` }} />
                  </div>

                  {pending_submissions > 0 && (
                    <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                      ⏳ {pending_submissions} задани{pending_submissions === 1 ? 'е' : 'й'} на проверке AI
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/children" className="btn btn-secondary">Подробнее о детях</Link>
            <Link to="/submissions" className="btn btn-primary">Открыть отчёты</Link>
          </div>
        </>
      )}
    </div>
  );
}

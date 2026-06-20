import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getMyStats } from '../api';

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyStats()
      .then(r => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const categoryData = stats
    ? Object.entries(stats.submissions_by_category).map(([name, value]) => ({ name, value }))
    : [];

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  if (!stats) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📊</div>
        <p className="empty-title">Статистика недоступна</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📊 Моя статистика</h1>
        <p className="page-subtitle">Твой прогресс и активность</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div>
            <div className="stat-value">{stats.approved_submissions}</div>
            <div className="stat-label">Одобрено</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">⭐</div>
          <div>
            <div className="stat-value">{stats.total_points}</div>
            <div className="stat-label">Баллов</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">🔥</div>
          <div>
            <div className="stat-value">{stats.streak_days}</div>
            <div className="stat-label">Серия дней</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">📈</div>
          <div>
            <div className="stat-value">{stats.completion_rate}%</div>
            <div className="stat-label">Успешность</div>
          </div>
        </div>
      </div>

      {stats.favorite_category && (
        <div className="card" style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Любимое направление: <strong>{stats.favorite_category}</strong>
          </p>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Баллы по неделям</h3>
          {stats.points_by_week.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Пока нет данных</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.points_by_week}>
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="points" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>По категориям</h3>
          {categoryData.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Пока нет данных</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

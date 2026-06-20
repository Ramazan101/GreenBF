import { Link } from 'react-router-dom';
import { Flame, ListChecks, Star, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ChildHome() {
  const { user } = useAuth();
  const profile = user?.child_profile;

  const levelPct = profile ? Math.min(((profile.total_points % 200) / 200) * 100, 100) : 0;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Привет, {profile?.name || user?.username}!</h1>
        <p className="page-subtitle">Это детское приложение: выполняй задания и собирай достижения</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-icon amber"><Star size={22} /></div>
          <div>
            <div className="stat-value">{profile?.points_balance ?? 0}</div>
            <div className="stat-label">GreenPoints</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Trophy size={22} /></div>
          <div>
            <div className="stat-value">{profile?.level ?? 1}</div>
            <div className="stat-label">Уровень</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><Flame size={22} /></div>
          <div>
            <div className="stat-value">{profile?.streak_days ?? 0}</div>
            <div className="stat-label">Дней подряд</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Star size={22} /></div>
          <div>
            <div className="stat-value">{profile?.total_points ?? 0}</div>
            <div className="stat-label">Всего заработано</div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>
        До уровня {(profile?.level ?? 1) + 1}: {Math.round(levelPct)}%
      </div>
      <div className="progress-bar" style={{ marginBottom: 28 }}>
        <div className="progress-fill" style={{ width: `${levelPct}%` }} />
      </div>

      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 24 }}>
        <Link to="/my-tasks" className="btn btn-primary" style={{ justifyContent: 'center' }}>
          <ListChecks size={16} /> Мои задания
        </Link>
        <Link to="/my-submissions" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
          Мои отчёты
        </Link>
        <Link to="/rewards" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
          Награды
        </Link>
        <Link to="/chat" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
          AI-наставник
        </Link>
      </div>
    </div>
  );
}

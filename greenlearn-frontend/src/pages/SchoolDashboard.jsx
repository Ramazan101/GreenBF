import { Link } from 'react-router-dom';
import { BarChart2, Leaf, Star, Trophy, Users } from 'lucide-react';
import { schoolSummary } from '../data/platformMock';
import { GpExplainer, PageHeader, StatCard } from '../components/PlatformComponents';

export default function SchoolDashboard() {
  return (
    <div>
      <PageHeader
        title={schoolSummary.name}
        subtitle="B2B кабинет школы: баланс, классы, эко-вклад и рейтинг."
        actions={<Link to="/school/wallet" className="btn btn-primary">Открыть GreenPoints</Link>}
      />
      <GpExplainer />

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon={<Star size={22} />} value={schoolSummary.balance} label="Баланс GP" tone="amber" />
        <StatCard icon={<Users size={22} />} value={schoolSummary.classes} label="Классов" tone="blue" />
        <StatCard icon={<Users size={22} />} value={schoolSummary.students} label="Учеников" />
        <StatCard icon={<Trophy size={22} />} value={`#${schoolSummary.rank}`} label="Место школы" tone="red" />
      </div>

      <div className="impact-band">
        <div className="impact-title">Вклад школы в район</div>
        <div className="impact-grid">
          <div className="impact-item"><div className="impact-value">{schoolSummary.goodDeeds}</div><div className="impact-label">добрых дел</div></div>
          <div className="impact-item"><div className="impact-value">{schoolSummary.ecoMissions}</div><div className="impact-label">эко-миссий</div></div>
          <div className="impact-item"><div className="impact-value">{schoolSummary.trees}</div><div className="impact-label">деревьев/растений</div></div>
          <div className="impact-item"><div className="impact-value">{schoolSummary.trashKg}<span className="impact-unit"> кг</span></div><div className="impact-label">мусора убрано</div></div>
        </div>
      </div>

      <div className="grid-3">
        <Link to="/school/classes" className="platform-card-link">
          <div className="platform-card"><Leaf size={24} color="var(--green)" /><h3>Классы</h3><p>Распределяйте GP, смотрите рейтинги и классных руководителей.</p></div>
        </Link>
        <Link to="/school-challenges" className="platform-card-link">
          <div className="platform-card"><Trophy size={24} color="var(--warning)" /><h3>Green School Challenge</h3><p>Соревнования между школами и районами Кыргызстана.</p></div>
        </Link>
        <Link to="/national-leaderboard" className="platform-card-link">
          <div className="platform-card"><BarChart2 size={24} color="var(--info)" /><h3>Национальный рейтинг</h3><p>Сравнение школ, классов, районов и городов.</p></div>
        </Link>
      </div>
    </div>
  );
}

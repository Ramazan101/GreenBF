import { Link } from 'react-router-dom';
import { BarChart2, ClipboardList, Star, Users } from 'lucide-react';
import { universityGroups, universitySummary } from '../data/platformMock';
import { GpExplainer, PageHeader, SimpleTable, StatCard } from '../components/PlatformComponents';

export default function UniversityDashboard() {
  return (
    <div>
      <PageHeader
        title={universitySummary.name}
        subtitle="Кабинет ВУЗа: факультеты, группы, GreenPoints, мероприятия, отчёты и волонтёрские часы."
        actions={<Link to="/university/wallet" className="btn btn-primary">University Wallet</Link>}
      />
      <GpExplainer />

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon={<Star size={22} />} value={universitySummary.balance} label="GP баланс" tone="amber" />
        <StatCard icon={<Users size={22} />} value={universitySummary.faculties} label="Факультетов" tone="blue" />
        <StatCard icon={<Users size={22} />} value={universitySummary.students} label="Студентов" />
        <StatCard icon={<ClipboardList size={22} />} value={universitySummary.reports} label="Отчётов" tone="red" />
      </div>

      <SimpleTable
        columns={[
          { key: 'name', label: 'Группа' },
          { key: 'faculty', label: 'Факультет' },
          { key: 'balance', label: 'GP' },
          { key: 'students', label: 'Студенты' },
          { key: 'hours', label: 'Волонтёрские часы' },
        ]}
        rows={universityGroups}
      />

      <div className="platform-card" style={{ marginTop: 18 }}>
        <BarChart2 size={24} color="var(--green)" />
        <h3>ВУЗ как центр наставничества</h3>
        <p>Студенты получают GreenPoints за эко-акции, помощь младшим, мастер-классы, хакатоны и организацию общественных проектов.</p>
      </div>
    </div>
  );
}

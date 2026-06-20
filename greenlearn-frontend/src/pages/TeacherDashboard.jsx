import { Link } from 'react-router-dom';
import { BarChart2, ClipboardList, ListChecks, Star, Users } from 'lucide-react';
import { teacherStudents, teacherSummary } from '../data/platformMock';
import { PageHeader, SimpleTable, StatCard } from '../components/PlatformComponents';

export default function TeacherDashboard() {
  return (
    <div>
      <PageHeader
        title="Учитель: классная панель"
        subtitle={`${teacherSummary.teacherName} · ${teacherSummary.school} · класс ${teacherSummary.className}`}
        actions={<Link to="/teacher/missions" className="btn btn-primary">Создать задание</Link>}
      />

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon={<Star size={22} />} value={teacherSummary.classPoints} label="GP класса" tone="amber" />
        <StatCard icon={<Users size={22} />} value={teacherSummary.students} label="Учеников" tone="blue" />
        <StatCard icon={<ListChecks size={22} />} value={teacherSummary.completed} label="Выполнено" />
        <StatCard icon={<ClipboardList size={22} />} value={teacherSummary.pending} label="Ждут проверки" tone="red" />
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h2 className="card-title">Быстрые действия</h2>
        </div>
        <div className="grid-3">
          <Link to="/teacher/missions" className="btn btn-primary" style={{ justifyContent: 'center' }}>Создать задание</Link>
          <Link to="/teacher/submissions" className="btn btn-secondary" style={{ justifyContent: 'center' }}>Проверить отчёты</Link>
          <Link to="/school/leaderboard" className="btn btn-secondary" style={{ justifyContent: 'center' }}><BarChart2 size={16} /> Рейтинг класса</Link>
        </div>
      </div>

      <SimpleTable
        columns={[
          { key: 'rank', label: '#', render: (_, index) => index + 1 },
          { key: 'name', label: 'Ученик' },
          { key: 'points', label: 'GreenPoints' },
          { key: 'streak', label: 'Streak' },
          { key: 'level', label: 'Уровень' },
          { key: 'missions', label: 'Миссий' },
        ]}
        rows={teacherStudents}
      />
    </div>
  );
}

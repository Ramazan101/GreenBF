import { Award, BookOpen, Star, Users } from 'lucide-react';
import { studentMissions, teacherStudents } from '../data/platformMock';
import { PageHeader, SimpleTable, StatCard } from '../components/PlatformComponents';

export default function StudentDashboard() {
  return (
    <div>
      <PageHeader
        title="Студент 18+"
        subtitle="Волонтёрские проекты, эко-акции, помощь младшим, хакатоны, рейтинг и сертификаты."
      />

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon={<Star size={22} />} value="3 420" label="GreenPoints" tone="amber" />
        <StatCard icon={<Users size={22} />} value="84 ч" label="Волонтёрство" />
        <StatCard icon={<BookOpen size={22} />} value="6" label="Проектов" tone="blue" />
        <StatCard icon={<Award size={22} />} value="3" label="Сертификата" tone="red" />
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div>
          <h2 className="platform-section-title">Волонтёрские миссии</h2>
          <SimpleTable
            columns={[
              { key: 'title', label: 'Миссия' },
              { key: 'category', label: 'Категория' },
              { key: 'points', label: 'GP' },
            ]}
            rows={studentMissions}
          />
        </div>
        <div>
          <h2 className="platform-section-title">Рейтинг студентов</h2>
          <SimpleTable
            columns={[
              { key: 'rank', label: '#', render: (_, index) => index + 1 },
              { key: 'name', label: 'Студент' },
              { key: 'points', label: 'GP' },
              { key: 'missions', label: 'Проекты' },
            ]}
            rows={teacherStudents}
          />
        </div>
      </div>
    </div>
  );
}

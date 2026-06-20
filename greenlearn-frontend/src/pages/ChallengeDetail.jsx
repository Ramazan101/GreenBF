import { useParams } from 'react-router-dom';
import { Leaf, Star, Trophy, Users } from 'lucide-react';
import { classLeaderboard, schoolChallenges, schoolLeaderboard, teacherStudents } from '../data/platformMock';
import { PageHeader, ProgressBar, SimpleTable, StatCard } from '../components/PlatformComponents';

export default function ChallengeDetail() {
  const { id } = useParams();
  const challenge = schoolChallenges.find(item => item.id === id) || schoolChallenges[0];

  return (
    <div>
      <PageHeader
        title={challenge.title}
        subtitle={challenge.description}
      />

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon={<Users size={22} />} value={challenge.schools} label="Школ участвует" tone="blue" />
        <StatCard icon={<Star size={22} />} value="184K" label="GreenPoints" tone="amber" />
        <StatCard icon={<Leaf size={22} />} value="416" label="Очищенные зоны" />
        <StatCard icon={<Trophy size={22} />} value={challenge.endsIn} label="До конца" tone="red" />
      </div>

      <div className="grid-2" style={{ marginBottom: 24, alignItems: 'start' }}>
        <div className="platform-card">
          <span className="platform-eyebrow">Правила</span>
          <h3>Как победить</h3>
          <div className="platform-list">
            {['Класс выбирает территорию', 'Ученики выполняют эко-миссии', 'AI и учитель проверяют отчёты', 'Школа получает GreenPoints и поднимается в рейтинге'].map((text, index) => (
              <div className="platform-list-item" key={text}><strong>{index + 1}</strong><span>{text}</span></div>
            ))}
          </div>
        </div>
        <div className="platform-card">
          <span className="platform-eyebrow">Прогресс</span>
          <h3>{challenge.progress}% пути</h3>
          <ProgressBar value={challenge.progress} />
          <p style={{ marginTop: 14 }}>Приз: {challenge.prize}. Сроки: {challenge.dates}.</p>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24, alignItems: 'start' }}>
        <div>
          <h2 className="platform-section-title">Рейтинг школ</h2>
          <SimpleTable columns={[
            { key: 'rank', label: '#' },
            { key: 'name', label: 'Школа' },
            { key: 'points', label: 'GP' },
            { key: 'cleanZones', label: 'Зоны' },
          ]} rows={schoolLeaderboard} />
        </div>
        <div>
          <h2 className="platform-section-title">Рейтинг классов</h2>
          <SimpleTable columns={[
            { key: 'rank', label: '#' },
            { key: 'name', label: 'Класс' },
            { key: 'points', label: 'GP' },
            { key: 'missions', label: 'Миссии' },
          ]} rows={classLeaderboard} />
        </div>
      </div>

      <h2 className="platform-section-title">Топ учеников</h2>
      <SimpleTable columns={[
        { key: 'rank', label: '#', render: (_, index) => index + 1 },
        { key: 'name', label: 'Ученик' },
        { key: 'points', label: 'GP' },
        { key: 'missions', label: 'Миссии' },
      ]} rows={teacherStudents} />
    </div>
  );
}

import { useState } from 'react';
import { classLeaderboard, teacherStudents } from '../data/platformMock';
import { PageHeader, SimpleTable } from '../components/PlatformComponents';

const FILTERS = ['неделя', 'месяц', 'сезон', 'всё время'];

export default function SchoolLeaderboard() {
  const [filter, setFilter] = useState('месяц');

  return (
    <div>
      <PageHeader
        title="Рейтинг школы"
        subtitle="Рейтинг классов и учеников с фильтрами по периоду."
        actions={<div className="filter-bar" style={{ marginBottom: 0 }}>{FILTERS.map(item => <button key={item} className={`btn btn-sm ${filter === item ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(item)}>{item}</button>)}</div>}
      />

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div>
          <h2 className="platform-section-title">Классы · {filter}</h2>
          <SimpleTable
            columns={[
              { key: 'rank', label: '#' },
              { key: 'name', label: 'Класс' },
              { key: 'points', label: 'GP' },
              { key: 'missions', label: 'Миссии' },
            ]}
            rows={classLeaderboard}
          />
        </div>
        <div>
          <h2 className="platform-section-title">Ученики · {filter}</h2>
          <SimpleTable
            columns={[
              { key: 'rank', label: '#', render: (_, index) => index + 1 },
              { key: 'name', label: 'Ученик' },
              { key: 'points', label: 'GP' },
              { key: 'missions', label: 'Миссии' },
            ]}
            rows={teacherStudents}
          />
        </div>
      </div>
    </div>
  );
}

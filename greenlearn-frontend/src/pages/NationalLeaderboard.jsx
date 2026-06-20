import { useState } from 'react';
import { schoolLeaderboard } from '../data/platformMock';
import { PageHeader, SimpleTable } from '../components/PlatformComponents';

const FILTERS = ['неделя', 'месяц', 'сезон', 'год'];
const TYPES = ['школы', 'классы', 'районы', 'города'];

export default function NationalLeaderboard() {
  const [filter, setFilter] = useState('месяц');
  const [type, setType] = useState('школы');

  const rows = schoolLeaderboard.map(item => ({
    ...item,
    name: type === 'школы' ? item.name : type === 'классы' ? `${item.name} · 8-А` : type === 'районы' ? `${item.city} · район` : item.city,
  }));

  return (
    <div>
      <PageHeader
        title="Национальный рейтинг"
        subtitle="Рейтинг школ, классов, районов и городов по GreenPoints и эко-вкладу."
      />
      <div className="filter-bar">
        {FILTERS.map(item => <button key={item} className={`btn btn-sm ${filter === item ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(item)}>{item}</button>)}
      </div>
      <div className="filter-bar">
        {TYPES.map(item => <button key={item} className={`btn btn-sm ${type === item ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setType(item)}>{item}</button>)}
      </div>
      <SimpleTable
        columns={[
          { key: 'rank', label: '#' },
          { key: 'name', label: type },
          { key: 'city', label: 'Город' },
          { key: 'points', label: 'GreenPoints' },
          { key: 'cleanZones', label: 'Очищенные зоны' },
        ]}
        rows={rows}
      />
      <div className="platform-note" style={{ marginTop: 18 }}>
        GreenLearnAI превращает локальные школьные действия в национальное движение: каждая чистая улица видна в общем рейтинге Кыргызстана.
      </div>
    </div>
  );
}

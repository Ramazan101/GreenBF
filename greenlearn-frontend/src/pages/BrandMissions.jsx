import { useState } from 'react';
import toast from 'react-hot-toast';
import { brandMissions } from '../data/platformMock';
import { PageHeader, SimpleTable, StatusBadge } from '../components/PlatformComponents';

export default function BrandMissions() {
  const [items, setItems] = useState(brandMissions);
  const [form, setForm] = useState({
    title: 'KFC Green Mission',
    description: 'Убери мусор во дворе → получи 100 GP',
    reward: 'Скидка 15%',
    points: 100,
    age: '7-17',
    sponsor: 'KFC Kyrgyzstan',
  });

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    setItems(prev => [{ ...form, status: 'active' }, ...prev]);
    toast.success('Брендовая миссия опубликована');
  };

  return (
    <div>
      <PageHeader title="Брендовые миссии" subtitle="Партнёр создаёт миссии с наградами, возрастом, сроками и sponsor name." />
      <div className="grid-2" style={{ alignItems: 'start', marginBottom: 24 }}>
        <form className="card" onSubmit={submit}>
          <h2 className="card-title" style={{ marginBottom: 16 }}>Создать миссию</h2>
          {[
            ['title', 'Title'],
            ['description', 'Description'],
            ['reward', 'Reward'],
            ['points', 'Points'],
            ['age', 'Target age'],
            ['sponsor', 'Sponsor name'],
          ].map(([key, label]) => (
            <div className="form-group" key={key}>
              <label className="form-label">{label}</label>
              <input className="form-input" value={form[key]} onChange={e => update(key, e.target.value)} />
            </div>
          ))}
          <button className="btn btn-primary">Опубликовать</button>
        </form>
        <div className="platform-card">
          <span className="platform-eyebrow">Примеры</span>
          <h3>KFC Green Mission</h3>
          <p>Убери мусор → получи 100 GP. Книжный магазин: прочитай книгу → получи скидку. Кинотеатр: 7 добрых дел → скидка на билет.</p>
        </div>
      </div>
      <SimpleTable
        columns={[
          { key: 'title', label: 'Миссия' },
          { key: 'reward', label: 'Награда' },
          { key: 'points', label: 'GP' },
          { key: 'age', label: 'Возраст' },
          { key: 'status', label: 'Статус', render: row => <StatusBadge value={row.status} /> },
        ]}
        rows={items}
      />
    </div>
  );
}

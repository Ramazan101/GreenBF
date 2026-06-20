import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { teacherMissionExamples } from '../data/platformMock';
import { MockApiNotice, PageHeader, SimpleTable, StatusBadge } from '../components/PlatformComponents';

export default function TeacherMissions() {
  const [missions, setMissions] = useState(teacherMissionExamples);
  const [form, setForm] = useState({
    title: 'Участие в субботнике',
    description: 'Если ученик участвует в субботнике и показывает результат, он получает GreenPoints.',
    category: 'Экология',
    points: 50,
    deadline: '2026-07-01',
    group: '7-Б',
    proofType: 'photo',
  });

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    setMissions(prev => [{ title: form.title, category: form.category, points: Number(form.points), proofType: form.proofType }, ...prev]);
    toast.success('Миссия создана для класса');
  };

  return (
    <div>
      <PageHeader
        title="Миссии учителя"
        subtitle="Формула: если ученик делает X → получает Y GreenPoints."
      />
      <MockApiNotice />

      <div className="grid-2" style={{ alignItems: 'start', marginBottom: 24 }}>
        <form className="card" onSubmit={handleSubmit}>
          <div className="card-header"><h2 className="card-title">Создать условие-миссию</h2></div>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" value={form.title} onChange={e => update('title', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e => update('description', e.target.value)} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <input className="form-input" value={form.category} onChange={e => update('category', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Points</label>
              <input className="form-input" type="number" value={form.points} onChange={e => update('points', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input className="form-input" type="date" value={form.deadline} onChange={e => update('deadline', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Class / group</label>
              <input className="form-input" value={form.group} onChange={e => update('group', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Proof type</label>
            <select className="form-select" value={form.proofType} onChange={e => update('proofType', e.target.value)}>
              <option value="photo">photo</option>
              <option value="text">text</option>
              <option value="voice">voice</option>
              <option value="teacher approval">teacher approval</option>
            </select>
          </div>
          <button className="btn btn-primary" type="submit"><Plus size={16} /> Создать миссию</button>
        </form>

        <div className="platform-card">
          <span className="platform-eyebrow">AI Mission Builder</span>
          <h3>Нужно больше идей?</h3>
          <p>Открой AI-конструктор: напиши цель, а система предложит title, description, points, proof type и объяснение.</p>
          <Link to="/mission-builder" className="btn btn-secondary" style={{ marginTop: 16 }}>Открыть AI Mission Builder</Link>
        </div>
      </div>

      <SimpleTable
        columns={[
          { key: 'title', label: 'Миссия' },
          { key: 'category', label: 'Категория' },
          { key: 'points', label: 'GP' },
          { key: 'proofType', label: 'Proof type', render: row => <StatusBadge value={row.proofType === 'photo' ? 'active' : 'pending'} /> },
        ]}
        rows={missions}
      />
    </div>
  );
}

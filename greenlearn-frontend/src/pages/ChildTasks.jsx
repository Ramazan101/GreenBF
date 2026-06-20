import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Upload, Star } from 'lucide-react';
import { getMissions, getCategories, createSubmission, getRecommendedMe } from '../api';
import PhotoCapture from '../components/PhotoCapture';

const DIFF_LABELS = { easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный' };

function SubmitModal({ mission, onClose, onDone }) {
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('mission', mission.id);
      if (photo) fd.append('photo', photo);
      await createSubmission(fd);
      toast.success(photo ? '📸 Отправлено на AI-проверку!' : '✅ Задание отправлено!');
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.[0] || 'Ошибка отправки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Отправить задание</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>«{mission.title}»</p>
        <form onSubmit={handle}>
          <div className="form-group">
            <PhotoCapture
              value={photo}
              onChange={setPhoto}
              inputId={`mission-photo-${mission.id}`}
              label="Фото (рекомендуется — AI проверит автоматически)"
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Отмена</button>
            {photo && (
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Отправка...' : 'Отправить'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ChildTasks() {
  const [missionsRes, setMissionsRes] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState({ category: '', difficulty: '' });
  const [tab, setTab] = useState('recommended');
  const [submitModal, setSubmitModal] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const missionsKey = `${tab}|${filter.category}|${filter.difficulty}`;

  useEffect(() => {
    getCategories().then(r => setCategories(r.data.results || r.data));
  }, []);

  useEffect(() => {
    let active = true;
    const promise = tab === 'recommended' ? getRecommendedMe() : getMissions(filter);
    promise
      .then(r => { if (active) setMissionsRes({ key: missionsKey, list: r.data.results || r.data }); })
      .catch(() => { if (active) setMissionsRes({ key: missionsKey, list: [] }); });
    return () => { active = false; };
  }, [filter, tab, missionsKey, refreshKey]);

  const missions = missionsRes?.key === missionsKey ? missionsRes.list : [];
  const loading = missionsRes?.key !== missionsKey;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📋 Мои задания</h1>
        <p className="page-subtitle">Выполняй добрые дела и получай GreenPoints</p>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'recommended' ? 'active' : ''}`} onClick={() => setTab('recommended')}>
          ⭐ Рекомендуемые
        </button>
        <button className={`tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>Все задания</button>
      </div>

      {tab === 'all' && (
        <div className="filter-bar">
          <select className="form-select" style={{ width: 'auto' }} value={filter.category} onChange={e => setFilter({ ...filter, category: e.target.value })}>
            <option value="">Все категории</option>
            {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={filter.difficulty} onChange={e => setFilter({ ...filter, difficulty: e.target.value })}>
            <option value="">Любая сложность</option>
            <option value="easy">Лёгкий</option>
            <option value="medium">Средний</option>
            <option value="hard">Сложный</option>
          </select>
        </div>
      )}

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : missions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <p className="empty-title">Заданий не найдено</p>
        </div>
      ) : (
        <div className="grid-auto">
          {missions.map(m => (
            <div key={m.id} className="mission-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span className={`badge badge-${m.difficulty}`}>{DIFF_LABELS[m.difficulty]}</span>
                <span className="badge" style={{ background: '#fef3c7', color: '#92400e', gap: 4 }}>
                  <Star size={11} fill="#d97706" color="#d97706" /> {m.points} балл.
                </span>
              </div>
              <div className="mission-title">{m.title}</div>
              <div className="mission-desc">{m.description}</div>
              <div className="mission-meta">
                {m.category_name && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>📁 {m.category_name}</span>
                )}
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>👤 {m.min_age}–{m.max_age} лет</span>
              </div>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}
                onClick={() => setSubmitModal(m)}
              >
                <Upload size={14} /> Отправить с фото
              </button>
            </div>
          ))}
        </div>
      )}

      {submitModal && (
        <SubmitModal
          mission={submitModal}
          onClose={() => setSubmitModal(null)}
          onDone={() => setRefreshKey(key => key + 1)}
        />
      )}
    </div>
  );
}

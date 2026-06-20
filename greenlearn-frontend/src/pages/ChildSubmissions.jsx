import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, ChevronRight, MessageSquare } from 'lucide-react';
import { getSubmissions } from '../api';
import { mediaUrl } from '../utils/mediaUrl';

const STATUS_LABELS = {
  pending: 'На проверке',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  ai_review: 'AI проверка',
};

function aiText(submission) {
  if (submission.ai_feedback) return submission.ai_feedback;
  if (submission.status === 'ai_review') return 'AI проверяет фото и скоро даст текстовый ответ.';
  if (submission.status === 'pending') return 'Фото отправлено, ответ появится после проверки.';
  return 'AI-ответ пока не добавлен.';
}

export default function ChildSubmissions() {
  const [itemsRes, setItemsRes] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    let active = true;
    getSubmissions({ status: filter || undefined })
      .then(r => { if (active) setItemsRes({ filter, list: r.data.results || r.data }); })
      .catch(() => { if (active) setItemsRes({ filter, list: [] }); });
    return () => { active = false; };
  }, [filter]);

  const items = itemsRes?.filter === filter ? itemsRes.list : [];
  const loading = itemsRes?.filter !== filter;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📋 Мои отчёты</h1>
        <p className="page-subtitle">Фото выполненных заданий и текстовые AI-ответы</p>
      </div>

      <div className="filter-bar">
        {[
          { value: '', label: 'Все' },
          { value: 'pending', label: '⏳ Ожидают' },
          { value: 'ai_review', label: '🤖 AI проверка' },
          { value: 'approved', label: '✅ Одобрены' },
          { value: 'rejected', label: '❌ Отклонены' },
        ].map(opt => (
          <button
            key={opt.value}
            className={`btn btn-sm ${filter === opt.value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p className="empty-title">Пока нет отчётов</p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Выполни задание и отправь фото — AI проверит автоматически</p>
        </div>
      ) : (
        <div className="grid-auto">
          {items.map(s => (
            <Link key={s.id} to={`/my-submissions/${s.id}`} className="submission-card">
              <div className="submission-photo">
                {s.photo ? (
                  <img src={mediaUrl(s.photo)} alt={s.mission_title} />
                ) : (
                  <div className="submission-photo-empty">
                    <Camera size={26} />
                    <span>Без фото</span>
                  </div>
                )}
              </div>
              <div className="submission-card-body">
                <div className="submission-card-title-row">
                  <h2>{s.mission_title}</h2>
                  <span className={`badge badge-${s.status}`}>{STATUS_LABELS[s.status]}</span>
                </div>
                <p className="submission-ai-preview">
                  <MessageSquare size={15} /> {aiText(s)}
                </p>
                <div className="submission-card-footer">
                  <span>{new Date(s.created_at).toLocaleDateString('ru')}</span>
                  {s.points_awarded > 0 && <strong>+{s.points_awarded} GreenPoints</strong>}
                  <ChevronRight size={18} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

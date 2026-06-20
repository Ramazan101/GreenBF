import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle } from 'lucide-react';
import { getSubmissions, approveSubmission, rejectSubmission } from '../api';
import { mediaUrl } from '../utils/mediaUrl';

const STATUS_LABELS = {
  pending: 'На проверке',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  ai_review: 'AI проверка',
};

function PhotoModal({ url, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: 600, width: '100%' }}>
        <img src={url} alt="submission" style={{ width: '100%', borderRadius: 12, maxHeight: '80vh', objectFit: 'contain' }} />
        <button className="btn btn-secondary" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }} onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  );
}

function RejectModal({ submission, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      await rejectSubmission(submission.id, reason);
      toast.success('Задание отклонено');
      onDone(submission.id);
      onClose();
    } catch { toast.error('Ошибка'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Отклонить задание</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
          «{submission.mission_title}» — {submission.child_name}
        </p>
        <div className="form-group">
          <label className="form-label">Причина отклонения (необязательно)</label>
          <textarea className="form-textarea" value={reason} onChange={e => setReason(e.target.value)} placeholder="Объясните ребёнку, что нужно исправить..." />
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn btn-danger" onClick={handle} disabled={loading}>
            {loading ? '...' : 'Отклонить'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Submissions() {
  const [itemsRes, setItemsRes] = useState(null); // { filter, list }
  const [filter, setFilter] = useState('pending');
  const [photoUrl, setPhotoUrl] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  useEffect(() => {
    let active = true;
    getSubmissions({ status: filter || undefined })
      .then(r => { if (active) setItemsRes({ filter, list: r.data.results || r.data }); })
      .catch(() => { if (active) setItemsRes({ filter, list: [] }); });
    return () => { active = false; };
  }, [filter]);

  const items = itemsRes?.filter === filter ? itemsRes.list : [];
  const loading = itemsRes?.filter !== filter;

  const updateItemStatus = (id, status) => {
    setItemsRes(prev => prev && ({
      ...prev,
      list: prev.list.map(x => x.id === id ? { ...x, status } : x),
    }));
  };

  const handleApprove = async (id) => {
    try {
      const { data } = await approveSubmission(id);
      toast.success(`✅ Одобрено! +${data.points_awarded} баллов`);
      updateItemStatus(id, 'approved');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Ошибка');
    }
  };

  const handleRejected = (id) => {
    updateItemStatus(id, 'rejected');
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📋 Проверка заданий</h1>
        <p className="page-subtitle">Просматривайте и одобряйте выполненные задания</p>
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
          <p className="empty-title">Нет заданий</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ребёнок</th>
                  <th>Задание</th>
                  <th>Статус</th>
                  <th>Баллы</th>
                  <th>Фото</th>
                  <th>AI отзыв</th>
                  <th>Дата</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {items.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.child_name}</td>
                    <td>{s.mission_title}</td>
                    <td><span className={`badge badge-${s.status}`}>{STATUS_LABELS[s.status]}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--green)' }}>
                      {s.points_awarded > 0 ? `+${s.points_awarded}` : '—'}
                    </td>
                    <td>
                      {s.photo ? (
                        <img
                          src={mediaUrl(s.photo)}
                          className="img-thumb"
                          alt="photo"
                          onClick={() => setPhotoUrl(mediaUrl(s.photo))}
                        />
                      ) : '—'}
                    </td>
                    <td style={{ maxWidth: 200, fontSize: 13, color: 'var(--text-muted)' }}>
                      {s.ai_feedback
                        ? <span title={s.ai_feedback}>{s.ai_feedback.slice(0, 60)}{s.ai_feedback.length > 60 ? '...' : ''}</span>
                        : '—'}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(s.created_at).toLocaleDateString('ru')}
                    </td>
                    <td>
                      {(s.status === 'pending' || s.status === 'ai_review') && (
                        <div className="actions">
                          <button className="btn btn-sm btn-success" onClick={() => handleApprove(s.id)} title="Одобрить">
                            <CheckCircle size={14} />
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => setRejectTarget(s)} title="Отклонить">
                            <XCircle size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {photoUrl && <PhotoModal url={photoUrl} onClose={() => setPhotoUrl(null)} />}
      {rejectTarget && (
        <RejectModal
          submission={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onDone={handleRejected}
        />
      )}
    </div>
  );
}

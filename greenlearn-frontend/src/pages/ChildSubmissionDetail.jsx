import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bot, Camera, CheckCircle2, Clock, RefreshCw, Upload, XCircle } from 'lucide-react';
import { getSubmission, resubmitSubmissionPhoto, runSubmissionAiCheck } from '../api';
import { mediaUrl } from '../utils/mediaUrl';
import PhotoCapture from '../components/PhotoCapture';

const STATUS_LABELS = {
  pending: 'На проверке',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  ai_review: 'AI проверка',
};

const STATUS_ICONS = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  ai_review: Bot,
};

function aiText(submission) {
  if (submission.ai_feedback) return submission.ai_feedback;
  if (submission.status === 'ai_review') return 'AI проверяет фото. Текстовый ответ появится здесь после анализа.';
  if (submission.status === 'pending') return 'Фото получено. Проверка ещё не завершена.';
  return 'AI пока не добавил текстовый ответ по этому фото.';
}

export default function ChildSubmissionDetail() {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState('');
  const [newPhoto, setNewPhoto] = useState(null);
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitError, setResubmitError] = useState('');
  const autoCheckStarted = useRef(false);

  const handleAiCheck = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setChecking(true);
    if (!silent) setCheckError('');
    try {
      const { data } = await runSubmissionAiCheck(id);
      setSubmission(data);
    } catch {
      if (!silent) setCheckError('Не получилось проверить фото. Попробуй ещё раз.');
    } finally {
      if (!silent) setChecking(false);
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    autoCheckStarted.current = false;
    getSubmission(id)
      .then(({ data }) => { if (active) setSubmission(data); })
      .catch(() => { if (active) setSubmission(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const handleResubmitPhoto = async (event) => {
    event.preventDefault();
    if (!newPhoto) {
      setResubmitError('Выбери новое фото.');
      return;
    }

    setResubmitting(true);
    setResubmitError('');
    try {
      const formData = new FormData();
      formData.append('photo', newPhoto);
      const { data } = await resubmitSubmissionPhoto(id, formData);
      autoCheckStarted.current = true;
      setSubmission(data);
      setNewPhoto(null);
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.photo || 'Не получилось отправить новое фото.';
      setResubmitError(message);
    } finally {
      setResubmitting(false);
    }
  };

  const needsAiCheck = Boolean(submission?.photo) && (
    !submission?.ai_feedback ||
    submission?.status === 'ai_review' ||
    (submission?.status === 'pending' && Number(submission?.ai_confidence || 0) < 0.7)
  );

  useEffect(() => {
    if (!needsAiCheck || autoCheckStarted.current) return undefined;

    autoCheckStarted.current = true;
    let active = true;
    runSubmissionAiCheck(id)
      .then(({ data }) => { if (active) setSubmission(data); })
      .catch(() => {});
    return () => { active = false; };
  }, [id, needsAiCheck]);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  if (!submission) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <p className="empty-title">Отчёт не найден</p>
        <Link to="/my-submissions" className="btn btn-primary" style={{ marginTop: 16 }}>Вернуться к отчётам</Link>
      </div>
    );
  }

  const StatusIcon = STATUS_ICONS[submission.status] || Clock;
  const photo = mediaUrl(submission.photo);

  return (
    <div>
      <div className="page-header location-header">
        <div>
          <Link to="/my-submissions" className="btn btn-secondary btn-sm" style={{ marginBottom: 14 }}>
            <ArrowLeft size={15} /> Назад
          </Link>
          <h1 className="page-title">{submission.mission_title}</h1>
          <p className="page-subtitle">Детальный отчёт по фото и текстовый ответ AI</p>
        </div>
        <span className={`badge badge-${submission.status}`} style={{ alignSelf: 'flex-start' }}>
          <StatusIcon size={14} /> {STATUS_LABELS[submission.status]}
        </span>
      </div>

      <div className="submission-detail-grid">
        <div className="card submission-detail-photo-card">
          {photo ? (
            <a href={photo} target="_blank" rel="noreferrer">
              <img src={photo} alt={submission.mission_title} />
            </a>
          ) : (
            <div className="submission-photo-empty large">
              <Camera size={36} />
              <span>Фото не отправлено</span>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">AI-ответ по фото</h2>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleAiCheck()}
              disabled={checking || !photo}
            >
              {checking ? <RefreshCw size={15} /> : <Bot size={15} />}
              {checking ? 'Проверка...' : 'Проверить AI'}
            </button>
          </div>
          <div className="ai-feedback-box">
            {aiText(submission)}
          </div>
          {checkError && <p className="field-error">{checkError}</p>}
          {submission.status === 'rejected' && (
            <form className="resubmit-box" onSubmit={handleResubmitPhoto}>
              <PhotoCapture
                value={newPhoto}
                onChange={(file) => {
                  setNewPhoto(file);
                  setResubmitError('');
                }}
                inputId="resubmit-photo"
                label="Отправить новое фото"
              />
              {resubmitError && <p className="field-error">{resubmitError}</p>}
              {newPhoto && (
                <button type="submit" className="btn btn-primary btn-sm" disabled={resubmitting}>
                  {resubmitting ? <RefreshCw size={15} /> : <Upload size={15} />}
                  {resubmitting ? 'Отправка...' : 'Отправить новое фото'}
                </button>
              )}
            </form>
          )}
          <div className="submission-detail-meta">
            <div>
              <span>Дата</span>
              <strong>{new Date(submission.created_at).toLocaleString('ru')}</strong>
            </div>
            <div>
              <span>Уверенность AI</span>
              <strong>{submission.ai_confidence !== null && submission.ai_confidence !== undefined ? `${Math.round(submission.ai_confidence * 100)}%` : '—'}</strong>
            </div>
            <div>
              <span>Баллы</span>
              <strong>{submission.points_awarded > 0 ? `+${submission.points_awarded}` : '—'}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

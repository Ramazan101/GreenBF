import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Loader2 } from 'lucide-react';
import { getMyEcoPassport, downloadCertificatePdf } from '../api';

export default function Passport() {
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    getMyEcoPassport()
      .then(r => setPassport(r.data))
      .catch(() => toast.error('Не удалось загрузить паспорт'))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (cert) => {
    setDownloading(cert.id);
    try {
      const { data } = await downloadCertificatePdf(cert.id);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${cert.code}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Не удалось скачать сертификат');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🌍 Eco Passport</h1>
        <p className="page-subtitle">Твой личный паспорт добрых дел</p>
      </div>

      {!passport ? (
        <div className="empty-state">
          <div className="empty-icon">🌍</div>
          <p className="empty-title">Паспорт недоступен</p>
        </div>
      ) : (
        <>
          <div className="passport-hero">
            <div className="child-avatar" style={{ width: 64, height: 64, fontSize: 26, marginBottom: 0 }}>
              {passport.child.name[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{passport.child.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {passport.child.age} лет • Уровень {passport.child.level} • Наставник: {passport.persona?.name}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--green)' }}>{passport.points_balance} GP</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>доступно из {passport.total_points}</div>
            </div>
          </div>

          <div className="grid-4" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-icon green">✅</div>
              <div>
                <div className="stat-value">{passport.approved_missions}</div>
                <div className="stat-label">Добрых дел</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red">🔥</div>
              <div>
                <div className="stat-value">{passport.streak_days}</div>
                <div className="stat-label">Дней подряд</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">🏆</div>
              <div>
                <div className="stat-value">{passport.achievements_count}</div>
                <div className="stat-label">Достижений</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon amber">📖</div>
              <div>
                <div className="stat-value">{passport.diary_entries_count}</div>
                <div className="stat-label">Записей дневника</div>
              </div>
            </div>
          </div>

          {Object.keys(passport.by_category).length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <h3 className="card-title" style={{ marginBottom: 12 }}>Дела по направлениям</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(passport.by_category).map(([name, count]) => (
                  <span key={name} className="badge" style={{ background: 'var(--green-light)', color: 'var(--green-dark)', padding: '6px 14px' }}>
                    {name}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}

          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>📜 Сертификаты</h2>
          {passport.certificates.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              Сертификатов пока нет — выполняй задания, и они появятся автоматически
            </div>
          ) : (
            <div className="grid-auto">
              {passport.certificates.map(cert => (
                <div key={cert.id} className="achievement-card">
                  <div className="achievement-icon">{cert.icon || '📜'}</div>
                  <div className="achievement-title">{cert.title}</div>
                  <div className="achievement-desc">{cert.description}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Выдан {new Date(cert.issued_at).toLocaleDateString('ru')}
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleDownload(cert)}
                    disabled={downloading === cert.id}
                  >
                    {downloading === cert.id
                      ? <Loader2 size={14} className="spin-icon" />
                      : <Download size={14} />}
                    Скачать PDF
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

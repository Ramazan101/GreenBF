import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Clock, Copy, Flame, RefreshCw, Share2, Star, Unlink, Users } from 'lucide-react';
import { disconnectChildLink, getChildInvites, getChildren } from '../api';
import { getChildJoinLink } from '../config/appMode';

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatRemaining(value) {
  if (!value) return 'Код действует 3 дня';
  const ms = new Date(value).getTime() - Date.now();
  if (ms <= 0) return 'Код обновится при следующем открытии';
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  if (days >= 3) return 'Код действует 3 дня';
  if (days === 1) return 'Код действует 1 день';
  return `Код действует ${days} дня`;
}

export default function ConnectChild() {
  const [children, setChildren] = useState([]);
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const inviteLink = useMemo(() => (invite ? getChildJoinLink(invite.code) : ''), [invite]);

  useEffect(() => {
    let alive = true;
    Promise.all([getChildren(), getChildInvites()])
      .then(([childrenRes, invitesRes]) => {
        if (!alive) return;
        setChildren(childrenRes.data.results || childrenRes.data);
        setInvite((invitesRes.data.results || invitesRes.data)[0] || null);
      })
      .catch(() => toast.error('Не удалось загрузить код'))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const [childrenRes, invitesRes] = await Promise.all([getChildren(), getChildInvites()]);
      setChildren(childrenRes.data.results || childrenRes.data);
      setInvite((invitesRes.data.results || invitesRes.data)[0] || null);
    } catch {
      toast.error('Не удалось загрузить код');
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (value, successText) => {
    await navigator.clipboard.writeText(value);
    toast.success(successText);
  };

  const copyCode = async () => {
    if (!invite) return;
    try {
      await copyText(invite.code, 'Код скопирован');
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      toast.error('Не удалось скопировать код');
    }
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    try {
      await copyText(inviteLink, 'Ссылка скопирована');
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1800);
    } catch {
      toast.error('Не удалось скопировать ссылку');
    }
  };

  const shareInvite = async () => {
    if (!invite) return;
    const text = `Код подключения Pingo: ${invite.code}. Код действует 3 дня.`;
    if (!navigator.share) {
      await copyText(`${text} ${inviteLink}`, 'Сообщение скопировано');
      return;
    }
    try {
      await navigator.share({
        title: 'Pingo',
        text,
        url: inviteLink,
      });
    } catch {
      // Native share was cancelled.
    }
  };

  const handleDisconnect = async (child) => {
    if (!confirm(`Отвязать ребёнка «${child.name}»?`)) return;
    try {
      await disconnectChildLink(child.id);
      toast.success('Ребёнок отвязан');
      setChildren(prev => prev.filter(c => c.id !== child.id));
    } catch {
      toast.error('Ошибка при отвязке');
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header location-header">
        <div>
          <h1 className="page-title">Пригласить ребёнка</h1>
          <p className="page-subtitle">Код создаётся сам и автоматически меняется каждые 3 дня</p>
        </div>
        <button className="btn btn-secondary" onClick={refresh}>
          <RefreshCw size={16} /> Обновить
        </button>
      </div>

      <div className="invite-main-card" style={{ marginBottom: 28 }}>
        <div className="invite-main-header">
          <div>
            <h2>Пригласите детей в ваш круг</h2>
            <p>Ребёнок открывает Pingo и вводит этот код или переходит по ссылке.</p>
          </div>
          <Users size={28} />
        </div>

        {invite ? (
          <>
            <div className="family-code-box">
              <div className="family-code">{invite.code}</div>
              <div className="family-code-note">
                <Clock size={16} /> {formatRemaining(invite.expires_at)}
              </div>
            </div>
            <div className="invite-actions wide">
              <button className="btn btn-secondary" onClick={copyCode}>
                <Copy size={16} /> {copiedCode ? 'Скопировано' : 'Копировать код'}
              </button>
              <button className="btn btn-secondary" onClick={copyLink}>
                <Copy size={16} /> {copiedLink ? 'Ссылка скопирована' : 'Копировать ссылку'}
              </button>
              <button className="btn btn-primary" onClick={shareInvite}>
                <Share2 size={16} /> Отправить код
              </button>
            </div>
            <div className="invite-meta">
              <span>Код обновится: {formatDate(invite.expires_at)}</span>
              <span className="invite-link">{inviteLink}</span>
            </div>
          </>
        ) : (
          <div className="empty-state compact">
            <p className="empty-title">Код будет создан автоматически</p>
            <button className="btn btn-primary" onClick={refresh}>Обновить</button>
          </div>
        )}
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Подключённые дети</h2>
      {children.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👨‍👩‍👧</div>
          <p className="empty-title">Пока нет подключённых детей</p>
        </div>
      ) : (
        <div className="grid-auto">
          {children.map(child => (
            <div key={child.id} className="child-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="child-avatar">{child.name[0]}</div>
                <button className="btn btn-sm btn-danger" onClick={() => handleDisconnect(child)} title="Отвязать">
                  <Unlink size={14} />
                </button>
              </div>
              <div className="child-name">{child.name}</div>
              <div className="child-age">{child.age} лет</div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)' }}>
                  <Star size={14} color="#d97706" fill="#d97706" /> {child.total_points}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)' }}>
                  <Flame size={14} color="#ef4444" /> {child.streak_days} дней
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

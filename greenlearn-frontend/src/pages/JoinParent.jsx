import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { KeyRound, Link2, ShieldCheck } from 'lucide-react';
import { joinParentByCode, loginChildByCode } from '../api';
import { useAuth } from '../context/AuthContext';
import { clearPendingInviteCode, savePendingInviteCode } from '../config/pendingInvite';
import { APP_TARGET } from '../config/appMode';

function cleanCode(value) {
  const compact = (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  return compact.length > 3 ? `${compact.slice(0, 3)}-${compact.slice(3)}` : compact;
}

function compactCode(value) {
  return (value || '').replace(/[^A-Z0-9]/gi, '');
}

export default function JoinParent() {
  const [searchParams] = useSearchParams();
  const codeFromLink = useMemo(() => cleanCode(searchParams.get('code')), [searchParams]);
  const [manualCode, setManualCode] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [joinError, setJoinError] = useState({ code: '', message: '' });
  const attemptedCode = useRef('');
  const { user, loading, refreshUser, signIn } = useAuth();
  const navigate = useNavigate();

  const connectWithCode = useCallback(async (rawCode, manual = false) => {
    const code = cleanCode(rawCode);
    if (compactCode(code).length !== 6) {
      setJoinError({ code: code || 'manual', message: 'Введите 6 символов кода' });
      return;
    }

    if (manual) {
      setManualSubmitting(true);
      setJoinError({ code: '', message: '' });
    }

    try {
      if (user?.role === 'parent') {
        setJoinError({ code, message: 'Эта ссылка работает только в детском приложении Pingo' });
        return;
      }

      if (user?.role === 'child') {
        const { data } = await joinParentByCode(code);
        toast.success(data.detail || 'Родитель подключён');
        clearPendingInviteCode();
        await refreshUser();
        navigate('/', { replace: true });
        return;
      }

      const { data } = await loginChildByCode(code);
      signIn({ access: data.access, refresh: data.refresh }, data.user);
      clearPendingInviteCode();
      toast.success(data.detail || 'Профиль ребёнка открыт');
      navigate('/', { replace: true });
    } catch (err) {
      const message = err.response?.data?.code || err.response?.data?.detail || 'Не удалось подключиться';
      setJoinError({ code, message });
      toast.error(message);
    } finally {
      if (manual) setManualSubmitting(false);
    }
  }, [navigate, refreshUser, signIn, user]);

  useEffect(() => {
    if (codeFromLink) savePendingInviteCode(codeFromLink);
  }, [codeFromLink]);

  useEffect(() => {
    if (!codeFromLink || loading || user?.role === 'parent' || attemptedCode.current === codeFromLink) return;
    attemptedCode.current = codeFromLink;
    connectWithCode(codeFromLink);
  }, [codeFromLink, connectWithCode, loading, user?.role]);

  if (APP_TARGET === 'parent') return <Navigate to="/" replace />;

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const activeJoinError = joinError.code === codeFromLink ? joinError.message : '';

  if (user?.role === 'parent') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">Pingo</div>
          <p className="auth-subtitle">Эта ссылка работает только для ребёнка. Откройте её в детском приложении.</p>
        </div>
      </div>
    );
  }

  if (codeFromLink && !activeJoinError) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <Link2 size={28} />
            Pingo
          </div>
          <p className="auth-subtitle">Открываем детский профиль по коду родителя</p>
          <div className="connect-code invite-code" style={{ marginBottom: 18 }}>{codeFromLink}</div>
          <div className="loading-center" style={{ padding: 20 }}><div className="spinner" /></div>
        </div>
      </div>
    );
  }

  const manualError = codeFromLink
    ? (joinError.code === 'manual' ? joinError.message : '')
    : joinError.message;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <ShieldCheck size={28} />
          Pingo
        </div>
        <p className="auth-subtitle">
          {activeJoinError || 'Введи код, который родитель создал в Find My Kids'}
        </p>
        {codeFromLink && <div className="connect-code invite-code" style={{ marginBottom: 18 }}>{codeFromLink}</div>}

        <form onSubmit={(e) => { e.preventDefault(); connectWithCode(manualCode || codeFromLink, true); }}>
          <div className="form-group">
            <label className="form-label">Код подключения</label>
            <input
              className="form-input"
              type="text"
              inputMode="text"
              maxLength={7}
              placeholder={codeFromLink || 'RAN-EH8'}
              style={{ letterSpacing: '0.12em', textAlign: 'center', fontSize: 22, fontWeight: 700, textTransform: 'uppercase' }}
              value={manualCode}
              onChange={e => setManualCode(cleanCode(e.target.value))}
            />
            {manualError && <div className="field-error" style={{ display: 'block' }}>{manualError}</div>}
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={manualSubmitting}>
            <KeyRound size={16} /> {manualSubmitting ? 'Подключение...' : 'Войти в мой профиль'}
          </button>
        </form>
      </div>
    </div>
  );
}

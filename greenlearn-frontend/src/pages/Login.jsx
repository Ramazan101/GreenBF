import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Leaf } from 'lucide-react';
import { joinParentByCode, login } from '../api';
import { useAuth } from '../context/AuthContext';
import { getAppName, getAppSubtitle, getExpectedRole, isRoleAllowed } from '../config/appMode';
import { clearPendingInviteCode, getPendingInviteCode, savePendingInviteCode } from '../config/pendingInvite';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const expectedRole = getExpectedRole();
  const joinCode = (searchParams.get('join_code') || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 7);
  const inviteQuery = joinCode ? `?join_code=${joinCode}` : '';

  useEffect(() => {
    if (joinCode) savePendingInviteCode(joinCode);
  }, [joinCode]);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await login(form);
      if (!isRoleAllowed(data.user.role)) {
        const label = expectedRole === 'parent' ? 'родителя' : 'ребёнка';
        toast.error(`Этот порт только для аккаунта ${label}`);
        return;
      }
      signIn({ access: data.access, refresh: data.refresh }, data.user);
      const pendingCode = joinCode || getPendingInviteCode();
      if (pendingCode && data.user.role === 'child') {
        savePendingInviteCode(pendingCode);
        await joinParentByCode(pendingCode);
        clearPendingInviteCode();
      }
      toast.success('Добро пожаловать!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.code || err.response?.data?.detail || 'Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Leaf size={28} />
          {getAppName()}
        </div>
        <p className="auth-subtitle">Вход в {getAppSubtitle()}</p>

        <form onSubmit={handle}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="example@mail.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input
              className="form-input"
              type="password"
              placeholder="минимум 8 символов"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: 16 }}>
          <Link to="/forgot-password">Забыли пароль?</Link>
        </p>
        <p className="auth-footer">
          Нет аккаунта? <Link to={`/register${inviteQuery}`}>Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Baby, Leaf, Users } from 'lucide-react';
import { joinParentByCode, register } from '../api';
import { useAuth } from '../context/AuthContext';
import { APP_TARGET, getAppName, getAppSubtitle, getExpectedRole } from '../config/appMode';
import { clearPendingInviteCode, getPendingInviteCode, savePendingInviteCode } from '../config/pendingInvite';

export default function Register() {
  const forcedRole = getExpectedRole();
  const [role, setRole] = useState(forcedRole || 'parent');
  const [form, setForm] = useState({ email: '', username: '', gender: '', password: '', password2: '', age: 10 });
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const joinCode = (searchParams.get('join_code') || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 7);
  const inviteQuery = joinCode ? `?join_code=${joinCode}` : '';

  useEffect(() => {
    if (joinCode) savePendingInviteCode(joinCode);
  }, [joinCode]);

  const handle = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      toast.error('Пароли не совпадают');
      return;
    }
    if ((forcedRole || role) === 'parent' && !form.gender) {
      toast.error('Укажите пол');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        email: form.email,
        username: form.username,
        ...((forcedRole || role) === 'parent' && { gender: form.gender }),
        password: form.password,
        password2: form.password2,
        role: forcedRole || role,
        ...((forcedRole || role) === 'child' && { age: Number(form.age) }),
      };
      const { data } = await register(payload);
      signIn({ access: data.access, refresh: data.refresh }, data.user);
      const pendingCode = joinCode || getPendingInviteCode();
      if (pendingCode && data.user.role === 'child') {
        savePendingInviteCode(pendingCode);
        await joinParentByCode(pendingCode);
        clearPendingInviteCode();
      }
      toast.success('Аккаунт создан!');
      navigate('/');
    } catch (err) {
      const errors = err.response?.data;
      const msg = errors
        ? Object.values(errors).flat().join(', ')
        : 'Ошибка регистрации';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const f = (field) => ({
    value: form[field],
    onChange: e => setForm({ ...form, [field]: e.target.value }),
  });

  const activeRole = forcedRole || role;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Leaf size={28} />
          {getAppName()}
        </div>
        <p className="auth-subtitle">Регистрация в {getAppSubtitle()}</p>

        {APP_TARGET === 'all' ? (
          <div className="role-picker">
            <button
              type="button"
              className={`role-option ${role === 'parent' ? 'active' : ''}`}
              onClick={() => setRole('parent')}
            >
              <Users size={22} />
              <span>Родитель</span>
            </button>
            <button
              type="button"
              className={`role-option ${role === 'child' ? 'active' : ''}`}
              onClick={() => setRole('child')}
            >
              <Baby size={22} />
              <span>Ребёнок</span>
            </button>
          </div>
        ) : (
          <div className="role-picker">
            <div className="role-option active">
              {activeRole === 'parent' ? <Users size={22} /> : <Baby size={22} />}
              <span>{activeRole === 'parent' ? 'Родитель' : 'Ребёнок'}</span>
            </div>
          </div>
        )}

        <form onSubmit={handle}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="example@mail.com" {...f('email')} required />
          </div>
          <div className="form-group">
            <label className="form-label">{activeRole === 'child' ? 'Имя ребёнка' : 'Имя родителя'}</label>
            <input className="form-input" type="text" placeholder="Ваше имя" {...f('username')} required />
          </div>
          {activeRole === 'parent' && (
            <div className="form-group">
              <label className="form-label">Пол</label>
              <select className="form-select" {...f('gender')} required>
                <option value="" disabled>Выберите пол</option>
                <option value="female">Женский</option>
                <option value="male">Мужской</option>
                <option value="other">Другое</option>
              </select>
            </div>
          )}
          {activeRole === 'child' && (
            <div className="form-group">
              <label className="form-label">Возраст</label>
              <input className="form-input" type="number" min={2} max={17} {...f('age')} required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input className="form-input" type="password" placeholder="минимум 8 символов" {...f('password')} required minLength={8} />
          </div>
          <div className="form-group">
            <label className="form-label">Повторите пароль</label>
            <input className="form-input" type="password" placeholder="повторите пароль" {...f('password2')} required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Создание...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="auth-footer">
          Уже есть аккаунт? <Link to={`/login${inviteQuery}`}>Войти</Link>
        </p>
      </div>
    </div>
  );
}

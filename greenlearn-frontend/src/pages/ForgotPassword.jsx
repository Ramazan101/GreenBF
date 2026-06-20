import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Leaf, ArrowLeft } from 'lucide-react';
import { requestPasswordReset, verifyResetCode } from '../api';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1 — ввод email, 2 — код и новый пароль
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    reset_code: '',
    new_password: '',
    confirm_password: '',
  });
  const navigate = useNavigate();

  const f = (field) => ({
    value: form[field],
    onChange: e => setForm({ ...form, [field]: e.target.value }),
  });

  // Шаг 1 — отправить код на email
  const requestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestPasswordReset(form.email.trim());
      toast.success('Код отправлен на вашу почту 📧');
      setStep(2);
    } catch (err) {
      const data = err.response?.data;
      const msg = data
        ? (data.email?.[0] || data.detail || Object.values(data).flat().join(', '))
        : 'Не удалось отправить код. Попробуйте позже.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Шаг 2 — подтвердить код и задать новый пароль
  const resetPassword = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) {
      toast.error('Пароли не совпадают');
      return;
    }
    setLoading(true);
    try {
      await verifyResetCode({
        email: form.email.trim(),
        reset_code: form.reset_code.trim(),
        new_password: form.new_password,
        confirm_password: form.confirm_password,
      });
      toast.success('Пароль изменён! Войдите с новым паролем');
      navigate('/login');
    } catch (err) {
      const data = err.response?.data;
      const msg = data
        ? (data.reset_code?.[0] || data.confirm_password?.[0] || data.new_password?.[0] || data.detail || Object.values(data).flat().join(', '))
        : 'Не удалось сбросить пароль';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Leaf size={28} />
          GreenLearn
        </div>
        <p className="auth-subtitle">
          {step === 1
            ? 'Восстановление пароля — введите email'
            : 'Введите код из письма и новый пароль'}
        </p>

        {step === 1 ? (
          <form onSubmit={requestCode}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="example@mail.com"
                {...f('email')}
                required
                autoFocus
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Отправка...' : 'Получить код'}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword}>
            <div className="form-group">
              <label className="form-label">Код из письма</label>
              <input
                className="form-input"
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="4-значный код"
                style={{ letterSpacing: '0.4em', textAlign: 'center', fontSize: 20, fontWeight: 700 }}
                {...f('reset_code')}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Новый пароль</label>
              <input
                className="form-input"
                type="password"
                placeholder="Минимум 8 символов"
                {...f('new_password')}
                required
                minLength={8}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Повторите пароль</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                {...f('confirm_password')}
                required
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Сохранение...' : 'Сменить пароль'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Отправить код повторно
            </button>
          </form>
        )}

        <p className="auth-footer">
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={14} /> Вернуться ко входу
          </Link>
        </p>
      </div>
    </div>
  );
}

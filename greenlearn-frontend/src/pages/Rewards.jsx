import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Gift, Star, Ticket } from 'lucide-react';
import { getRewards, redeemReward, getRedemptions } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Rewards() {
  const { user, refreshUser } = useAuth();
  const profile = user?.child_profile;
  const [rewards, setRewards] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);

  const loadAll = () => {
    Promise.all([getRewards(), getRedemptions()])
      .then(([rw, rd]) => {
        setRewards(rw.data.results || rw.data);
        setRedemptions(rd.data.results || rd.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, []);

  const balance = profile?.points_balance ?? 0;

  const handleRedeem = async (reward) => {
    setRedeeming(reward.id);
    try {
      const { data } = await redeemReward(reward.id);
      toast.success(`🎉 Получено! Код купона: ${data.code}`);
      refreshUser?.();
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Ошибка обмена');
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">🎁 Магазин наград</h1>
          <p className="page-subtitle">Обменивай GreenPoints на реальные награды</p>
        </div>
        <div className="balance-badge">
          <Star size={14} fill="#d97706" color="#d97706" /> {balance} GP
        </div>
      </div>

      <div className="grid-auto" style={{ marginBottom: 32 }}>
        {rewards.map(r => {
          const affordable = balance >= r.cost_points;
          const outOfStock = r.stock !== null && r.stock <= 0;
          return (
            <div key={r.id} className="mission-card reward-card">
              <div className="reward-icon">{r.icon || '🎁'}</div>
              <div className="mission-title">{r.title}</div>
              {r.partner && <div className="reward-partner">{r.partner}</div>}
              <div className="mission-desc">{r.description}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <span className="points-badge">
                  <Star size={14} fill="#d97706" /> {r.cost_points} GP
                </span>
                {r.stock !== null && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Осталось: {r.stock}
                  </span>
                )}
              </div>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}
                disabled={!affordable || outOfStock || redeeming === r.id}
                onClick={() => handleRedeem(r)}
              >
                <Gift size={14} />
                {outOfStock ? 'Закончилась' : redeeming === r.id ? 'Обмен...' : affordable ? 'Получить' : `Нужно ещё ${r.cost_points - balance} GP`}
              </button>
            </div>
          );
        })}
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Ticket size={18} color="var(--green)" /> Мои купоны
      </h2>
      {redemptions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          Пока нет полученных наград
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Награда</th>
                  <th>Код купона</th>
                  <th>Баллы</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map(r => (
                  <tr key={r.id}>
                    <td>{r.reward?.icon} {r.reward?.title}</td>
                    <td><span className="coupon-code">{r.code}</span></td>
                    <td style={{ color: 'var(--danger)', fontWeight: 600 }}>−{r.points_spent}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {new Date(r.created_at).toLocaleDateString('ru')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

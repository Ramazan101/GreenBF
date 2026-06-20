import { useState } from 'react';
import toast from 'react-hot-toast';
import { universityGroups, universitySummary, walletPackages, walletTransactions } from '../data/platformMock';
import { GpExplainer, PageHeader, SimpleTable } from '../components/PlatformComponents';

export default function UniversityWallet() {
  const [balance, setBalance] = useState(universitySummary.balance);
  const [group, setGroup] = useState(universityGroups[0].name);
  const [amount, setAmount] = useState(2000);

  const buy = (points) => {
    setBalance(prev => prev + points);
    toast.success(`ВУЗ купил ${points.toLocaleString('ru-RU')} GP`);
  };

  const distribute = () => {
    const value = Number(amount);
    if (!value || value <= 0 || value > balance) return toast.error('Проверьте сумму');
    setBalance(prev => prev - value);
    toast.success(`${value} GP распределено группе ${group}`);
  };

  return (
    <div>
      <PageHeader title="University Wallet" subtitle="Покупка пакетов GP, распределение по группам и история транзакций." />
      <GpExplainer />

      <div className="grid-2" style={{ marginBottom: 24, alignItems: 'start' }}>
        <div className="card">
          <h2 className="card-title">Баланс ВУЗа</h2>
          <div className="stat-value" style={{ color: 'var(--green)', margin: '12px 0 16px' }}>{balance.toLocaleString('ru-RU')} GP</div>
          <div className="grid-3">
            {walletPackages.map(pkg => (
              <div className="platform-card" key={pkg.name}>
                <h3>{pkg.name.replace('School', 'University')}</h3>
                <p>{pkg.points.toLocaleString('ru-RU')} GP · {pkg.price}</p>
                <button className="btn btn-primary btn-sm" onClick={() => buy(pkg.points)}>Купить</button>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Распределить группе</h2>
          <div className="form-group">
            <label className="form-label">Группа</label>
            <select className="form-select" value={group} onChange={e => setGroup(e.target.value)}>
              {universityGroups.map(item => <option key={item.name}>{item.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Сумма GP</label>
            <input className="form-input" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={distribute}>Распределить</button>
        </div>
      </div>

      <SimpleTable
        columns={[
          { key: 'date', label: 'Дата' },
          { key: 'type', label: 'Тип' },
          { key: 'description', label: 'Описание' },
          { key: 'amount', label: 'GP' },
        ]}
        rows={walletTransactions}
      />
    </div>
  );
}

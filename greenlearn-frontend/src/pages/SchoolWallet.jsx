import { useState } from 'react';
import toast from 'react-hot-toast';
import { schoolClasses, schoolSummary, walletPackages, walletTransactions } from '../data/platformMock';
import { GpExplainer, PageHeader, SimpleTable } from '../components/PlatformComponents';

export default function SchoolWallet() {
  const [balance, setBalance] = useState(schoolSummary.balance);
  const [targetClass, setTargetClass] = useState(schoolClasses[0].name);
  const [amount, setAmount] = useState(1000);

  const buy = (points) => {
    setBalance(prev => prev + points);
    toast.success(`Куплен пакет ${points.toLocaleString('ru-RU')} GP`);
  };

  const distribute = () => {
    const value = Number(amount);
    if (!value || value <= 0 || value > balance) {
      toast.error('Проверьте сумму распределения');
      return;
    }
    setBalance(prev => prev - value);
    toast.success(`${value} GP распределено классу ${targetClass}`);
  };

  return (
    <div>
      <PageHeader
        title="School Wallet"
        subtitle="Школа покупает GreenPoints и распределяет их между классами."
      />
      <GpExplainer />

      <div className="grid-2" style={{ marginBottom: 24, alignItems: 'start' }}>
        <div className="card">
          <div className="card-header"><h2 className="card-title">Общий баланс школы</h2></div>
          <div className="stat-value" style={{ color: 'var(--green)', marginBottom: 16 }}>{balance.toLocaleString('ru-RU')} GP</div>
          <div className="grid-3">
            {walletPackages.map(pkg => (
              <div className="platform-card" key={pkg.name}>
                <h3>{pkg.name}</h3>
                <p>{pkg.points.toLocaleString('ru-RU')} GP · {pkg.price}</p>
                <button className="btn btn-primary btn-sm" onClick={() => buy(pkg.points)}>Купить пакет</button>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2 className="card-title">Распределить классу</h2></div>
          <div className="form-group">
            <label className="form-label">Класс</label>
            <select className="form-select" value={targetClass} onChange={e => setTargetClass(e.target.value)}>
              {schoolClasses.map(item => <option key={item.name}>{item.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Сумма GP</label>
            <input className="form-input" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={distribute}>Распределить классу</button>
        </div>
      </div>

      <SimpleTable
        columns={[
          { key: 'date', label: 'Дата' },
          { key: 'type', label: 'Тип' },
          { key: 'description', label: 'Описание' },
          { key: 'amount', label: 'GP', render: row => <strong style={{ color: row.amount > 0 ? 'var(--green)' : 'var(--danger)' }}>{row.amount > 0 ? '+' : ''}{row.amount}</strong> },
        ]}
        rows={walletTransactions}
      />
    </div>
  );
}

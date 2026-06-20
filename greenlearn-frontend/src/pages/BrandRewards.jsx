import toast from 'react-hot-toast';
import { brandRewards } from '../data/platformMock';
import { PageHeader, SimpleTable, StatusBadge } from '../components/PlatformComponents';

export default function BrandRewards() {
  return (
    <div>
      <PageHeader
        title="Купоны и награды бренда"
        subtitle="Стоимость в GP, лимит, количество получений и статус."
        actions={<button className="btn btn-primary" onClick={() => toast.success('Купон создан в демо')}>Добавить купон</button>}
      />
      <SimpleTable
        columns={[
          { key: 'title', label: 'Купон' },
          { key: 'cost', label: 'Стоимость GP' },
          { key: 'limit', label: 'Лимит' },
          { key: 'claimed', label: 'Получено' },
          { key: 'status', label: 'Статус', render: row => <StatusBadge value={row.status} /> },
        ]}
        rows={brandRewards}
      />
    </div>
  );
}

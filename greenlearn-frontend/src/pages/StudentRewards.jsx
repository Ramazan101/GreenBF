import { brandRewards } from '../data/platformMock';
import { GpExplainer, PageHeader, SimpleTable, StatusBadge } from '../components/PlatformComponents';

export default function StudentRewards() {
  return (
    <div>
      <PageHeader title="Студенческие награды" subtitle="Купоны, образовательные скидки и партнёрские бонусы за волонтёрство." />
      <GpExplainer />
      <SimpleTable
        columns={[
          { key: 'title', label: 'Награда' },
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

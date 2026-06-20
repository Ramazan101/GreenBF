import toast from 'react-hot-toast';
import { schoolClasses } from '../data/platformMock';
import { PageHeader, SimpleTable } from '../components/PlatformComponents';

export default function SchoolClasses() {
  return (
    <div>
      <PageHeader
        title="Классы школы"
        subtitle="Классный руководитель, баланс GreenPoints, ученики и рейтинг класса внутри школы."
      />
      <SimpleTable
        columns={[
          { key: 'name', label: 'Класс', render: row => <strong>{row.name}</strong> },
          { key: 'teacher', label: 'Классный руководитель' },
          { key: 'balance', label: 'Баланс GP' },
          { key: 'students', label: 'Ученики' },
          { key: 'rank', label: 'Рейтинг' },
          {
            key: 'actions',
            label: 'Действия',
            render: row => <button className="btn btn-sm btn-primary" onClick={() => toast.success(`GreenPoints выданы классу ${row.name}`)}>Выдать GP классу</button>,
          },
        ]}
        rows={schoolClasses}
      />
    </div>
  );
}

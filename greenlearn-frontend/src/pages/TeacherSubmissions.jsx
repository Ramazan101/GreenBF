import { useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle } from 'lucide-react';
import { teacherSubmissions } from '../data/platformMock';
import { MockApiNotice, PageHeader, SimpleTable, StatusBadge } from '../components/PlatformComponents';

export default function TeacherSubmissions() {
  const [items, setItems] = useState(teacherSubmissions);

  const setStatus = (index, status) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, status } : item));
    toast.success(status === 'approved' ? 'Отчёт одобрен, баллы начислены' : 'Отчёт отклонён, причина отправлена ученику');
  };

  return (
    <div>
      <PageHeader
        title="Проверка отчётов"
        subtitle="Учитель видит фото, AI feedback, статус и может approve/reject."
      />
      <MockApiNotice />
      <SimpleTable
        columns={[
          { key: 'student', label: 'Ученик' },
          { key: 'mission', label: 'Миссия' },
          { key: 'photo', label: 'Фото', render: () => <div className="img-thumb" style={{ display: 'grid', placeItems: 'center' }}>📷</div> },
          { key: 'feedback', label: 'AI feedback' },
          { key: 'status', label: 'Статус', render: row => <StatusBadge value={row.status} /> },
          { key: 'points', label: 'GP' },
          {
            key: 'actions',
            label: 'Действия',
            render: (_, index) => (
              <div className="actions">
                <button className="btn btn-sm btn-success" onClick={() => setStatus(index, 'approved')}><CheckCircle size={14} /></button>
                <button className="btn btn-sm btn-danger" onClick={() => setStatus(index, 'rejected')}><XCircle size={14} /></button>
              </div>
            ),
          },
        ]}
        rows={items}
      />
    </div>
  );
}

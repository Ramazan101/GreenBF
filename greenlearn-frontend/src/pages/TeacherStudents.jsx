import toast from 'react-hot-toast';
import { teacherStudents } from '../data/platformMock';
import { PageHeader, SimpleTable } from '../components/PlatformComponents';

export default function TeacherStudents() {
  return (
    <div>
      <PageHeader
        title="Ученики класса"
        subtitle="Баллы, streak, уровень и выполненные миссии каждого ученика."
      />
      <SimpleTable
        columns={[
          { key: 'name', label: 'Ученик', render: row => <strong>{row.name}</strong> },
          { key: 'points', label: 'GreenPoints' },
          { key: 'streak', label: 'Streak' },
          { key: 'level', label: 'Уровень' },
          { key: 'missions', label: 'Выполненные миссии' },
          {
            key: 'actions',
            label: 'Действия',
            render: row => (
              <button className="btn btn-sm btn-secondary" onClick={() => toast.success(`Профиль ${row.name} открыт в демо`)}>
                Посмотреть профиль
              </button>
            ),
          },
        ]}
        rows={teacherStudents}
      />
    </div>
  );
}

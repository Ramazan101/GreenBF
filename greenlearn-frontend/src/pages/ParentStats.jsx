import { useEffect, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart2, ClipboardList, Star, Users } from 'lucide-react';
import { getFamilyStats } from '../api';
import { PageHeader, StatCard } from '../components/PlatformComponents';

const fallback = {
  total_children: 3,
  total_points: 2840,
  total_submissions: 48,
  approved_submissions: 36,
  total_achievements: 11,
  children: [
    { child: { name: 'Айгерим' }, total_points: 1240, approved_submissions: 14 },
    { child: { name: 'Бекзат' }, total_points: 980, approved_submissions: 12 },
    { child: { name: 'Айжан' }, total_points: 620, approved_submissions: 10 },
  ],
};

export default function ParentStats() {
  const [stats, setStats] = useState(fallback);

  useEffect(() => {
    getFamilyStats().then(r => setStats(r.data)).catch(() => setStats(fallback));
  }, []);

  const chart = (stats.children || []).map(item => ({
    name: item.child?.name,
    points: item.total_points,
    missions: item.approved_submissions,
  }));

  return (
    <div>
      <PageHeader title="Статистика семьи" subtitle="Прогресс детей, миссии, GreenPoints и достижения." />
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon={<Users size={22} />} value={stats.total_children} label="Детей" tone="blue" />
        <StatCard icon={<Star size={22} />} value={stats.total_points} label="GreenPoints" tone="amber" />
        <StatCard icon={<ClipboardList size={22} />} value={stats.approved_submissions} label="Одобрено" />
        <StatCard icon={<BarChart2 size={22} />} value={stats.total_achievements} label="Достижения" tone="red" />
      </div>
      <div className="card">
        <h2 className="card-title" style={{ marginBottom: 16 }}>GreenPoints по детям</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chart}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="points" fill="#16a34a" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

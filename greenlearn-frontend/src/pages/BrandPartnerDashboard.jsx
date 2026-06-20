import { Gift, Star, Users } from 'lucide-react';
import { brandSummary } from '../data/platformMock';
import { PageHeader, StatCard } from '../components/PlatformComponents';

export default function BrandPartnerDashboard() {
  return (
    <div>
      <PageHeader
        title={`Бренд-партнёр: ${brandSummary.brand}`}
        subtitle="Кабинет партнёра: миссии, купоны, охват и социальный impact."
      />
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon={<Star size={22} />} value={brandSummary.activeMissions} label="Активные миссии" tone="amber" />
        <StatCard icon={<Users size={22} />} value={brandSummary.completed} label="Детей выполнили" />
        <StatCard icon={<Gift size={22} />} value={brandSummary.couponsIssued} label="Купонов выдано" tone="blue" />
        <StatCard icon={<Users size={22} />} value={brandSummary.reach} label="Охват" tone="red" />
      </div>
      <div className="platform-card">
        <span className="platform-eyebrow">Social impact</span>
        <h3>{brandSummary.impact}</h3>
        <p>Бренд получает рекламу, новых клиентов и сильный социальный имидж, а дети получают реальные награды за полезные действия.</p>
      </div>
    </div>
  );
}

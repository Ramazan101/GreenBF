import { ecoTerritories, platformStats } from '../data/platformMock';
import { PageHeader, StatusBadge, StatCard } from '../components/PlatformComponents';
import { Leaf, MapPin, Recycle, TreePine } from 'lucide-react';

export default function EcoMap() {
  return (
    <div>
      <PageHeader
        title="Эко-карта Кыргызстана"
        subtitle="Mock-карта территорий: школы, районы, места уборки, посадки деревьев и субботники. Позже здесь можно подключить Leaflet или MapLibre."
      />

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon={<MapPin size={22} />} value={platformStats.cleanZones} label="Территорий" tone="blue" />
        <StatCard icon={<TreePine size={22} />} value={platformStats.trees} label="Деревьев" />
        <StatCard icon={<Recycle size={22} />} value={`${Math.round(platformStats.trashKg / 1000)} т`} label="Мусора убрано" tone="amber" />
        <StatCard icon={<Leaf size={22} />} value={`${Math.round(platformStats.co2Kg / 1000)} т`} label="CO2 условно" />
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="eco-map-mock">
          {ecoTerritories.map(item => (
            <div className="eco-map-pin" key={item.title}>
              <b>{item.title}</b>
              <small>{item.district}</small>
              <small>{item.impact}</small>
              <div style={{ marginTop: 8 }}><StatusBadge value={item.status} /></div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-header"><h2 className="card-title">Территории</h2></div>
          <div className="platform-list">
            {ecoTerritories.map(item => (
              <div className="platform-list-item" key={item.title}>
                <strong><Leaf size={14} /></strong>
                <span>
                  <b>{item.title}</b><br />
                  <span style={{ color: 'var(--text-muted)' }}>{item.impact}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

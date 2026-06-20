import { Award, BookOpen, Leaf, Star } from 'lucide-react';
import { PageHeader, StatCard } from '../components/PlatformComponents';

export default function StudentPassport() {
  return (
    <div>
      <PageHeader title="Student Eco Passport" subtitle="Портфолио студента: волонтёрские часы, сертификаты, эко-проекты и наставничество." />
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon={<Star size={22} />} value="3 420" label="GreenPoints" tone="amber" />
        <StatCard icon={<Leaf size={22} />} value="14" label="Эко-проектов" />
        <StatCard icon={<BookOpen size={22} />} value="6" label="Мастер-классов" tone="blue" />
        <StatCard icon={<Award size={22} />} value="3" label="Сертификата" tone="red" />
      </div>
      <div className="platform-card">
        <span className="platform-eyebrow">Сертификат</span>
        <h3>Волонтёр GreenLearnAI</h3>
        <p>Подтверждает участие в эко-акциях, помощи школьникам и общественных проектах. Позже здесь можно подключить PDF-сертификаты как в детском Eco Passport.</p>
      </div>
    </div>
  );
}

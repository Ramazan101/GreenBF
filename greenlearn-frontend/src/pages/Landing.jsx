import { Link } from 'react-router-dom';
import { Leaf, LogIn, PlayCircle, Rocket } from 'lucide-react';
import { audience, platformStats, problems, solutionSteps } from '../data/platformMock';
import { InfoCard, MetricCard } from '../components/PlatformComponents';

export default function Landing() {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-brand"><Leaf size={28} /> GreenLearnAI</div>
        <div className="platform-actions">
          <Link to="/login" className="btn btn-secondary"><LogIn size={16} /> Войти</Link>
          <Link to="/" className="btn btn-primary"><Rocket size={16} /> Начать</Link>
        </div>
      </nav>

      <main className="landing-main">
        <section className="platform-hero">
          <span className="platform-eyebrow" style={{ color: '#dcfce7' }}>Кыргызстан через 10 лет</span>
          <h1>Учись, делай добро, меняй мир.</h1>
          <p>
            Представьте Кыргызстан через 10 лет. Каждая школа отвечает за свой район.
            Каждый класс следит за своей улицей. Каждый ребёнок знает: если я посажу дерево,
            уберу мусор, помогу родителям или сделаю доброе дело — это мой вклад в будущее страны.
          </p>
          <p style={{ marginTop: 14 }}>
            GreenLearnAI — это AI-платформа, которая превращает обучение, экологию и добрые дела
            в игру с реальными наградами.
          </p>
          <div className="platform-hero-actions">
            <Link to="/" className="btn btn-primary"><Rocket size={16} /> Начать</Link>
            <Link to="/login" className="btn btn-secondary"><LogIn size={16} /> Войти</Link>
            <Link to="/school-challenges" className="btn btn-secondary"><PlayCircle size={16} /> Посмотреть демо</Link>
          </div>
        </section>

        <section className="platform-section">
          <div className="grid-4">
            <MetricCard label="Школы" value={platformStats.nationalSchools} note="готовы соревноваться" />
            <MetricCard label="Дети" value="24K" note="выполняют миссии" tone="blue" />
            <MetricCard label="GreenPoints" value="2.8M" note="за реальные дела" tone="amber" />
            <MetricCard label="Чистые зоны" value={platformStats.cleanZones} note="на эко-карте" />
          </div>
        </section>

        <section className="platform-section">
          <h2 className="platform-section-title">Проблемы, которые мы решаем</h2>
          <div className="grid-3">
            {problems.map((problem, index) => (
              <InfoCard key={problem} eyebrow={`Проблема ${index + 1}`} title={problem} text="GreenLearnAI переводит внимание ребёнка из бесконечного экрана в осознанное действие." />
            ))}
          </div>
        </section>

        <section className="platform-section">
          <h2 className="platform-section-title">Как GreenLearnAI работает</h2>
          <div className="platform-list">
            {solutionSteps.map((step, index) => (
              <div className="platform-list-item" key={step}>
                <strong>{index + 1}</strong>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="platform-section">
          <h2 className="platform-section-title">Для кого платформа</h2>
          <div className="grid-auto">
            {audience.map(item => <InfoCard key={item.title} title={item.title} text={item.text} />)}
          </div>
        </section>

        <section className="platform-section">
          <div className="platform-card" style={{ background: 'linear-gradient(135deg, #f0fdf4, #e0f2fe)' }}>
            <span className="platform-eyebrow">Почему это нужно Кыргызстану</span>
            <h3 style={{ fontSize: 28 }}>GreenLearnAI — это не просто приложение. Это национальная система воспитания экологичного поколения.</h3>
            <p>
              Каждая школа может отвечать за свою территорию, классы могут соревноваться,
              школы могут очищать районы, а эко-карта показывает общий вклад. Страна получает поколение,
              которое не загрязняет, а восстанавливает.
            </p>
          </div>
        </section>

        <section className="platform-section">
          <h2 className="platform-section-title">Монетизация</h2>
          <div className="grid-3">
            <InfoCard title="Родители" text="Покупают GreenPoints для домашних заданий и семейных миссий." />
            <InfoCard title="Школы и ВУЗы" text="Покупают пакеты GreenPoints и распределяют их между классами и группами." />
            <InfoCard title="Бренды" text="Размещают купоны, миссии и получают сильный социальный имидж." />
            <InfoCard title="Premium" text="Расширенная аналитика для родителей и образовательных организаций." />
            <InfoCard title="B2B кабинет" text="Школы видят классы, wallet, рейтинги, эко-карту и соревнования." />
            <InfoCard title="Партнёрские миссии" text="KFC, кинотеатры, книжные, кафе и спортзалы создают реальные награды." />
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        Чистая страна начинается не с законов. Она начинается с ребёнка, который однажды понял: я тоже отвечаю за этот мир.
      </footer>
    </div>
  );
}

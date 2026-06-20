import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { schoolChallenges } from '../data/platformMock';
import { PageHeader, ProgressBar } from '../components/PlatformComponents';

export default function SchoolChallenges() {
  return (
    <div>
      <PageHeader
        title="Green School Challenge"
        subtitle="GreenLearnAI превращает экологию в соревнование между школами. Сегодня класс убирает свой двор, завтра школа поднимается в рейтинге, а через месяц весь район становится чище."
      />
      <div className="grid-auto">
        {schoolChallenges.map(challenge => (
          <div className="platform-card challenge-card" key={challenge.id}>
            <span className="platform-eyebrow">До конца: {challenge.endsIn}</span>
            <h3>{challenge.title}</h3>
            <p>{challenge.description}</p>
            <div className="challenge-meta">
              <span>{challenge.dates}</span>
              <span>{challenge.schools} школ</span>
              <span>{challenge.prize}</span>
            </div>
            <ProgressBar value={challenge.progress} />
            <div className="platform-actions">
              <button className="btn btn-primary btn-sm" onClick={() => toast.success('Школа участвует в соревновании')}>Участвовать</button>
              <Link to={`/challenges/${challenge.id}`} className="btn btn-secondary btn-sm">Открыть</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { buildMissionSuggestion } from '../data/platformMock';
import { MockApiNotice, PageHeader } from '../components/PlatformComponents';

export default function AIMissionBuilder() {
  const [goal, setGoal] = useState('Хочу, чтобы ребёнок меньше сидел в телефоне');
  const [suggestion, setSuggestion] = useState(() => buildMissionSuggestion(goal));

  const generate = () => setSuggestion(buildMissionSuggestion(goal));

  return (
    <div>
      <PageHeader
        title="AI Mission Builder"
        subtitle="Учитель или родитель вводит цель, AI предлагает миссию, proof type, баллы и объяснение."
        actions={<button className="btn btn-primary" onClick={generate}><Sparkles size={16} /> Сгенерировать</button>}
      />
      <MockApiNotice />

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="form-group">
            <label className="form-label">Цель</label>
            <textarea
              className="form-textarea"
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="Например: нужно задание для 7 класса по экологии"
            />
          </div>
          <div className="platform-list">
            {[
              'Хочу, чтобы ребёнок меньше сидел в телефоне',
              'Нужно задание для 7 класса по экологии',
              'Хочу развить речь ребёнка',
              'Нужно задание на субботник',
            ].map(text => (
              <button key={text} className="btn btn-secondary btn-sm" onClick={() => { setGoal(text); setSuggestion(buildMissionSuggestion(text)); }}>
                {text}
              </button>
            ))}
          </div>
        </div>

        <div className="mission-builder-result">
          <span className="platform-eyebrow">AI предложение</span>
          <h2 style={{ marginBottom: 12 }}>{suggestion.title}</h2>
          <p style={{ marginBottom: 16 }}>{suggestion.description}</p>
          <div className="grid-2">
            <div><strong>Category</strong><br />{suggestion.category}</div>
            <div><strong>Points</strong><br />{suggestion.points} GP</div>
            <div><strong>Proof type</strong><br />{suggestion.proofType}</div>
            <div><strong>Deadline</strong><br />{suggestion.deadline}</div>
          </div>
          <p style={{ marginTop: 16 }}><strong>Почему это работает:</strong> {suggestion.explanation}</p>
        </div>
      </div>
    </div>
  );
}

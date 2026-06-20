import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Mic, Square, Loader2, Send, BookOpen } from 'lucide-react';
import { getDiaryEntries, createDiaryEntry } from '../api';

const SpeechRecognitionImpl =
  typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

export default function Diary() {
  const [entries, setEntries] = useState(null);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [voiceState, setVoiceState] = useState('idle');
  const recognitionRef = useRef(null);

  useEffect(() => {
    let active = true;
    getDiaryEntries()
      .then(r => { if (active) setEntries(r.data); })
      .catch(() => { if (active) setEntries([]); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    return () => recognitionRef.current?.abort?.();
  }, []);

  const toggleRecording = () => {
    if (!SpeechRecognitionImpl) {
      toast.error('Ваш браузер не поддерживает голосовой ввод');
      return;
    }
    if (voiceState === 'recording') {
      recognitionRef.current?.stop();
      return;
    }
    const rec = new SpeechRecognitionImpl();
    rec.lang = 'ru-RU';
    rec.interimResults = false;
    rec.continuous = true;

    rec.onresult = (e) => {
      const chunk = Array.from(e.results)
        .map(res => res[0].transcript)
        .join(' ')
        .trim();
      if (chunk) setText(prev => (prev ? prev + ' ' : '') + chunk);
    };
    rec.onerror = (e) => {
      setVoiceState('idle');
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        toast.error('Разрешите доступ к микрофону');
      } else if (e.error === 'no-speech') {
        toast('🎙️ Речь не распознана, попробуйте ещё раз');
      } else if (e.error !== 'aborted') {
        toast.error('Не удалось распознать речь');
      }
    };
    rec.onend = () => setVoiceState('idle');

    recognitionRef.current = rec;
    setVoiceState('recording');
    rec.start();
  };

  const save = async () => {
    const trimmed = text.trim();
    if (!trimmed) { toast.error('Запись пустая'); return; }
    recognitionRef.current?.stop();
    setSaving(true);
    try {
      const { data } = await createDiaryEntry(trimmed);
      setEntries(prev => [data, ...(prev || [])]);
      setText('');
      toast.success('📖 Запись сохранена!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const loading = entries === null;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📖 Голосовой дневник</h1>
        <p className="page-subtitle">Расскажи, что хорошего сделал сегодня — AI отметит твой прогресс</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <button
            className={`mic-btn ${voiceState}`}
            style={{ width: 52, height: 52 }}
            onClick={toggleRecording}
            disabled={saving}
            title={voiceState === 'recording' ? 'Остановить запись' : 'Записать голосом'}
          >
            {voiceState === 'recording'
              ? <Square size={18} fill="currentColor" />
              : <Mic size={22} />}
          </button>
          <div style={{ flex: 1 }}>
            <textarea
              className="form-textarea"
              style={{ minHeight: 70 }}
              placeholder={voiceState === 'recording' ? '🎙️ Говорите — текст появится здесь...' : 'Расскажи, что хорошего ты сделал сегодня...'}
              value={text}
              onChange={e => setText(e.target.value)}
            />
            {voiceState === 'recording' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 13, color: 'var(--danger)', fontWeight: 500 }}>
                <span className="rec-dot" /> Говорите... (нажмите квадрат, чтобы остановить)
              </div>
            )}
          </div>
          <button className="btn btn-primary" onClick={save} disabled={saving || !text.trim()}>
            {saving ? <Loader2 size={16} className="spin-icon" /> : <Send size={16} />}
            {saving ? 'Анализ...' : 'Сохранить'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : entries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌙</div>
          <p className="empty-title">Записей пока нет</p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Запиши первую — расскажи про сегодняшний день</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {entries.map(entry => (
            <div key={entry.id} className="card diary-entry">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BookOpen size={14} color="var(--green)" />
                  {new Date(entry.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{entry.word_count} слов</span>
              </div>
              <p style={{ fontSize: 14, marginBottom: 10 }}>{entry.text}</p>
              {entry.ai_feedback && (
                <div className="diary-feedback">
                  <span style={{ fontWeight: 600 }}>🤖 AI: </span>{entry.ai_feedback}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

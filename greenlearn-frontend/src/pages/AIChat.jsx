import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Send, Bot, Mic, Square, Loader2, Volume2, VolumeX, HeartHandshake } from 'lucide-react';
import { getChatHistory, sendChatMessage, sendVoiceMessage, getChildren, getPsychologistSpeech } from '../api';
import { useAuth } from '../context/AuthContext';

const SpeechRecognitionImpl =
  typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

const SOFT_RUSSIAN_VOICE_HINTS = [
  'dariya',
  'daria',
  'svetlana',
  'irina',
  'elena',
  'alyona',
  'alena',
  'tatyana',
  'tatiana',
  'oksana',
  'milena',
  'mariya',
  'maria',
  'katya',
  'victoria',
  'zira',
  'aria',
  'jenny',
  'sara',
  'samantha',
  'eva',
  'hazel',
  'google uk english female',
  'google русский',
  'microsoft russian',
];

const NATURAL_VOICE_HINTS = ['natural', 'neural', 'online', 'premium', 'female', 'жен'];
const ROUGH_VOICE_HINTS = ['pavel', 'dmitry', 'dmitrii', 'alexandr', 'alexander', 'yuri', 'male', 'муж'];

function getVoiceKey(voice) {
  return voice?.voiceURI || `${voice?.name || ''}-${voice?.lang || ''}`;
}

function isRussianVoice(voice) {
  const name = voice.name.toLowerCase();
  const lang = (voice.lang || '').toLowerCase();
  return lang.startsWith('ru') || name.includes('russian') || name.includes('рус');
}

function getRussianVoices(voices) {
  return voices.filter(isRussianVoice);
}

function scoreSoftRussianVoice(voice) {
  const name = voice.name.toLowerCase();
  const lang = (voice.lang || '').toLowerCase();
  let score = lang.startsWith('ru') ? 120 : 0;
  if (name.includes('russian') || name.includes('рус')) score += 40;
  if (voice.default) score -= 8;
  if (voice.localService) score += 4;
  NATURAL_VOICE_HINTS.forEach((hint, index) => {
    if (name.includes(hint)) score += 70 - (index * 4);
  });
  SOFT_RUSSIAN_VOICE_HINTS.forEach((hint, index) => {
    if (name.includes(hint)) score += 60 - index;
  });
  ROUGH_VOICE_HINTS.forEach((hint) => {
    if (name.includes(hint)) score -= 90;
  });
  return score;
}

function pickPsychologistVoice(voices, preferredVoiceKey = '') {
  if (!voices.length) return null;
  if (preferredVoiceKey) {
    const preferred = voices.find((voice) => getVoiceKey(voice) === preferredVoiceKey);
    if (preferred && !preferred.default) return preferred;
  }

  const nonDefaultVoices = voices.filter((voice) => !voice.default);
  const russianNonDefaultVoices = getRussianVoices(nonDefaultVoices);
  const preferredPool = russianNonDefaultVoices.length ? russianNonDefaultVoices : nonDefaultVoices;
  const bestOtherVoice = preferredPool
    .map((voice) => {
      return { voice, score: scoreSoftRussianVoice(voice) };
    })
    .sort((a, b) => b.score - a.score)[0];

  if (bestOtherVoice) return bestOtherVoice.voice;

  const russianVoices = getRussianVoices(voices);
  const fallbackPool = russianVoices.length ? russianVoices : voices;
  return fallbackPool
    .map((voice) => {
      return { voice, score: scoreSoftRussianVoice(voice) };
    })
    .sort((a, b) => b.score - a.score)[0]?.voice || null;
}

function getPersona(child) {
  if (!child) {
    return {
      emoji: '💚',
      name: 'Личный психолог',
      subtitle: 'Мягкая поддержка для родителей',
      greeting: 'Здравствуйте! Я ваш личный AI-психолог',
      greetingSub: 'Поговорим о стрессе, тревоге, мотивации ребёнка и вашем самочувствии.',
      suggestions: [
        'Ребёнок сильно устаёт, что делать?',
        'Как справиться с тревогой?',
        'Ребёнок не хочет учиться',
        'Как развить концентрацию у ребёнка?',
      ],
    };
  }
  if (child.age <= 12) {
    return {
      emoji: '🐉',
      name: 'Жашыл',
      subtitle: 'Добрый зелёный дракончик — друг и наставник',
      greeting: `Привет! Я Жашыл — твой зелёный друг! 🐉`,
      greetingSub: 'Расскажи, что хорошего ты сделал сегодня, или спроси меня о природе!',
      suggestions: [
        'Почему нельзя мусорить?',
        'Какое доброе дело сделать сегодня?',
        'Расскажи историю про природу',
        'Как помочь птицам зимой?',
      ],
    };
  }
  return {
    emoji: '⚡',
    name: 'GAIA',
    subtitle: 'Твой AI-собеседник — на равных, без занудства',
    greeting: 'Привет! Я GAIA ⚡',
    greetingSub: 'Поговорим про эко-дела, учёбу, мотивацию — без нравоучений.',
    suggestions: [
      'Зачем вообще сдавать батарейки?',
      'Как перестать залипать в телефон?',
      'Идеи для эко-проекта в школе',
      'Как заработать больше GreenPoints?',
    ],
  };
}

const PSYCHOLOGIST_MODE = {
  emoji: '💚',
  name: 'Личный психолог',
  subtitle: 'Мягкая поддержка для родителей',
  greeting: 'Здравствуйте! Я ваш личный AI-психолог',
  greetingSub: 'Поговорим о стрессе, тревоге, мотивации, учёбе или отношениях — мягко и спокойно.',
  suggestions: [
    'Ребёнок сильно устаёт, что делать?',
    'Как справиться с тревогой?',
    'Ребёнок не хочет учиться',
    'Как развить концентрацию у ребёнка?',
  ],
};

export default function AIChat({ variant = 'child-mentor' }) {
  const { user } = useAuth();
  const isParentPsychologist = variant === 'parent-psychologist';
  const childProfile = user?.child_profile;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState([]);
  const [childId, setChildId] = useState('');
  const [voiceState, setVoiceState] = useState('idle');
  const [speakingId, setSpeakingId] = useState(null);
  const [speechLoadingId, setSpeechLoadingId] = useState(null);
  const [voices, setVoices] = useState([]);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const speechCacheRef = useRef(new Map());
  const speechRequestRef = useRef(0);
  const speechErrorToastBlockedRef = useRef(false);
  const messageIdRef = useRef(1);

  const mode = isParentPsychologist ? 'psychologist' : 'assistant';

  useEffect(() => {
    if (isParentPsychologist) {
      getChildren().then(r => {
        const list = r.data.results || r.data;
        setChildren(list);
      });
    }
  }, [isParentPsychologist]);

  useEffect(() => {
    const historyChildId = isParentPsychologist ? (childId || null) : null;
    getChatHistory(historyChildId)
      .then(r => setMessages(r.data))
      .catch(() => {});
  }, [childId, isParentPsychologist]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!window.speechSynthesis) return undefined;

    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    const timer = setTimeout(loadVoices, 600);
    window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);

    return () => {
      clearTimeout(timer);
      window.speechSynthesis.removeEventListener?.('voiceschanged', loadVoices);
    };
  }, []);

  useEffect(() => {
    const speechCache = speechCacheRef.current;
    return () => {
      recognitionRef.current?.abort?.();
      window.speechSynthesis?.cancel();
      audioRef.current?.pause();
      speechCache.forEach((audioUrl) => URL.revokeObjectURL(audioUrl));
      speechCache.clear();
    };
  }, []);

  const stopVoice = () => {
    speechRequestRef.current += 1;
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setSpeakingId(null);
    setSpeechLoadingId(null);
  };

  const speakWithBrowser = (msg, { auto = false } = {}) => {
    if (!window.speechSynthesis) {
      if (!auto) toast.error('Ваш браузер не поддерживает озвучку');
      return;
    }

    window.speechSynthesis.cancel();

    let started = false;
    const startSpeaking = () => {
      if (started) return;
      started = true;

      const utterance = new SpeechSynthesisUtterance(msg.message);
      const loadedVoices = voices.length ? voices : window.speechSynthesis.getVoices();
      const voice = pickPsychologistVoice(loadedVoices);
      if (voice) utterance.voice = voice;
      utterance.lang = 'ru-RU';
      utterance.rate = isParentPsychologist ? 0.78 : 0.96;
      utterance.pitch = isParentPsychologist ? 1.18 : 1;
      utterance.volume = isParentPsychologist ? 0.95 : 1;
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);

      setSpeakingId(msg.id);
      window.speechSynthesis.speak(utterance);
      window.speechSynthesis.resume?.();
    };

    const voicesReady = voices.length > 0 || window.speechSynthesis.getVoices().length > 0;
    if (voicesReady) {
      startSpeaking();
      return;
    }

    window.speechSynthesis.addEventListener?.('voiceschanged', startSpeaking, { once: true });
    setTimeout(startSpeaking, 1000);
  };

  const playGeminiAudio = async (audioUrl, { auto = false } = {}) => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => stopVoice();
    audio.onerror = () => {
      stopVoice();
      if (!auto) toast.error('Не удалось включить голос Gemini');
    };
    await audio.play();
  };

  const speakMessage = async (msg, { auto = false } = {}) => {
    if (!auto && (speakingId === msg.id || speechLoadingId === msg.id)) {
      stopVoice();
      return;
    }

    stopVoice();

    if (isParentPsychologist) {
      setSpeakingId(msg.id);
      const cachedAudioUrl = speechCacheRef.current.get(msg.message);
      if (cachedAudioUrl) {
        try {
          await playGeminiAudio(cachedAudioUrl, { auto });
        } catch {
          stopVoice();
          if (!auto) toast.error('Не удалось включить голос Gemini');
        }
        return;
      }

      const requestId = speechRequestRef.current + 1;
      speechRequestRef.current = requestId;
      setSpeechLoadingId(msg.id);
      try {
        const { data } = await getPsychologistSpeech(msg.message);
        if (requestId !== speechRequestRef.current) return;
        const audioUrl = URL.createObjectURL(data);
        speechCacheRef.current.set(msg.message, audioUrl);
        setSpeechLoadingId(null);
        await playGeminiAudio(audioUrl, { auto });
      } catch {
        stopVoice();
        if (!auto && !speechErrorToastBlockedRef.current) {
          speechErrorToastBlockedRef.current = true;
          toast.error('Голос Gemini временно недоступен');
          setTimeout(() => {
            speechErrorToastBlockedRef.current = false;
          }, 4000);
        }
      }
      return;
    }

    speakWithBrowser(msg, { auto });
  };

  const sendText = async (text, viaVoice = false) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMessage = { id: `local-${messageIdRef.current++}`, role: 'user', message: trimmed };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    try {
      let answer;
      const ctxChildId = isParentPsychologist ? (childId || null) : null;
      if (viaVoice) {
        const { data } = await sendVoiceMessage(trimmed, ctxChildId, mode);
        answer = data.text;
      } else {
        const { data } = await sendChatMessage(trimmed, ctxChildId, mode);
        answer = data.response;
      }
      const assistantMessage = { id: `local-${messageIdRef.current++}`, role: 'assistant', message: answer };
      setMessages(prev => [...prev, assistantMessage]);
      if (isParentPsychologist) {
        speakMessage(assistantMessage, { auto: true });
      }
    } catch {
      toast.error('Ошибка AI чата');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
      setVoiceState('idle');
    }
  };

  const send = () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    sendText(text);
  };

  const toggleRecording = () => {
    if (!SpeechRecognitionImpl) {
      toast.error('Ваш браузер не поддерживает голосовой ввод');
      return;
    }
    if (voiceState === 'recording') {
      recognitionRef.current?.stop();
      return;
    }
    if (voiceState === 'processing' || loading) return;

    const rec = new SpeechRecognitionImpl();
    rec.lang = 'ru-RU';
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript.trim();
      if (transcript) {
        setVoiceState('processing');
        sendText(transcript, true);
      } else {
        setVoiceState('idle');
      }
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
    rec.onend = () => {
      setVoiceState(s => (s === 'recording' ? 'idle' : s));
    };

    recognitionRef.current = rec;
    setVoiceState('recording');
    rec.start();
  };

  const toggleSpeak = (msg) => {
    speakMessage(msg);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const selectedChild = isParentPsychologist
    ? children.find(c => String(c.id) === String(childId))
    : childProfile;
  const m = isParentPsychologist ? PSYCHOLOGIST_MODE : getPersona(selectedChild);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 className="page-title">{m.emoji} {m.name}</h1>
          <p className="page-subtitle">{m.subtitle}</p>
        </div>
        {isParentPsychologist && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {children.length > 0 && (
              <select className="form-select" style={{ width: 'auto' }} value={childId} onChange={e => setChildId(e.target.value)}>
                <option value="">Общий разговор</option>
                {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
        )}
      </div>

      {isParentPsychologist && (
        <div className="psy-disclaimer">
          💚 AI-психолог не заменяет настоящего врача или психолога. В сложной ситуации обратитесь к специалисту или в экстренную службу (112).
        </div>
      )}

      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              {isParentPsychologist
                ? <HeartHandshake size={48} color="var(--green)" style={{ margin: '0 auto 16px' }} />
                : <Bot size={48} color="var(--green)" style={{ margin: '0 auto 16px' }} />}
              <p style={{ fontWeight: 600, marginBottom: 8 }}>{m.greeting}</p>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
                {m.greetingSub}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {m.suggestions.map(s => (
                  <button key={s} className="btn btn-secondary btn-sm" onClick={() => setInput(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className="avatar-circle" style={{ width: 32, height: 32, fontSize: 16, flexShrink: 0 }}>
                  {m.emoji}
                </div>
              )}
              <div className="message-bubble">{msg.message}</div>
              {msg.role === 'assistant' && (
                <button
                  className={`speak-btn ${speakingId === msg.id ? 'speaking' : ''}`}
                  onClick={() => toggleSpeak(msg)}
                  title={speechLoadingId === msg.id ? 'Готовлю голос' : speakingId === msg.id ? 'Остановить' : 'Прослушать'}
                >
                  {speechLoadingId === msg.id
                    ? <Loader2 size={15} className="spin-icon" />
                    : speakingId === msg.id
                      ? <VolumeX size={15} />
                      : <Volume2 size={15} />}
                </button>
              )}
            </div>
          ))}

          {loading && (
            <div className="message assistant">
              <div className="avatar-circle" style={{ width: 32, height: 32, fontSize: 16, flexShrink: 0 }}>
                {m.emoji}
              </div>
              <div className="message-bubble" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Думаю...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {voiceState === 'recording' && (
          <div className="voice-hint">
            <span className="rec-dot" /> Говорите...
          </div>
        )}
        {voiceState === 'processing' && (
          <div className="voice-hint">
            <Loader2 size={14} className="spin-icon" /> Обработка...
          </div>
        )}

        <div className="chat-input-area">
          <input
            className="chat-input"
            placeholder={voiceState === 'recording' ? '🎙️ Говорите...' : 'Напишите сообщение...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading || voiceState === 'recording'}
          />
          <button
            className={`mic-btn ${voiceState}`}
            onClick={toggleRecording}
            disabled={loading && voiceState !== 'recording'}
            title={voiceState === 'recording' ? 'Остановить запись' : 'Голосовой ввод'}
          >
            {voiceState === 'recording'
              ? <Square size={15} fill="currentColor" />
              : voiceState === 'processing'
                ? <Loader2 size={17} className="spin-icon" />
                : <Mic size={17} />}
          </button>
          <button className="btn btn-primary" onClick={send} disabled={loading || !input.trim()}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

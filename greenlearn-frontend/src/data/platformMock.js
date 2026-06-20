export const platformStats = {
  nationalSchools: 128,
  students: 24000,
  greenPoints: 2800000,
  cleanZones: 416,
  trees: 9830,
  trashKg: 31200,
  co2Kg: 18400,
};

export const problems = [
  'Задержка речевого развития',
  'Снижение творческого мышления',
  'Слабая память и концентрация',
  'Телефонная зависимость',
  'Нарушение причинно-следственного мышления',
  'Загрязнение экологии',
];

export const solutionSteps = [
  'AI говорит с ребёнком простым и добрым языком',
  'Ребёнок выполняет реальные офлайн-задания',
  'Загружает фото или голосовой ответ',
  'AI помогает объяснить мысль и причинно-следственную связь',
  'Родитель или учитель подтверждает выполнение',
  'Ребёнок получает GreenPoints',
  'GreenPoints можно обменять на реальные награды',
];

export const audience = [
  { title: 'Дети', text: 'Развивают речь, память и привычку делать добро.' },
  { title: 'Подростки', text: 'Получают эко-челленджи, лидерство и командные задания.' },
  { title: 'Родители', text: 'Создают семейные миссии и мотивируют без давления.' },
  { title: 'Учителя', text: 'Ставят задания классам и проверяют отчёты.' },
  { title: 'Школы', text: 'Покупают и распределяют GreenPoints, соревнуются районами.' },
  { title: 'ВУЗы', text: 'Развивают волонтёрство, наставничество и эко-проекты.' },
  { title: 'Бренды', text: 'Дают реальные купоны, миссии и получают социальный impact.' },
];

export const teacherSummary = {
  teacherName: 'Айсулуу Абдылдаева',
  school: 'Школа №12, Бишкек',
  className: '7-Б',
  classPoints: 12500,
  students: 28,
  completed: 146,
  pending: 12,
};

export const teacherStudents = [
  { name: 'Айгерим', points: 1240, streak: 12, level: 7, missions: 34 },
  { name: 'Бекзат', points: 980, streak: 8, level: 6, missions: 27 },
  { name: 'Алина', points: 910, streak: 6, level: 5, missions: 25 },
  { name: 'Эржан', points: 870, streak: 5, level: 5, missions: 23 },
  { name: 'Самира', points: 790, streak: 4, level: 4, missions: 21 },
];

export const teacherMissionExamples = [
  { title: 'Участие в субботнике', category: 'Экология', points: 50, proofType: 'photo' },
  { title: 'Сдать макулатуру', category: 'Экология', points: 70, proofType: 'teacher approval' },
  { title: 'Неделя без опозданий', category: 'Дисциплина', points: 30, proofType: 'teacher approval' },
  { title: 'Помочь в школьном мероприятии', category: 'Волонтёрство', points: 100, proofType: 'text' },
  { title: 'Посадить растение', category: 'Экология', points: 80, proofType: 'photo' },
  { title: 'Прочитать книгу и пересказать AI', category: 'Речь', points: 40, proofType: 'voice' },
];

export const teacherSubmissions = [
  {
    student: 'Айгерим',
    mission: 'Полей цветы и объясни почему нужна вода',
    status: 'ai_review',
    points: 30,
    feedback: 'AI видит растение и лейку. Ответ полный: есть причина и результат.',
  },
  {
    student: 'Бекзат',
    mission: 'Собери мусор во дворе',
    status: 'pending',
    points: 50,
    feedback: 'Фото читаемое, но учителю нужно подтвердить территорию.',
  },
  {
    student: 'Самира',
    mission: 'Прочитай книгу и перескажи AI',
    status: 'approved',
    points: 40,
    feedback: 'Пересказ содержит начало, середину и вывод.',
  },
  {
    student: 'Эржан',
    mission: 'Посадить растение',
    status: 'rejected',
    points: 80,
    feedback: 'На фото не видно результата задания. Нужно переснять растение.',
  },
];

export const schoolSummary = {
  name: 'Школа №12 имени Ч. Айтматова',
  balance: 38000,
  classes: 24,
  students: 714,
  rank: 2,
  ecoMissions: 416,
  goodDeeds: 1240,
  trees: 318,
  trashKg: 920,
  co2Kg: 640,
};

export const schoolClasses = [
  { name: '5-А', teacher: 'Нурзат Осмонова', balance: 3200, students: 29, rank: 3 },
  { name: '6-Б', teacher: 'Руслан Темиров', balance: 4100, students: 31, rank: 2 },
  { name: '8-А', teacher: 'Айсулуу Абдылдаева', balance: 5600, students: 28, rank: 1 },
  { name: '9-В', teacher: 'Динара Сатыбалдиева', balance: 2800, students: 26, rank: 4 },
];

export const walletPackages = [
  { name: 'School Basic', points: 10000, price: '10 000 сом' },
  { name: 'School Pro', points: 50000, price: '45 000 сом' },
  { name: 'School Premium', points: 100000, price: '80 000 сом' },
];

export const walletTransactions = [
  { type: 'purchase', description: 'School Pro пакет', amount: 50000, date: '18.06.2026' },
  { type: 'distribute', description: 'Выдано классу 8-А', amount: -5000, date: '18.06.2026' },
  { type: 'award', description: 'Награды за субботник', amount: -2400, date: '17.06.2026' },
  { type: 'distribute', description: 'Выдано классу 6-Б', amount: -3500, date: '16.06.2026' },
];

export const schoolLeaderboard = [
  { rank: 1, name: 'Школа №61', city: 'Бишкек', points: 58400, cleanZones: 52 },
  { rank: 2, name: 'Школа №12', city: 'Бишкек', points: 54120, cleanZones: 47 },
  { rank: 3, name: 'Школа №5', city: 'Бишкек', points: 48900, cleanZones: 43 },
  { rank: 4, name: 'Школа №23', city: 'Ош', points: 43200, cleanZones: 38 },
  { rank: 5, name: 'Гимназия №6', city: 'Каракол', points: 39700, cleanZones: 34 },
];

export const classLeaderboard = [
  { rank: 1, name: '8-А', points: 14200, missions: 118 },
  { rank: 2, name: '6-Б', points: 12900, missions: 106 },
  { rank: 3, name: '5-А', points: 11800, missions: 98 },
  { rank: 4, name: '9-В', points: 10700, missions: 92 },
];

export const schoolChallenges = [
  {
    id: 'green-bishkek',
    title: 'Самая зелёная школа Бишкека',
    description: 'Классы очищают дворы, улицы и парки вокруг школ. Побеждает школа с самым высоким impact.',
    dates: '17.06 - 17.07',
    prize: '100 000 GP + партнёрские купоны',
    schools: 38,
    progress: 72,
    endsIn: '18 дней',
  },
  {
    id: 'eco-districts',
    title: 'Эко-баттл районов',
    description: 'Районы соревнуются по количеству чистых зон, деревьев и школьных эко-миссий.',
    dates: '01.07 - 01.08',
    prize: 'Кубок района и 250 000 GP',
    schools: 74,
    progress: 43,
    endsIn: '42 дня',
  },
  {
    id: 'national-cup',
    title: 'GreenLearnAI National Cup',
    description: 'Национальное соревнование школ Кыргызстана по добрым делам и экологии.',
    dates: '01.09 - 01.12',
    prize: 'Национальный кубок GreenLearnAI',
    schools: 128,
    progress: 18,
    endsIn: '88 дней',
  },
  {
    id: 'clean-yard',
    title: '7 дней чистого двора',
    description: 'Каждый класс берёт ответственность за свой двор и отмечает ежедневный прогресс.',
    dates: '20.06 - 27.06',
    prize: '20 000 GP классу-победителю',
    schools: 21,
    progress: 86,
    endsIn: '4 дня',
  },
  {
    id: 'plastic-free',
    title: 'Месяц без пластика',
    description: 'Ученики сокращают одноразовый пластик и показывают альтернативы.',
    dates: '01.08 - 31.08',
    prize: 'Эко-наборы от партнёров',
    schools: 44,
    progress: 31,
    endsIn: '51 день',
  },
];

export const ecoTerritories = [
  { title: 'Школа №12 - район вокруг школы', district: 'Октябрьский район', status: 'active', impact: '46 миссий, 14 деревьев, 120 кг мусора' },
  { title: 'Школа №5 - парк рядом', district: 'Первомайский район', status: 'clean', impact: '31 миссия, 8 деревьев, 74 кг мусора' },
  { title: 'Школа №61 - улица Манаса', district: 'Ленинский район', status: 'clean', impact: '52 миссии, 21 дерево, 180 кг мусора' },
  { title: 'Класс 8-Б - очистили 3 точки', district: 'Свердловский район', status: 'active', impact: '3 зоны ждут проверки учителя' },
  { title: 'Река Ала-Арча - школьный патруль', district: 'Пригород', status: 'needs_attention', impact: 'Нужен новый субботник' },
];

export const studentMissions = [
  { title: 'Участие в субботнике', points: 100, category: 'Эко-акция' },
  { title: 'Провести мастер-класс школьникам', points: 200, category: 'Наставничество' },
  { title: 'Помочь на мероприятии ВУЗа', points: 150, category: 'Волонтёрство' },
  { title: 'Организовать эко-акцию', points: 300, category: 'Лидерство' },
  { title: 'Наставничество младших', points: 250, category: 'Образование' },
];

export const universitySummary = {
  name: 'Кыргызский государственный университет',
  balance: 64000,
  faculties: 8,
  students: 4200,
  volunteerHours: 1280,
  reports: 318,
};

export const universityGroups = [
  { name: 'ФИТ-2', faculty: 'IT', balance: 7200, students: 31, hours: 188 },
  { name: 'ЭКО-1', faculty: 'Экология', balance: 9100, students: 24, hours: 240 },
  { name: 'ПЕД-3', faculty: 'Педагогика', balance: 6400, students: 29, hours: 176 },
];

export const brandSummary = {
  brand: 'KFC Kyrgyzstan',
  activeMissions: 4,
  completed: 3240,
  couponsIssued: 1180,
  reach: 48200,
  impact: '31 тонна мусора и 9 830 деревьев в партнёрских миссиях',
};

export const brandMissions = [
  { title: 'KFC Green Mission', description: 'Убери мусор во дворе и получи 100 GP', reward: 'Скидка 15%', points: 100, age: '7-17', status: 'active' },
  { title: 'Book Week', description: 'Прочитай книгу и перескажи AI', reward: 'Скидка в книжном', points: 80, age: '8-18', status: 'active' },
  { title: '7 добрых дел', description: 'Сделай 7 добрых дел за неделю', reward: 'Скидка на кино', points: 150, age: '10-18', status: 'draft' },
];

export const brandRewards = [
  { title: 'KFC купон -15%', cost: 450, limit: 1000, claimed: 318, status: 'active' },
  { title: 'Кино билет -20%', cost: 600, limit: 500, claimed: 144, status: 'active' },
  { title: 'Книжный купон', cost: 300, limit: 800, claimed: 206, status: 'active' },
];

export const missionBuilderTemplates = [
  {
    keywords: ['телефон', 'экран', 'завис'],
    title: 'Один час без телефона',
    description: 'Проведи один час без телефона: почитай, помоги дома или выйди на прогулку. Потом расскажи AI, что ты сделал.',
    category: 'Цифровой баланс',
    points: 50,
    proofType: 'voice',
    deadline: 'Сегодня',
    explanation: 'Задание заменяет экранное время реальным действием и развивает навык самоконтроля.',
  },
  {
    keywords: ['7 класс', 'эколог', 'субботник'],
    title: 'Эко-патруль 7 класса',
    description: 'Класс очищает одну территорию вокруг школы, делает фото до/после и коротко объясняет результат.',
    category: 'Экология',
    points: 70,
    proofType: 'photo',
    deadline: 'До пятницы',
    explanation: 'Командная миссия развивает ответственность за свою улицу и видимый вклад класса.',
  },
  {
    keywords: ['речь', 'говор', 'предлож'],
    title: 'Объясни доброе дело',
    description: 'Сделай доброе дело и ответь AI по формуле: что сделал, почему это важно, кому помогло.',
    category: 'Развитие речи',
    points: 40,
    proofType: 'voice',
    deadline: '3 дня',
    explanation: 'AI мягко помогает ребёнку строить длинные предложения и причинно-следственные связи.',
  },
];

export function buildMissionSuggestion(goal) {
  const lower = goal.toLowerCase();
  return (
    missionBuilderTemplates.find(template =>
      template.keywords.some(keyword => lower.includes(keyword))
    ) || {
      title: 'Доброе дело недели',
      description: 'Сделай одно полезное дело для семьи, школы или природы и объясни AI, почему это важно.',
      category: 'Добрые дела',
      points: 50,
      proofType: 'text',
      deadline: '7 дней',
      explanation: 'Универсальная миссия помогает связать реальное действие, речь и мотивацию GreenPoints.',
    }
  );
}

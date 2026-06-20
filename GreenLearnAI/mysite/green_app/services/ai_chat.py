# coding: utf-8
"""
AI-чат через LangChain + Gemini.
При недоступности API возвращает keyword fallback — не падает с 500.
"""
import logging

from django.conf import settings

logger = logging.getLogger('green_app')

KEYWORD_FALLBACK = {
    'задание': 'Попробуйте выбрать задание, которое соответствует возрасту и интересам вашего ребёнка. Начните с простых заданий категории «Лёгкий» уровень.',
    'балл': 'Баллы начисляются за каждое выполненное и подтверждённое задание. Чем сложнее задание — тем больше баллов!',
    'уровень': 'Уровень повышается автоматически при накоплении баллов. Каждый новый уровень открывает более сложные задания.',
    'достижение': 'Достижения разблокируются при выполнении определённого количества заданий и наборе баллов. Это отличная мотивация!',
    'мотив': 'Хвалите ребёнка за каждое выполненное задание! Маленькие победы создают большую уверенность в себе.',
    'серия': 'Серия дней — это подряд идущие дни, когда ребёнок выполняет хотя бы одно задание. Поддерживайте её!',
}

DEFAULT_FALLBACK = (
    'Я помогаю родителям в вопросах воспитания, развития детей и работы с платформой GreenLearn. '
    'Задайте вопрос о заданиях, баллах, уровнях или мотивации ребёнка.'
)

PSYCHOLOGIST_FALLBACK = (
    'Я рядом и готов поддержать вас. 💚 Расскажите, что вас беспокоит — стресс, усталость, '
    'тревога, учёба или отношения с ребёнком. Помните: я не заменяю настоящего психолога или врача, '
    'но постараюсь мягко помочь добрым советом.'
)

# Ключевые слова, указывающие на возможную опасность (русский + кыргызский)
CRISIS_KEYWORDS = [
    'хочу умереть', 'не хочу жить', 'покончить с собой', 'суицид', 'самоубийств',
    'навредить себе', 'порезать себя', 'причинить себе', 'убить себя',
    'меня бьют', 'меня бьёт', 'меня бьет', 'меня избива', 'надо мной издева',
    'мне очень страшно', 'насилие надо мной',
    'өлгүм келет', 'жашагым келбейт', 'өзүмө зыян', 'мени уруп жатышат', 'мага абдан коркунучтуу',
]

CRISIS_RESPONSE = (
    'Мне очень жаль, что тебе сейчас так тяжело. 💚 Пожалуйста, не оставайся с этим наедине. '
    'Прямо сейчас расскажи об этом взрослому, которому доверяешь: родителям, учителю или врачу. '
    'Если есть опасность для жизни или здоровья — срочно позвони в экстренную службу (112). '
    'Ты очень важен, и тебе обязательно помогут настоящие люди рядом.\n\n'
    'Азыр эле ишенген чоң кишиге — ата-энеңе, мугалимиңе же дарыгерге айт. '
    'Коркунуч болсо, дароо 112 номерине чал. Сен маанилүүсүң, сага сөзсүз жардам беришет. 💚'
)

PSYCHOLOGIST_PROMPT = (
    'Ты — добрый AI-психолог платформы GreenLearnAI. Ты помогаешь детям и родителям '
    'мягко, спокойно и безопасно. Темы, с которыми ты помогаешь:\n'
    '- стресс и усталость\n'
    '- мотивация\n'
    '- тревога и страхи\n'
    '- проблемы с учёбой\n'
    '- отношения родителей и детей\n'
    '- развитие речи, памяти и концентрации\n\n'
    'Правила:\n'
    '- Отвечай простым, добрым и понятным языком. Ответы короткие и тёплые.\n'
    '- НЕ ставь диагнозы и НЕ назначай лекарства.\n'
    '- НЕ говори, что ты заменяешь врача или настоящего психолога — при серьёзных проблемах '
    'мягко советуй обратиться к специалисту.\n'
    '- Если есть риск самоповреждения, насилия или опасности — посоветуй срочно обратиться '
    'к взрослому, родителям, врачу или в экстренную службу (112).\n'
    '- Отвечай на том языке, на котором пишет пользователь: русский или кыргызский.'
)


def detect_crisis(user_message: str) -> bool:
    """Проверить сообщение на признаки опасной ситуации."""
    lower = user_message.lower()
    return any(keyword in lower for keyword in CRISIS_KEYWORDS)


# ──────────────────────────────────────────────
# Персонажи по возрасту: Жашыл / GAIA / GAIA Pro
# ──────────────────────────────────────────────

JASHYL_PROMPT = (
    'Ты — Жашыл, добрый анимированный зелёный дракончик платформы GreenLearnAI. '
    'Ты разговариваешь с ребёнком 6–12 лет. Правила:\n'
    '- Говори очень просто, короткими предложениями, тепло и весело.\n'
    '- Хвали ребёнка за каждое доброе дело и старание.\n'
    '- Мягко исправляй речь: если ребёнок отвечает одним словом, попроси сказать целым предложением.\n'
    '- Задавай простые вопросы «почему?» и «что будет дальше?», чтобы развивать логику и речь.\n'
    '- Рассказывай, почему важно беречь природу, на простых примерах.\n'
    '- Предлагай добрые дела: убрать мусор, полить растение, помочь маме.\n'
    '- Отвечай на том языке, на котором пишет ребёнок: русский или кыргызский.'
)

GAIA_PROMPT = (
    'Ты — GAIA, AI-собеседник платформы GreenLearnAI для подростков 13–17 лет. Правила:\n'
    '- Общайся как ровесник: легко, с юмором, без сюсюканья и нравоучений.\n'
    '- Уважай мнение подростка, разговаривай на равных.\n'
    '- Поддерживай в учёбе, мотивации, эко-делах и добрых поступках.\n'
    '- Объясняй причинно-следственные связи в экологии интересно, без занудства.\n'
    '- Отвечай на том языке, на котором пишет пользователь: русский или кыргызский.'
)

GAIA_PRO_PROMPT = (
    'Ты — GAIA Pro, умный AI-наставник платформы GreenLearnAI для родителей, студентов и взрослых. '
    'Отвечай на русском или кыргызском языке — на том, на котором пишет пользователь. '
    'Давай советы по:\n'
    '- воспитанию и развитию детей\n'
    '- выбору подходящих заданий для ребёнка\n'
    '- мотивации ребёнка выполнять задания\n'
    '- объяснению системы GreenPoints, уровней и наград\n'
    '- экологическому воспитанию и развитию речи, памяти, концентрации\n'
    'Будь позитивным, структурным и используй простые слова.'
)


JASHYL_EXPANSION = (
    '\n\nДополнительный фокус GreenLearnAI для Жашыл:\n'
    '- Помогай ребенку развивать речь: проси объяснить "почему", "как" и "что будет дальше".\n'
    '- Давай короткие, добрые задания, которые выводят ребенка из телефона в реальный мир.\n'
    '- Мягко помогай составлять полные предложения без давления и оценки.\n'
    '- Связывай добрые дела, помощь родителям и экологию с личной ответственностью ребенка.\n'
)

GAIA_EXPANSION = (
    '\n\nДополнительный фокус GreenLearnAI для GAIA:\n'
    '- Помогай подростку держать мотивацию, концентрацию и здоровый баланс с телефоном.\n'
    '- Предлагай эко-челленджи, командные задания, лидерство и волонтерство.\n'
    '- Объясняй, как маленькие реальные действия превращаются в вклад класса, школы и района.\n'
    '- Говори уважительно и взросло, без давления и морализаторства.\n'
)

GAIA_PRO_EXPANSION = (
    '\n\nДополнительный фокус GreenLearnAI для GAIA Pro:\n'
    '- Помогай родителям, учителям и школам создавать миссии с понятной формулой: действие -> GreenPoints -> награда.\n'
    '- Объясняй, что GreenPoints - внутренняя мотивационная валюта, а не деньги.\n'
    '- Подсказывай задания для развития речи, памяти, ответственности, экологии и борьбы с телефонной зависимостью.\n'
    '- Помогай анализировать прогресс ребенка, класса или школы и формулировать следующие шаги.\n'
)


def get_persona(child=None) -> dict:
    """Выбрать персонажа по возрасту ребёнка."""
    if child is None:
        return {'key': 'gaia_pro', 'name': 'GAIA Pro', 'prompt': GAIA_PRO_PROMPT + GAIA_PRO_EXPANSION}
    if child.age <= 12:
        return {'key': 'jashyl', 'name': 'Жашыл', 'prompt': JASHYL_PROMPT + JASHYL_EXPANSION}
    return {'key': 'gaia', 'name': 'GAIA', 'prompt': GAIA_PROMPT + GAIA_EXPANSION}


def build_system_prompt(child=None, mode: str = 'assistant') -> str:
    if mode == 'psychologist':
        base = PSYCHOLOGIST_PROMPT
    else:
        base = get_persona(child)['prompt']
    if child:
        base += (
            f'\n\nКонтекст ребёнка:\n'
            f'- Имя: {child.name}\n'
            f'- Возраст: {child.age} лет\n'
            f'- Уровень: {child.level}\n'
            f'- Баллы: {child.total_points}\n'
            f'- Серия дней: {child.streak_days}\n'
            'Давай советы с учётом возраста и прогресса этого ребёнка.'
        )
    return base


def _keyword_fallback(user_message: str, mode: str = 'assistant') -> str:
    if mode == 'psychologist':
        return PSYCHOLOGIST_FALLBACK
    lower = user_message.lower()
    for keyword, response in KEYWORD_FALLBACK.items():
        if keyword in lower:
            return response
    return DEFAULT_FALLBACK


def chat_with_ai(user_message: str, history: list, child=None, mode: str = 'assistant') -> str:
    """
    Отправить сообщение в Gemini через LangChain.
    При любой ошибке — вернуть keyword fallback.
    """
    # Безопасность: при признаках опасности отвечаем детерминированно, без LLM
    if detect_crisis(user_message):
        return CRISIS_RESPONSE

    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.messages import SystemMessage, HumanMessage
        from langchain_core.messages import AIMessage as LangAIMessage

        api_key = getattr(settings, 'GEMINI_API_KEY', None)
        if not api_key:
            logger.warning('chat_with_ai: GEMINI_API_KEY не задан, используется fallback')
            return _keyword_fallback(user_message, mode)

        llm = ChatGoogleGenerativeAI(
            model='gemini-3.1-flash-lite',
            google_api_key=api_key,
            temperature=0.7,
            max_tokens=1024,
        )

        messages = [SystemMessage(content=build_system_prompt(child, mode))]
        for msg in history:
            if msg.role == 'user':
                messages.append(HumanMessage(content=msg.message))
            else:
                messages.append(LangAIMessage(content=msg.message))
        messages.append(HumanMessage(content=user_message))

        response = llm.invoke(messages)

        if isinstance(response.content, str):
            return response.content
        elif isinstance(response.content, list):
            return ''.join(
                block.get('text', '')
                for block in response.content
                if isinstance(block, dict) and block.get('type') == 'text'
            )
        return str(response.content)

    except Exception as exc:
        logger.error('chat_with_ai error: %s', exc)
        return _keyword_fallback(user_message, mode)


# ──────────────────────────────────────────────
# Голосовой дневник
# ──────────────────────────────────────────────

DIARY_FALLBACK = (
    'Молодец, что ведёшь дневник! 🌟 Каждая запись делает твою речь богаче. '
    'Завтра попробуй рассказать ещё подробнее: что ты сделал, почему и что почувствовал.'
)


def analyze_diary_entry(text: str, child=None) -> str:
    """
    Проанализировать запись голосового дневника:
    похвалить, мягко отметить прогресс речи и дать один совет.
    """
    if detect_crisis(text):
        return CRISIS_RESPONSE

    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.messages import SystemMessage, HumanMessage

        api_key = getattr(settings, 'GEMINI_API_KEY', None)
        if not api_key:
            return DIARY_FALLBACK

        persona = get_persona(child)
        system = (
            f'Ты — {persona["name"]}, персонаж платформы GreenLearnAI. '
            'Ребёнок записал голосовой дневник о своём дне. Твоя задача:\n'
            '1. Тепло похвалить за конкретные добрые дела из записи (1-2 предложения).\n'
            '2. Мягко отметить речь: насколько развёрнуто рассказал, есть ли целые предложения.\n'
            '3. Дать ОДИН простой совет, как завтра рассказать ещё лучше.\n'
            'Всего 3-4 коротких предложения, добрым и простым языком. '
            'Отвечай на языке записи: русский или кыргызский.'
        )
        if child:
            system += f'\nИмя ребёнка: {child.name}, возраст: {child.age} лет.'

        llm = ChatGoogleGenerativeAI(
            model='gemini-3.1-flash-lite',
            google_api_key=api_key,
            temperature=0.7,
            max_tokens=512,
        )
        response = llm.invoke([
            SystemMessage(content=system),
            HumanMessage(content=text),
        ])
        if isinstance(response.content, str):
            return response.content
        return str(response.content)

    except Exception as exc:
        logger.error('analyze_diary_entry error: %s', exc)
        return DIARY_FALLBACK

# coding: utf-8
"""
Сертификаты Eco Passport: выдаются автоматически при достижении порогов.
"""
import logging

logger = logging.getLogger('green_app')

# (code, title, description, icon, check(child, approved_count) -> bool)
CERTIFICATE_DEFINITIONS = [
    {
        'code': 'first-steps',
        'title': 'Первые шаги',
        'description': 'Выполнено первое доброе дело на платформе GreenLearnAI.',
        'icon': '🌱',
        'check': lambda child, approved: approved >= 1,
    },
    {
        'code': 'young-eco-defender',
        'title': 'Юный защитник природы',
        'description': 'Выполнено 10 добрых дел для природы и людей.',
        'icon': '🌿',
        'check': lambda child, approved: approved >= 10,
    },
    {
        'code': 'eco-leader',
        'title': 'Эко-лидер',
        'description': 'Выполнено 25 заданий — настоящий пример для других!',
        'icon': '🏆',
        'check': lambda child, approved: approved >= 25,
    },
    {
        'code': 'master-of-good-deeds',
        'title': 'Мастер добрых дел',
        'description': 'Заработано 500 GreenPoints добрыми делами.',
        'icon': '💚',
        'check': lambda child, approved: child.total_points >= 500,
    },
    {
        'code': 'week-of-power',
        'title': 'Неделя силы',
        'description': '7 дней подряд с выполненными заданиями.',
        'icon': '🔥',
        'check': lambda child, approved: child.streak_days >= 7,
    },
]


def check_and_issue_certificates(child) -> list:
    """
    Проверить пороги и выдать недостающие сертификаты.
    Возвращает список новых выданных сертификатов.
    """
    from ..models import Certificate, MissionSubmission

    approved = MissionSubmission.objects.filter(
        child=child, status=MissionSubmission.Status.APPROVED
    ).count()

    existing = set(
        Certificate.objects.filter(child=child).values_list('code', flat=True)
    )

    new_certs = []
    for definition in CERTIFICATE_DEFINITIONS:
        if definition['code'] in existing:
            continue
        if definition['check'](child, approved):
            cert = Certificate.objects.create(
                child=child,
                code=definition['code'],
                title=definition['title'],
                description=definition['description'],
                icon=definition['icon'],
            )
            new_certs.append(cert)
            logger.info('certificate issued: child=%s code=%s', child.name, definition['code'])

    return new_certs

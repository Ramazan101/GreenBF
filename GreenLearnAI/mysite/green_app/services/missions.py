# coding: utf-8
"""
Бизнес-логика заданий: лимит отправки, рекомендации.
"""
from datetime import date


def can_submit_today(child, mission) -> bool:
    """Проверить, может ли ребёнок сегодня отправить это задание."""
    from green_app.models import MissionSubmission

    today = date.today()
    return not MissionSubmission.objects.filter(
        child=child,
        mission=mission,
        created_at__date=today
    ).exclude(status=MissionSubmission.Status.REJECTED).exists()


def get_recommended_missions(child, limit: int = 10):
    """Вернуть рекомендованные задания по возрасту ребёнка, исключая выполненные."""
    from green_app.models import Mission, MissionSubmission

    completed_ids = MissionSubmission.objects.filter(
        child=child,
        status=MissionSubmission.Status.APPROVED
    ).values_list('mission_id', flat=True)

    return (
        Mission.objects
        .filter(is_active=True, min_age__lte=child.age, max_age__gte=child.age)
        .exclude(id__in=completed_ids)
        .order_by('difficulty', 'points')
        [:limit]
    )

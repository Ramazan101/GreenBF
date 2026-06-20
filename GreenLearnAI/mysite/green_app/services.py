# coding: utf-8
from django.utils import timezone
from django.db.models import Count


def update_level(child):
    """Пересчитать уровень ребёнка: каждые 200 баллов = +1 уровень"""
    child.level = child.total_points // 200 + 1
    child.save(update_fields=['level'])


def award_points(child, points):
    """Начислить баллы ребёнку и обновить уровень"""
    child.total_points += points
    child.save(update_fields=['total_points'])
    update_level(child)


def unlock_achievements(child):
    """Проверить и разблокировать достижения для ребёнка"""
    from .models import Achievement, ChildAchievement

    already_unlocked = ChildAchievement.objects.filter(child=child).values_list(
        'achievement_id', flat=True
    )
    approved_count = child.submissions.filter(status='approved').count()
    candidates = Achievement.objects.filter(is_active=True).exclude(id__in=already_unlocked)

    for achievement in candidates:
        points_ok = child.total_points >= achievement.required_points
        missions_ok = approved_count >= achievement.required_missions_count
        if points_ok and missions_ok:
            ChildAchievement.objects.create(child=child, achievement=achievement)


def can_submit_today(child, mission):
    """Проверить, не выполнял ли ребёнок это задание сегодня"""
    from .models import MissionSubmission
    today = timezone.now().date()
    return not MissionSubmission.objects.filter(
        child=child,
        mission=mission,
        created_at__date=today
    ).exists()


def get_recommended_missions(child):
    """Получить рекомендованные задания для ребёнка по возрасту"""
    from .models import Mission
    completed_ids = child.submissions.filter(
        status='approved'
    ).values_list('mission_id', flat=True)

    return Mission.objects.filter(
        is_active=True,
        min_age__lte=child.age,
        max_age__gte=child.age,
    ).exclude(id__in=completed_ids).order_by('difficulty', 'points')


def update_streak(child):
    """Обновить серию дней активности ребёнка"""
    from .models import MissionSubmission
    today = timezone.now().date()
    yesterday = today - timezone.timedelta(days=1)

    submitted_today = MissionSubmission.objects.filter(
        child=child, created_at__date=today
    ).exists()
    submitted_yesterday = MissionSubmission.objects.filter(
        child=child, created_at__date=yesterday
    ).exists()

    if submitted_today and submitted_yesterday:
        child.streak_days += 1
    elif submitted_today and not submitted_yesterday:
        child.streak_days = 1
    else:
        child.streak_days = 0

    child.save(update_fields=['streak_days'])
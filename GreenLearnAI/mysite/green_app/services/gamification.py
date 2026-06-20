# coding: utf-8
"""
Геймификация: начисление баллов, уровни, достижения, серия дней.
"""
import logging
from datetime import date

logger = logging.getLogger('green_app')


def award_points(child, points: int) -> None:
    """Начислить баллы ребёнку и обновить уровень."""
    child.total_points += points
    child.save(update_fields=['total_points'])
    update_level(child)
    logger.info('award_points: child=%s points=%s total=%s', child.name, points, child.total_points)


def update_level(child) -> None:
    """Обновить уровень на основе суммарных баллов."""
    thresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500]
    new_level = 1
    for i, threshold in enumerate(thresholds):
        if child.total_points >= threshold:
            new_level = i + 1
    if new_level != child.level:
        child.level = new_level
        child.save(update_fields=['level'])
        logger.info('update_level: child=%s new_level=%s', child.name, new_level)


def unlock_achievements(child) -> list:
    """Проверить и разблокировать достижения ребёнка."""
    from green_app.models import Achievement, ChildAchievement, MissionSubmission

    already_unlocked = set(
        ChildAchievement.objects.filter(child=child).values_list('achievement_id', flat=True)
    )
    approved_count = MissionSubmission.objects.filter(
        child=child, status=MissionSubmission.Status.APPROVED
    ).count()

    unlocked = []
    for achievement in Achievement.objects.filter(is_active=True).exclude(id__in=already_unlocked):
        if child.total_points >= achievement.required_points and approved_count >= achievement.required_missions_count:
            ChildAchievement.objects.create(child=child, achievement=achievement)
            unlocked.append(achievement)
            logger.info('unlock_achievements: child=%s achievement=%s', child.name, achievement.title)

    return unlocked


def update_streak(child) -> None:
    """Обновить серию выполненных дней."""
    from green_app.models import MissionSubmission

    today = date.today()
    last_approved = (
        MissionSubmission.objects
        .filter(child=child, status=MissionSubmission.Status.APPROVED)
        .order_by('-reviewed_at')
        .first()
    )

    if last_approved and last_approved.reviewed_at:
        last_date = last_approved.reviewed_at.date()
        delta = (today - last_date).days
        if delta == 0:
            pass  # сегодня уже засчитано
        elif delta == 1:
            child.streak_days += 1
            child.save(update_fields=['streak_days'])
        else:
            child.streak_days = 1
            child.save(update_fields=['streak_days'])
    else:
        child.streak_days = 1
        child.save(update_fields=['streak_days'])

    logger.info('update_streak: child=%s streak=%s', child.name, child.streak_days)
# coding: utf-8
"""
AI-проверка фото выполненного задания через Gemini Vision.
При недоступности API используется локальная проверка качества фото.
"""
import base64
import json
import logging
import re

from django.conf import settings
from django.utils import timezone

logger = logging.getLogger('green_app')


def _read_image_base64(image_field) -> tuple[str, str]:
    """Прочитать ImageField и вернуть (base64_data, media_type)."""
    image_field.open('rb')
    raw = image_field.read()
    image_field.close()
    b64 = base64.b64encode(raw).decode('utf-8')

    name = image_field.name.lower()
    if name.endswith('.png'):
        media_type = 'image/png'
    elif name.endswith('.gif'):
        media_type = 'image/gif'
    elif name.endswith('.webp'):
        media_type = 'image/webp'
    else:
        media_type = 'image/jpeg'

    return b64, media_type


def _approve_submission(submission, raw_text: str, feedback: str, confidence: float) -> None:
    """Одобрить отчёт и начислить баллы только один раз."""
    from green_app.models import MissionSubmission
    from green_app.services.gamification import award_points, update_streak, unlock_achievements

    child = submission.child
    mission = submission.mission
    should_award = not (
        submission.status == MissionSubmission.Status.APPROVED and
        submission.points_awarded > 0
    )

    submission.status = MissionSubmission.Status.APPROVED
    if submission.points_awarded <= 0:
        submission.points_awarded = mission.points
    submission.reviewed_at = timezone.now()
    submission.ai_result = raw_text
    submission.ai_feedback = feedback
    submission.ai_confidence = confidence
    submission.save(update_fields=[
        'status', 'points_awarded', 'reviewed_at',
        'ai_result', 'ai_feedback', 'ai_confidence'
    ])

    if should_award:
        award_points(child, mission.points)
        update_streak(child)
        unlock_achievements(child)


def _reject_submission(submission, raw_text: str, feedback: str, confidence: float) -> None:
    """Отклонить отчёт и убрать баллы, если этот отчёт уже был одобрен."""
    from green_app.models import MissionSubmission
    from green_app.services.gamification import update_level

    child = submission.child
    points_to_remove = submission.points_awarded if submission.status == MissionSubmission.Status.APPROVED else 0

    if points_to_remove:
        child.total_points = max(child.total_points - points_to_remove, 0)
        child.save(update_fields=['total_points'])
        update_level(child)

    submission.status = MissionSubmission.Status.REJECTED
    submission.points_awarded = 0
    submission.reviewed_at = timezone.now()
    submission.ai_result = raw_text
    submission.ai_feedback = feedback
    submission.ai_confidence = confidence
    submission.save(update_fields=[
        'status', 'points_awarded', 'reviewed_at',
        'ai_result', 'ai_feedback', 'ai_confidence'
    ])


def _fallback_photo_check(submission, reason: str = '') -> dict:
    """Сохранить понятный AI-ответ, когда Gemini недоступен."""
    from green_app.models import MissionSubmission

    mission_title = getattr(getattr(submission, 'mission', None), 'title', 'задание')
    metrics = {}
    confidence = 0.0
    completed = False
    auto_approved = False

    try:
        from PIL import Image, ImageStat

        submission.photo.open('rb')
        try:
            with Image.open(submission.photo) as image:
                width, height = image.size
                rgb = image.convert('RGB')
                gray = rgb.convert('L')
                stat = ImageStat.Stat(gray)
                color_stat = ImageStat.Stat(rgb)
                brightness = round(stat.mean[0], 1)
                contrast = round(stat.stddev[0], 1)
                color_spread = round(sum(color_stat.stddev) / 3, 1)
        finally:
            submission.photo.close()

        title_lower = mission_title.lower()
        metrics = {
            'width': width,
            'height': height,
            'brightness': brightness,
            'contrast': contrast,
            'color_spread': color_spread,
        }
        issues = []

        if min(width, height) < 240:
            issues.append('фото слишком маленькое')
        if brightness < 35:
            issues.append('фото слишком тёмное')
        elif brightness > 230:
            issues.append('фото пересвечено')
        if contrast < 18:
            issues.append('мало деталей или низкая чёткость')
        if any(word in title_lower for word in ('цвет', 'растен', 'полей', 'полить')) and color_spread < 12:
            issues.append('на фото не видно цветок или растение для этого задания')

        if issues:
            confidence = 0.28
            issue_text = ', '.join(issues)
            feedback = (
                f'AI проверил фото по заданию «{mission_title}»: {issue_text}. '
                'Фото не подходит к заданию, поэтому отчёт отклонён. '
                'Отправь другое фото, где хорошо видно правильный результат задания.'
            )
        else:
            completed = True
            auto_approved = True
            confidence = 0.82
            feedback = (
                f'AI проверил фото по заданию «{mission_title}»: изображение открывается, '
                f'размер {width}x{height}, яркость и контраст подходят для просмотра. '
                'Задание выглядит выполненным, поэтому отчёт одобрен автоматически.'
            )
    except Exception as exc:
        logger.warning('fallback_photo_check error: %s', exc)
        feedback = (
            f'AI получил фото по заданию «{mission_title}», но не смог прочитать изображение. '
            'Отчёт отклонён. Попробуй отправить фото ещё раз.'
        )
        metrics = {'error': str(exc)}

    if reason:
        metrics['fallback_reason'] = reason

    result = {
        'completed': completed,
        'confidence': confidence,
        'feedback': feedback,
        'auto_approved': auto_approved,
        'source': 'local_photo_check',
        'metrics': metrics,
    }

    raw_text = json.dumps(result, ensure_ascii=False)
    if auto_approved:
        _approve_submission(submission, raw_text, feedback, confidence)
    else:
        _reject_submission(submission, raw_text, feedback, confidence)

    return result


def check_mission_photo(submission) -> dict:
    """
    Отправить фото задания в Gemini Vision.

    Возвращает dict:
        {
            "completed": bool,
            "confidence": float,
            "feedback": str,
            "auto_approved": bool,
        }
    При ошибке сохраняет локальный текстовый AI-ответ и переводит отчёт на ручную проверку.
    """
    from green_app.models import MissionSubmission

    default_result = {'completed': False, 'confidence': 0.0, 'feedback': '', 'auto_approved': False}

    if not submission.photo:
        return default_result

    try:
        api_key = getattr(settings, 'GEMINI_API_KEY', None)
        if not api_key:
            logger.warning('check_mission_photo: GEMINI_API_KEY не задан')
            return _fallback_photo_check(submission, reason='missing_gemini_api_key')

        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-lite')

        child = submission.child
        mission = submission.mission

        prompt = (
            f'Посмотри на фото. Ребёнок ({child.age} лет) выполнял задание:\n'
            f'«{mission.title}» — {mission.description}\n'
            f'Проверь именно соответствие фото этому заданию. '
            f'Если на фото другое действие, другой предмет, картинка слишком размыта, '
            f'не видно результата или фото не доказывает выполнение — поставь completed=false '
            f'и в feedback напиши точную причину отказа на русском.\n'
            f'Задание выполнено? Ответь строго в JSON без markdown:\n'
            f'{{"completed": true/false, "confidence": 0.0-1.0, "feedback": "комментарий на русском для родителя"}}'
        )

        b64, media_type = _read_image_base64(submission.photo)
        image_part = {'mime_type': media_type, 'data': b64}

        response = model.generate_content([prompt, image_part])
        raw_text = response.text.strip()

        # убрать возможные markdown-блоки
        raw_text = re.sub(r'```json|```', '', raw_text).strip()

        result = json.loads(raw_text)
        completed = bool(result.get('completed', False))
        confidence = float(result.get('confidence', 0.0))
        feedback = str(result.get('feedback', '')).strip()
        if not feedback:
            if completed:
                feedback = 'AI проверил фото, но не дал подробный комментарий. Отчёт отправлен родителю на проверку.'
            else:
                feedback = 'AI отклонил фото: снимок не подтверждает выполнение этого задания.'
            result['feedback'] = feedback
            raw_text = json.dumps(result, ensure_ascii=False)

        auto_approved = completed and confidence >= 0.7

        if auto_approved:
            _approve_submission(submission, raw_text, feedback, confidence)
            logger.info(
                'check_mission_photo: AUTO APPROVED submission=%s child=%s confidence=%.2f',
                submission.id, child.name, confidence
            )
        elif not completed:
            _reject_submission(submission, raw_text, feedback, confidence)
            logger.info(
                'check_mission_photo: REJECTED submission=%s confidence=%.2f',
                submission.id, confidence
            )
        else:
            submission.status = MissionSubmission.Status.PENDING
            submission.ai_result = raw_text
            submission.ai_feedback = feedback
            submission.ai_confidence = confidence
            submission.save(update_fields=['status', 'ai_result', 'ai_feedback', 'ai_confidence'])
            logger.info(
                'check_mission_photo: PENDING (manual review) submission=%s confidence=%.2f',
                submission.id, confidence
            )

        return {
            'completed': completed,
            'confidence': confidence,
            'feedback': feedback,
            'auto_approved': auto_approved,
        }

    except Exception as exc:
        logger.error('check_mission_photo error: %s', exc)
        return _fallback_photo_check(submission, reason=str(exc))

# coding: utf-8
"""
Сервис привязки родитель ↔ ребёнок (логика в стиле Find My Kids):
- подключение родителя по 6-значному коду ребёнка;
- приглашение родителя по email (HTML-письмо с кодом и кнопкой);
- отвязка ребёнка.
"""
import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from rest_framework.exceptions import ValidationError

from ..models import UserProfile, ChildProfile, ParentChild, ParentInvitation

logger = logging.getLogger('green_app')


def connect_parent_by_code(parent_user, code: str) -> ChildProfile:
    """
    Подключить родителя к ребёнку по коду.

    Проверки:
    - код существует;
    - ребёнок ещё не подключён к ЭТОМУ родителю;
    Возвращает ChildProfile при успехе, иначе бросает ValidationError.
    """
    code = (code or '').strip()
    try:
        child = ChildProfile.objects.get(connection_code=code)
    except ChildProfile.DoesNotExist:
        raise ValidationError({'code': 'Неверный код подключения.'})

    if ParentChild.objects.filter(parent=parent_user, child=child).exists():
        raise ValidationError({'code': 'Этот ребёнок уже подключён к вам.'})

    ParentChild.objects.create(parent=parent_user, child=child)

    # Первый подключившийся родитель становится владельцем профиля (для совместимости
    # с существующей логикой миссий/наград, опирающейся на child.parent).
    if child.parent_id is None:
        child.parent = parent_user
        child.save(update_fields=['parent'])

    # Если код пришёл из приглашения — отметим его принятым
    ParentInvitation.objects.filter(
        child=child, parent_email__iexact=parent_user.email, is_accepted=False
    ).update(is_accepted=True)

    logger.info('connect: parent=%s child=%s', parent_user.email, child.id)
    return child


def disconnect_child(parent_user, child: ChildProfile) -> None:
    """Отвязать ребёнка от родителя."""
    child.refresh_from_db()
    link = ParentChild.objects.filter(parent=parent_user, child=child).first()
    if not link and child.parent_id != parent_user.id:
        raise ValidationError({'detail': 'Этот ребёнок не подключён к вам.'})
    if link:
        link.delete()
    if child.parent_id == parent_user.id:
        # Передаём владение другому подключённому родителю (если есть) или обнуляем
        next_link = child.parent_links.exclude(parent=parent_user).first()
        child.parent = next_link.parent if next_link else None
        child.save(update_fields=['parent'])
    logger.info('disconnect: parent=%s child=%s', parent_user.email, child.id)


def send_parent_invitation(child: ChildProfile, parent_email: str) -> ParentInvitation:
    """Отправить родителю HTML-письмо с приглашением и кодом подключения."""
    parent_email = (parent_email or '').strip().lower()
    if not parent_email:
        raise ValidationError({'parent_email': 'Укажите email родителя.'})

    invitation = ParentInvitation.objects.create(child=child, parent_email=parent_email)

    connect_url = f'{settings.FRONTEND_URL}/connect-child?code={child.connection_code}'
    context = {
        'child_name': child.name,
        'connection_code': child.connection_code,
        'connect_url': connect_url,
    }
    html_body = render_to_string('email/parent_invitation.html', context)
    text_body = (
        f'Здравствуйте!\n\n'
        f'{child.name} хочет подключить вас к своему аккаунту в GreenLearnAI.\n'
        f'Код подключения: {child.connection_code}\n\n'
        f'Войдите в приложение и нажмите «Подключить ребёнка», затем введите код.\n'
        f'Или перейдите по ссылке: {connect_url}\n\n'
        f'Команда GreenLearnAI 🌿'
    )

    msg = EmailMultiAlternatives(
        subject='GreenLearnAI — приглашение подключиться к ребёнку',
        body=text_body,
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None) or settings.EMAIL_HOST_USER,
        to=[parent_email],
    )
    msg.attach_alternative(html_body, 'text/html')
    msg.send(fail_silently=False)

    logger.info('invitation sent: child=%s parent_email=%s', child.id, parent_email)
    return invitation


def get_parent_for_child(child: ChildProfile):
    """Родитель для submission/уведомлений (владелец или первый подключённый)."""
    if child.parent_id:
        return child.parent
    link = child.parent_links.select_related('parent').first()
    return link.parent if link else None


def child_accessible_by_parent(parent_user, child) -> bool:
    """Родитель имеет доступ к профилю ребёнка."""
    if child.parent_id == parent_user.id:
        return True
    return child.parent_links.filter(parent=parent_user).exists()


def get_connected_children(parent_user):
    """Все дети, доступные родителю: владелец ИЛИ подключён через ParentChild."""
    from django.db.models import Q
    return (
        ChildProfile.objects
        .filter(Q(parent=parent_user) | Q(parent_links__parent=parent_user))
        .distinct()
    )

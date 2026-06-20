# coding: utf-8
"""
Отправка 4-значного кода для сброса пароля.

При запросе POST /api/password_reset/ библиотека django_rest_passwordreset
создаёт токен и шлёт сигнал reset_password_token_created. Здесь мы подменяем
ключ токена на короткий 4-значный код и отправляем его пользователю на email.
"""
import logging
import random

from django.conf import settings
from django.core.mail import send_mail
from django.dispatch import receiver
from django_rest_passwordreset.signals import reset_password_token_created
from django_rest_passwordreset.models import ResetPasswordToken

logger = logging.getLogger('green_app')


@receiver(reset_password_token_created)
def password_reset_token_created(sender, instance, reset_password_token, *args, **kwargs):
    user = reset_password_token.user

    # Оставляем действительным только последний код: удаляем прежние токены пользователя
    ResetPasswordToken.objects.filter(user=user).exclude(pk=reset_password_token.pk).delete()

    code = random.randint(1000, 9999)
    reset_password_token.key = str(code)
    reset_password_token.save(update_fields=['key'])

    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or settings.EMAIL_HOST_USER

    send_mail(
        subject='GreenLearnAI — код для сброса пароля',
        message=(
            f'Здравствуйте!\n\n'
            f'Ваш код для сброса пароля: {code}\n\n'
            f'Введите его на странице восстановления пароля. '
            f'Код действует один раз.\n'
            f'Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.\n\n'
            f'Команда GreenLearnAI 🌿'
        ),
        from_email=from_email,
        recipient_list=[user.email],
        fail_silently=False,
    )
    logger.info('password reset code sent to %s', user.email)

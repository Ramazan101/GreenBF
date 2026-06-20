from django.apps import AppConfig


class GreenAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'green_app'

    def ready(self):
        from green_app import signals  # Инициализация сигналов
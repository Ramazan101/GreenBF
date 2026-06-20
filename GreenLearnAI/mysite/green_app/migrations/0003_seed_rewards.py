# coding: utf-8
from django.db import migrations

INITIAL_REWARDS = [
    {
        'title': 'Купон KFC на комбо',
        'description': 'Бесплатное детское комбо в любом KFC Бишкека.',
        'partner': 'KFC',
        'icon': '🍗',
        'cost_points': 300,
        'stock': 50,
    },
    {
        'title': 'Билет в кино',
        'description': 'Один билет на детский сеанс в кинотеатре-партнёре.',
        'partner': 'Кинотеатр',
        'icon': '🎬',
        'cost_points': 400,
        'stock': 30,
    },
    {
        'title': 'Книга на выбор',
        'description': 'Детская книга из специальной полки книжного магазина-партнёра.',
        'partner': 'Книжный магазин',
        'icon': '📚',
        'cost_points': 250,
        'stock': None,
    },
    {
        'title': 'Скидка 20% в кафе',
        'description': 'Скидка на семейный обед в кафе-партнёре.',
        'partner': 'Кафе',
        'icon': '🥗',
        'cost_points': 150,
        'stock': None,
    },
    {
        'title': 'Мороженое',
        'description': 'Бесплатное мороженое в точке партнёра.',
        'partner': 'Кафе',
        'icon': '🍦',
        'cost_points': 80,
        'stock': None,
    },
    {
        'title': 'Набор для творчества',
        'description': 'Краски, карандаши и альбом для юного художника.',
        'partner': 'GreenLearnAI',
        'icon': '🎨',
        'cost_points': 500,
        'stock': 20,
    },
]


def seed_rewards(apps, schema_editor):
    Reward = apps.get_model('green_app', 'Reward')
    if Reward.objects.exists():
        return
    for item in INITIAL_REWARDS:
        Reward.objects.create(**item)


def unseed_rewards(apps, schema_editor):
    Reward = apps.get_model('green_app', 'Reward')
    Reward.objects.filter(
        title__in=[item['title'] for item in INITIAL_REWARDS]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('green_app', '0002_reward_childprofile_spent_points_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_rewards, unseed_rewards),
    ]

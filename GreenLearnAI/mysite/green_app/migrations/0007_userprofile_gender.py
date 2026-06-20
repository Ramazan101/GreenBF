# Generated manually for parent profile gender.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('green_app', '0006_parentchildinvite'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='gender',
            field=models.CharField(blank=True, choices=[('male', 'Мужской'), ('female', 'Женский'), ('other', 'Другое')], max_length=20, verbose_name='Пол'),
        ),
    ]

# Generated manually for Find My Kids location tracking.

import django.core.validators
import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('green_app', '0004_childprofile_connection_code_childprofile_user_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='ChildLocation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('latitude', models.FloatField(validators=[django.core.validators.MinValueValidator(-90), django.core.validators.MaxValueValidator(90)], verbose_name='Latitude')),
                ('longitude', models.FloatField(validators=[django.core.validators.MinValueValidator(-180), django.core.validators.MaxValueValidator(180)], verbose_name='Longitude')),
                ('accuracy', models.FloatField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(0)], verbose_name='Accuracy meters')),
                ('altitude', models.FloatField(blank=True, null=True, verbose_name='Altitude')),
                ('speed', models.FloatField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(0)], verbose_name='Speed')),
                ('heading', models.FloatField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(360)], verbose_name='Heading')),
                ('battery_level', models.PositiveSmallIntegerField(blank=True, null=True, validators=[django.core.validators.MaxValueValidator(100)], verbose_name='Battery level')),
                ('source', models.CharField(choices=[('browser', 'Browser'), ('manual', 'Manual')], default='browser', max_length=20, verbose_name='Source')),
                ('recorded_at', models.DateTimeField(default=django.utils.timezone.now, verbose_name='Recorded at')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created at')),
                ('child', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='locations', to='green_app.childprofile', verbose_name='Child')),
            ],
            options={
                'verbose_name': 'Child location',
                'verbose_name_plural': 'Child locations',
                'ordering': ['-recorded_at', '-created_at'],
                'indexes': [
                    models.Index(fields=['child', 'recorded_at'], name='green_app_c_child_i_9d0b7a_idx'),
                    models.Index(fields=['created_at'], name='green_app_c_created_9b0e43_idx'),
                ],
            },
        ),
    ]

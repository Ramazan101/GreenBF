# Generated manually for parent-generated child invite codes.

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('green_app', '0005_childlocation'),
    ]

    operations = [
        migrations.CreateModel(
            name='ParentChildInvite',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(db_index=True, max_length=6, unique=True, verbose_name='Invite code')),
                ('child_name', models.CharField(blank=True, max_length=100, verbose_name='Child name')),
                ('child_age', models.PositiveSmallIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(2), django.core.validators.MaxValueValidator(17)], verbose_name='Child age')),
                ('accepted_at', models.DateTimeField(blank=True, null=True, verbose_name='Accepted at')),
                ('expires_at', models.DateTimeField(blank=True, null=True, verbose_name='Expires at')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created at')),
                ('accepted_child', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='accepted_invites', to='green_app.childprofile', verbose_name='Accepted child')),
                ('parent', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='child_invites', to=settings.AUTH_USER_MODEL, verbose_name='Parent')),
            ],
            options={
                'verbose_name': 'Parent child invite',
                'verbose_name_plural': 'Parent child invites',
                'ordering': ['-created_at'],
            },
        ),
    ]

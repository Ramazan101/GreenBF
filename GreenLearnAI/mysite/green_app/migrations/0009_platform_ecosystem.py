# Generated manually for GreenLearnAI platform ecosystem expansion.

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('green_app', '0008_parentchildinvite_three_day_family_code'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='role',
            field=models.CharField(
                choices=[
                    ('parent', 'Родитель'),
                    ('child', 'Ребёнок'),
                    ('admin', 'Администратор'),
                    ('teacher', 'Teacher'),
                    ('school_admin', 'School admin'),
                    ('university_admin', 'University admin'),
                    ('student', 'Student'),
                    ('brand_partner', 'Brand partner'),
                ],
                default='parent',
                max_length=20,
                verbose_name='Роль',
            ),
        ),
        migrations.CreateModel(
            name='School',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('city', models.CharField(blank=True, max_length=100)),
                ('district', models.CharField(blank=True, max_length=100)),
                ('address', models.CharField(blank=True, max_length=255)),
                ('points_balance', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('admin', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='admin_schools', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='University',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('city', models.CharField(blank=True, max_length=100)),
                ('points_balance', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('admin', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='admin_universities', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['name'],
                'verbose_name_plural': 'Universities',
            },
        ),
        migrations.CreateModel(
            name='SchoolChallenge',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('start_date', models.DateField()),
                ('end_date', models.DateField()),
                ('prize', models.CharField(blank=True, max_length=200)),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('active', 'Active'), ('finished', 'Finished')], default='active', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-start_date', 'title'],
            },
        ),
        migrations.CreateModel(
            name='BrandPartner',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('brand_name', models.CharField(max_length=200)),
                ('logo', models.ImageField(blank=True, null=True, upload_to='brand_logos/')),
                ('description', models.TextField(blank=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='brand_partner_profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='ClassRoom',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=60)),
                ('points_balance', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('school', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='classrooms', to='green_app.school')),
                ('teacher', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='teacher_classrooms', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['school__name', 'name'],
                'unique_together': {('school', 'name')},
            },
        ),
        migrations.CreateModel(
            name='StudentProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('total_points', models.PositiveIntegerField(default=0)),
                ('spent_points', models.PositiveIntegerField(default=0)),
                ('level', models.PositiveSmallIntegerField(default=1)),
                ('streak_days', models.PositiveSmallIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('class_room', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='student_profiles', to='green_app.classroom')),
                ('school', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='student_profiles', to='green_app.school')),
                ('university', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='student_profiles', to='green_app.university')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='student_profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='ChallengeParticipant',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('points', models.PositiveIntegerField(default=0)),
                ('rank', models.PositiveIntegerField(default=0)),
                ('challenge', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='participants', to='green_app.schoolchallenge')),
                ('school', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='challenge_participants', to='green_app.school')),
            ],
            options={
                'ordering': ['rank', '-points'],
                'unique_together': {('challenge', 'school')},
            },
        ),
        migrations.CreateModel(
            name='BrandMission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('points', models.PositiveIntegerField(default=0)),
                ('reward_description', models.CharField(blank=True, max_length=255)),
                ('is_active', models.BooleanField(default=True)),
                ('start_date', models.DateField(blank=True, null=True)),
                ('end_date', models.DateField(blank=True, null=True)),
                ('partner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='missions', to='green_app.brandpartner')),
            ],
            options={
                'ordering': ['-is_active', 'title'],
            },
        ),
        migrations.CreateModel(
            name='GreenPointWallet',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('owner_type', models.CharField(choices=[('parent', 'Parent'), ('school', 'School'), ('university', 'University'), ('brand', 'Brand'), ('platform', 'Platform')], max_length=20)),
                ('balance', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('brand', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='wallets', to='green_app.brandpartner')),
                ('owner', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='greenpoint_wallets', to=settings.AUTH_USER_MODEL)),
                ('school', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='wallets', to='green_app.school')),
                ('university', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='wallets', to='green_app.university')),
            ],
        ),
        migrations.CreateModel(
            name='GreenPointTransaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.IntegerField()),
                ('transaction_type', models.CharField(choices=[('purchase', 'Purchase'), ('distribute', 'Distribute'), ('award', 'Award'), ('spend', 'Spend'), ('refund', 'Refund')], max_length=20)),
                ('description', models.CharField(blank=True, max_length=255)),
                ('source', models.CharField(blank=True, max_length=120)),
                ('target', models.CharField(blank=True, max_length=120)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('related_child', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='greenpoint_transactions', to='green_app.childprofile')),
                ('related_school', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='greenpoint_transactions', to='green_app.school')),
                ('related_user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='greenpoint_transactions', to=settings.AUTH_USER_MODEL)),
                ('wallet', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='transactions', to='green_app.greenpointwallet')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]

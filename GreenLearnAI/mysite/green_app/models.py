# coding: utf-8
from datetime import timedelta

from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.utils import timezone


class UserProfile(AbstractUser):
    """Профиль пользователя (родитель или администратор)"""

    class Role(models.TextChoices):
        PARENT = 'parent', 'Родитель'
        CHILD = 'child', 'Ребёнок'
        ADMIN = 'admin', 'Администратор'
        TEACHER = 'teacher', 'Teacher'
        SCHOOL_ADMIN = 'school_admin', 'School admin'
        UNIVERSITY_ADMIN = 'university_admin', 'University admin'
        STUDENT = 'student', 'Student'
        BRAND_PARTNER = 'brand_partner', 'Brand partner'

    class Gender(models.TextChoices):
        MALE = 'male', 'Мужской'
        FEMALE = 'female', 'Женский'
        OTHER = 'other', 'Другое'

    email = models.EmailField(unique=True, verbose_name='Email')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True, verbose_name='Аватар')
    gender = models.CharField(
        max_length=20, choices=Gender.choices, blank=True, verbose_name='Пол'
    )
    role = models.CharField(
        max_length=20, choices=Role.choices, default=Role.PARENT, verbose_name='Роль'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлён')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = 'Профиль пользователя'
        verbose_name_plural = 'Профили пользователей'

    def __str__(self):
        return f'{self.email} ({self.get_role_display()})'


class ChildProfile(models.Model):
    """
    Профиль ребёнка.

    Может существовать в двух режимах:
    - создан родителем (parent задан, user пуст) — классический сценарий;
    - самостоятельный аккаунт ребёнка (user задан) — режим Find My Kids,
      подключается к родителю(ям) через ParentChild и connection_code.
    """
    parent = models.ForeignKey(
        UserProfile, on_delete=models.CASCADE,
        related_name='children', verbose_name='Родитель (владелец)',
        null=True, blank=True,
    )
    user = models.OneToOneField(
        UserProfile, on_delete=models.CASCADE,
        related_name='child_profile', verbose_name='Аккаунт ребёнка',
        null=True, blank=True,
    )
    connection_code = models.CharField(
        max_length=6, unique=True, null=True, blank=True, db_index=True,
        verbose_name='Код подключения',
    )
    name = models.CharField(max_length=100, verbose_name='Имя')
    age = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(2), MaxValueValidator(17)],
        verbose_name='Возраст'
    )
    avatar = models.ImageField(upload_to='children/', null=True, blank=True, verbose_name='Аватар')
    total_points = models.PositiveIntegerField(default=0, verbose_name='Всего баллов')
    spent_points = models.PositiveIntegerField(default=0, verbose_name='Потрачено баллов')
    level = models.PositiveSmallIntegerField(default=1, verbose_name='Уровень')
    streak_days = models.PositiveSmallIntegerField(default=0, verbose_name='Серия дней')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')

    class Meta:
        verbose_name = 'Профиль ребёнка'
        verbose_name_plural = 'Профили детей'

    @property
    def points_balance(self) -> int:
        """Доступные GreenPoints (заработано минус потрачено)."""
        return max(self.total_points - self.spent_points, 0)

    @staticmethod
    def generate_connection_code() -> str:
        """Сгенерировать уникальный 6-значный код подключения."""
        import random
        while True:
            code = f'{random.randint(100000, 999999)}'
            if not ChildProfile.objects.filter(connection_code=code).exists():
                return code

    def save(self, *args, **kwargs):
        if not self.connection_code:
            self.connection_code = self.generate_connection_code()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.name} (возраст {self.age}, уровень {self.level})'


class ParentChild(models.Model):
    """Связь родитель ↔ ребёнок (как в Find My Kids: ребёнок может быть привязан к нескольким родителям)."""
    parent = models.ForeignKey(
        UserProfile, on_delete=models.CASCADE,
        related_name='parent_links', verbose_name='Родитель',
    )
    child = models.ForeignKey(
        ChildProfile, on_delete=models.CASCADE,
        related_name='parent_links', verbose_name='Ребёнок',
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Подключён')

    class Meta:
        unique_together = ('parent', 'child')
        verbose_name = 'Связь родитель-ребёнок'
        verbose_name_plural = 'Связи родитель-ребёнок'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.parent.email} ↔ {self.child.name}'


class ParentInvitation(models.Model):
    """Приглашение родителя ребёнком по email (для отслеживания и письма с кодом)."""
    child = models.ForeignKey(
        ChildProfile, on_delete=models.CASCADE,
        related_name='invitations', verbose_name='Ребёнок',
    )
    parent_email = models.EmailField(verbose_name='Email родителя')
    is_accepted = models.BooleanField(default=False, verbose_name='Принято')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Отправлено')

    class Meta:
        verbose_name = 'Приглашение родителю'
        verbose_name_plural = 'Приглашения родителям'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.child.name} → {self.parent_email}'


class ParentChildInvite(models.Model):
    """Parent-generated invite code that a child enters in the child app."""

    INVITE_TTL_DAYS = 3
    CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

    parent = models.ForeignKey(
        UserProfile, on_delete=models.CASCADE, related_name='child_invites',
        verbose_name='Parent',
    )
    code = models.CharField(max_length=7, unique=True, db_index=True, verbose_name='Invite code')
    child_name = models.CharField(max_length=100, blank=True, verbose_name='Child name')
    child_age = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[MinValueValidator(2), MaxValueValidator(17)],
        verbose_name='Child age',
    )
    accepted_child = models.ForeignKey(
        ChildProfile, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='accepted_invites', verbose_name='Accepted child',
    )
    accepted_at = models.DateTimeField(null=True, blank=True, verbose_name='Accepted at')
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name='Expires at')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created at')

    class Meta:
        verbose_name = 'Parent child invite'
        verbose_name_plural = 'Parent child invites'
        ordering = ['-created_at']

    @property
    def is_expired(self) -> bool:
        return bool(self.expires_at and timezone.now() > self.expires_at)

    @property
    def is_accepted(self) -> bool:
        return bool(self.accepted_at and self.accepted_child_id)

    @property
    def is_active(self) -> bool:
        return not self.is_expired

    @staticmethod
    def generate_code() -> str:
        import secrets
        while True:
            raw = ''.join(secrets.choice(ParentChildInvite.CODE_ALPHABET) for _ in range(6))
            code = f'{raw[:3]}-{raw[3:]}'
            if not ParentChildInvite.objects.filter(code=code).exists():
                return code

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self.generate_code()
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=self.INVITE_TTL_DAYS)
        super().save(*args, **kwargs)

    def __str__(self):
        child_label = self.child_name or self.accepted_child or 'child'
        return f'{self.parent.email} -> {child_label} [{self.code}]'


class ChildLocation(models.Model):
    """Last known and historical child location pings for the Find My Kids flow."""

    class Source(models.TextChoices):
        BROWSER = 'browser', 'Browser'
        MANUAL = 'manual', 'Manual'

    child = models.ForeignKey(
        ChildProfile, on_delete=models.CASCADE, related_name='locations',
        verbose_name='Child',
    )
    latitude = models.FloatField(
        validators=[MinValueValidator(-90), MaxValueValidator(90)],
        verbose_name='Latitude',
    )
    longitude = models.FloatField(
        validators=[MinValueValidator(-180), MaxValueValidator(180)],
        verbose_name='Longitude',
    )
    accuracy = models.FloatField(
        null=True, blank=True, validators=[MinValueValidator(0)],
        verbose_name='Accuracy meters',
    )
    altitude = models.FloatField(null=True, blank=True, verbose_name='Altitude')
    speed = models.FloatField(
        null=True, blank=True, validators=[MinValueValidator(0)],
        verbose_name='Speed',
    )
    heading = models.FloatField(
        null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(360)],
        verbose_name='Heading',
    )
    battery_level = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[MaxValueValidator(100)],
        verbose_name='Battery level',
    )
    source = models.CharField(
        max_length=20, choices=Source.choices, default=Source.BROWSER,
        verbose_name='Source',
    )
    recorded_at = models.DateTimeField(default=timezone.now, verbose_name='Recorded at')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created at')

    class Meta:
        verbose_name = 'Child location'
        verbose_name_plural = 'Child locations'
        ordering = ['-recorded_at', '-created_at']
        indexes = [
            models.Index(fields=['child', 'recorded_at'], name='green_app_c_child_i_9d0b7a_idx'),
            models.Index(fields=['created_at'], name='green_app_c_created_9b0e43_idx'),
        ]

    def __str__(self):
        return f'{self.child.name}: {self.latitude:.5f}, {self.longitude:.5f}'


class MissionCategory(models.Model):
    """Категория заданий"""
    name = models.CharField(max_length=100, verbose_name='Название')
    slug = models.SlugField(unique=True, verbose_name='Slug')
    description = models.TextField(blank=True, verbose_name='Описание')
    icon = models.CharField(max_length=100, blank=True, verbose_name='Иконка')

    class Meta:
        verbose_name = 'Категория заданий'
        verbose_name_plural = 'Категории заданий'

    def __str__(self):
        return self.name


class Mission(models.Model):
    """Задание"""

    class Difficulty(models.TextChoices):
        EASY = 'easy', 'Лёгкий'
        MEDIUM = 'medium', 'Средний'
        HARD = 'hard', 'Сложный'

    title = models.CharField(max_length=200, verbose_name='Название')
    description = models.TextField(verbose_name='Описание')
    category = models.ForeignKey(
        MissionCategory, on_delete=models.SET_NULL,
        null=True, related_name='missions', verbose_name='Категория'
    )
    points = models.PositiveIntegerField(verbose_name='Баллы')
    difficulty = models.CharField(
        max_length=10, choices=Difficulty.choices, default=Difficulty.EASY, verbose_name='Сложность'
    )
    min_age = models.PositiveSmallIntegerField(
        default=2, validators=[MinValueValidator(2), MaxValueValidator(17)],
        verbose_name='Минимальный возраст'
    )
    max_age = models.PositiveSmallIntegerField(
        default=10, validators=[MinValueValidator(2), MaxValueValidator(17)],
        verbose_name='Максимальный возраст'
    )
    is_active = models.BooleanField(default=True, verbose_name='Активно')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')

    class Meta:
        verbose_name = 'Задание'
        verbose_name_plural = 'Задания'

    def __str__(self):
        return self.title


class MissionSubmission(models.Model):
    """Выполненное задание"""

    class Status(models.TextChoices):
        PENDING = 'pending', 'На проверке'
        APPROVED = 'approved', 'Одобрено'
        REJECTED = 'rejected', 'Отклонено'
        AI_REVIEW = 'ai_review', 'AI проверка'

    child = models.ForeignKey(
        ChildProfile, on_delete=models.CASCADE,
        related_name='submissions', verbose_name='Ребёнок'
    )
    mission = models.ForeignKey(
        Mission, on_delete=models.CASCADE,
        related_name='submissions', verbose_name='Задание'
    )
    parent = models.ForeignKey(
        UserProfile, on_delete=models.CASCADE,
        related_name='submissions', verbose_name='Родитель'
    )
    photo = models.ImageField(
        upload_to='submissions/', null=True, blank=True, verbose_name='Фото'
    )
    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.PENDING, verbose_name='Статус'
    )
    ai_result = models.TextField(blank=True, verbose_name='Результат AI')
    ai_feedback = models.TextField(blank=True, verbose_name='Обратная связь AI')
    ai_confidence = models.FloatField(null=True, blank=True, verbose_name='Уверенность AI')
    points_awarded = models.PositiveIntegerField(default=0, verbose_name='Начислено баллов')
    reviewed_at = models.DateTimeField(null=True, blank=True, verbose_name='Проверено')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')

    class Meta:
        verbose_name = 'Выполненное задание'
        verbose_name_plural = 'Выполненные задания'

    def __str__(self):
        return f'{self.child.name} — {self.mission.title} ({self.get_status_display()})'


class Achievement(models.Model):
    """Достижение"""
    title = models.CharField(max_length=200, verbose_name='Название')
    description = models.TextField(verbose_name='Описание')
    icon = models.CharField(max_length=100, blank=True, verbose_name='Иконка')
    required_points = models.PositiveIntegerField(default=0, verbose_name='Требуемые баллы')
    required_missions_count = models.PositiveIntegerField(
        default=0, verbose_name='Требуемое кол-во заданий'
    )
    is_active = models.BooleanField(default=True, verbose_name='Активно')

    class Meta:
        verbose_name = 'Достижение'
        verbose_name_plural = 'Достижения'

    def __str__(self):
        return self.title


class ChildAchievement(models.Model):
    """Разблокированное достижение ребёнка"""
    child = models.ForeignKey(
        ChildProfile, on_delete=models.CASCADE,
        related_name='child_achievements', verbose_name='Ребёнок'
    )
    achievement = models.ForeignKey(
        Achievement, on_delete=models.CASCADE,
        related_name='child_achievements', verbose_name='Достижение'
    )
    unlocked_at = models.DateTimeField(auto_now_add=True, verbose_name='Разблокировано')

    class Meta:
        unique_together = ('child', 'achievement')
        verbose_name = 'Достижение ребёнка'
        verbose_name_plural = 'Достижения детей'

    def __str__(self):
        return f'{self.child.name} — {self.achievement.title}'


class AIChatMessage(models.Model):
    """Сообщение AI-чата"""

    class Role(models.TextChoices):
        USER = 'user', 'Пользователь'
        ASSISTANT = 'assistant', 'Ассистент'

    parent = models.ForeignKey(
        UserProfile, on_delete=models.CASCADE,
        related_name='chat_messages', verbose_name='Родитель'
    )
    child = models.ForeignKey(
        ChildProfile, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='chat_messages', verbose_name='Ребёнок'
    )
    role = models.CharField(
        max_length=10, choices=Role.choices, verbose_name='Роль'
    )
    message = models.TextField(verbose_name='Сообщение')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')

    class Meta:
        verbose_name = 'Сообщение чата'
        verbose_name_plural = 'Сообщения чата'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.parent.email} [{self.role}] {self.created_at:%Y-%m-%d %H:%M}'


class Reward(models.Model):
    """Награда в магазине GreenPoints (купон партнёра, билет, книга и т.д.)"""
    title = models.CharField(max_length=200, verbose_name='Название')
    description = models.TextField(blank=True, verbose_name='Описание')
    partner = models.CharField(max_length=100, blank=True, verbose_name='Партнёр')
    icon = models.CharField(max_length=20, blank=True, verbose_name='Иконка (эмодзи)')
    cost_points = models.PositiveIntegerField(verbose_name='Стоимость в GreenPoints')
    stock = models.PositiveIntegerField(
        null=True, blank=True, verbose_name='Остаток (пусто = безлимит)'
    )
    is_active = models.BooleanField(default=True, verbose_name='Активна')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создана')

    class Meta:
        verbose_name = 'Награда'
        verbose_name_plural = 'Награды'
        ordering = ['cost_points']

    def __str__(self):
        return f'{self.title} ({self.cost_points} GP)'


class RewardRedemption(models.Model):
    """Обмен GreenPoints на награду"""
    child = models.ForeignKey(
        ChildProfile, on_delete=models.CASCADE,
        related_name='redemptions', verbose_name='Ребёнок'
    )
    reward = models.ForeignKey(
        Reward, on_delete=models.PROTECT,
        related_name='redemptions', verbose_name='Награда'
    )
    parent = models.ForeignKey(
        UserProfile, on_delete=models.CASCADE,
        related_name='redemptions', verbose_name='Родитель'
    )
    points_spent = models.PositiveIntegerField(verbose_name='Списано баллов')
    code = models.CharField(max_length=20, unique=True, verbose_name='Код купона')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')

    class Meta:
        verbose_name = 'Обмен награды'
        verbose_name_plural = 'Обмены наград'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.child.name} — {self.reward.title} [{self.code}]'


class VoiceDiaryEntry(models.Model):
    """Запись голосового дневника ребёнка"""
    parent = models.ForeignKey(
        UserProfile, on_delete=models.CASCADE,
        related_name='diary_entries', verbose_name='Родитель'
    )
    child = models.ForeignKey(
        ChildProfile, on_delete=models.CASCADE,
        related_name='diary_entries', verbose_name='Ребёнок'
    )
    text = models.TextField(verbose_name='Текст записи')
    word_count = models.PositiveIntegerField(default=0, verbose_name='Кол-во слов')
    ai_feedback = models.TextField(blank=True, verbose_name='Отзыв AI')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создана')

    class Meta:
        verbose_name = 'Запись дневника'
        verbose_name_plural = 'Записи дневника'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.child.name} — дневник {self.created_at:%Y-%m-%d}'


class Certificate(models.Model):
    """Именной сертификат ребёнка за большие миссии"""
    child = models.ForeignKey(
        ChildProfile, on_delete=models.CASCADE,
        related_name='certificates', verbose_name='Ребёнок'
    )
    code = models.SlugField(max_length=50, verbose_name='Код сертификата')
    title = models.CharField(max_length=200, verbose_name='Название')
    description = models.TextField(blank=True, verbose_name='Описание')
    icon = models.CharField(max_length=20, blank=True, verbose_name='Иконка (эмодзи)')
    issued_at = models.DateTimeField(auto_now_add=True, verbose_name='Выдан')

    class Meta:
        unique_together = ('child', 'code')
        verbose_name = 'Сертификат'
        verbose_name_plural = 'Сертификаты'
        ordering = ['-issued_at']

    def __str__(self):
        return f'{self.child.name} — {self.title}'


class School(models.Model):
    name = models.CharField(max_length=200)
    city = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=100, blank=True)
    address = models.CharField(max_length=255, blank=True)
    admin = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='admin_schools',
    )
    points_balance = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class University(models.Model):
    name = models.CharField(max_length=200)
    city = models.CharField(max_length=100, blank=True)
    admin = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='admin_universities',
    )
    points_balance = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Universities'

    def __str__(self):
        return self.name


class ClassRoom(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='classrooms')
    name = models.CharField(max_length=60)
    teacher = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='teacher_classrooms',
    )
    points_balance = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('school', 'name')
        ordering = ['school__name', 'name']

    def __str__(self):
        return f'{self.school.name} - {self.name}'


class StudentProfile(models.Model):
    user = models.OneToOneField(
        UserProfile, on_delete=models.CASCADE, related_name='student_profile'
    )
    school = models.ForeignKey(
        School, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='student_profiles',
    )
    class_room = models.ForeignKey(
        ClassRoom, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='student_profiles',
    )
    university = models.ForeignKey(
        University, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='student_profiles',
    )
    total_points = models.PositiveIntegerField(default=0)
    spent_points = models.PositiveIntegerField(default=0)
    level = models.PositiveSmallIntegerField(default=1)
    streak_days = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def points_balance(self):
        return max(self.total_points - self.spent_points, 0)

    def __str__(self):
        return self.user.email


class SchoolChallenge(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        ACTIVE = 'active', 'Active'
        FINISHED = 'finished', 'Finished'

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    prize = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_date', 'title']

    def __str__(self):
        return self.title


class ChallengeParticipant(models.Model):
    challenge = models.ForeignKey(
        SchoolChallenge, on_delete=models.CASCADE, related_name='participants'
    )
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='challenge_participants')
    points = models.PositiveIntegerField(default=0)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('challenge', 'school')
        ordering = ['rank', '-points']

    def __str__(self):
        return f'{self.challenge.title} - {self.school.name}'


class BrandPartner(models.Model):
    user = models.OneToOneField(
        UserProfile, on_delete=models.CASCADE, related_name='brand_partner_profile'
    )
    brand_name = models.CharField(max_length=200)
    logo = models.ImageField(upload_to='brand_logos/', null=True, blank=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.brand_name


class BrandMission(models.Model):
    partner = models.ForeignKey(BrandPartner, on_delete=models.CASCADE, related_name='missions')
    title = models.CharField(max_length=200)
    description = models.TextField()
    points = models.PositiveIntegerField(default=0)
    reward_description = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ['-is_active', 'title']

    def __str__(self):
        return self.title


class GreenPointWallet(models.Model):
    class OwnerType(models.TextChoices):
        PARENT = 'parent', 'Parent'
        SCHOOL = 'school', 'School'
        UNIVERSITY = 'university', 'University'
        BRAND = 'brand', 'Brand'
        PLATFORM = 'platform', 'Platform'

    owner = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='greenpoint_wallets',
    )
    owner_type = models.CharField(max_length=20, choices=OwnerType.choices)
    school = models.ForeignKey(School, on_delete=models.CASCADE, null=True, blank=True, related_name='wallets')
    university = models.ForeignKey(University, on_delete=models.CASCADE, null=True, blank=True, related_name='wallets')
    brand = models.ForeignKey(BrandPartner, on_delete=models.CASCADE, null=True, blank=True, related_name='wallets')
    balance = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.owner_type}: {self.balance} GP'


class GreenPointTransaction(models.Model):
    class TransactionType(models.TextChoices):
        PURCHASE = 'purchase', 'Purchase'
        DISTRIBUTE = 'distribute', 'Distribute'
        AWARD = 'award', 'Award'
        SPEND = 'spend', 'Spend'
        REFUND = 'refund', 'Refund'

    wallet = models.ForeignKey(
        GreenPointWallet, on_delete=models.CASCADE, related_name='transactions',
        null=True, blank=True,
    )
    amount = models.IntegerField()
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices)
    description = models.CharField(max_length=255, blank=True)
    source = models.CharField(max_length=120, blank=True)
    target = models.CharField(max_length=120, blank=True)
    related_user = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='greenpoint_transactions',
    )
    related_child = models.ForeignKey(
        ChildProfile, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='greenpoint_transactions',
    )
    related_school = models.ForeignKey(
        School, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='greenpoint_transactions',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.transaction_type} {self.amount} GP'

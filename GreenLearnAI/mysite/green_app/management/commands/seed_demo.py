# coding: utf-8
"""
Демо-наполнение для презентации жюри: один запуск — и приложение «живое».

    python manage.py seed_demo

Создаёт демо-родителя, детей (в т.ч. один child-аккаунт с логином),
категории, задания, выполнения с разными статусами, дневник, достижения,
сертификаты и обмен награды. Идемпотентно: пересоздаёт демо-данные при повторе.
"""
import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from green_app.models import (
    UserProfile, ChildProfile, ParentChild, MissionCategory, Mission,
    MissionSubmission, Achievement, ChildAchievement, Reward, RewardRedemption,
    VoiceDiaryEntry, Certificate,
    School, University, ClassRoom, StudentProfile, SchoolChallenge,
    ChallengeParticipant, BrandPartner, BrandMission,
    GreenPointWallet, GreenPointTransaction,
)
from green_app.services.gamification import update_level, unlock_achievements
from green_app.services.certificates import check_and_issue_certificates

DEMO_PASSWORD = 'demo12345'
DEMO_PARENT_EMAIL = 'demo@greenlearn.ai'
DEMO_CHILD_EMAIL = 'aigerim@greenlearn.ai'
DEMO_TEACHER_EMAIL = 'teacher@greenlearn.ai'
DEMO_SCHOOL_EMAIL = 'school@greenlearn.ai'
DEMO_STUDENT_EMAIL = 'student@greenlearn.ai'
DEMO_UNIVERSITY_EMAIL = 'university@greenlearn.ai'
DEMO_BRAND_EMAIL = 'kfc@greenlearn.ai'

CATEGORIES = [
    ('Экология', 'eco', '🌿'),
    ('Образование', 'education', '📚'),
    ('Здоровье', 'health', '💪'),
    ('Доброта', 'kindness', '💚'),
    ('Творчество', 'creative', '🎨'),
]

MISSIONS = [
    # (title, description, category_slug, points, difficulty, min_age, max_age)
    ('Убрать мусор во дворе', 'Собери мусор во дворе и выброси в контейнер. Сделай фото до и после.', 'eco', 50, 'easy', 5, 17),
    ('Посадить растение', 'Посади дерево или цветок и полей его. Сфотографируй результат.', 'eco', 80, 'medium', 6, 17),
    ('Сдать батарейки на переработку', 'Собери использованные батарейки и отнеси в пункт приёма.', 'eco', 70, 'medium', 8, 17),
    ('Неделя без пластика', 'Откажись от одноразового пластика на 7 дней.', 'eco', 120, 'hard', 10, 17),
    ('Прочитать страницу и пересказать', 'Прочитай страницу книги и перескажи её голосом боту.', 'education', 40, 'easy', 6, 12),
    ('Выучить 5 слов на кыргызском', 'Выучи 5 новых кыргызских слов о природе и назови их.', 'education', 45, 'easy', 5, 14),
    ('Решить 10 примеров', 'Реши 10 примеров по математике и покажи решение.', 'education', 50, 'medium', 7, 14),
    ('Утренняя зарядка', 'Сделай утреннюю зарядку 10 минут.', 'health', 30, 'easy', 4, 17),
    ('8 стаканов воды', 'Выпей 8 стаканов воды за день.', 'health', 25, 'easy', 5, 17),
    ('Час без телефона', 'Проведи час без телефона — почитай или погуляй.', 'health', 35, 'easy', 6, 17),
    ('Помочь маме', 'Помоги родителям по дому: убери комнату или помой посуду.', 'kindness', 40, 'easy', 4, 17),
    ('Покормить бездомное животное', 'Покорми бездомную кошку или собаку (безопасно, со взрослым).', 'kindness', 45, 'easy', 7, 17),
    ('Нарисовать эко-плакат', 'Нарисуй плакат о защите природы.', 'creative', 55, 'medium', 5, 14),
    ('Поделка из вторсырья', 'Сделай поделку из переработанных материалов.', 'creative', 60, 'medium', 6, 15),
]

ACHIEVEMENTS = [
    ('Первые шаги', 'Выполнено первое задание', '🌱', 0, 1),
    ('Эко-новичок', 'Заработано 100 GreenPoints', '🍃', 100, 0),
    ('Трудяга', 'Выполнено 5 заданий', '⭐', 0, 5),
    ('Защитник природы', 'Заработано 300 GreenPoints', '🌍', 300, 0),
    ('Супергерой добра', 'Выполнено 10 заданий', '🦸', 0, 10),
]

DIARY_TEXTS = [
    ('Сегодня я убрал мусор во дворе и помог соседке донести сумки. Было приятно!',
     'Молодец! Ты рассказал целым предложением и сделал сразу два добрых дела. 🌟 Завтра попробуй добавить, что ты при этом почувствовал.'),
    ('Я посадил цветок и поливал его. Ещё выучил три слова на кыргызском.',
     'Здорово, что ты заботишься о природе и учишь родной язык! 💚 В следующий раз назови слова, которые выучил.'),
]


class Command(BaseCommand):
    help = 'Заполняет БД демо-данными для презентации'

    @transaction.atomic
    def handle(self, *args, **options):
        def ensure_demo_user(email, username, role):
            user, _ = UserProfile.objects.get_or_create(
                email=email,
                defaults={'username': username, 'role': role},
            )
            user.username = username
            user.role = role
            user.set_password(DEMO_PASSWORD)
            user.save()
            return user

        self.stdout.write('Создаю категории...')
        cats = {}
        for name, slug, icon in CATEGORIES:
            cat, _ = MissionCategory.objects.get_or_create(
                slug=slug, defaults={'name': name, 'icon': icon}
            )
            cats[slug] = cat

        self.stdout.write('Создаю задания...')
        missions = {}
        for title, desc, slug, pts, diff, mn, mx in MISSIONS:
            m, _ = Mission.objects.get_or_create(
                title=title,
                defaults={
                    'description': desc, 'category': cats[slug], 'points': pts,
                    'difficulty': diff, 'min_age': mn, 'max_age': mx, 'is_active': True,
                },
            )
            missions[title] = m

        self.stdout.write('Создаю достижения...')
        for title, desc, icon, pts, cnt in ACHIEVEMENTS:
            Achievement.objects.get_or_create(
                title=title,
                defaults={'description': desc, 'icon': icon,
                          'required_points': pts, 'required_missions_count': cnt, 'is_active': True},
            )

        self.stdout.write('Создаю демо-родителя...')
        parent, _ = UserProfile.objects.get_or_create(
            email=DEMO_PARENT_EMAIL,
            defaults={'username': 'Демо Родитель', 'role': UserProfile.Role.PARENT},
        )
        parent.set_password(DEMO_PASSWORD)
        parent.role = UserProfile.Role.PARENT
        parent.save()

        # child-аккаунт с логином
        child_user, _ = UserProfile.objects.get_or_create(
            email=DEMO_CHILD_EMAIL,
            defaults={'username': 'Айгерим', 'role': UserProfile.Role.CHILD},
        )
        child_user.set_password(DEMO_PASSWORD)
        child_user.role = UserProfile.Role.CHILD
        child_user.save()

        self.stdout.write('Создаю профили детей...')
        aigerim, _ = ChildProfile.objects.get_or_create(
            user=child_user, defaults={'name': 'Айгерим', 'age': 9, 'parent': parent}
        )
        aigerim.parent = parent
        aigerim.save()

        bekzat, _ = ChildProfile.objects.get_or_create(
            parent=parent, name='Бекзат', defaults={'age': 11}
        )
        aizhan, _ = ChildProfile.objects.get_or_create(
            parent=parent, name='Айжан', defaults={'age': 7}
        )
        children = [aigerim, bekzat, aizhan]

        for child in children:
            ParentChild.objects.get_or_create(parent=parent, child=child)

        # Чистим прежние демо-данные детей для идемпотентности
        self.stdout.write('Сбрасываю прежние демо-выполнения...')
        MissionSubmission.objects.filter(child__in=children).delete()
        ChildAchievement.objects.filter(child__in=children).delete()
        VoiceDiaryEntry.objects.filter(child__in=children).delete()
        Certificate.objects.filter(child__in=children).delete()
        RewardRedemption.objects.filter(child__in=children).delete()
        for child in children:
            child.total_points = 0
            child.spent_points = 0
            child.level = 1
            child.save(update_fields=['total_points', 'spent_points', 'level'])

        self.stdout.write('Создаю выполненные задания...')
        mission_list = list(missions.values())
        now = timezone.now()

        # Сценарии активности: имя -> (кол-во одобренных, серия дней)
        plans = {'Айгерим': (9, 12), 'Бекзат': (6, 5), 'Айжан': (3, 3)}

        for child in children:
            approved_n, streak = plans.get(child.name, (3, 2))
            chosen = random.sample(mission_list, min(approved_n, len(mission_list)))
            total = 0
            for i, mission in enumerate(chosen):
                reviewed = now - timedelta(days=i * 2)
                MissionSubmission.objects.create(
                    child=child, mission=mission, parent=parent,
                    status=MissionSubmission.Status.APPROVED,
                    points_awarded=mission.points,
                    ai_feedback='Отличная работа! Фото подтверждает выполнение задания.',
                    ai_confidence=round(random.uniform(0.82, 0.98), 2),
                    reviewed_at=reviewed,
                )
                total += mission.points

            # На проверке / AI-ревью / отклонено — для живых вкладок
            extra = [m for m in mission_list if m not in chosen]
            if extra:
                MissionSubmission.objects.create(
                    child=child, mission=extra[0], parent=parent,
                    status=MissionSubmission.Status.PENDING,
                )
            if len(extra) > 1:
                MissionSubmission.objects.create(
                    child=child, mission=extra[1], parent=parent,
                    status=MissionSubmission.Status.AI_REVIEW,
                    ai_feedback='AI распознаёт объекты на фото...',
                    ai_confidence=0.61,
                )

            child.total_points = total
            child.streak_days = streak
            child.save(update_fields=['total_points', 'streak_days'])
            update_level(child)
            unlock_achievements(child)
            check_and_issue_certificates(child)

        self.stdout.write('Создаю записи дневника...')
        for text, feedback in DIARY_TEXTS:
            VoiceDiaryEntry.objects.create(
                parent=parent, child=aigerim, text=text,
                word_count=len(text.split()), ai_feedback=feedback,
            )

        self.stdout.write('Создаю обмен награды...')
        reward = Reward.objects.filter(is_active=True).order_by('cost_points').first()
        if reward and aigerim.points_balance >= reward.cost_points:
            aigerim.spent_points += reward.cost_points
            aigerim.save(update_fields=['spent_points'])
            RewardRedemption.objects.create(
                child=aigerim, reward=reward, parent=parent,
                points_spent=reward.cost_points, code='GL-DEMO01',
            )

        self.stdout.write('Создаю демо-данные школ, ВУЗа, бренда и GreenPoints...')
        teacher = ensure_demo_user(DEMO_TEACHER_EMAIL, 'Учитель GreenLearnAI', UserProfile.Role.TEACHER)
        school_admin = ensure_demo_user(DEMO_SCHOOL_EMAIL, 'Админ школы', UserProfile.Role.SCHOOL_ADMIN)
        student_user = ensure_demo_user(DEMO_STUDENT_EMAIL, 'Студент волонтер', UserProfile.Role.STUDENT)
        university_admin = ensure_demo_user(DEMO_UNIVERSITY_EMAIL, 'Админ ВУЗа', UserProfile.Role.UNIVERSITY_ADMIN)
        brand_user = ensure_demo_user(DEMO_BRAND_EMAIL, 'KFC Partner', UserProfile.Role.BRAND_PARTNER)

        school12, _ = School.objects.update_or_create(
            name='Школа №12',
            defaults={
                'city': 'Бишкек',
                'district': 'Первомайский район',
                'address': 'Район вокруг школы',
                'admin': school_admin,
                'points_balance': 76000,
            },
        )
        school61, _ = School.objects.update_or_create(
            name='Школа №61',
            defaults={
                'city': 'Бишкек',
                'district': 'Октябрьский район',
                'address': 'Улица Манаса',
                'points_balance': 54000,
            },
        )
        school5, _ = School.objects.update_or_create(
            name='Школа №5',
            defaults={
                'city': 'Бишкек',
                'district': 'Свердловский район',
                'address': 'Парк рядом со школой',
                'points_balance': 43000,
            },
        )

        class5a, _ = ClassRoom.objects.update_or_create(
            school=school12,
            name='5-А',
            defaults={'teacher': teacher, 'points_balance': 12000},
        )
        ClassRoom.objects.update_or_create(
            school=school12,
            name='6-Б',
            defaults={'points_balance': 9800},
        )
        ClassRoom.objects.update_or_create(
            school=school61,
            name='8-А',
            defaults={'points_balance': 14300},
        )

        university, _ = University.objects.update_or_create(
            name='Кыргызский государственный университет',
            defaults={'city': 'Бишкек', 'admin': university_admin, 'points_balance': 88000},
        )
        StudentProfile.objects.update_or_create(
            user=student_user,
            defaults={
                'school': school12,
                'class_room': class5a,
                'university': university,
                'total_points': 1320,
                'spent_points': 240,
                'level': 5,
                'streak_days': 9,
            },
        )

        school_missions = [
            ('Участие в субботнике', 'Помоги классу очистить территорию школы.', 'eco', 50),
            ('Сдать макулатуру', 'Принеси макулатуру для переработки и расскажи AI, почему это важно.', 'eco', 70),
            ('Неделя без опозданий', 'Приходи вовремя всю неделю и поддержи рейтинг класса.', 'education', 30),
            ('Помочь в школьном мероприятии', 'Стань волонтером на школьном событии.', 'kindness', 100),
            ('Прочитать книгу и пересказать AI', 'Прочитай главу и перескажи главную мысль AI-наставнику.', 'education', 40),
        ]
        for title, desc, slug, points in school_missions:
            Mission.objects.update_or_create(
                title=title,
                defaults={
                    'description': desc,
                    'category': cats[slug],
                    'points': points,
                    'difficulty': 'medium',
                    'min_age': 7,
                    'max_age': 18,
                    'is_active': True,
                },
            )

        today = timezone.now().date()
        challenge, _ = SchoolChallenge.objects.update_or_create(
            title='GreenLearnAI National Cup',
            defaults={
                'description': 'Школы соревнуются в эко-миссиях, добрых делах и реальном вкладе в чистоту районов.',
                'start_date': today,
                'end_date': today + timedelta(days=30),
                'prize': 'Кубок самой зеленой школы Кыргызстана и партнерские награды',
                'status': SchoolChallenge.Status.ACTIVE,
            },
        )
        for school, points, rank in [(school12, 18400, 1), (school61, 15150, 2), (school5, 12880, 3)]:
            ChallengeParticipant.objects.update_or_create(
                challenge=challenge,
                school=school,
                defaults={'points': points, 'rank': rank},
            )

        brand, _ = BrandPartner.objects.update_or_create(
            user=brand_user,
            defaults={
                'brand_name': 'KFC Kyrgyzstan',
                'logo': 'KFC',
                'description': 'Партнерские миссии и купоны за добрые дела.',
            },
        )
        BrandMission.objects.update_or_create(
            partner=brand,
            title='KFC Green Mission',
            defaults={
                'description': 'Убери мусор во дворе или парке и получи GreenPoints для купона.',
                'points': 100,
                'reward_description': 'Скидка на комбо для участника',
                'is_active': True,
                'start_date': today,
                'end_date': today + timedelta(days=45),
            },
        )
        BrandMission.objects.update_or_create(
            partner=brand,
            title='7 добрых дел',
            defaults={
                'description': 'Выполни 7 добрых дел за неделю и получи партнерский купон.',
                'points': 150,
                'reward_description': 'Купон партнера за серию добрых дел',
                'is_active': True,
                'start_date': today,
                'end_date': today + timedelta(days=60),
            },
        )

        parent_wallet, _ = GreenPointWallet.objects.update_or_create(
            owner=parent,
            owner_type=GreenPointWallet.OwnerType.PARENT,
            defaults={'balance': 2400},
        )
        school_wallet, _ = GreenPointWallet.objects.update_or_create(
            owner=school_admin,
            owner_type=GreenPointWallet.OwnerType.SCHOOL,
            school=school12,
            defaults={'balance': 76000},
        )
        university_wallet, _ = GreenPointWallet.objects.update_or_create(
            owner=university_admin,
            owner_type=GreenPointWallet.OwnerType.UNIVERSITY,
            university=university,
            defaults={'balance': 88000},
        )
        brand_wallet, _ = GreenPointWallet.objects.update_or_create(
            owner=brand_user,
            owner_type=GreenPointWallet.OwnerType.BRAND,
            brand=brand,
            defaults={'balance': 35000},
        )
        GreenPointTransaction.objects.filter(description__startswith='Demo ').delete()
        transactions = [
            (school_wallet, 50000, GreenPointTransaction.TransactionType.PURCHASE, 'Demo School Pro purchase', 'platform', school_admin.email, school12),
            (school_wallet, -12000, GreenPointTransaction.TransactionType.DISTRIBUTE, 'Demo distribution to class 5-A', school_admin.email, teacher.email, school12),
            (parent_wallet, 1000, GreenPointTransaction.TransactionType.PURCHASE, 'Demo parent GreenPoints package', 'platform', parent.email, None),
            (university_wallet, 50000, GreenPointTransaction.TransactionType.PURCHASE, 'Demo university volunteer package', 'platform', university_admin.email, None),
            (brand_wallet, -5000, GreenPointTransaction.TransactionType.AWARD, 'Demo brand coupon mission reserve', brand_user.email, student_user.email, None),
        ]
        for wallet, amount, tx_type, description, source, target, related_school in transactions:
            GreenPointTransaction.objects.create(
                wallet=wallet,
                amount=amount,
                transaction_type=tx_type,
                description=description,
                source=source,
                target=target,
                related_school=related_school,
            )

        self.stdout.write(self.style.SUCCESS(
            '\n[OK] Демо-данные готовы!\n'
            f'   Родитель: {DEMO_PARENT_EMAIL} / {DEMO_PASSWORD}\n'
            f'   Ребёнок:  {DEMO_CHILD_EMAIL} / {DEMO_PASSWORD}\n'
            f'   Учитель:  {DEMO_TEACHER_EMAIL} / {DEMO_PASSWORD}\n'
            f'   Школа:    {DEMO_SCHOOL_EMAIL} / {DEMO_PASSWORD}\n'
            f'   Студент:  {DEMO_STUDENT_EMAIL} / {DEMO_PASSWORD}\n'
            f'   ВУЗ:      {DEMO_UNIVERSITY_EMAIL} / {DEMO_PASSWORD}\n'
            f'   Бренд:    {DEMO_BRAND_EMAIL} / {DEMO_PASSWORD}\n'
            f'   Дети: Айгерим, Бекзат, Айжан\n'
        ))

# coding: utf-8
from rest_framework import serializers
from datetime import timedelta
from django.db.models import Sum
from django.utils import timezone
from .models import (
    UserProfile, ChildProfile, MissionCategory, Mission,
    MissionSubmission, Achievement, ChildAchievement, AIChatMessage,
    Reward, RewardRedemption, VoiceDiaryEntry, Certificate,
    ParentChild, ParentInvitation, ParentChildInvite, ChildLocation,
    School, University, ClassRoom, StudentProfile, SchoolChallenge,
    ChallengeParticipant, BrandPartner, BrandMission,
    GreenPointWallet, GreenPointTransaction,
)
from django_rest_passwordreset.models import ResetPasswordToken


def normalize_invite_code(value):
    compact = ''.join(ch for ch in (value or '').upper() if ch.isalnum())
    if len(compact) != 6:
        raise serializers.ValidationError('Введите код из 6 символов.')
    return f'{compact[:3]}-{compact[3:]}'


class UserProfileSerializer(serializers.ModelSerializer):
    child_profile = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ('id', 'email', 'username', 'avatar', 'gender', 'role', 'child_profile', 'created_at')
        read_only_fields = ('id', 'created_at', 'role', 'child_profile')

    def get_child_profile(self, obj):
        """Для аккаунта-ребёнка вернуть его профиль (id, код, баллы)."""
        if obj.role != UserProfile.Role.CHILD:
            return None
        profile = getattr(obj, 'child_profile', None)
        if not profile:
            return None
        return {
            'id': profile.id,
            'name': profile.name,
            'age': profile.age,
            'connection_code': profile.connection_code,
            'total_points': profile.total_points,
            'points_balance': profile.points_balance,
            'level': profile.level,
            'streak_days': profile.streak_days,
        }


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(
        choices=[UserProfile.Role.PARENT, UserProfile.Role.CHILD],
        default=UserProfile.Role.PARENT,
    )
    gender = serializers.ChoiceField(
        choices=UserProfile.Gender.choices,
        required=False,
        allow_blank=True,
    )
    # Необязательные поля для регистрации ребёнка
    age = serializers.IntegerField(required=False, min_value=2, max_value=17, write_only=True)

    class Meta:
        model = UserProfile
        fields = ('email', 'username', 'gender', 'password', 'password2', 'role', 'age')

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Пароли не совпадают.'})
        if data.get('role') == UserProfile.Role.PARENT and not data.get('gender'):
            raise serializers.ValidationError({'gender': 'Укажите пол.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        role = validated_data.get('role', UserProfile.Role.PARENT)
        age = validated_data.pop('age', None)

        user = UserProfile.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
            role=role,
            gender=validated_data.get('gender', ''),
        )

        # Для ребёнка сразу создаём профиль с уникальным кодом подключения
        if role == UserProfile.Role.CHILD:
            ChildProfile.objects.create(
                user=user,
                name=validated_data['username'],
                age=age or 10,
            )
        return user


class ConnectByCodeSerializer(serializers.Serializer):
    """Подключение родителя к ребёнку по 6-значному коду."""
    code = serializers.CharField(max_length=6, min_length=6)


class InviteParentSerializer(serializers.Serializer):
    """Приглашение родителя ребёнком по email."""
    parent_email = serializers.EmailField()


class CreateChildInviteSerializer(serializers.Serializer):
    """Parent creates an invite code that the child enters in the child app."""
    child_name = serializers.CharField(required=False, allow_blank=True, max_length=100)
    child_age = serializers.IntegerField(required=False, min_value=2, max_value=17)


class JoinParentByCodeSerializer(serializers.Serializer):
    """Child enters the parent-generated invite code."""
    code = serializers.CharField(max_length=16, min_length=6)

    def validate_code(self, value):
        return normalize_invite_code(value)


class ParentChildSerializer(serializers.ModelSerializer):
    parent_email = serializers.CharField(source='parent.email', read_only=True)
    child_name = serializers.CharField(source='child.name', read_only=True)

    class Meta:
        model = ParentChild
        fields = ('id', 'parent', 'parent_email', 'child', 'child_name', 'created_at')


class ParentInvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParentInvitation
        fields = ('id', 'child', 'parent_email', 'is_accepted', 'created_at')
        read_only_fields = ('id', 'is_accepted', 'created_at')


class ParentChildInviteSerializer(serializers.ModelSerializer):
    parent_email = serializers.CharField(source='parent.email', read_only=True)
    accepted_child_name = serializers.CharField(source='accepted_child.name', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    is_accepted = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = ParentChildInvite
        fields = (
            'id', 'parent', 'parent_email', 'code',
            'child_name', 'child_age',
            'accepted_child', 'accepted_child_name',
            'is_active', 'is_accepted', 'is_expired',
            'accepted_at', 'expires_at', 'created_at',
        )
        read_only_fields = (
            'id', 'parent', 'parent_email', 'code',
            'accepted_child', 'accepted_child_name',
            'is_active', 'is_accepted', 'is_expired',
            'accepted_at', 'expires_at', 'created_at',
        )


class ChildLocationSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)
    is_stale = serializers.SerializerMethodField()

    class Meta:
        model = ChildLocation
        fields = (
            'id', 'child', 'child_name',
            'latitude', 'longitude', 'accuracy', 'altitude',
            'speed', 'heading', 'battery_level', 'source',
            'recorded_at', 'created_at', 'is_stale',
        )
        read_only_fields = ('id', 'child', 'child_name', 'created_at', 'is_stale')

    def get_is_stale(self, obj):
        return timezone.now() - obj.recorded_at > timedelta(minutes=15)


class VerifyResetCodeSerializer(serializers.Serializer):
    """Проверка кода из письма и установка нового пароля."""

    email = serializers.EmailField()
    reset_code = serializers.IntegerField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Пароли не совпадают.'})

        try:
            token = ResetPasswordToken.objects.get(
                user__email=data['email'],
                key=str(data['reset_code']),
            )
        except ResetPasswordToken.DoesNotExist:
            raise serializers.ValidationError({'reset_code': 'Неверный код или email.'})

        data['user'] = token.user
        data['token'] = token
        return data

    def save(self):
        user = self.validated_data['user']
        token = self.validated_data['token']

        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])

        # Удаляем использованный токен, чтобы код нельзя было применить повторно
        ResetPasswordToken.objects.filter(user=user).delete()
        return user


class ChildProfileSerializer(serializers.ModelSerializer):
    parent = serializers.HiddenField(default=serializers.CurrentUserDefault())

    points_balance = serializers.IntegerField(read_only=True)

    class Meta:
        model = ChildProfile
        fields = (
            'id', 'parent', 'name', 'age', 'avatar',
            'total_points', 'spent_points', 'points_balance',
            'level', 'streak_days', 'created_at'
        )
        read_only_fields = (
            'id', 'total_points', 'spent_points', 'points_balance',
            'level', 'streak_days', 'created_at'
        )


class MissionCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MissionCategory
        fields = ('id', 'name', 'slug', 'description', 'icon')


class MissionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Mission
        fields = (
            'id', 'title', 'description', 'category', 'category_name',
            'points', 'difficulty', 'min_age', 'max_age', 'is_active', 'created_at'
        )


class MissionSubmissionSerializer(serializers.ModelSerializer):
    mission_title = serializers.CharField(source='mission.title', read_only=True)
    child_name = serializers.CharField(source='child.name', read_only=True)
    child = serializers.PrimaryKeyRelatedField(
        queryset=ChildProfile.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = MissionSubmission
        fields = (
            'id', 'child', 'child_name', 'mission', 'mission_title',
            'parent', 'photo', 'status', 'ai_result', 'ai_feedback', 'ai_confidence',
            'points_awarded', 'reviewed_at', 'created_at'
        )
        read_only_fields = (
            'id', 'parent', 'child', 'status', 'ai_result', 'ai_feedback', 'ai_confidence',
            'points_awarded', 'reviewed_at', 'created_at'
        )

    def validate(self, attrs):
        request = self.context.get('request')
        if request and getattr(request.user, 'role', None) == UserProfile.Role.CHILD:
            profile = getattr(request.user, 'child_profile', None)
            if not profile:
                raise serializers.ValidationError('Профиль ребёнка не найден.')
            attrs['child'] = profile
        return attrs


class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = (
            'id', 'title', 'description', 'icon',
            'required_points', 'required_missions_count', 'is_active'
        )


class ChildAchievementSerializer(serializers.ModelSerializer):
    achievement = AchievementSerializer(read_only=True)

    class Meta:
        model = ChildAchievement
        fields = ('id', 'child', 'achievement', 'unlocked_at')


class AIChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIChatMessage
        fields = ('id', 'role', 'message', 'created_at')


class RewardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reward
        fields = (
            'id', 'title', 'description', 'partner', 'icon',
            'cost_points', 'stock', 'is_active'
        )


class RewardRedemptionSerializer(serializers.ModelSerializer):
    reward = RewardSerializer(read_only=True)
    child_name = serializers.CharField(source='child.name', read_only=True)

    class Meta:
        model = RewardRedemption
        fields = ('id', 'child', 'child_name', 'reward', 'points_spent', 'code', 'created_at')


class VoiceDiaryEntrySerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)

    class Meta:
        model = VoiceDiaryEntry
        fields = ('id', 'child', 'child_name', 'text', 'word_count', 'ai_feedback', 'created_at')
        read_only_fields = ('id', 'word_count', 'ai_feedback', 'created_at')


class CertificateSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)

    class Meta:
        model = Certificate
        fields = ('id', 'child', 'child_name', 'code', 'title', 'description', 'icon', 'issued_at')


class SchoolSerializer(serializers.ModelSerializer):
    admin_email = serializers.CharField(source='admin.email', read_only=True)

    class Meta:
        model = School
        fields = (
            'id', 'name', 'city', 'district', 'address',
            'admin', 'admin_email', 'points_balance', 'created_at',
        )
        read_only_fields = ('id', 'created_at')


class UniversitySerializer(serializers.ModelSerializer):
    admin_email = serializers.CharField(source='admin.email', read_only=True)

    class Meta:
        model = University
        fields = ('id', 'name', 'city', 'admin', 'admin_email', 'points_balance', 'created_at')
        read_only_fields = ('id', 'created_at')


class ClassRoomSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.name', read_only=True)
    teacher_email = serializers.CharField(source='teacher.email', read_only=True)

    class Meta:
        model = ClassRoom
        fields = (
            'id', 'school', 'school_name', 'name',
            'teacher', 'teacher_email', 'points_balance', 'created_at',
        )
        read_only_fields = ('id', 'created_at')


class StudentProfileSerializer(serializers.ModelSerializer):
    email = serializers.CharField(source='user.email', read_only=True)
    name = serializers.CharField(source='user.username', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    class_room_name = serializers.CharField(source='class_room.name', read_only=True)
    university_name = serializers.CharField(source='university.name', read_only=True)
    points_balance = serializers.IntegerField(read_only=True)

    class Meta:
        model = StudentProfile
        fields = (
            'id', 'user', 'email', 'name',
            'school', 'school_name', 'class_room', 'class_room_name',
            'university', 'university_name',
            'total_points', 'spent_points', 'points_balance',
            'level', 'streak_days', 'created_at',
        )
        read_only_fields = ('id', 'points_balance', 'created_at')


class SchoolChallengeSerializer(serializers.ModelSerializer):
    participants_count = serializers.SerializerMethodField()

    class Meta:
        model = SchoolChallenge
        fields = (
            'id', 'title', 'description', 'start_date', 'end_date',
            'prize', 'status', 'participants_count', 'created_at',
        )
        read_only_fields = ('id', 'participants_count', 'created_at')

    def get_participants_count(self, obj):
        return obj.participants.count()


class ChallengeParticipantSerializer(serializers.ModelSerializer):
    challenge_title = serializers.CharField(source='challenge.title', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)

    class Meta:
        model = ChallengeParticipant
        fields = ('id', 'challenge', 'challenge_title', 'school', 'school_name', 'points', 'rank')


class BrandPartnerSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = BrandPartner
        fields = ('id', 'user', 'user_email', 'brand_name', 'logo', 'description')


class BrandMissionSerializer(serializers.ModelSerializer):
    partner_name = serializers.CharField(source='partner.brand_name', read_only=True)

    class Meta:
        model = BrandMission
        fields = (
            'id', 'partner', 'partner_name', 'title', 'description',
            'points', 'reward_description', 'is_active', 'start_date', 'end_date',
        )


class GreenPointWalletSerializer(serializers.ModelSerializer):
    owner_email = serializers.CharField(source='owner.email', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    university_name = serializers.CharField(source='university.name', read_only=True)
    brand_name = serializers.CharField(source='brand.brand_name', read_only=True)

    class Meta:
        model = GreenPointWallet
        fields = (
            'id', 'owner', 'owner_email', 'owner_type',
            'school', 'school_name', 'university', 'university_name',
            'brand', 'brand_name', 'balance', 'created_at',
        )
        read_only_fields = ('id', 'created_at')


class GreenPointTransactionSerializer(serializers.ModelSerializer):
    wallet_owner_type = serializers.CharField(source='wallet.owner_type', read_only=True)
    related_user_email = serializers.CharField(source='related_user.email', read_only=True)
    related_child_name = serializers.CharField(source='related_child.name', read_only=True)
    related_school_name = serializers.CharField(source='related_school.name', read_only=True)

    class Meta:
        model = GreenPointTransaction
        fields = (
            'id', 'wallet', 'wallet_owner_type', 'amount', 'transaction_type',
            'description', 'source', 'target',
            'related_user', 'related_user_email',
            'related_child', 'related_child_name',
            'related_school', 'related_school_name',
            'created_at',
        )
        read_only_fields = ('id', 'created_at')


# ──────────────────────────────────────────────
# Статистика
# ──────────────────────────────────────────────

class ChildStatsSerializer(serializers.Serializer):
    """Статистика одного ребёнка."""
    child = ChildProfileSerializer()
    total_submissions = serializers.IntegerField()
    approved_submissions = serializers.IntegerField()
    rejected_submissions = serializers.IntegerField()
    pending_submissions = serializers.IntegerField()
    total_points = serializers.IntegerField()
    current_level = serializers.IntegerField()
    streak_days = serializers.IntegerField()
    achievements_count = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    submissions_by_category = serializers.DictField(child=serializers.IntegerField())
    points_by_week = serializers.ListField(child=serializers.DictField())
    favorite_category = serializers.CharField(allow_null=True)


class FamilyStatsSerializer(serializers.Serializer):
    """Суммарная статистика по всем детям родителя."""
    total_children = serializers.IntegerField()
    total_points = serializers.IntegerField()
    total_submissions = serializers.IntegerField()
    approved_submissions = serializers.IntegerField()
    total_achievements = serializers.IntegerField()
    children = ChildStatsSerializer(many=True)

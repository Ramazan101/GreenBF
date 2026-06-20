# coding: utf-8
import logging
from datetime import datetime, timedelta

from django.http import HttpResponse
from django.db.models import Sum, Count
from django.utils import timezone
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action, api_view
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    UserProfile, ChildProfile, MissionCategory, Mission,
    MissionSubmission, Achievement, ChildAchievement, AIChatMessage,
    Reward, RewardRedemption, VoiceDiaryEntry, Certificate,
    ParentChild, ParentInvitation, ParentChildInvite, ChildLocation,
    School, University, ClassRoom, StudentProfile, SchoolChallenge,
    ChallengeParticipant, BrandPartner, BrandMission,
    GreenPointWallet, GreenPointTransaction,
)
from .permissions import IsParent, IsChild, IsAdminUser, IsParentOfChild, IsParentOfSubmission, IsParentOrChild
from .serializers import (
    UserProfileSerializer, RegisterSerializer, ChildProfileSerializer,
    MissionCategorySerializer, MissionSerializer, MissionSubmissionSerializer,
    AchievementSerializer, ChildAchievementSerializer, AIChatMessageSerializer,
    ChildStatsSerializer, FamilyStatsSerializer,
    RewardSerializer, RewardRedemptionSerializer,
    VoiceDiaryEntrySerializer, CertificateSerializer,
    VerifyResetCodeSerializer,
    ConnectByCodeSerializer, InviteParentSerializer,
    ParentChildSerializer, ParentInvitationSerializer,
    CreateChildInviteSerializer, JoinParentByCodeSerializer,
    ParentChildInviteSerializer,
    ChildLocationSerializer,
    SchoolSerializer, UniversitySerializer, ClassRoomSerializer,
    StudentProfileSerializer, SchoolChallengeSerializer,
    ChallengeParticipantSerializer, BrandPartnerSerializer,
    BrandMissionSerializer, GreenPointWalletSerializer,
    GreenPointTransactionSerializer,
    normalize_invite_code,
)
from .services.gamification import award_points, update_level, update_streak, unlock_achievements
from .services.missions import can_submit_today, get_recommended_missions
from .services.ai_chat import chat_with_ai, analyze_diary_entry, get_persona
from .services.ai_vision import check_mission_photo
from .services.tts import synthesize_psychologist_speech
from .services.certificates import check_and_issue_certificates
from .services.connections import (
    connect_parent_by_code, disconnect_child,
    send_parent_invitation, get_connected_children,
    get_parent_for_child, child_accessible_by_parent,
)

logger = logging.getLogger('green_app')


# ──────────────────────────────────────────────
# Пагинация
# ──────────────────────────────────────────────

class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class PlatformRolePermission(BasePermission):
    """Read access is role-scoped by queryset; writes require an allowed platform role."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        allowed_roles = getattr(view, 'write_roles', ())
        return user.is_staff or user.role == UserProfile.Role.ADMIN or user.role in allowed_roles


# ──────────────────────────────────────────────
# Авторизация
# ──────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserProfileSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        from django.contrib.auth import authenticate
        email = request.data.get('email', '').lower().strip()
        password = request.data.get('password', '')
        user = authenticate(request, username=email, password=password)
        if not user:
            return Response({'detail': 'Неверный email или пароль.'}, status=status.HTTP_401_UNAUTHORIZED)
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserProfileSerializer(user).data,
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        return Response({'detail': 'Выход выполнен.'})


@api_view(['POST'])
def verify_reset_code(request):
    """
    Подтверждение 4-значного кода из письма и установка нового пароля.

    Ожидает: email, reset_code, new_password, confirm_password.
    Шаг 1 (запрос кода) выполняется через POST /api/password_reset/.
    """
    serializer = VerifyResetCodeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(
        {'detail': 'Пароль успешно изменён. Теперь вы можете войти.'},
        status=status.HTTP_200_OK,
    )


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


# ──────────────────────────────────────────────
# Привязка Parent ↔ Child (Find My Kids style)
# ──────────────────────────────────────────────

class ConnectChildView(APIView):
    """Родитель подключает ребёнка по 6-значному коду."""
    permission_classes = [IsParent]

    def post(self, request):
        serializer = ConnectByCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        child = connect_parent_by_code(request.user, serializer.validated_data['code'])
        return Response(
            {
                'detail': f'Ребёнок «{child.name}» успешно подключён.',
                'child': ChildProfileSerializer(child, context={'request': request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class DisconnectChildView(APIView):
    """Родитель отвязывает ребёнка."""
    permission_classes = [IsParent]

    def post(self, request):
        child_id = request.data.get('child_id')
        try:
            child = ChildProfile.objects.get(id=child_id)
        except (ChildProfile.DoesNotExist, ValueError, TypeError):
            return Response({'detail': 'Ребёнок не найден.'}, status=status.HTTP_404_NOT_FOUND)
        disconnect_child(request.user, child)
        return Response({'detail': 'Ребёнок отвязан.'})


class MyConnectionCodeView(APIView):
    """Ребёнок смотрит свой код подключения."""
    permission_classes = [IsChild]

    def get(self, request):
        profile = getattr(request.user, 'child_profile', None)
        if not profile:
            return Response({'detail': 'Профиль ребёнка не найден.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            'connection_code': profile.connection_code,
            'connected_parents': ParentChildSerializer(
                profile.parent_links.select_related('parent'), many=True
            ).data,
        })


class InviteParentView(APIView):
    """Ребёнок приглашает родителя по email (письмо с кодом и кнопкой)."""
    permission_classes = [IsChild]

    def post(self, request):
        profile = getattr(request.user, 'child_profile', None)
        if not profile:
            return Response({'detail': 'Профиль ребёнка не найден.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = InviteParentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        send_parent_invitation(profile, serializer.validated_data['parent_email'])
        return Response(
            {'detail': 'Приглашение отправлено родителю на email.'},
            status=status.HTTP_201_CREATED,
        )


# ──────────────────────────────────────────────
# Дети
# ──────────────────────────────────────────────

class ParentChildInviteView(APIView):
    """Parent app reads the current family code; it rotates every three days."""
    permission_classes = [IsParent]

    def get(self, request):
        now = timezone.now()
        invite = (
            ParentChildInvite.objects
            .filter(parent=request.user, expires_at__gt=now)
            .select_related('accepted_child')
            .order_by('-created_at')
            .first()
        )
        if not invite:
            invite = ParentChildInvite.objects.create(parent=request.user)
        invites = (
            ParentChildInvite.objects
            .filter(parent=request.user)
            .select_related('accepted_child')
            .order_by('-created_at')[:5]
        )
        return Response(ParentChildInviteSerializer(invites, many=True).data)

    def post(self, request):
        invite = ParentChildInvite.objects.create(
            parent=request.user,
        )
        return Response(ParentChildInviteSerializer(invite).data, status=status.HTTP_201_CREATED)


def _invite_code_candidates(code):
    try:
        normalized = normalize_invite_code(code)
    except ValidationError:
        normalized = (code or '').strip().upper()
    compact = ''.join(ch for ch in (code or '').upper() if ch.isalnum())
    return {normalized, compact, (code or '').strip().upper()}


def _get_invite_by_code(code, select_user=False):
    qs = ParentChildInvite.objects.select_related('parent', 'accepted_child')
    if select_user:
        qs = qs.select_related('accepted_child__user')
    return qs.filter(code__in=_invite_code_candidates(code)).order_by('-created_at').first()


class JoinParentByCodeView(APIView):
    """Child app joins a parent's family using a parent-generated code."""
    permission_classes = [IsChild]

    def post(self, request):
        serializer = JoinParentByCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data['code']
        invite = _get_invite_by_code(code)
        if not invite:
            return Response({'code': 'Неверный код приглашения.'}, status=status.HTTP_400_BAD_REQUEST)

        if invite.is_expired:
            return Response({'code': 'Срок действия кода истёк. Попросите родителя создать новый код.'}, status=status.HTTP_400_BAD_REQUEST)

        profile = getattr(request.user, 'child_profile', None)
        if not profile:
            profile = ChildProfile.objects.create(
                user=request.user,
                name=request.user.username,
                age=invite.child_age or 10,
            )

        ParentChild.objects.get_or_create(parent=invite.parent, child=profile)
        if profile.parent_id is None:
            profile.parent = invite.parent
            profile.save(update_fields=['parent'])

        if not invite.accepted_at:
            invite.accepted_child = profile
            invite.accepted_at = timezone.now()
            invite.save(update_fields=['accepted_child', 'accepted_at'])

        return Response({
            'detail': f'Вы подключились к родителю {invite.parent.email}.',
            'parent': UserProfileSerializer(invite.parent).data,
            'child': ChildProfileSerializer(profile, context={'request': request}).data,
            'link': ParentChildSerializer(
                ParentChild.objects.get(parent=invite.parent, child=profile)
            ).data,
        }, status=status.HTTP_201_CREATED)


def _create_child_user_for_invite(invite):
    base_email = f'pingo.child.{invite.code}'
    email = f'{base_email}@local.invalid'
    counter = 1
    while UserProfile.objects.filter(email=email).exists():
        counter += 1
        email = f'{base_email}.{counter}@local.invalid'

    username = f'pingo_{invite.code}'
    counter = 1
    while UserProfile.objects.filter(username=username).exists():
        counter += 1
        username = f'pingo_{invite.code}_{counter}'

    user = UserProfile(
        email=email,
        username=username,
        role=UserProfile.Role.CHILD,
    )
    user.set_unusable_password()
    user.save()
    return user


def _build_child_code_login_response(user, request, detail):
    refresh = RefreshToken.for_user(user)
    return Response({
        'detail': detail,
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': UserProfileSerializer(user, context={'request': request}).data,
    }, status=status.HTTP_201_CREATED)


class ChildLoginByCodeView(APIView):
    """Public Pingo entry: a child enters the parent code and gets their profile."""
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        serializer = JoinParentByCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data['code']
        invite = _get_invite_by_code(code, select_user=True)
        if not invite:
            return Response({'code': 'Неверный код приглашения.'}, status=status.HTTP_400_BAD_REQUEST)

        if invite.is_expired:
            return Response(
                {'code': 'Срок действия кода истёк. Попросите родителя создать новый код.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = _create_child_user_for_invite(invite)
        profile = ChildProfile.objects.create(
            parent=invite.parent,
            user=user,
            name=(invite.child_name or 'Ребёнок').strip(),
            age=invite.child_age or 10,
        )
        if not invite.accepted_child_id:
            invite.accepted_child = profile
            invite.accepted_at = timezone.now()
            invite.save(update_fields=['accepted_child', 'accepted_at'])

        ParentChild.objects.get_or_create(parent=invite.parent, child=profile)
        if profile.parent_id is None:
            profile.parent = invite.parent
            profile.save(update_fields=['parent'])

        return _build_child_code_login_response(
            user,
            request,
            f'Вы вошли в профиль ребёнка и подключились к родителю {invite.parent.email}.',
        )


def _location_status(location):
    if not location:
        return 'offline'
    if timezone.now() - location.recorded_at > timedelta(minutes=15):
        return 'stale'
    return 'online'


def _bounded_limit(value, default=50, maximum=200):
    try:
        return min(max(int(value), 1), maximum)
    except (TypeError, ValueError):
        return default


class ChildLocationPingView(APIView):
    """Child app sends the current geolocation ping."""
    permission_classes = [IsChild]

    def get(self, request):
        profile = getattr(request.user, 'child_profile', None)
        if not profile:
            return Response({'detail': 'Профиль ребёнка не найден.'}, status=status.HTTP_404_NOT_FOUND)
        location = profile.locations.first()
        return Response({
            'location': ChildLocationSerializer(location).data if location else None,
            'status': _location_status(location),
        })

    def post(self, request):
        profile = getattr(request.user, 'child_profile', None)
        if not profile:
            return Response({'detail': 'Профиль ребёнка не найден.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ChildLocationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        location = serializer.save(child=profile)
        return Response(
            {
                'location': ChildLocationSerializer(location).data,
                'status': _location_status(location),
            },
            status=status.HTTP_201_CREATED,
        )


class MyLocationHistoryView(APIView):
    """Child app reads its own recent location pings."""
    permission_classes = [IsChild]

    def get(self, request):
        profile = getattr(request.user, 'child_profile', None)
        if not profile:
            return Response({'detail': 'Профиль ребёнка не найден.'}, status=status.HTTP_404_NOT_FOUND)
        limit = _bounded_limit(request.query_params.get('limit'))
        qs = ChildLocation.objects.filter(child=profile).order_by('-recorded_at', '-created_at')[:limit]
        return Response(ChildLocationSerializer(qs, many=True).data)


class ChildrenLatestLocationView(APIView):
    """Parent app reads last known locations for all connected children."""
    permission_classes = [IsParent]

    def get(self, request):
        children = list(get_connected_children(request.user).order_by('name'))
        latest_by_child = {}
        if children:
            locations = (
                ChildLocation.objects
                .filter(child__in=children)
                .select_related('child')
                .order_by('child_id', '-recorded_at', '-created_at')
            )
            for location in locations:
                latest_by_child.setdefault(location.child_id, location)

        data = []
        for child in children:
            location = latest_by_child.get(child.id)
            data.append({
                'child': ChildProfileSerializer(child, context={'request': request}).data,
                'location': ChildLocationSerializer(location).data if location else None,
                'status': _location_status(location),
            })
        return Response(data)


class ChildLocationHistoryView(APIView):
    """Parent app reads recent location history for one connected child."""
    permission_classes = [IsParent]

    def get(self, request, child_id):
        child = get_connected_children(request.user).filter(id=child_id).first()
        if not child:
            return Response({'detail': 'Ребёнок не найден.'}, status=status.HTTP_404_NOT_FOUND)
        limit = _bounded_limit(request.query_params.get('limit'))
        qs = ChildLocation.objects.filter(child=child).order_by('-recorded_at', '-created_at')[:limit]
        return Response(ChildLocationSerializer(qs, many=True).data)


class ChildProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """Родитель видит подключённых детей (только чтение)."""
    serializer_class = ChildProfileSerializer
    permission_classes = [IsParent]
    pagination_class = StandardPagination

    def get_queryset(self):
        return get_connected_children(self.request.user)


# ──────────────────────────────────────────────
# Категории и задания
# ──────────────────────────────────────────────

class MissionCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MissionCategory.objects.all()
    serializer_class = MissionCategorySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination


class MissionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MissionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = Mission.objects.filter(is_active=True).select_related('category')

        category = self.request.query_params.get('category')
        difficulty = self.request.query_params.get('difficulty')
        min_age = self.request.query_params.get('min_age')
        max_age = self.request.query_params.get('max_age')

        if category:
            qs = qs.filter(category__slug=category)
        if difficulty:
            qs = qs.filter(difficulty=difficulty)
        if min_age:
            qs = qs.filter(min_age__gte=min_age)
        if max_age:
            qs = qs.filter(max_age__lte=max_age)

        return qs

    @action(detail=False, methods=['get'], url_path='recommended/me')
    def recommended_me(self, request):
        """Рекомендуемые задания для текущего ребёнка."""
        if request.user.role != UserProfile.Role.CHILD:
            return Response({'detail': 'Только для детей.'}, status=status.HTTP_403_FORBIDDEN)
        child = getattr(request.user, 'child_profile', None)
        if not child:
            return Response({'detail': 'Профиль ребёнка не найден.'}, status=status.HTTP_404_NOT_FOUND)
        missions = get_recommended_missions(child)
        serializer = self.get_serializer(missions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='recommended/(?P<child_id>[^/.]+)')
    def recommended(self, request, child_id=None):
        child = get_connected_children(request.user).filter(id=child_id).first()
        if not child:
            return Response({'detail': 'Ребёнок не найден.'}, status=status.HTTP_404_NOT_FOUND)

        missions = get_recommended_missions(child)
        serializer = self.get_serializer(missions, many=True)
        return Response(serializer.data)


# ──────────────────────────────────────────────
# Выполненные задания
# ──────────────────────────────────────────────

class MissionSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = MissionSubmissionSerializer
    permission_classes = [IsParentOfSubmission]
    pagination_class = StandardPagination
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        qs = MissionSubmission.objects.select_related('child', 'mission')
        if user.role == UserProfile.Role.CHILD:
            profile = getattr(user, 'child_profile', None)
            qs = qs.filter(child=profile) if profile else qs.none()
        elif user.role == UserProfile.Role.PARENT:
            qs = qs.filter(child__in=get_connected_children(user))
        elif user.role != UserProfile.Role.ADMIN:
            qs = qs.filter(parent=user)

        status_filter = self.request.query_params.get('status')
        valid_statuses = {choice[0] for choice in MissionSubmission.Status.choices}
        if status_filter in valid_statuses:
            qs = qs.filter(status=status_filter)

        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != UserProfile.Role.CHILD:
            raise ValidationError('Только ребёнок может отправлять задания.')

        child = getattr(user, 'child_profile', None)
        if not child:
            raise ValidationError('Профиль ребёнка не найден.')

        mission = serializer.validated_data['mission']
        parent_user = get_parent_for_child(child) or user

        if not can_submit_today(child, mission):
            raise ValidationError('Это задание уже было отправлено сегодня.')

        has_photo = 'photo' in self.request.FILES
        initial_status = MissionSubmission.Status.AI_REVIEW if has_photo else MissionSubmission.Status.PENDING

        submission = serializer.save(parent=parent_user, child=child, status=initial_status)

        if has_photo:
            result = check_mission_photo(submission)
            logger.info('perform_create: ai_vision result=%s', result)

    @action(detail=True, methods=['post'], url_path='ai-check')
    def ai_check(self, request, pk=None):
        submission = self.get_object()
        if not submission.photo:
            return Response({'detail': 'Фото не отправлено.'}, status=status.HTTP_400_BAD_REQUEST)

        result = check_mission_photo(submission)
        logger.info('ai_check: submission=%s result=%s', submission.id, result)
        submission.refresh_from_db()
        return Response(self.get_serializer(submission).data)

    @action(detail=True, methods=['post'], url_path='resubmit-photo')
    def resubmit_photo(self, request, pk=None):
        if request.user.role != UserProfile.Role.CHILD:
            return Response({'detail': 'Только ребёнок может отправить новое фото.'}, status=status.HTTP_403_FORBIDDEN)

        submission = self.get_object()
        if submission.status != MissionSubmission.Status.REJECTED:
            return Response({'detail': 'Новое фото можно отправить только для отклонённого отчёта.'}, status=status.HTTP_400_BAD_REQUEST)

        photo = request.FILES.get('photo')
        if not photo:
            return Response({'photo': 'Выберите фото.'}, status=status.HTTP_400_BAD_REQUEST)

        submission.photo = photo
        submission.status = MissionSubmission.Status.AI_REVIEW
        submission.ai_result = ''
        submission.ai_feedback = ''
        submission.ai_confidence = None
        submission.points_awarded = 0
        submission.reviewed_at = None
        submission.save(update_fields=[
            'photo', 'status', 'ai_result', 'ai_feedback',
            'ai_confidence', 'points_awarded', 'reviewed_at'
        ])

        result = check_mission_photo(submission)
        logger.info('resubmit_photo: submission=%s result=%s', submission.id, result)
        submission.refresh_from_db()
        return Response(self.get_serializer(submission).data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if request.user.role not in (UserProfile.Role.PARENT, UserProfile.Role.ADMIN):
            return Response({'detail': 'Недоступно.'}, status=status.HTTP_403_FORBIDDEN)
        submission = self.get_object()
        if submission.status == MissionSubmission.Status.APPROVED:
            return Response({'detail': 'Уже одобрено.'})

        already_awarded = submission.points_awarded > 0
        submission.status = MissionSubmission.Status.APPROVED
        if submission.points_awarded <= 0:
            submission.points_awarded = submission.mission.points
        submission.reviewed_at = timezone.now()
        submission.save(update_fields=['status', 'points_awarded', 'reviewed_at'])

        if not already_awarded:
            award_points(submission.child, submission.mission.points)
        update_streak(submission.child)
        new_achievements = unlock_achievements(submission.child)

        logger.info(
            'approve: submission=%s child=%s points=%s achievements=%s',
            submission.id, submission.child.name,
            submission.mission.points, len(new_achievements)
        )

        return Response({
            'detail': 'Задание одобрено.',
            'points_awarded': submission.mission.points,
            'new_achievements': [a.title for a in new_achievements],
        })

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        if request.user.role not in (UserProfile.Role.PARENT, UserProfile.Role.ADMIN):
            return Response({'detail': 'Недоступно.'}, status=status.HTTP_403_FORBIDDEN)
        submission = self.get_object()
        reason = request.data.get('reason', '')
        points_to_remove = submission.points_awarded if submission.status == MissionSubmission.Status.APPROVED else 0
        if points_to_remove:
            child = submission.child
            child.total_points = max(child.total_points - points_to_remove, 0)
            child.save(update_fields=['total_points'])
            update_level(child)

        submission.status = MissionSubmission.Status.REJECTED
        submission.points_awarded = 0
        submission.ai_feedback = reason
        submission.reviewed_at = timezone.now()
        submission.save(update_fields=['status', 'points_awarded', 'ai_feedback', 'reviewed_at'])

        logger.info('reject: submission=%s child=%s', submission.id, submission.child.name)

        return Response({'detail': 'Задание отклонено.'})


# ──────────────────────────────────────────────
# Достижения
# ──────────────────────────────────────────────

class AchievementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Achievement.objects.filter(is_active=True)
    serializer_class = AchievementSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination


# ──────────────────────────────────────────────
# Дашборд
# ──────────────────────────────────────────────

class DashboardView(APIView):
    permission_classes = [IsParent]

    def get(self, request):
        children = list(get_connected_children(request.user))
        data = []
        for child in children:
            pending = MissionSubmission.objects.filter(
                child=child,
                status__in=(MissionSubmission.Status.PENDING, MissionSubmission.Status.AI_REVIEW),
            ).count()
            achievements = ChildAchievement.objects.filter(child=child).count()
            data.append({
                'child': ChildProfileSerializer(child, context={'request': request}).data,
                'pending_submissions': pending,
                'achievements_count': achievements,
            })

        # Экологический импакт семьи (для главного экрана)
        approved = MissionSubmission.objects.filter(
            child__in=children, status=MissionSubmission.Status.APPROVED
        )
        good_deeds = approved.count()
        total_points = sum(c.total_points for c in children)
        eco_deeds = approved.filter(mission__category__slug='eco').count()
        # Оценочные эко-метрики (усреднённые коэффициенты на одно эко-действие)
        impact = {
            'good_deeds': good_deeds,
            'total_points': total_points,
            'eco_deeds': eco_deeds,
            'co2_saved_kg': round(eco_deeds * 1.8, 1),
            'trees_equivalent': round(eco_deeds * 0.2, 1),
            'best_streak': max((c.streak_days for c in children), default=0),
        }
        return Response({'children': data, 'impact': impact})


# ──────────────────────────────────────────────
# AI-чат
# ──────────────────────────────────────────────

class AIChatView(APIView):
    permission_classes = [IsParentOrChild]

    def get(self, request):
        user = request.user
        qs = AIChatMessage.objects.filter(parent=user)
        if user.role == UserProfile.Role.CHILD:
            profile = getattr(user, 'child_profile', None)
            if profile:
                qs = qs.filter(child=profile)
        else:
            child_id = request.query_params.get('child_id')
            if child_id:
                qs = qs.filter(child_id=child_id)
        qs = qs.order_by('-created_at')[:50]
        messages = list(reversed(qs))
        return Response(AIChatMessageSerializer(messages, many=True).data)

    def post(self, request):
        user_message = request.data.get('message', '').strip()
        if not user_message:
            return Response({'detail': 'Сообщение не может быть пустым.'}, status=status.HTTP_400_BAD_REQUEST)

        ai_response = _process_chat_message(request, user_message)
        return Response({'response': ai_response})


def _process_chat_message(request, user_message: str) -> str:
    """Чат: родитель — только психолог; ребёнок — AI-наставник по возрасту."""
    user = request.user

    if user.role == UserProfile.Role.PARENT:
        mode = 'psychologist'
        child = None
        child_id = request.data.get('child_id')
        if child_id:
            child = get_connected_children(user).filter(id=child_id).first()
    elif user.role == UserProfile.Role.CHILD:
        mode = 'assistant'
        child = getattr(user, 'child_profile', None)
    else:
        mode = request.data.get('mode', 'assistant')
        if mode not in ('assistant', 'psychologist'):
            mode = 'assistant'
        child = None

    history_qs = AIChatMessage.objects.filter(parent=user)
    if child:
        history_qs = history_qs.filter(child=child)
    history = list(reversed(list(history_qs.order_by('-created_at')[:20])))

    ai_response = chat_with_ai(user_message, history, child=child, mode=mode)

    AIChatMessage.objects.create(
        parent=user, child=child, role='user', message=user_message
    )
    AIChatMessage.objects.create(
        parent=user, child=child, role='assistant', message=ai_response
    )
    return ai_response


class AIVoiceChatView(APIView):
    """
    Голосовой чат: принимает распознанный текст (transcript) после
    Web Speech API на фронтенде. Возвращает {'text': ответ ИИ, 'transcript': текст пользователя}.
    """
    permission_classes = [IsParentOrChild]

    def post(self, request):
        transcript = (request.data.get('transcript') or request.data.get('message') or '').strip()
        if not transcript:
            return Response(
                {'detail': 'Не удалось распознать речь. Попробуйте ещё раз.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ai_response = _process_chat_message(request, transcript)
        return Response({'text': ai_response, 'transcript': transcript})


class AITextToSpeechView(APIView):
    permission_classes = [IsParent]

    def post(self, request):
        text = (request.data.get('text') or '').strip()
        if not text:
            return Response({'detail': 'Текст для озвучки не может быть пустым.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            audio, voice = synthesize_psychologist_speech(text, request.data.get('voice'))
        except Exception as exc:
            logger.error('Gemini TTS error: %s', exc)
            return Response(
                {'detail': 'Голос Gemini временно недоступен.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        response = HttpResponse(audio, content_type='audio/wav')
        response['Content-Disposition'] = 'inline; filename="psychologist-voice.wav"'
        response['X-Gemini-Voice'] = voice
        response['Cache-Control'] = 'private, max-age=86400'
        return response


# ──────────────────────────────────────────────
# Магазин наград (GreenPoints)
# ──────────────────────────────────────────────

class RewardViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RewardSerializer
    permission_classes = [IsParentOrChild]
    pagination_class = StandardPagination

    def get_queryset(self):
        return Reward.objects.filter(is_active=True)

    @action(detail=True, methods=['post'])
    def redeem(self, request, pk=None):
        import secrets
        from django.db import transaction

        if request.user.role != UserProfile.Role.CHILD:
            return Response({'detail': 'Только ребёнок может обменивать баллы.'}, status=status.HTTP_403_FORBIDDEN)

        child = getattr(request.user, 'child_profile', None)
        if not child:
            return Response({'detail': 'Профиль ребёнка не найден.'}, status=status.HTTP_404_NOT_FOUND)

        reward = self.get_object()
        parent_user = get_parent_for_child(child) or request.user

        if reward.stock is not None and reward.stock <= 0:
            return Response({'detail': 'Эта награда закончилась.'}, status=status.HTTP_400_BAD_REQUEST)
        if child.points_balance < reward.cost_points:
            return Response(
                {'detail': f'Недостаточно GreenPoints: нужно {reward.cost_points}, доступно {child.points_balance}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            child.spent_points += reward.cost_points
            child.save(update_fields=['spent_points'])
            if reward.stock is not None:
                reward.stock -= 1
                reward.save(update_fields=['stock'])
            redemption = RewardRedemption.objects.create(
                child=child,
                reward=reward,
                parent=parent_user,
                points_spent=reward.cost_points,
                code=f'GL-{secrets.token_hex(4).upper()}',
            )

        logger.info('redeem: child=%s reward=%s code=%s', child.name, reward.title, redemption.code)
        return Response(RewardRedemptionSerializer(redemption).data, status=status.HTTP_201_CREATED)


class RedemptionListView(generics.ListAPIView):
    serializer_class = RewardRedemptionSerializer
    permission_classes = [IsParentOrChild]
    pagination_class = StandardPagination

    def get_queryset(self):
        user = self.request.user
        qs = RewardRedemption.objects.select_related('reward', 'child')
        if user.role == UserProfile.Role.CHILD:
            profile = getattr(user, 'child_profile', None)
            return qs.filter(child=profile) if profile else qs.none()
        if user.role == UserProfile.Role.PARENT:
            qs = qs.filter(child__in=get_connected_children(user))
            child_id = self.request.query_params.get('child_id')
            if child_id:
                qs = qs.filter(child_id=child_id)
            return qs
        return qs.filter(parent=user)


# ──────────────────────────────────────────────
# Голосовой дневник
# ──────────────────────────────────────────────

class VoiceDiaryView(APIView):
    permission_classes = [IsParentOrChild]

    def get(self, request):
        user = request.user
        if user.role == UserProfile.Role.CHILD:
            profile = getattr(user, 'child_profile', None)
            qs = VoiceDiaryEntry.objects.filter(child=profile).select_related('child') if profile else VoiceDiaryEntry.objects.none()
        else:
            qs = VoiceDiaryEntry.objects.filter(
                child__in=get_connected_children(user)
            ).select_related('child')
            child_id = request.query_params.get('child_id')
            if child_id:
                qs = qs.filter(child_id=child_id)
        entries = qs[:50]
        return Response(VoiceDiaryEntrySerializer(entries, many=True).data)

    def post(self, request):
        if request.user.role != UserProfile.Role.CHILD:
            return Response({'detail': 'Только ребёнок может создавать записи.'}, status=status.HTTP_403_FORBIDDEN)

        text = (request.data.get('text') or '').strip()
        if not text:
            return Response({'detail': 'Запись не может быть пустой.'}, status=status.HTTP_400_BAD_REQUEST)

        child = getattr(request.user, 'child_profile', None)
        if not child:
            return Response({'detail': 'Профиль ребёнка не найден.'}, status=status.HTTP_404_NOT_FOUND)

        parent_user = get_parent_for_child(child) or request.user
        ai_feedback = analyze_diary_entry(text, child)
        entry = VoiceDiaryEntry.objects.create(
            parent=parent_user,
            child=child,
            text=text,
            word_count=len(text.split()),
            ai_feedback=ai_feedback,
        )
        return Response(VoiceDiaryEntrySerializer(entry).data, status=status.HTTP_201_CREATED)


# ──────────────────────────────────────────────
# Eco Passport и сертификаты
# ──────────────────────────────────────────────

def _build_eco_passport(child, request):
    check_and_issue_certificates(child)

    approved_qs = MissionSubmission.objects.filter(
        child=child, status=MissionSubmission.Status.APPROVED
    )
    by_category = (
        approved_qs.values('mission__category__name')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    certificates = Certificate.objects.filter(child=child)
    persona = get_persona(child)

    return {
        'child': ChildProfileSerializer(child, context={'request': request}).data,
        'persona': {'key': persona['key'], 'name': persona['name']},
        'approved_missions': approved_qs.count(),
        'total_points': child.total_points,
        'points_balance': child.points_balance,
        'streak_days': child.streak_days,
        'achievements_count': ChildAchievement.objects.filter(child=child).count(),
        'diary_entries_count': VoiceDiaryEntry.objects.filter(child=child).count(),
        'by_category': {
            (row['mission__category__name'] or 'Без категории'): row['count']
            for row in by_category
        },
        'certificates': CertificateSerializer(certificates, many=True).data,
    }


class EcoPassportMeView(APIView):
    """Eco Passport текущего ребёнка."""
    permission_classes = [IsChild]

    def get(self, request):
        child = getattr(request.user, 'child_profile', None)
        if not child:
            return Response({'detail': 'Профиль ребёнка не найден.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(_build_eco_passport(child, request))


class EcoPassportView(APIView):
    """Eco Passport ребёнка (родитель — только просмотр)."""
    permission_classes = [IsParent]

    def get(self, request, child_id):
        child = get_connected_children(request.user).filter(id=child_id).first()
        if not child:
            return Response({'detail': 'Ребёнок не найден.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(_build_eco_passport(child, request))


class CertificatePDFView(APIView):
    permission_classes = [IsParentOrChild]

    def get(self, request, pk):
        from django.http import HttpResponse

        try:
            certificate = Certificate.objects.select_related('child').get(pk=pk)
        except Certificate.DoesNotExist:
            return Response({'detail': 'Сертификат не найден.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if user.role == UserProfile.Role.CHILD:
            profile = getattr(user, 'child_profile', None)
            if not profile or certificate.child_id != profile.id:
                return Response({'detail': 'Сертификат не найден.'}, status=status.HTTP_404_NOT_FOUND)
        elif user.role == UserProfile.Role.PARENT:
            if not child_accessible_by_parent(user, certificate.child):
                return Response({'detail': 'Сертификат не найден.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            from .services.certificate_pdf import generate_certificate_pdf
            pdf_bytes = generate_certificate_pdf(certificate)
        except ImportError:
            return Response(
                {'detail': 'Генерация PDF недоступна: не установлен reportlab.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = (
            f'attachment; filename="certificate-{certificate.code}-{certificate.id}.pdf"'
        )
        return response


# ──────────────────────────────────────────────
# Статистика
# ──────────────────────────────────────────────

def _build_child_stats(child) -> dict:
    from django.db.models.functions import TruncWeek

    submissions = MissionSubmission.objects.filter(child=child)
    total = submissions.count()
    approved = submissions.filter(status=MissionSubmission.Status.APPROVED).count()
    rejected = submissions.filter(status=MissionSubmission.Status.REJECTED).count()
    pending = submissions.filter(status=MissionSubmission.Status.PENDING).count()
    completion_rate = round((approved / total * 100) if total else 0, 1)

    # Разбивка по категориям
    by_category_qs = (
        submissions.filter(status=MissionSubmission.Status.APPROVED)
        .values('mission__category__name')
        .annotate(cnt=Count('id'))
    )
    by_category = {
        (row['mission__category__name'] or 'Без категории'): row['cnt']
        for row in by_category_qs
    }

    # Любимая категория
    favorite_category = max(by_category, key=by_category.get) if by_category else None

    # Баллы по неделям (последние 8 недель)
    eight_weeks_ago = timezone.now() - timedelta(weeks=8)
    weekly_qs = (
        submissions.filter(
            status=MissionSubmission.Status.APPROVED,
            reviewed_at__gte=eight_weeks_ago
        )
        .annotate(week=TruncWeek('reviewed_at'))
        .values('week')
        .annotate(points=Sum('points_awarded'))
        .order_by('week')
    )
    points_by_week = [
        {'week': row['week'].strftime('%G-W%V'), 'points': row['points'] or 0}
        for row in weekly_qs
    ]

    achievements_count = ChildAchievement.objects.filter(child=child).count()

    return {
        'child': child,
        'total_submissions': total,
        'approved_submissions': approved,
        'rejected_submissions': rejected,
        'pending_submissions': pending,
        'total_points': child.total_points,
        'current_level': child.level,
        'streak_days': child.streak_days,
        'achievements_count': achievements_count,
        'completion_rate': completion_rate,
        'submissions_by_category': by_category,
        'points_by_week': points_by_week,
        'favorite_category': favorite_category,
    }


class ChildStatsMeView(APIView):
    """Статистика текущего ребёнка."""
    permission_classes = [IsChild]

    def get(self, request):
        child = getattr(request.user, 'child_profile', None)
        if not child:
            return Response({'detail': 'Профиль ребёнка не найден.'}, status=status.HTTP_404_NOT_FOUND)
        stats = _build_child_stats(child)
        serializer = ChildStatsSerializer(stats, context={'request': request})
        return Response(serializer.data)


class ChildStatsView(APIView):
    permission_classes = [IsParent]

    def get(self, request, child_id):
        child = get_connected_children(request.user).filter(id=child_id).first()
        if not child:
            return Response({'detail': 'Ребёнок не найден.'}, status=status.HTTP_404_NOT_FOUND)

        stats = _build_child_stats(child)
        serializer = ChildStatsSerializer(stats, context={'request': request})
        return Response(serializer.data)


class FamilyStatsView(APIView):
    permission_classes = [IsParent]

    def get(self, request):
        children = list(get_connected_children(request.user))
        children_stats = [_build_child_stats(c) for c in children]

        total_points = sum(s['total_points'] for s in children_stats)
        total_submissions = sum(s['total_submissions'] for s in children_stats)
        approved_submissions = sum(s['approved_submissions'] for s in children_stats)
        total_achievements = sum(s['achievements_count'] for s in children_stats)

        data = {
            'total_children': len(children),
            'total_points': total_points,
            'total_submissions': total_submissions,
            'approved_submissions': approved_submissions,
            'total_achievements': total_achievements,
            'children': children_stats,
        }
        serializer = FamilyStatsSerializer(data, context={'request': request})
        return Response(serializer.data)


class SchoolViewSet(viewsets.ModelViewSet):
    serializer_class = SchoolSerializer
    permission_classes = [PlatformRolePermission]
    pagination_class = StandardPagination
    write_roles = (UserProfile.Role.SCHOOL_ADMIN,)

    def get_queryset(self):
        user = self.request.user
        qs = School.objects.select_related('admin')
        if user.is_staff or user.role == UserProfile.Role.ADMIN:
            return qs
        if user.role == UserProfile.Role.SCHOOL_ADMIN:
            return qs.filter(admin=user)
        if user.role == UserProfile.Role.TEACHER:
            return qs.filter(classrooms__teacher=user).distinct()
        if user.role == UserProfile.Role.STUDENT:
            profile = getattr(user, 'student_profile', None)
            return qs.filter(id=profile.school_id) if profile and profile.school_id else qs.none()
        return qs.none()


class UniversityViewSet(viewsets.ModelViewSet):
    serializer_class = UniversitySerializer
    permission_classes = [PlatformRolePermission]
    pagination_class = StandardPagination
    write_roles = (UserProfile.Role.UNIVERSITY_ADMIN,)

    def get_queryset(self):
        user = self.request.user
        qs = University.objects.select_related('admin')
        if user.is_staff or user.role == UserProfile.Role.ADMIN:
            return qs
        if user.role == UserProfile.Role.UNIVERSITY_ADMIN:
            return qs.filter(admin=user)
        if user.role == UserProfile.Role.STUDENT:
            profile = getattr(user, 'student_profile', None)
            return qs.filter(id=profile.university_id) if profile and profile.university_id else qs.none()
        return qs.none()


class ClassRoomViewSet(viewsets.ModelViewSet):
    serializer_class = ClassRoomSerializer
    permission_classes = [PlatformRolePermission]
    pagination_class = StandardPagination
    write_roles = (UserProfile.Role.TEACHER, UserProfile.Role.SCHOOL_ADMIN)

    def get_queryset(self):
        user = self.request.user
        qs = ClassRoom.objects.select_related('school', 'teacher')
        if user.is_staff or user.role == UserProfile.Role.ADMIN:
            return qs
        if user.role == UserProfile.Role.TEACHER:
            return qs.filter(teacher=user)
        if user.role == UserProfile.Role.SCHOOL_ADMIN:
            return qs.filter(school__admin=user)
        if user.role == UserProfile.Role.STUDENT:
            profile = getattr(user, 'student_profile', None)
            return qs.filter(id=profile.class_room_id) if profile and profile.class_room_id else qs.none()
        return qs.none()


class StudentProfileViewSet(viewsets.ModelViewSet):
    serializer_class = StudentProfileSerializer
    permission_classes = [PlatformRolePermission]
    pagination_class = StandardPagination
    write_roles = (
        UserProfile.Role.TEACHER,
        UserProfile.Role.SCHOOL_ADMIN,
        UserProfile.Role.UNIVERSITY_ADMIN,
    )

    def get_queryset(self):
        user = self.request.user
        qs = StudentProfile.objects.select_related('user', 'school', 'class_room', 'university')
        if user.is_staff or user.role == UserProfile.Role.ADMIN:
            return qs
        if user.role == UserProfile.Role.STUDENT:
            return qs.filter(user=user)
        if user.role == UserProfile.Role.TEACHER:
            return qs.filter(class_room__teacher=user)
        if user.role == UserProfile.Role.SCHOOL_ADMIN:
            return qs.filter(school__admin=user)
        if user.role == UserProfile.Role.UNIVERSITY_ADMIN:
            return qs.filter(university__admin=user)
        return qs.none()


class SchoolChallengeViewSet(viewsets.ModelViewSet):
    serializer_class = SchoolChallengeSerializer
    permission_classes = [PlatformRolePermission]
    pagination_class = StandardPagination
    write_roles = (UserProfile.Role.SCHOOL_ADMIN,)

    def get_queryset(self):
        return SchoolChallenge.objects.all()


class ChallengeParticipantViewSet(viewsets.ModelViewSet):
    serializer_class = ChallengeParticipantSerializer
    permission_classes = [PlatformRolePermission]
    pagination_class = StandardPagination
    write_roles = (UserProfile.Role.TEACHER, UserProfile.Role.SCHOOL_ADMIN)

    def get_queryset(self):
        user = self.request.user
        qs = ChallengeParticipant.objects.select_related('challenge', 'school')
        if user.is_staff or user.role == UserProfile.Role.ADMIN:
            return qs
        if user.role == UserProfile.Role.SCHOOL_ADMIN:
            return qs.filter(school__admin=user)
        if user.role == UserProfile.Role.TEACHER:
            return qs.filter(school__classrooms__teacher=user).distinct()
        return qs.none()


class BrandPartnerViewSet(viewsets.ModelViewSet):
    serializer_class = BrandPartnerSerializer
    permission_classes = [PlatformRolePermission]
    pagination_class = StandardPagination
    write_roles = (UserProfile.Role.BRAND_PARTNER,)

    def get_queryset(self):
        user = self.request.user
        qs = BrandPartner.objects.select_related('user')
        if user.is_staff or user.role == UserProfile.Role.ADMIN:
            return qs
        if user.role == UserProfile.Role.BRAND_PARTNER:
            return qs.filter(user=user)
        return qs.none()


class BrandMissionViewSet(viewsets.ModelViewSet):
    serializer_class = BrandMissionSerializer
    permission_classes = [PlatformRolePermission]
    pagination_class = StandardPagination
    write_roles = (UserProfile.Role.BRAND_PARTNER,)

    def get_queryset(self):
        user = self.request.user
        qs = BrandMission.objects.select_related('partner', 'partner__user')
        if user.is_staff or user.role == UserProfile.Role.ADMIN:
            return qs
        if user.role == UserProfile.Role.BRAND_PARTNER:
            return qs.filter(partner__user=user)
        return qs.none()


class GreenPointWalletViewSet(viewsets.ModelViewSet):
    serializer_class = GreenPointWalletSerializer
    permission_classes = [PlatformRolePermission]
    pagination_class = StandardPagination
    write_roles = (
        UserProfile.Role.PARENT,
        UserProfile.Role.SCHOOL_ADMIN,
        UserProfile.Role.UNIVERSITY_ADMIN,
        UserProfile.Role.BRAND_PARTNER,
    )

    def get_queryset(self):
        user = self.request.user
        qs = GreenPointWallet.objects.select_related('owner', 'school', 'university', 'brand')
        if user.is_staff or user.role == UserProfile.Role.ADMIN:
            return qs
        if user.role == UserProfile.Role.PARENT:
            return qs.filter(owner=user)
        if user.role == UserProfile.Role.SCHOOL_ADMIN:
            return qs.filter(school__admin=user)
        if user.role == UserProfile.Role.UNIVERSITY_ADMIN:
            return qs.filter(university__admin=user)
        if user.role == UserProfile.Role.BRAND_PARTNER:
            return qs.filter(brand__user=user)
        return qs.none()


class GreenPointTransactionViewSet(viewsets.ModelViewSet):
    serializer_class = GreenPointTransactionSerializer
    permission_classes = [PlatformRolePermission]
    pagination_class = StandardPagination
    write_roles = (
        UserProfile.Role.PARENT,
        UserProfile.Role.SCHOOL_ADMIN,
        UserProfile.Role.UNIVERSITY_ADMIN,
        UserProfile.Role.BRAND_PARTNER,
    )

    def get_queryset(self):
        user = self.request.user
        qs = GreenPointTransaction.objects.select_related(
            'wallet', 'related_user', 'related_child', 'related_school'
        )
        if user.is_staff or user.role == UserProfile.Role.ADMIN:
            return qs
        if user.role == UserProfile.Role.PARENT:
            return qs.filter(wallet__owner=user)
        if user.role == UserProfile.Role.SCHOOL_ADMIN:
            return qs.filter(wallet__school__admin=user)
        if user.role == UserProfile.Role.UNIVERSITY_ADMIN:
            return qs.filter(wallet__university__admin=user)
        if user.role == UserProfile.Role.BRAND_PARTNER:
            return qs.filter(wallet__brand__user=user)
        return qs.none()

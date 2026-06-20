# coding: utf-8
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView, LoginView, LogoutView, MeView,
    ChildProfileViewSet, MissionCategoryViewSet, MissionViewSet,
    MissionSubmissionViewSet, AchievementViewSet,
    DashboardView, AIChatView, AIVoiceChatView, AITextToSpeechView,
    ChildStatsView, ChildStatsMeView, FamilyStatsView,
    RewardViewSet, RedemptionListView, VoiceDiaryView,
    EcoPassportView, EcoPassportMeView, CertificatePDFView, verify_reset_code,
    ConnectChildView, DisconnectChildView,
    MyConnectionCodeView, InviteParentView,
    ParentChildInviteView, JoinParentByCodeView, ChildLoginByCodeView,
    ChildLocationPingView, MyLocationHistoryView,
    ChildrenLatestLocationView, ChildLocationHistoryView,
    SchoolViewSet, UniversityViewSet, ClassRoomViewSet,
    StudentProfileViewSet, SchoolChallengeViewSet,
    ChallengeParticipantViewSet, BrandPartnerViewSet,
    BrandMissionViewSet, GreenPointWalletViewSet,
    GreenPointTransactionViewSet,
)

router = DefaultRouter()
router.register(r'children', ChildProfileViewSet, basename='children')
router.register(r'categories', MissionCategoryViewSet, basename='categories')
router.register(r'missions', MissionViewSet, basename='missions')
router.register(r'submissions', MissionSubmissionViewSet, basename='submissions')
router.register(r'achievements', AchievementViewSet, basename='achievements')
router.register(r'rewards', RewardViewSet, basename='rewards')
router.register(r'schools', SchoolViewSet, basename='schools')
router.register(r'universities', UniversityViewSet, basename='universities')
router.register(r'classrooms', ClassRoomViewSet, basename='classrooms')
router.register(r'student-profiles', StudentProfileViewSet, basename='student-profiles')
router.register(r'school-challenges', SchoolChallengeViewSet, basename='school-challenges')
router.register(r'challenge-participants', ChallengeParticipantViewSet, basename='challenge-participants')
router.register(r'brand-partners', BrandPartnerViewSet, basename='brand-partners')
router.register(r'brand-missions', BrandMissionViewSet, basename='brand-missions')
router.register(r'greenpoint-wallets', GreenPointWalletViewSet, basename='greenpoint-wallets')
router.register(r'greenpoint-transactions', GreenPointTransactionViewSet, basename='greenpoint-transactions')

urlpatterns = [
    # Авторизация
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='me'),

    # Привязка родитель ↔ ребёнок
    path('connections/connect/', ConnectChildView.as_view(), name='connect-child'),
    path('connections/disconnect/', DisconnectChildView.as_view(), name='disconnect-child'),
    path('connections/my-code/', MyConnectionCodeView.as_view(), name='my-connection-code'),
    path('connections/invite/', InviteParentView.as_view(), name='invite-parent'),
    path('connections/child-invites/', ParentChildInviteView.as_view(), name='child-invites'),
    path('connections/join-parent/', JoinParentByCodeView.as_view(), name='join-parent'),
    path('connections/child-login-by-code/', ChildLoginByCodeView.as_view(), name='child-login-by-code'),

    # Find My Kids locations
    path('locations/ping/', ChildLocationPingView.as_view(), name='location-ping'),
    path('locations/me/history/', MyLocationHistoryView.as_view(), name='my-location-history'),
    path('locations/children/latest/', ChildrenLatestLocationView.as_view(), name='children-latest-location'),
    path('locations/children/<int:child_id>/history/', ChildLocationHistoryView.as_view(), name='child-location-history'),

    # Дашборд и чат
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('ai-chat/', AIChatView.as_view(), name='ai-chat'),
    path('ai/voice-chat/', AIVoiceChatView.as_view(), name='ai-voice-chat'),
    path('ai/tts/', AITextToSpeechView.as_view(), name='ai-tts'),

    # Статистика
    path('stats/me/', ChildStatsMeView.as_view(), name='stats-me'),
    path('stats/child/<int:child_id>/', ChildStatsView.as_view(), name='stats-child'),
    path('stats/family/', FamilyStatsView.as_view(), name='stats-family'),

    # Магазин наград, дневник, Eco Passport
    path('redemptions/', RedemptionListView.as_view(), name='redemptions'),
    path('diary/', VoiceDiaryView.as_view(), name='diary'),
    path('passport/me/', EcoPassportMeView.as_view(), name='eco-passport-me'),
    path('passport/<int:child_id>/', EcoPassportView.as_view(), name='eco-passport'),
    path('certificates/<int:pk>/pdf/', CertificatePDFView.as_view(), name='certificate-pdf'),
    path('password_reset/', include('django_rest_passwordreset.urls', namespace='password_reset')),
    path('password_reset/verify_code/', verify_reset_code, name='verify_reset_code'),

    # ViewSet роуты
    path('', include(router.urls)),
]

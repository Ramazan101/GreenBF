# coding: utf-8
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import (
    UserProfile, ChildProfile, MissionCategory, Mission,
    MissionSubmission, Achievement, ChildAchievement, AIChatMessage,
    Reward, RewardRedemption, VoiceDiaryEntry, Certificate,
    ParentChild, ParentInvitation, ParentChildInvite, ChildLocation,
    School, University, ClassRoom, StudentProfile, SchoolChallenge,
    ChallengeParticipant, BrandPartner, BrandMission,
    GreenPointWallet, GreenPointTransaction,
)


@admin.register(UserProfile)
class UserProfileAdmin(UserAdmin):
    list_display = ('email', 'username', 'gender', 'role', 'is_active', 'created_at')
    list_filter = ('role', 'gender', 'is_active')
    search_fields = ('email', 'username')
    ordering = ('-created_at',)
    fieldsets = UserAdmin.fieldsets + (
        ('GreenLearn', {'fields': ('avatar', 'gender', 'role')}),
    )


@admin.register(ChildProfile)
class ChildProfileAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'user', 'connection_code', 'age', 'total_points', 'level', 'streak_days')
    list_filter = ('age', 'level')
    search_fields = ('name', 'parent__email', 'connection_code')


@admin.register(ParentChild)
class ParentChildAdmin(admin.ModelAdmin):
    list_display = ('parent', 'child', 'created_at')
    search_fields = ('parent__email', 'child__name')


@admin.register(ParentInvitation)
class ParentInvitationAdmin(admin.ModelAdmin):
    list_display = ('child', 'parent_email', 'is_accepted', 'created_at')
    list_filter = ('is_accepted',)
    search_fields = ('child__name', 'parent_email')


@admin.register(ParentChildInvite)
class ParentChildInviteAdmin(admin.ModelAdmin):
    list_display = ('parent', 'code', 'child_name', 'child_age', 'accepted_child', 'accepted_at', 'expires_at')
    list_filter = ('accepted_at', 'expires_at')
    search_fields = ('parent__email', 'code', 'child_name', 'accepted_child__name')
    readonly_fields = ('code', 'created_at', 'accepted_at')


@admin.register(ChildLocation)
class ChildLocationAdmin(admin.ModelAdmin):
    list_display = ('child', 'latitude', 'longitude', 'accuracy', 'battery_level', 'recorded_at')
    list_filter = ('source', 'recorded_at')
    search_fields = ('child__name', 'child__user__email')
    readonly_fields = ('created_at',)


@admin.register(MissionCategory)
class MissionCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Mission)
class MissionAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'difficulty', 'points', 'min_age', 'max_age', 'is_active')
    list_filter = ('difficulty', 'is_active', 'category')
    search_fields = ('title',)
    list_editable = ('is_active',)


@admin.register(MissionSubmission)
class MissionSubmissionAdmin(admin.ModelAdmin):
    list_display = ('child', 'mission', 'parent', 'status', 'points_awarded', 'created_at')
    list_filter = ('status',)
    search_fields = ('child__name', 'mission__title', 'parent__email')
    readonly_fields = ('created_at', 'reviewed_at')


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ('title', 'required_points', 'required_missions_count', 'is_active')
    list_editable = ('is_active',)


@admin.register(ChildAchievement)
class ChildAchievementAdmin(admin.ModelAdmin):
    list_display = ('child', 'achievement', 'unlocked_at')
    search_fields = ('child__name', 'achievement__title')


@admin.register(AIChatMessage)
class AIChatMessageAdmin(admin.ModelAdmin):
    list_display = ('parent', 'child', 'role', 'created_at')
    list_filter = ('role',)
    search_fields = ('parent__email', 'message')


@admin.register(Reward)
class RewardAdmin(admin.ModelAdmin):
    list_display = ('title', 'partner', 'cost_points', 'stock', 'is_active')
    list_filter = ('is_active', 'partner')
    search_fields = ('title', 'partner')
    list_editable = ('is_active',)


@admin.register(RewardRedemption)
class RewardRedemptionAdmin(admin.ModelAdmin):
    list_display = ('child', 'reward', 'points_spent', 'code', 'created_at')
    search_fields = ('child__name', 'reward__title', 'code')
    readonly_fields = ('created_at',)


@admin.register(VoiceDiaryEntry)
class VoiceDiaryEntryAdmin(admin.ModelAdmin):
    list_display = ('child', 'word_count', 'created_at')
    search_fields = ('child__name', 'text')
    readonly_fields = ('created_at',)


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('child', 'title', 'code', 'issued_at')
    list_filter = ('code',)
    search_fields = ('child__name', 'title')


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'district', 'admin', 'points_balance')
    search_fields = ('name', 'city', 'district', 'admin__email')
    list_filter = ('city', 'district')


@admin.register(University)
class UniversityAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'admin', 'points_balance')
    search_fields = ('name', 'city', 'admin__email')
    list_filter = ('city',)


@admin.register(ClassRoom)
class ClassRoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'school', 'teacher', 'points_balance')
    search_fields = ('name', 'school__name', 'teacher__email')
    list_filter = ('school',)


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'school', 'class_room', 'university', 'total_points', 'level', 'streak_days')
    search_fields = ('user__email', 'user__username', 'school__name', 'class_room__name', 'university__name')
    list_filter = ('school', 'university', 'level')


@admin.register(SchoolChallenge)
class SchoolChallengeAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'start_date', 'end_date', 'prize')
    list_filter = ('status', 'start_date')
    search_fields = ('title', 'description', 'prize')


@admin.register(ChallengeParticipant)
class ChallengeParticipantAdmin(admin.ModelAdmin):
    list_display = ('challenge', 'school', 'points', 'rank')
    list_filter = ('challenge',)
    search_fields = ('challenge__title', 'school__name')


@admin.register(BrandPartner)
class BrandPartnerAdmin(admin.ModelAdmin):
    list_display = ('brand_name', 'user')
    search_fields = ('brand_name', 'user__email')


@admin.register(BrandMission)
class BrandMissionAdmin(admin.ModelAdmin):
    list_display = ('title', 'partner', 'points', 'reward_description', 'is_active')
    list_filter = ('is_active', 'partner')
    search_fields = ('title', 'partner__brand_name')


@admin.register(GreenPointWallet)
class GreenPointWalletAdmin(admin.ModelAdmin):
    list_display = ('owner_type', 'owner', 'school', 'university', 'brand', 'balance')
    list_filter = ('owner_type',)
    search_fields = ('owner__email', 'school__name', 'university__name', 'brand__brand_name')


@admin.register(GreenPointTransaction)
class GreenPointTransactionAdmin(admin.ModelAdmin):
    list_display = ('transaction_type', 'amount', 'wallet', 'description', 'created_at')
    list_filter = ('transaction_type', 'created_at')
    search_fields = ('description', 'source', 'target', 'related_user__email', 'related_school__name')

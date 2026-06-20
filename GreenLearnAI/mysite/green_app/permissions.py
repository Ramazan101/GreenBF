# coding: utf-8
from rest_framework.permissions import BasePermission

from .models import UserProfile


class IsParent(BasePermission):
    """Только авторизованные родители."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == UserProfile.Role.PARENT
        )


class IsAdminUser(BasePermission):
    """Только администраторы."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == UserProfile.Role.ADMIN
        )


class IsChild(BasePermission):
    """Только авторизованные дети."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == UserProfile.Role.CHILD
        )


class IsParentOfChild(BasePermission):
    """
    Родитель может управлять ребёнком, если он владелец (parent FK)
    ИЛИ подключён к ребёнку через ParentChild.
    """
    def has_object_permission(self, request, view, obj):
        if obj.parent_id == request.user.id:
            return True
        return obj.parent_links.filter(parent=request.user).exists()


class IsParentOrChild(BasePermission):
    """Родитель или ребёнок."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            request.user.role in (UserProfile.Role.PARENT, UserProfile.Role.CHILD)
        )


class IsParentOfSubmission(BasePermission):
    """Доступ к submission: родитель (только просмотр) или ребёнок (свои записи)."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role == UserProfile.Role.CHILD:
            return view.action in (None, 'list', 'retrieve', 'create', 'ai_check', 'resubmit_photo')
        if request.user.role == UserProfile.Role.PARENT:
            return view.action in (None, 'list', 'retrieve', 'ai_check', 'approve', 'reject')
        return request.user.role == UserProfile.Role.ADMIN

    def has_object_permission(self, request, view, obj):
        from .services.connections import get_connected_children
        user = request.user
        if user.role == UserProfile.Role.CHILD:
            profile = getattr(user, 'child_profile', None)
            return profile and obj.child_id == profile.id
        if user.role == UserProfile.Role.PARENT:
            return obj.child_id in get_connected_children(user).values_list('id', flat=True)
        return True

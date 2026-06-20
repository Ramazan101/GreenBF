# coding: utf-8
"""
Обратная совместимость: реэкспорт всех публичных функций из подмодулей.
"""
from green_app.services.gamification import (  # noqa: F401
    award_points,
    update_level,
    unlock_achievements,
    update_streak,
)
from green_app.services.missions import (  # noqa: F401
    can_submit_today,
    get_recommended_missions,
)
from green_app.services.ai_chat import chat_with_ai, build_system_prompt  # noqa: F401
from green_app.services.ai_vision import check_mission_photo  # noqa: F401
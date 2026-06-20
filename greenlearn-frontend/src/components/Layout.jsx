import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BarChart2, BookOpen, ClipboardList, Gift, Globe, HeartHandshake,
  LayoutDashboard, Leaf, Link2, ListChecks, LogOut,
  MessageCircle, Star, Trophy, Users,
} from 'lucide-react';
import { APP_TARGET, getAppName } from '../config/appMode';

const PARENT_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Главная', exact: true },
  { to: '/children', icon: Users, label: 'Дети' },
  { to: '/submissions', icon: ClipboardList, label: 'Отчёты' },
  { to: '/connect-child', icon: Link2, label: 'Код ребёнка' },
  { to: '/psychologist', icon: HeartHandshake, label: 'AI-психолог' },
  { to: '/parent-rewards', icon: Gift, label: 'Награды' },
  { to: '/parent-stats', icon: BarChart2, label: 'Статистика' },
  { to: '/mission-builder', icon: MessageCircle, label: 'AI Mission Builder' },
];

const CHILD_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Главная', exact: true },
  { to: '/my-tasks', icon: ListChecks, label: 'Задания' },
  { to: '/my-submissions', icon: ClipboardList, label: 'Отчёты' },
  { to: '/rewards', icon: Gift, label: 'Награды' },
  { to: '/achievements', icon: Trophy, label: 'Достижения' },
  { to: '/diary', icon: BookOpen, label: 'Дневник' },
  { to: '/passport', icon: Globe, label: 'Eco Passport' },
  { to: '/chat', icon: MessageCircle, label: 'AI-наставник' },
  { to: '/stats', icon: BarChart2, label: 'Статистика' },
];

const TEACHER_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Главная', exact: true },
  { to: '/teacher/students', icon: Users, label: 'Ученики' },
  { to: '/teacher/missions', icon: ListChecks, label: 'Миссии' },
  { to: '/teacher/submissions', icon: ClipboardList, label: 'Проверка' },
  { to: '/school/leaderboard', icon: Trophy, label: 'Рейтинг класса' },
  { to: '/mission-builder', icon: MessageCircle, label: 'AI Mission Builder' },
];

const SCHOOL_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Главная', exact: true },
  { to: '/school/classes', icon: Users, label: 'Классы' },
  { to: '/school/wallet', icon: Star, label: 'GreenPoints' },
  { to: '/school-challenges', icon: Trophy, label: 'Соревнования' },
  { to: '/national-leaderboard', icon: BarChart2, label: 'Рейтинг' },
  { to: '/eco-map', icon: Globe, label: 'Эко-карта' },
];

const STUDENT_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Главная', exact: true },
  { to: '/student', icon: ListChecks, label: 'Волонтёрские миссии' },
  { to: '/student/rewards', icon: Gift, label: 'Награды' },
  { to: '/student/passport', icon: Globe, label: 'Eco Passport' },
  { to: '/student/leaderboard', icon: Trophy, label: 'Рейтинг' },
];

const UNIVERSITY_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Главная', exact: true },
  { to: '/', icon: Users, label: 'Группы', exact: true },
  { to: '/university/wallet', icon: Star, label: 'GreenPoints' },
  { to: '/', icon: HeartHandshake, label: 'Волонтёрство', exact: true },
  { to: '/university/leaderboard', icon: Trophy, label: 'Рейтинг' },
];

const BRAND_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Главная', exact: true },
  { to: '/brand/missions', icon: ListChecks, label: 'Брендовые миссии' },
  { to: '/brand/rewards', icon: Gift, label: 'Купоны' },
  { to: '/', icon: BarChart2, label: 'Аналитика', exact: true },
];

const ADMIN_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Главная', exact: true },
  { to: '/school-challenges', icon: Trophy, label: 'Соревнования' },
  { to: '/national-leaderboard', icon: BarChart2, label: 'Национальный рейтинг' },
  { to: '/eco-map', icon: Globe, label: 'Эко-карта' },
];

const ROLE_META = {
  parent: 'Родитель',
  child: 'Детский профиль',
  teacher: 'Учитель',
  school_admin: 'Администратор школы',
  university_admin: 'Администратор ВУЗа',
  student: 'Студент',
  brand_partner: 'Бренд-партнёр',
  admin: 'Администратор',
};

function getNavItems(role) {
  if (APP_TARGET === 'parent') return PARENT_NAV;
  if (APP_TARGET === 'child') return CHILD_NAV;
  if (role === 'child') return CHILD_NAV;
  if (role === 'teacher') return TEACHER_NAV;
  if (role === 'school_admin') return SCHOOL_NAV;
  if (role === 'student') return STUDENT_NAV;
  if (role === 'university_admin') return UNIVERSITY_NAV;
  if (role === 'brand_partner') return BRAND_NAV;
  if (role === 'admin') return ADMIN_NAV;
  return PARENT_NAV;
}

export default function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const navItems = getNavItems(user?.role);
  const displayName = user?.child_profile?.name || user?.username || user?.email;
  const displayMeta = user?.role === 'child' ? ROLE_META.child : (ROLE_META[user?.role] || user?.email);

  const handleLogout = () => {
    signOut();
    navigate(APP_TARGET === 'child' ? '/join' : '/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Leaf size={24} color="#16a34a" />
          <span>{getAppName()}</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label, exact }, index) => (
            <NavLink
              key={`${to}-${label}-${index}`}
              to={to}
              end={exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar-circle">
              {displayName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="user-name">{displayName}</p>
              <p className="user-email">{displayMeta}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Выйти">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

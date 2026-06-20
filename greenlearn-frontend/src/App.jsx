import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Children from './pages/Children';
import Submissions from './pages/Submissions';
import Achievements from './pages/Achievements';
import AIChat from './pages/AIChat';
import Stats from './pages/Stats';
import Rewards from './pages/Rewards';
import Diary from './pages/Diary';
import Passport from './pages/Passport';
import ConnectChild from './pages/ConnectChild';
import ChildHome from './pages/ChildHome';
import ChildTasks from './pages/ChildTasks';
import ChildSubmissions from './pages/ChildSubmissions';
import ChildSubmissionDetail from './pages/ChildSubmissionDetail';
import JoinParent from './pages/JoinParent';
import Landing from './pages/Landing';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherMissions from './pages/TeacherMissions';
import TeacherStudents from './pages/TeacherStudents';
import TeacherSubmissions from './pages/TeacherSubmissions';
import SchoolDashboard from './pages/SchoolDashboard';
import SchoolClasses from './pages/SchoolClasses';
import SchoolWallet from './pages/SchoolWallet';
import SchoolLeaderboard from './pages/SchoolLeaderboard';
import SchoolChallenges from './pages/SchoolChallenges';
import ChallengeDetail from './pages/ChallengeDetail';
import NationalLeaderboard from './pages/NationalLeaderboard';
import EcoMap from './pages/EcoMap';
import StudentDashboard from './pages/StudentDashboard';
import StudentRewards from './pages/StudentRewards';
import StudentPassport from './pages/StudentPassport';
import UniversityDashboard from './pages/UniversityDashboard';
import UniversityWallet from './pages/UniversityWallet';
import BrandPartnerDashboard from './pages/BrandPartnerDashboard';
import BrandMissions from './pages/BrandMissions';
import BrandRewards from './pages/BrandRewards';
import AIMissionBuilder from './pages/AIMissionBuilder';
import ParentStats from './pages/ParentStats';
import { APP_TARGET, getAppName, getExpectedRole, isRoleAllowed } from './config/appMode';

const APP_TITLE = getAppName();

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="spinner" />
    </div>
  );
}

function WrongAppRole() {
  const { user, signOut } = useAuth();
  const expectedRole = getExpectedRole();
  const labels = {
    parent: 'родителя',
    child: 'ребёнка',
    teacher: 'учителя',
    school_admin: 'администратора школы',
    university_admin: 'администратора ВУЗа',
    student: 'студента',
    brand_partner: 'бренда-партнёра',
    admin: 'администратора',
  };
  const expectedLabel = labels[expectedRole] || expectedRole;
  const currentLabel = labels[user?.role] || user?.role;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">{getAppName()}</div>
        <p className="auth-subtitle">
          Это приложение для аккаунта {expectedLabel}. Сейчас выполнен вход как {currentLabel}.
        </p>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={signOut}>
          Выйти и войти правильно
        </button>
      </div>
    </div>
  );
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to={APP_TARGET === 'child' ? '/join' : '/login'} replace />;
  if (!isRoleAllowed(user.role)) return <WrongAppRole />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user && !isRoleAllowed(user.role)) return <WrongAppRole />;
  return user ? <Navigate to="/" replace /> : children;
}

function RoleRoute({ role, roles, children }) {
  const { user } = useAuth();
  const allowed = roles || (role ? [role] : []);
  return allowed.includes(user?.role) ? children : <Navigate to="/" replace />;
}

function RoleHome() {
  const { user } = useAuth();
  if (APP_TARGET === 'parent') return <Dashboard />;
  if (APP_TARGET === 'child') return <ChildHome />;
  if (user?.role === 'child') return <ChildHome />;
  if (user?.role === 'teacher') return <TeacherDashboard />;
  if (user?.role === 'school_admin') return <SchoolDashboard />;
  if (user?.role === 'student') return <StudentDashboard />;
  if (user?.role === 'university_admin') return <UniversityDashboard />;
  if (user?.role === 'brand_partner') return <BrandPartnerDashboard />;
  if (user?.role === 'admin') return <SchoolDashboard />;
  return <Dashboard />;
}

function ParentRoutes() {
  return (
    <>
      <Route path="children" element={<RoleRoute role="parent"><Children /></RoleRoute>} />
      <Route path="submissions" element={<RoleRoute role="parent"><Submissions /></RoleRoute>} />
      <Route path="connect-child" element={<RoleRoute role="parent"><ConnectChild /></RoleRoute>} />
      <Route path="psychologist" element={<RoleRoute role="parent"><AIChat variant="parent-psychologist" /></RoleRoute>} />
      <Route path="parent-rewards" element={<RoleRoute role="parent"><Rewards /></RoleRoute>} />
      <Route path="parent-stats" element={<RoleRoute role="parent"><ParentStats /></RoleRoute>} />
      <Route path="mission-builder" element={<RoleRoute roles={['teacher', 'parent', 'school_admin']}><AIMissionBuilder /></RoleRoute>} />
    </>
  );
}

function ChildRoutes() {
  return (
    <>
      <Route path="my-tasks" element={<RoleRoute role="child"><ChildTasks /></RoleRoute>} />
      <Route path="my-submissions" element={<RoleRoute role="child"><ChildSubmissions /></RoleRoute>} />
      <Route path="my-submissions/:id" element={<RoleRoute role="child"><ChildSubmissionDetail /></RoleRoute>} />
      <Route path="rewards" element={<RoleRoute role="child"><Rewards /></RoleRoute>} />
      <Route path="achievements" element={<RoleRoute role="child"><Achievements /></RoleRoute>} />
      <Route path="diary" element={<RoleRoute role="child"><Diary /></RoleRoute>} />
      <Route path="passport" element={<RoleRoute role="child"><Passport /></RoleRoute>} />
      <Route path="chat" element={<RoleRoute role="child"><AIChat variant="child-mentor" /></RoleRoute>} />
      <Route path="stats" element={<RoleRoute role="child"><Stats /></RoleRoute>} />
    </>
  );
}

function TeacherRoutes() {
  return (
    <>
      <Route path="teacher/students" element={<RoleRoute role="teacher"><TeacherStudents /></RoleRoute>} />
      <Route path="teacher/missions" element={<RoleRoute role="teacher"><TeacherMissions /></RoleRoute>} />
      <Route path="teacher/submissions" element={<RoleRoute role="teacher"><TeacherSubmissions /></RoleRoute>} />
      <Route path="mission-builder" element={<RoleRoute roles={['teacher', 'parent', 'school_admin']}><AIMissionBuilder /></RoleRoute>} />
    </>
  );
}

function SchoolRoutes() {
  return (
    <>
      <Route path="school/classes" element={<RoleRoute role="school_admin"><SchoolClasses /></RoleRoute>} />
      <Route path="school/wallet" element={<RoleRoute role="school_admin"><SchoolWallet /></RoleRoute>} />
      <Route path="school/leaderboard" element={<RoleRoute roles={['school_admin', 'teacher']}><SchoolLeaderboard /></RoleRoute>} />
      <Route path="school-challenges" element={<RoleRoute roles={['school_admin', 'teacher', 'admin']}><SchoolChallenges /></RoleRoute>} />
      <Route path="challenges/:id" element={<RoleRoute roles={['school_admin', 'teacher', 'admin']}><ChallengeDetail /></RoleRoute>} />
      <Route path="national-leaderboard" element={<RoleRoute roles={['school_admin', 'teacher', 'admin']}><NationalLeaderboard /></RoleRoute>} />
      <Route path="eco-map" element={<RoleRoute roles={['school_admin', 'teacher', 'admin']}><EcoMap /></RoleRoute>} />
    </>
  );
}

function StudentRoutes() {
  return (
    <>
      <Route path="student" element={<RoleRoute role="student"><StudentDashboard /></RoleRoute>} />
      <Route path="student/rewards" element={<RoleRoute role="student"><StudentRewards /></RoleRoute>} />
      <Route path="student/passport" element={<RoleRoute role="student"><StudentPassport /></RoleRoute>} />
      <Route path="student/leaderboard" element={<RoleRoute role="student"><NationalLeaderboard /></RoleRoute>} />
    </>
  );
}

function UniversityRoutes() {
  return (
    <>
      <Route path="university/wallet" element={<RoleRoute role="university_admin"><UniversityWallet /></RoleRoute>} />
      <Route path="university/leaderboard" element={<RoleRoute role="university_admin"><NationalLeaderboard /></RoleRoute>} />
    </>
  );
}

function BrandRoutes() {
  return (
    <>
      <Route path="brand/missions" element={<RoleRoute role="brand_partner"><BrandMissions /></RoleRoute>} />
      <Route path="brand/rewards" element={<RoleRoute role="brand_partner"><BrandRewards /></RoleRoute>} />
    </>
  );
}

export default function App() {
  useEffect(() => {
    document.title = APP_TITLE;
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/landing" element={<Landing />} />
          <Route path="/join" element={<JoinParent />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<RoleHome />} />
            {(APP_TARGET === 'all' || APP_TARGET === 'parent') && ParentRoutes()}
            {(APP_TARGET === 'all' || APP_TARGET === 'child') && ChildRoutes()}
            {APP_TARGET === 'all' && TeacherRoutes()}
            {APP_TARGET === 'all' && SchoolRoutes()}
            {APP_TARGET === 'all' && StudentRoutes()}
            {APP_TARGET === 'all' && UniversityRoutes()}
            {APP_TARGET === 'all' && BrandRoutes()}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

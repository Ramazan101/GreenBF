export const APP_TARGET = import.meta.env.VITE_APP_TARGET || 'all';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'GreenLearn';
export const CHILD_APP_URL = import.meta.env.VITE_CHILD_APP_URL || 'http://127.0.0.1:5174';
export const PARENT_APP_URL = import.meta.env.VITE_PARENT_APP_URL || 'http://127.0.0.1:5173';

export const APP_MODES = {
  parent: {
    role: 'parent',
    name: 'Find My Kids',
    subtitle: 'родительское приложение',
    homeLabel: 'Главная',
  },
  child: {
    role: 'child',
    name: 'Pingo',
    subtitle: 'детское приложение',
    homeLabel: 'Главная',
  },
};

export function getExpectedRole() {
  return APP_MODES[APP_TARGET]?.role || null;
}

export function getAppName() {
  return APP_MODES[APP_TARGET]?.name || APP_NAME;
}

export function getAppSubtitle() {
  return APP_MODES[APP_TARGET]?.subtitle || 'семейное приложение';
}

export function isRoleAllowed(role) {
  const expected = getExpectedRole();
  return !expected || role === expected;
}

export function getChildJoinLink(code) {
  return `${CHILD_APP_URL.replace(/\/$/, '')}/join?code=${encodeURIComponent(code)}`;
}

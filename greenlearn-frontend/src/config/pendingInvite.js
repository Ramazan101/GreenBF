export const PENDING_INVITE_CODE_KEY = 'pingo:pending_parent_invite_code';

export function savePendingInviteCode(code) {
  if (code) sessionStorage.setItem(PENDING_INVITE_CODE_KEY, code);
}

export function getPendingInviteCode() {
  return sessionStorage.getItem(PENDING_INVITE_CODE_KEY);
}

export function clearPendingInviteCode() {
  sessionStorage.removeItem(PENDING_INVITE_CODE_KEY);
}

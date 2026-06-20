import client from './client';

// Auth
export const register = (data) => client.post('/auth/register/', data);
export const login = (data) => client.post('/auth/login/', data);
export const logout = (data) => client.post('/auth/logout/', data);
export const getMe = () => client.get('/auth/me/');

// Password reset (сброс пароля по коду из письма)
export const requestPasswordReset = (email) => client.post('/password_reset/', { email });
export const verifyResetCode = (data) => client.post('/password_reset/verify_code/', data);

// Children
export const getChildren = () => client.get('/children/');

// Connections (привязка родитель ↔ ребёнок)
export const disconnectChildLink = (childId) => client.post('/connections/disconnect/', { child_id: childId });
export const getChildInvites = () => client.get('/connections/child-invites/');
export const joinParentByCode = (code) => client.post('/connections/join-parent/', { code });
export const loginChildByCode = (code) => client.post('/connections/child-login-by-code/', { code });

// Missions
export const getMissions = (params) => client.get('/missions/', { params });
export const getCategories = () => client.get('/categories/');
export const getRecommendedMe = () => client.get('/missions/recommended/me/');

// Submissions
export const getSubmissions = (params) => client.get('/submissions/', { params });
export const getSubmission = (id) => client.get(`/submissions/${id}/`);
export const runSubmissionAiCheck = (id) => client.post(`/submissions/${id}/ai-check/`);
export const resubmitSubmissionPhoto = (id, data) => client.post(`/submissions/${id}/resubmit-photo/`, data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const approveSubmission = (id) => client.post(`/submissions/${id}/approve/`);
export const rejectSubmission = (id, reason) => client.post(`/submissions/${id}/reject/`, { reason });
export const createSubmission = (data) => client.post('/submissions/', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Achievements
export const getAchievements = () => client.get('/achievements/');

// Dashboard
export const getDashboard = () => client.get('/dashboard/');

// AI Chat
export const getChatHistory = (childId) => client.get('/ai-chat/', { params: childId ? { child_id: childId } : {} });
export const sendChatMessage = (message, childId, mode) => client.post('/ai-chat/', {
  message,
  ...(childId && { child_id: childId }),
  ...(mode && { mode })
});
export const sendVoiceMessage = (transcript, childId, mode) => client.post('/ai/voice-chat/', {
  transcript,
  ...(childId && { child_id: childId }),
  ...(mode && { mode })
});
export const getPsychologistSpeech = (text, voice) => client.post('/ai/tts/', {
  text,
  ...(voice && { voice })
}, {
  responseType: 'blob'
});

// Stats
export const getMyStats = () => client.get('/stats/me/');
export const getChildStats = (childId) => client.get(`/stats/child/${childId}/`);
export const getFamilyStats = () => client.get('/stats/family/');

// Rewards
export const getRewards = () => client.get('/rewards/');
export const redeemReward = (rewardId) => client.post(`/rewards/${rewardId}/redeem/`);
export const getRedemptions = () => client.get('/redemptions/');

// Voice diary
export const getDiaryEntries = (childId) => client.get('/diary/', { params: childId ? { child_id: childId } : {} });
export const createDiaryEntry = (text) => client.post('/diary/', { text });

// Eco Passport
export const getMyEcoPassport = () => client.get('/passport/me/');
export const getEcoPassport = (childId) => client.get(`/passport/${childId}/`);
export const downloadCertificatePdf = (certId) => client.get(`/certificates/${certId}/pdf/`, { responseType: 'blob' });

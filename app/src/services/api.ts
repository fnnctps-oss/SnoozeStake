const API_BASE = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://api.snoozestake.com/api';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// Auth
export const authApi = {
  register: (body: { firebaseUid: string; email: string; displayName: string; referralCode?: string }) =>
    request<{ user: any; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (firebaseUid: string) =>
    request<{ user: any; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ firebaseUid }) }),
  me: () => request<{ user: any }>('/auth/me'),
};

// Alarms
export const alarmApi = {
  list: () => request<{ alarms: any[] }>('/alarms'),
  create: (body: any) =>
    request<{ alarm: any }>('/alarms', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: any) =>
    request<{ alarm: any }>(`/alarms/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id: string) =>
    request<{ message: string }>(`/alarms/${id}`, { method: 'DELETE' }),
  toggle: (id: string) =>
    request<{ alarm: any }>(`/alarms/${id}/toggle`, { method: 'POST' }),
};

// Snooze
export const snoozeApi = {
  snooze: (alarmId: string, snoozeNumber: number) =>
    request<any>('/snooze', { method: 'POST', body: JSON.stringify({ alarmId, snoozeNumber }) }),
  wake: (body: { alarmId: string; snoozeCount: number; totalPenalty: number; taskCompleted?: string }) =>
    request<any>('/snooze/wake', { method: 'POST', body: JSON.stringify(body) }),
};

// Wallet
export const walletApi = {
  get: () => request<{ walletBalance: number; totalSnoozed: number; totalSaved: number }>('/wallet'),
  topUp: (amount: number) =>
    request<{ clientSecret: string; paymentIntentId: string }>('/wallet/topup', { method: 'POST', body: JSON.stringify({ amount }) }),
  confirmTopUp: (paymentIntentId: string) =>
    request<{ walletBalance: number }>('/wallet/topup/confirm', { method: 'POST', body: JSON.stringify({ paymentIntentId }) }),
  transactions: (page = 1, limit = 20) =>
    request<{ transactions: any[]; total: number }>(`/wallet/transactions?page=${page}&limit=${limit}`),
};

// Stats
export const statsApi = {
  dashboard: () => request<any>('/stats/dashboard'),
  history: (page = 1) => request<any>(`/stats/history?page=${page}`),
};

// Friends
export const friendApi = {
  list: () => request<{ friends: any[] }>('/friends'),
  pending: () => request<{ pending: any[] }>('/friends/pending'),
  invite: (identifier: string) =>
    request<any>('/friends/invite', { method: 'POST', body: JSON.stringify({ identifier }) }),
  accept: (id: string) =>
    request<any>(`/friends/accept/${id}`, { method: 'POST' }),
  decline: (id: string) =>
    request<any>(`/friends/decline/${id}`, { method: 'POST' }),
  remove: (id: string) =>
    request<any>(`/friends/${id}`, { method: 'DELETE' }),
};

// Battles
export const battleApi = {
  list: () => request<{ battles: any[] }>('/battles'),
  get: (id: string) => request<{ battle: any }>(`/battles/${id}`),
  create: (opponentId: string, betAmount: number) =>
    request<{ battle: any }>('/battles', { method: 'POST', body: JSON.stringify({ opponentId, betAmount }) }),
  accept: (id: string) =>
    request<any>(`/battles/${id}/accept`, { method: 'POST' }),
  decline: (id: string) =>
    request<any>(`/battles/${id}/decline`, { method: 'POST' }),
};

// Groups
export const groupApi = {
  list: () => request<{ groups: any[] }>('/groups'),
  get: (id: string) => request<any>(`/groups/${id}`),
  create: (name: string) =>
    request<{ group: any }>('/groups', { method: 'POST', body: JSON.stringify({ name }) }),
  join: (inviteCode: string) =>
    request<any>('/groups/join', { method: 'POST', body: JSON.stringify({ inviteCode }) }),
  leave: (id: string) =>
    request<any>(`/groups/${id}/leave`, { method: 'POST' }),
  remove: (id: string) =>
    request<any>(`/groups/${id}`, { method: 'DELETE' }),
};

// Charities
export const charityApi = {
  list: () => request<{ charities: any[] }>('/charities'),
  get: (id: string) => request<any>(`/charities/${id}`),
  impact: () => request<any>('/charities/user/impact'),
};

// Feed
export const feedApi = {
  get: (page = 1) => request<{ feed: any[] }>(`/feed?page=${page}`),
};

export const paymentApi = {
  getConfig: () => request<{ publishableKey: string }>('/payments/config'),
  createPaymentIntent: (amount: number) =>
    request<{ clientSecret: string; paymentIntentId: string }>('/payments/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
  getWallet: () =>
    request<{ walletBalance: string; totalSnoozed: string; totalSaved: string }>('/payments/wallet'),
  getHistory: () => request<{ transactions: any[] }>('/payments/history'),
  withdraw: (amount: number) =>
    request<{
      success: boolean;
      amount: number;
      fee: number;
      netRefund: number;
      totalDeducted: number;
      newBalance: number;
      refundId: string;
    }>('/payments/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
};

import { API_BASE_URL, apiRequest } from './api';

export type LoginPayload = {
  email: string;
  password: string;
};

export type SignupPayload = {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
};

type TokenResponse = {
  token?: string;
  message?: string;
  admin?: {
    email?: string;
  };
};

export type ProfileResponse = {
  firstname?: string;
  lastname?: string;
  username?: string;
  email?: string;
};

type LoginResult = {
  role: 'user' | 'admin';
  token: string;
  adminName?: string;
  profile?: ProfileResponse;
};

async function postAuth(
  endpoint: '/user/login' | '/admin/login',
  payload: LoginPayload,
): Promise<{ ok: boolean; data: TokenResponse }> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as TokenResponse;
  return { ok: response.ok, data };
}

export async function loginWithRoleFallback(payload: LoginPayload): Promise<LoginResult> {
  const userResult = await postAuth('/user/login', payload);
  if (userResult.ok && userResult.data.token) {
    let profile: ProfileResponse | undefined;
    try {
      profile = await fetchUserProfile(userResult.data.token);
    } catch {
      profile = undefined;
    }

    return {
      role: 'user',
      token: userResult.data.token,
      profile,
    };
  }

  const adminResult = await postAuth('/admin/login', payload);
  if (adminResult.ok && adminResult.data.token) {
    return {
      role: 'admin',
      token: adminResult.data.token,
      adminName: adminResult.data.admin?.email ?? 'Admin',
    };
  }

  throw new Error(
    userResult.data.message ||
      adminResult.data.message ||
      'Invalid credentials.',
  );
}

export async function fetchUserProfile(token: string): Promise<ProfileResponse> {
  return apiRequest<ProfileResponse>('/user/profile', {
    token,
  });
}

export async function signupUser(payload: SignupPayload): Promise<{ message?: string }> {
  return apiRequest<{ message?: string }>('/user/signup', {
    method: 'POST',
    body: payload,
  });
}

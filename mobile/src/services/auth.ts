import { API_BASE_URL, apiRequest, type ApiError } from './api';

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
  cbrilliance_email?: string | null;
  cbrilliance_email_verified?: boolean;
  cbrilliance_email_verified_at?: string | null;
};

type LoginResult = {
  role: 'user' | 'admin';
  token: string;
  adminName?: string;
};

async function postAuth(
  endpoint: '/user/login' | '/admin/login',
  payload: LoginPayload,
): Promise<{ ok: boolean; data: TokenResponse }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const data = (await response.json()) as TokenResponse;
    return { ok: response.ok, data };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { ok: false, data: { message: 'Request timed out. Please try again.' } };
    }
    const apiError = error as ApiError;
    return {
      ok: false,
      data: { message: apiError?.message || 'Connection error. Please try again.' },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function loginWithRoleFallback(payload: LoginPayload): Promise<LoginResult> {
  // Try both roles in parallel so admin (and failed) logins are not serial waterfalls.
  const [userResult, adminResult] = await Promise.all([
    postAuth('/user/login', payload),
    postAuth('/admin/login', payload),
  ]);

  if (userResult.ok && userResult.data.token) {
    return {
      role: 'user',
      token: userResult.data.token,
    };
  }

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

export type UpdateProfilePayload = {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
};

export async function fetchUserProfile(token: string): Promise<ProfileResponse> {
  const data = await apiRequest<ProfileResponse | { user?: ProfileResponse }>('/user/profile', {
    token,
  });
  if ('user' in data && data.user) {
    return data.user;
  }
  return data as ProfileResponse;
}

export async function updateUserProfile(
  token: string,
  payload: UpdateProfilePayload,
): Promise<ProfileResponse> {
  const data = await apiRequest<ProfileResponse | { user?: ProfileResponse }>('/user/profile', {
    method: 'PUT',
    token,
    body: payload,
  });
  if ('user' in data && data.user) {
    return data.user;
  }
  return data as ProfileResponse;
}

export async function logoutUser(token: string): Promise<void> {
  try {
    await apiRequest('/user/logout', {
      method: 'POST',
      token,
    });
  } catch {
    // Local logout still proceeds even if the API call fails.
  }
}

export async function deleteUserAccount(token: string): Promise<{ success?: boolean; message?: string }> {
  return apiRequest<{ success?: boolean; message?: string }>('/user/account', {
    method: 'DELETE',
    token,
  });
}

export async function signupUser(payload: SignupPayload): Promise<{ message?: string }> {
  return apiRequest<{ message?: string }>('/user/signup', {
    method: 'POST',
    body: payload,
  });
}

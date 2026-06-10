export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://api.cbrixi.com').replace(
  /\/+$/,
  '',
);

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type ApiRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  token?: string;
};

export type ApiError = {
  message: string;
  status?: number;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = Boolean(contentType && contentType.includes('application/json'));

  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'message' in payload
        ? String((payload as { message?: string }).message)
        : 'Request failed. Please try again.';

    throw {
      message,
      status: response.status,
    } satisfies ApiError;
  }

  return payload as T;
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  return parseResponse<T>(response);
}

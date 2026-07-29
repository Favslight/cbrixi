export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://api.cbrixi.com').replace(
  /\/+$/,
  '',
);

const DEFAULT_TIMEOUT_MS = 15000;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type ApiRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  token?: string;
  timeoutMs?: number;
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

function toApiError(error: unknown): ApiError {
  if (error && typeof error === 'object' && 'message' in error) {
    return error as ApiError;
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return { message: 'Request timed out. Please try again.' };
  }

  return { message: 'Request failed. Please try again.' };
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
      signal: controller.signal,
    });

    return await parseResponse<T>(response);
  } catch (error) {
    throw toApiError(error);
  } finally {
    clearTimeout(timeoutId);
  }
}

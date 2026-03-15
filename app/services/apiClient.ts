import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://healeasy.vercel.app/api/v1';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors?: unknown;
}

export class ApiError extends Error {
  constructor(public message: string, public statusCode: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    return token;
  } catch (error) {
    console.error('[ApiClient] Error retrieving token:', error);
    return null;
  }
}

// Helper to store token for API use
export async function setTokenForApi(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem('auth_token', token);
    console.log('[ApiClient] Token stored for API requests');
  } catch (error) {
    console.error('[ApiClient] Error storing token:', error);
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = await getToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  // Handle 304 Not Modified - need to fetch fresh data
  if (response.status === 304) {
    console.warn('[ApiClient] Received 304 Not Modified, retrying without cache headers...');
    return apiRequest<T>(path, { ...options, headers: { ...options.headers, 'Cache-Control': 'no-cache' } });
  }

  const text = await response.text();
  let json: ApiResponse<T>;
  
  try {
    json = text ? JSON.parse(text) as ApiResponse<T> : { success: false, message: 'Empty response', data: undefined as T };
  } catch (e) {
    console.error('[ApiClient] Failed to parse response:', text);
    throw new ApiError('Failed to parse server response', response.status);
  }

  if (!response.ok || !json.success) {
    throw new ApiError(json.message ?? 'Request failed', response.status);
  }

  return json;
}

// Convenience wrappers
export const apiGet = <T>(path: string) =>
  apiRequest<T>(path, { method: 'GET' });

export const apiPost = <T>(path: string, body: unknown) => {
  console.log('API POST request:', path, body); // Debug log
  return apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) });
};

export const apiPut = <T>(path: string, body: unknown) =>
  apiRequest<T>(path, { method: 'PUT', body: JSON.stringify(body) });

export const apiDelete = <T>(path: string) =>
  apiRequest<T>(path, { method: 'DELETE' });
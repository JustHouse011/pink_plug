import { Platform } from 'react-native';
import { firebaseAuth } from '@/lib/firebaseClient';

/**
 * Thin client for pink_plug_backend's REST API (docs/API-SPECIFICATION.md,
 * served at EXPO_PUBLIC_API_BASE_URL/api/v1). Mirrors the response envelope
 * described there: {success:true,data,meta} or {success:false,error}.
 */

const BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5001/demo-pink-plug/africa-south1/api/v1').replace(/\/+$/, '');

export interface ApiErrorBody {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

export class ApiError extends Error {
  code: string;
  status: number;
  fields?: Record<string, string[]>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.code = body.code;
    this.status = status;
    this.fields = body.fields;
  }
}

/** Network failures (no connectivity, emulator not running, DNS, etc.), distinct from a parsed API error. */
export class ApiNetworkError extends Error {
  cause?: unknown;

  constructor(cause: unknown) {
    super('Unable to reach the server. Check your connection and try again.');
    this.name = 'ApiNetworkError';
    this.cause = cause;
  }
}

type Envelope<T> =
  | { success: true; data: T; meta?: Record<string, unknown> }
  | { success: false; error: ApiErrorBody };

export interface ApiResult<T> {
  data: T;
  meta?: Record<string, unknown>;
}

/** Not cryptographically strong — fine for a client-generated idempotency key, never for secrets. */
function randomKey(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

const deviceName = Platform.select({ ios: 'iOS device (Pink Plug)', android: 'Android device (Pink Plug)', default: 'Web browser (Pink Plug)' });

export type AuthRequirement = 'none' | 'optional' | 'required';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Whether to attach `Authorization: Bearer <idToken>`. Defaults to 'required'. */
  auth?: AuthRequirement;
  /** Attaches a client-generated Idempotency-Key header (for creation/action endpoints that need one). */
  idempotent?: boolean;
}

async function authHeader(requirement: AuthRequirement): Promise<Record<string, string>> {
  if (requirement === 'none') return {};
  const user = firebaseAuth.currentUser;
  if (!user) {
    if (requirement === 'required') throw new ApiError(401, { code: 'UNAUTHENTICATED', message: 'You need to sign in again.' });
    return {};
  }
  const idToken = await user.getIdToken();
  return { Authorization: `Bearer ${idToken}` };
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/** Calls the API and returns `data`/`meta` on success, or throws ApiError/ApiNetworkError. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const { method = 'GET', body, query, auth = 'required', idempotent = false } = options;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Device-Name': deviceName,
    ...(await authHeader(auth)),
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (idempotent) headers['Idempotency-Key'] = randomKey();

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (cause) {
    throw new ApiNetworkError(cause);
  }

  if (response.status === 204) return { data: undefined as T };

  let json: Envelope<T> | undefined;
  try {
    json = await response.json();
  } catch {
    // Fall through: a non-OK response with an unparsable body still needs a generic error below.
  }

  if (!json) {
    throw new ApiError(response.status, { code: 'INTERNAL_ERROR', message: 'Unexpected response from the server.' });
  }
  if (!json.success) {
    throw new ApiError(response.status, json.error);
  }
  return { data: json.data, meta: json.meta };
}

/** Convenience wrapper returning only `data`, for call sites that don't need `meta`. */
export async function apiCall<T>(path: string, options?: RequestOptions): Promise<T> {
  const { data } = await apiRequest<T>(path, options);
  return data;
}

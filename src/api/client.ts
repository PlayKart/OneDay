// src/api/client.ts

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { auth } from "../lib/firebase";
import { BACKEND_URL } from "../constants";
import { keysToCamel } from "../utils/camelCase";
import { getLocalCalendarDate } from "../utils/streakUtils";
import { isLikelyJwt } from "../utils/sessionCleanup";

const IS_DEV = typeof import.meta !== "undefined" && Boolean((import.meta as any).env?.DEV);
const IDEMPOTENT_HTTP_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isRetryableHttpMethod(method?: string): boolean {
  const normalized = (method || "GET").toUpperCase();
  return IDEMPOTENT_HTTP_METHODS.has(normalized);
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Resolves a valid Firebase Bearer token for the currently authenticated user.
 * Never falls back to stale localStorage tokens when no Firebase user is signed in.
 */
export async function getValidAuthToken(
  authInstance: { currentUser: any; authStateReady?: () => Promise<void> } = auth
): Promise<string> {
  let user = authInstance.currentUser;

  if (!user && typeof authInstance.authStateReady === "function") {
    try {
      await Promise.race([
        authInstance.authStateReady(),
        new Promise((res) => setTimeout(res, 2000)),
      ]);
      user = authInstance.currentUser;
    } catch {
      // Ignore readiness errors
    }
  }

  if (!user) {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem("oneday_firebase_token");
      } catch {
        // Ignore storage errors
      }
    }
    return "";
  }

  try {
    const token = await user.getIdToken();
    if (token && isLikelyJwt(token)) {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("oneday_firebase_token", token);
      }
      return token;
    }
  } catch (err) {
    if (IS_DEV) {
      console.warn("[apiClient] Failed to retrieve Firebase ID token:", err);
    }
  }

  return "";
}

// Request Interceptor: Attach Firebase Bearer token and x-local-date header
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await getValidAuthToken();
      if (token && isLikelyJwt(token)) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (config.headers?.Authorization) {
        delete config.headers.Authorization;
      }
    } catch {
      if (IS_DEV) {
        console.warn("[apiClient] Auth token attachment skipped due to lookup error");
      }
    }

    config.headers["x-local-date"] = getLocalCalendarDate();
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper to check if an error is transient and safe for idempotent retry
function isTransientError(error: AxiosError, config?: InternalAxiosRequestConfig): boolean {
  if (axios.isCancel(error)) return false;
  if (!isRetryableHttpMethod(config?.method)) return false;
  if (!error.response) {
    return true;
  }
  const status = error.response.status;
  return [408, 429, 500, 502, 503, 504].includes(status);
}

// Response Interceptor: Normalize responses to camelCase, handle 401 refresh, and auto-retry idempotent transient failures
apiClient.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = keysToCamel(response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retryCount?: number;
      _authRetry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const responseData = error.response?.data as any;
    const status = error.response?.status;

    // 1. Handle 401 Unauthorized with single forced Firebase token refresh (never create guest accounts)
    const isBackendAuthError =
      status === 401 ||
      responseData?.error === "Cannot read properties of undefined (reading 'length')" ||
      responseData?.message === "Cannot read properties of undefined (reading 'length')";

    if (isBackendAuthError && !originalRequest._authRetry) {
      originalRequest._authRetry = true;
      const user = auth.currentUser;
      if (user) {
        try {
          const newToken = await user.getIdToken(true);
          if (newToken && isLikelyJwt(newToken)) {
            if (typeof localStorage !== "undefined") {
              localStorage.setItem("oneday_firebase_token", newToken);
            }
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          }
        } catch {
          if (IS_DEV) {
            console.warn("[apiClient] Token refresh failed");
          }
        }
      } else if (typeof localStorage !== "undefined") {
        localStorage.removeItem("oneday_firebase_token");
      }
    }

    // 2. Automatic Exponential Backoff Retry ONLY for idempotent methods (GET/HEAD/OPTIONS)
    const maxRetries = 2;
    const currentRetry = originalRequest._retryCount || 0;

    if (isTransientError(error, originalRequest) && currentRetry < maxRetries) {
      originalRequest._retryCount = currentRetry + 1;

      const baseDelay = Math.min(500 * Math.pow(2, currentRetry), 2000);
      const jitter = Math.floor(Math.random() * 150);
      const delay = baseDelay + jitter;

      if (IS_DEV) {
        console.warn(
          `[apiClient] Transient error (${status || error.message}) on ${originalRequest.method?.toUpperCase()} ${originalRequest.url}. Retrying ${originalRequest._retryCount}/${maxRetries} in ${delay}ms...`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      return apiClient(originalRequest);
    }

    if (IS_DEV) {
      console.error(`[apiClient] Request failed [${status || "NETWORK_ERR"}] ${originalRequest.url}`);
    }

    let serverMessage = "A network or connection issue occurred.";
    if (responseData) {
      if (responseData.action === "DUPLICATE_HABIT" || responseData.error?.action === "DUPLICATE_HABIT") {
        serverMessage = responseData.message || responseData.error?.message || "You already have a habit with this name.";
      } else if (typeof responseData.error === "object" && responseData.error?.message) {
        serverMessage = responseData.error.message;
      } else if (typeof responseData.error === "string" && responseData.error.trim().length > 0) {
        serverMessage = responseData.error;
      } else if (typeof responseData.message === "string" && responseData.message.trim().length > 0) {
        serverMessage = responseData.message;
      } else if (typeof responseData.detail === "string" && responseData.detail.trim().length > 0) {
        serverMessage = responseData.detail;
      } else if (typeof responseData.msg === "string" && responseData.msg.trim().length > 0) {
        serverMessage = responseData.msg;
      } else if (typeof responseData === "string" && !responseData.includes("<html") && responseData.trim().length > 0) {
        serverMessage = responseData.trim();
      }
    } else if (error.message && error.message !== "Network Error") {
      serverMessage = error.message;
    }

    if (serverMessage === "A network or connection issue occurred." && status) {
      if (status === 404) serverMessage = "Requested server endpoint was not found.";
      else if (status === 401) serverMessage = "Session expired. Please sign in again.";
      else if (status === 403) serverMessage = "You do not have permission to perform this action.";
      else if (status >= 500) serverMessage = "Server encountered an error. Please try again shortly.";
    }

    const err = new Error(serverMessage);
    (err as any).response = error.response;
    (err as any).isAuthError = isBackendAuthError;
    (err as any).status = status;
    (err as any).code = responseData?.code || responseData?.error?.code;
    (err as any).action = responseData?.action || responseData?.error?.action;
    (err as any).existingHabit = responseData?.existingHabit || responseData?.existing_habit || responseData?.error?.existingHabit;
    (err as any).isNetworkError = !error.response;
    return Promise.reject(err);
  }
);

/**
 * Generic API wrapper maintaining exact signature compatibility with existing apiRequest
 */
export async function apiRequest<T = any>(
  path: string,
  method = "GET",
  body: any = null,
  isRetry = false
): Promise<T> {
  try {
    const response = await apiClient({
      url: path,
      method,
      data: body,
    });
    return response.data;
  } catch (err: any) {
    if (isRetry) throw err;
    throw err;
  }
}

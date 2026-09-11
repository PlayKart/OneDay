// src/api/client.ts

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { auth } from "../lib/firebase";
import { BACKEND_URL } from "../constants";
import { keysToCamel } from "../utils/camelCase";
import { getLocalCalendarDate } from "../utils/streakUtils";

export const apiClient: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Ensures Firebase Auth is resolved before dispatching authenticated requests
 */
async function getValidAuthToken(): Promise<string> {
  let user = auth.currentUser;
  
  // If currentUser is not yet populated, wait for Firebase auth state resolution if supported
  if (!user && typeof (auth as any).authStateReady === "function") {
    try {
      await Promise.race([
        (auth as any).authStateReady(),
        new Promise((res) => setTimeout(res, 2000)), // 2s max wait
      ]);
      user = auth.currentUser;
    } catch {
      // Continue to fallback
    }
  }

  if (user) {
    try {
      const token = await user.getIdToken();
      if (token) {
        localStorage.setItem("oneday_firebase_token", token);
        return token;
      }
    } catch (err) {
      console.warn("Failed to retrieve Firebase ID token:", err);
    }
  }

  return localStorage.getItem("oneday_firebase_token") || "";
}

// Request Interceptor: Attach Firebase Bearer token and x-local-date header
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await getValidAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn("[apiClient] Auth token attachment notice:", e);
    }

    // Attach local calendar date header YYYY-MM-DD
    config.headers["x-local-date"] = getLocalCalendarDate();

    return config;
  },
  (error) => Promise.reject(error)
);

// Helper to check if an error is transient and retry-eligible
function isTransientError(error: AxiosError): boolean {
  if (axios.isCancel(error)) return false;
  if (!error.response) {
    // Network errors, connection timeouts, CORS or dropped sockets
    return true;
  }
  const status = error.response.status;
  // 408 Request Timeout, 429 Rate Limit, 500 Internal Error, 502 Bad Gateway, 503 Unavailable, 504 Gateway Timeout
  return [408, 429, 500, 502, 503, 504].includes(status);
}

// Response Interceptor: Normalize responses to camelCase, handle 401 refresh, and auto-retry transient failures
apiClient.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = keysToCamel(response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    // Do not retry explicitly cancelled/aborted requests
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

    // 1. Handle 401 Unauthorized or backend token missing/invalid errors with token refresh retry
    const isBackendAuthError =
      status === 401 ||
      responseData?.error === "Cannot read properties of undefined (reading 'length')" ||
      responseData?.message === "Cannot read properties of undefined (reading 'length')";

    if (isBackendAuthError && !originalRequest._authRetry) {
      originalRequest._authRetry = true;
      const user = auth.currentUser;
      if (user) {
        try {
          const newToken = await user.getIdToken(true); // Force token refresh
          if (newToken) {
            localStorage.setItem("oneday_firebase_token", newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshErr) {
          console.error("Token refresh failed:", refreshErr);
        }
      }
    }

    // 2. Automatic Exponential Backoff Retry for transient network/server failures
    const maxRetries = 3;
    const currentRetry = originalRequest._retryCount || 0;

    if (isTransientError(error) && currentRetry < maxRetries) {
      originalRequest._retryCount = currentRetry + 1;
      
      // Delays: retry 1 -> ~500ms, retry 2 -> ~1000ms, retry 3 -> ~2000ms (with jitter)
      const baseDelay = Math.min(500 * Math.pow(2, currentRetry), 2000);
      const jitter = Math.floor(Math.random() * 150);
      const delay = baseDelay + jitter;

      console.warn(
        `[apiClient] Transient error (${status || error.message}) on ${originalRequest.url}. Retrying attempt ${
          originalRequest._retryCount
        }/${maxRetries} in ${delay}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      return apiClient(originalRequest);
    }

    // Standardize error message & log Backend errors
    console.error(
      `[apiClient] Request failed [${status || 'NETWORK_ERR'}] ${originalRequest.url}:`,
      responseData || error.message
    );

    let serverMessage = "A network or connection issue occurred.";
    if (responseData) {
      if (typeof responseData.error === "object" && responseData.error?.message) {
        serverMessage = responseData.error.message;
      } else if (typeof responseData.error === "string") {
        serverMessage = responseData.error;
      } else if (responseData.message) {
        serverMessage = responseData.message;
      }
    } else if (error.message) {
      serverMessage = error.message;
    }

    const err = new Error(serverMessage);
    (err as any).response = error.response;
    (err as any).isAuthError = isBackendAuthError;
    (err as any).status = status;
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

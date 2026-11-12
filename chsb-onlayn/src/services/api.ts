import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

// API URL oxiridagi ortiqcha slash (/) belgisi bo'lsa, uni avtomatik olib tashlaymiz
const rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_BASE_URL = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

/**
 * Centralized Axios client for SCHOOL CHSB examination platform.
 * Configured with request interceptors for JWT Bearer token authentication
 * and response interceptors for standardized error handling and 401 recovery.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    Accept: "application/json",
  },
});

// Request interceptor: Inject Bearer token from localStorage
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("chsb_auth_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Response interceptor: Handle common HTTP statuses (401, 403, 500)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("chsb_auth_token");
      localStorage.removeItem("chsb_current_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login?expired=1";
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
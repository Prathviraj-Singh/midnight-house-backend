import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig;

    const is401 = error.response?.status === 401;
    const alreadyRetried = originalRequest?._retry;
    const isRefreshEndpoint = originalRequest?.url?.includes('/auth/token/refresh/');
    const isMeEndpoint = originalRequest?.url?.includes('/auth/me/');
    const isLoginEndpoint = originalRequest?.url?.includes('/auth/login/');

    // Never redirect on /auth/me/ or /auth/login/ 401s
    if (is401 && !alreadyRetried && !isRefreshing && !isRefreshEndpoint && !isMeEndpoint && !isLoginEndpoint) {
      isRefreshing = true;
      originalRequest._retry = true;

      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/token/refresh/`,
          {},
          { withCredentials: true }
        );

        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
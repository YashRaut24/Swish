import axios from 'axios';
import { STORAGE_KEYS } from '../utils/constants';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const http = axios.create({ baseURL, withCredentials: true, timeout: 20000 });

http.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

let isRefreshing = false;
let pendingRequests = [];

const processQueue = (error, token = null) => {
  pendingRequests.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  pendingRequests = [];
};

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push({
            resolve: (token) => {
              if (token) originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(http(originalRequest));
            },
            reject,
          });
        });
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
        const newToken = data?.data?.token;
        if (newToken) {
          localStorage.setItem(STORAGE_KEYS.TOKEN, newToken);
          http.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return http(originalRequest);
        }
      } catch (e) {
        processQueue(e, null);
        // Clear auth on refresh failure
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
      } finally {
        isRefreshing = false;
      }
    }

    // Extract error message from response
    let message = 'Request failed';
    if (error.response?.data) {
      message = error.response.data.message || error.response.data.error || message;
    } else if (error.message) {
      message = error.message;
    }
    const err = new Error(message);
    err.status = status;
    err.response = error.response;
    return Promise.reject(err);
  },
);

export default http;

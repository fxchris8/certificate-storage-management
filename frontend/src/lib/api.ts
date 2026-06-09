import type { UninterceptedApiError } from "@/types/api";
import axios, { AxiosError } from "axios";
import { getToken } from "./cookies";

export const BASE_URL =
  import.meta.env.VITE_API_URL + "/api" || "http://localhost:3000/api";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
  timeoutErrorMessage: "Periksa Kembali Koneksi Internet Anda.",
  withCredentials: true,
});

api.defaults.withCredentials = true;

api.interceptors.request.use(function (config) {
  if (config.headers) {
    if (config.data instanceof FormData) {
      config.headers.delete("Content-Type");
    }

    /** Get cookies from browser */
    const token = getToken();

    config.headers.Authorization = token ? `Bearer ${token}` : "";
  }

  return config;
});

api.interceptors.response.use(
  (config) => {
    return config;
  },
  (error: AxiosError<UninterceptedApiError>) => {
    // parse error
    if (error.response?.data.message) {
      return Promise.reject({
        ...error,
        response: {
          ...error.response,
          data: {
            ...error.response.data,
            message:
              typeof error.response.data.message === "string"
                ? error.response.data.message
                : Object.values(error.response.data.message)[0][0],
          },
        },
      });
    }
    return Promise.reject(error);
  },
);

export default api;

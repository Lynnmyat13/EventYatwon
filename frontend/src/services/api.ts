import axios from "axios";

export const AUTH_TOKEN_KEY = "eventyatwon_access_token";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const apiUrl = (
  configuredApiUrl || (import.meta.env.DEV ? "http://localhost:5000/api" : "")
).replace(/\/+$/, "");

if (!apiUrl) {
  throw new Error("VITE_API_URL must be configured for production builds");
}

export const api = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

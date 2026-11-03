
import axios from "axios";

const api = axios.create({
  baseURL: "https://divinecommerce2.vercel.app/api",
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  let token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  if (!token) {
    try {
      const userInfo = JSON.parse(
        localStorage.getItem("userInfo") || "null"
      );
      token = userInfo?.token;
    } catch {}
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userInfo");
    }

    return Promise.reject(error);
  }
);

export default api;

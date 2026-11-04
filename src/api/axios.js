import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
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
      } catch (error) {
        console.error("Unable to read userInfo:", error);
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized API request:", {
        url: error.config?.url,
        fullURL: error.config?.baseURL + error.config?.url,
        response: error.response?.data,
      });
    }

    return Promise.reject(error);
  }
);

export default api;

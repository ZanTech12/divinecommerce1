
import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD
      ? "https://divinecommerce2.vercel.app/api"
      : "http://localhost:5000/api"),

  timeout: 60000,

  headers: {
    "Content-Type": "application/json",
  },
});

// Attach authentication token
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

// Handle API responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized API request:", {
        url: error.config?.url,
        fullURL: error.config?.baseURL + error.config?.url,
        response: error.response?.data,
      });

      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userInfo");
    }

    return Promise.reject(error);
  }
);

export default api;

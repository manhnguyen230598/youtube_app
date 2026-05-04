import axios from "axios";
import { getAccessToken, clearAuthStorage } from "./authStorage";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
    }
});

apiClient.interceptors.request.use((config) => {
    const token = getAccessToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            clearAuthStorage();
        }

        return Promise.reject(error);
    }
);

export default apiClient;
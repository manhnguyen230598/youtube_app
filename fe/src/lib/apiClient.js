import axios from "axios";
import {
    getAccessToken,
    getRefreshToken,
    setAuthTokens,
    setCurrentUser,
    clearAuthStorage
} from "./authStorage";
import { disconnectCable } from "./actionCableClient";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
    }
});

let refreshPromise = null;

function isAuthEndpoint(url = "") {
    return (
        url.includes("/login") ||
        url.includes("/register") ||
        url.includes("/refresh")
    );
}

function forceLogout() {
    disconnectCable();
    clearAuthStorage();

    if (window.location.pathname !== "/") {
        window.location = "/";
    }
}

async function refreshAccessToken() {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
        throw new Error("Missing refresh token");
    }

    const res = await axios.post(
        `${API_BASE_URL}/refresh`,
        {
            refresh_token: refreshToken
        },
        {
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            }
        }
    );

    setAuthTokens({
        accessToken: res.data.access_token
    });

    if (res.data.user) {
        setCurrentUser(res.data.user);
    }

    return res.data.access_token;
}

apiClient.interceptors.request.use((config) => {
    const token = getAccessToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (!originalRequest || !error.response) {
            return Promise.reject(error);
        }

        const status = error.response.status;

        if (
            status !== 401 ||
            originalRequest._retry ||
            isAuthEndpoint(originalRequest.url)
        ) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            if (!refreshPromise) {
                refreshPromise = refreshAccessToken();
            }

            const newAccessToken = await refreshPromise;
            refreshPromise = null;

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            return apiClient(originalRequest);
        } catch (refreshError) {
            refreshPromise = null;
            forceLogout();
            return Promise.reject(refreshError);
        }
    }
);

export default apiClient;
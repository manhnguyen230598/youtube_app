const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user";

// Legacy keys from older implementation.
// Keep fallback temporarily so existing logged-in users do not break immediately.
const LEGACY_ACCESS_TOKEN_KEY = "token";
const LEGACY_USER_EMAIL_KEY = "user_email";

export function getAccessToken() {
    return (
        localStorage.getItem(ACCESS_TOKEN_KEY) ||
        localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY)
    );
}

export function getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthTokens({ accessToken, refreshToken }) {
    if (accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }

    if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    // Remove old key once the new key is written.
    localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
}

export function getCurrentUser() {
    const rawUser = localStorage.getItem(USER_KEY);

    if (rawUser) {
        try {
            return JSON.parse(rawUser);
        } catch {
            return null;
        }
    }

    // Temporary fallback for older localStorage data.
    const legacyEmail = localStorage.getItem(LEGACY_USER_EMAIL_KEY);
    return legacyEmail ? { email: legacyEmail } : null;
}

export function setCurrentUser(user) {
    if (!user) return;

    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.removeItem(LEGACY_USER_EMAIL_KEY);
}

export function clearAuthStorage() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    // Clean old keys from previous implementation.
    localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_EMAIL_KEY);
}
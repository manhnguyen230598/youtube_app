import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

export const options = {
    stages: [
        { duration: "30s", target: 10 },
        { duration: "1m", target: 30 },
        { duration: "30s", target: 50 },
        { duration: "30s", target: 0 }
    ],
    thresholds: {
        http_req_failed: ["rate<0.05"],
        http_req_duration: ["p(95)<1000"],
        checks: ["rate>0.95"]
    }
};

const API_BASE_URL = __ENV.API_BASE_URL || "http://backend:3000";

const videoShareDuration = new Trend("video_share_duration");
const loginFailureRate = new Rate("login_failures");
const shareFailureRate = new Rate("share_failures");

function uniqueEmail() {
    return `stress_user_${Date.now()}_${__VU}_${__ITER}@example.com`;
}

export default function () {
    const email = uniqueEmail();
    const password = "password123";

    const registerRes = http.post(`${API_BASE_URL}/register`, {
        email,
        password
    });

    check(registerRes, {
        "register returns 201 or already exists 422": (res) =>
            res.status === 201 || res.status === 422
    });

    const loginRes = http.post(`${API_BASE_URL}/login`, {
        email,
        password
    });

    const loginOk = check(loginRes, {
        "login returns 200": (res) => res.status === 200,
        "login has access token": (res) => {
            try {
                return !!res.json("access_token");
            } catch (e) {
                return false;
            }
        }
    });

    loginFailureRate.add(!loginOk);

    if (!loginOk) {
        sleep(1);
        return;
    }

    const token = loginRes.json("access_token");

    const listRes = http.get(`${API_BASE_URL}/videos`);

    check(listRes, {
        "list videos returns 200": (res) => res.status === 200
    });

    const shareStart = Date.now();

    const shareRes = http.post(
        `${API_BASE_URL}/videos`,
        {
            title: `Stress Test Video ${__VU}-${__ITER}`,
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            description: "Video created during k6 stress test"
        },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    videoShareDuration.add(Date.now() - shareStart);

    const shareOk = check(shareRes, {
        "share video returns 201": (res) => res.status === 201
    });

    shareFailureRate.add(!shareOk);

    sleep(1);
}
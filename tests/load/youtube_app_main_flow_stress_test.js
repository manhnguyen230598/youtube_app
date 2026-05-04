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
        checks: ["rate>0.95"],

        // Endpoint-level diagnostics
        list_videos_duration: ["p(95)<500"],
        share_video_duration: ["p(95)<1500"],

        // Business-level failure rate
        share_failures: ["rate<0.05"]
    }
};

const API_BASE_URL = __ENV.API_BASE_URL || "http://backend:3000";

const jsonHeaders = {
    "Content-Type": "application/json",
    "Accept": "application/json"
};

const listVideosDuration = new Trend("list_videos_duration");
const shareVideoDuration = new Trend("share_video_duration");
const shareFailureRate = new Rate("share_failures");

const RUN_ID = __ENV.RUN_ID || `${Date.now()}`;

function userEmail(index) {
    return `main_flow_user_${RUN_ID}_${index}@example.com`;
}

function safeBody(res) {
    if (!res || !res.body) return "<empty body>";
    return res.body.substring(0, 300);
}

export function setup() {
    const tokens = [];

    for (let i = 1; i <= 50; i++) {
        const email = userEmail(i);
        const password = "password123";

        const registerRes = http.post(
            `${API_BASE_URL}/register`,
            JSON.stringify({ email, password }),
            { headers: jsonHeaders }
        );

        if (![201, 422].includes(registerRes.status)) {
            console.log(
                `SETUP REGISTER FAILED user=${i}, status=${registerRes.status}, body=${safeBody(registerRes)}`
            );
        }

        const loginRes = http.post(
            `${API_BASE_URL}/login`,
            JSON.stringify({ email, password }),
            { headers: jsonHeaders }
        );

        const ok = check(loginRes, {
            [`setup login user ${i}`]: (res) =>
                res.status === 200 && !!res.json("access_token")
        });

        if (ok) {
            tokens.push(loginRes.json("access_token"));
        } else {
            console.log(
                `SETUP LOGIN FAILED user=${i}, status=${loginRes.status}, body=${safeBody(loginRes)}`
            );
        }
    }

    if (tokens.length === 0) {
        throw new Error("Setup failed: no access tokens were created.");
    }

    return { tokens };
}

export default function (data) {
    const token = data.tokens[(__VU - 1) % data.tokens.length];

    const listStart = Date.now();

    const listRes = http.get(`${API_BASE_URL}/videos?per_page=20`);

    listVideosDuration.add(Date.now() - listStart);

    check(listRes, {
        "list videos returns 200": (res) => res.status === 200
    });

    const shareStart = Date.now();

    const shareRes = http.post(
        `${API_BASE_URL}/videos`,
        JSON.stringify({
            title: `Main Flow Stress Video ${RUN_ID}-${__VU}-${__ITER}`,
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            description: "Video created during optimized main flow stress test"
        }),
        {
            headers: {
                ...jsonHeaders,
                Authorization: `Bearer ${token}`
            }
        }
    );

    shareVideoDuration.add(Date.now() - shareStart);

    const shareOk = check(shareRes, {
        "share video returns 201": (res) => res.status === 201
    });

    shareFailureRate.add(!shareOk);

    if (!shareOk) {
        console.log(
            `SHARE FAILED: status=${shareRes.status}, body=${safeBody(shareRes)}`
        );
    }

    sleep(1);
}
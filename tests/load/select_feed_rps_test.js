import http from "k6/http";
import { check } from "k6";
import { Rate, Trend } from "k6/metrics";

const API_BASE_URL = __ENV.API_BASE_URL || "http://localhost:3000";

const RATE = Number(__ENV.RATE || 50);
const DURATION = __ENV.DURATION || "1m";

// Tự scale VUs theo RATE, nhưng vẫn cho override từ CLI.
const PRE_ALLOCATED_VUS = Number(
    __ENV.PRE_ALLOCATED_VUS || Math.max(20, Math.ceil(RATE / 2))
);

const MAX_VUS = Number(
    __ENV.MAX_VUS || Math.max(100, RATE * 2)
);

const TIMEOUT = __ENV.TIMEOUT || "5s";
const LIMIT = Number(__ENV.LIMIT || 10);

const selectDuration = new Trend("select_feed_duration");
const selectFailures = new Rate("select_feed_failures");

export const options = {
    discardResponseBodies: true,
    scenarios: {
        select_feed: {
            executor: "constant-arrival-rate",
            rate: RATE,
            timeUnit: "1s",
            duration: DURATION,
            preAllocatedVUs: PRE_ALLOCATED_VUS,
            maxVUs: MAX_VUS,
            gracefulStop: "10s",
        },
    },
    thresholds: {
        http_req_failed: ["rate<0.01"],
        checks: ["rate>0.99"],
        select_feed_failures: ["rate<0.01"],

        // Giai đoạn baseline local Docker: để p95 500ms trước.
        // Sau khi tối ưu mới ép xuống 200ms.
        select_feed_duration: ["p(95)<500"],
    },
};

export default function () {
    const start = Date.now();

    const res = http.get(`${API_BASE_URL}/videos?limit=${LIMIT}`, {
        timeout: TIMEOUT,
        tags: {
            endpoint: "videos_index",
            test_type: "select_feed",
        },
    });

    const duration = Date.now() - start;
    selectDuration.add(duration);

    const ok = check(res, {
        "select feed returns 200": (r) => r.status === 200,
    });

    selectFailures.add(!ok);
}
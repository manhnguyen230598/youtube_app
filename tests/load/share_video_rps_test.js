import http from "k6/http";
import { check } from "k6";
import { Rate, Trend } from "k6/metrics";

const API_BASE_URL = __ENV.API_BASE_URL || "http://backend:3000";
const RATE = Number(__ENV.RATE || 500);
const DURATION = __ENV.DURATION || "1m";
const PRE_ALLOCATED_VUS = Number(__ENV.PRE_ALLOCATED_VUS || 500);
const MAX_VUS = Number(__ENV.MAX_VUS || 3000);

const tokens = JSON.parse(open("/data/perf_tokens.json"));

const shareDuration = new Trend("share_video_duration");
const shareFailures = new Rate("share_video_failures");

export const options = {
    discardResponseBodies: true,
    scenarios: {
        share_video: {
            executor: "constant-arrival-rate",
            rate: RATE,
            timeUnit: "1s",
            duration: DURATION,
            preAllocatedVUs: PRE_ALLOCATED_VUS,
            maxVUs: MAX_VUS
        }
    },
    thresholds: {
        http_req_failed: ["rate<0.01"],
        checks: ["rate>0.99"],
        share_video_failures: ["rate<0.01"],
        share_video_duration: ["p(95)<500"]
    }
};

function tokenForThisRequest() {
    const index = (__VU + __ITER) % tokens.length;
    return tokens[index].token;
}

export default function () {
    const token = tokenForThisRequest();

    const payload = JSON.stringify({
        title: `RPS Share Video ${Date.now()}-${__VU}-${__ITER}`,
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        description: "Created by k6 share_video_rps_test"
    });

    const start = Date.now();

    const res = http.post(`${API_BASE_URL}/videos`, payload, {
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`
        }
    });

    shareDuration.add(Date.now() - start);

    const ok = check(res, {
        "share video returns 201": (r) => r.status === 201
    });

    shareFailures.add(!ok);
}
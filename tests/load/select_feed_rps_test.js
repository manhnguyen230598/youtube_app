import http from "k6/http";
import { check } from "k6";
import { Rate, Trend } from "k6/metrics";

const API_BASE_URL = __ENV.API_BASE_URL || "http://backend:3000";
const RATE = Number(__ENV.RATE || 1000);
const DURATION = __ENV.DURATION || "1m";
const PRE_ALLOCATED_VUS = Number(__ENV.PRE_ALLOCATED_VUS || 500);
const MAX_VUS = Number(__ENV.MAX_VUS || 2000);

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
            maxVUs: MAX_VUS
        }
    },
    thresholds: {
        http_req_failed: ["rate<0.01"],
        checks: ["rate>0.99"],
        select_feed_failures: ["rate<0.01"],
        select_feed_duration: ["p(95)<200"]
    }
};

export default function () {
    const start = Date.now();

    const res = http.get(`${API_BASE_URL}/videos?limit=10`, {
        timeout: "2s"
    });

    selectDuration.add(Date.now() - start);

    const ok = check(res, {
        "select feed returns 200": (r) => r.status === 200
    });

    selectFailures.add(!ok);
}
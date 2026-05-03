import http from "k6/http";

const API_BASE_URL = __ENV.API_BASE_URL || "http://backend:3000";

export const options = {
    vus: 1,
    iterations: 1
};

function safeBody(res) {
    if (!res || !res.body) return "<empty body>";
    return res.body.substring(0, 1000);
}

export default function () {
    const email = `debug_user_${Date.now()}@example.com`;
    const password = "password123";

    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    };

    console.log(`API_BASE_URL = ${API_BASE_URL}`);
    console.log(`Email = ${email}`);

    const registerRes = http.post(
        `${API_BASE_URL}/register`,
        JSON.stringify({ email, password }),
        { headers }
    );

    console.log("REGISTER STATUS:", registerRes.status);
    console.log("REGISTER BODY:", safeBody(registerRes));

    const loginRes = http.post(
        `${API_BASE_URL}/login`,
        JSON.stringify({ email, password }),
        { headers }
    );

    console.log("LOGIN STATUS:", loginRes.status);
    console.log("LOGIN BODY:", safeBody(loginRes));
}
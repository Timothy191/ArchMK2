/**
 * Load test: AI chat API endpoint
 * Tests the /api/ai/chat route under concurrent load.
 *
 * Run: k6 run load-tests/scenarios/api-ai-chat.js
 * Note: Requires a valid session cookie in AUTH_COOKIE env var for authenticated tests.
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, thresholds } from "../k6.config.js";

export const options = {
  scenarios: {
    chat_load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "20s", target: 5  },
        { duration: "1m",  target: 20 },
        { duration: "20s", target: 0  },
      ],
    },
  },
  thresholds: {
    ...thresholds,
    http_req_duration: ["p(95)<5000"], // AI responses can be slow
  },
};

const PAYLOAD = JSON.stringify({
  messages: [{ role: "user", content: "What is the current machine status?" }],
  departmentName: "drilling",
});

const HEADERS = {
  "Content-Type": "application/json",
  ...__ENV.AUTH_COOKIE ? { Cookie: `sb-session=${__ENV.AUTH_COOKIE}` } : {},
};

export default function () {
  const res = http.post(`${BASE_URL}/api/ai/chat`, PAYLOAD, { headers: HEADERS });

  check(res, {
    "chat endpoint responds": (r) => r.status !== 0,
    "not a 500 error": (r) => r.status < 500,
    "response has content": (r) => r.body && r.body.length > 0,
  });

  sleep(2);
}

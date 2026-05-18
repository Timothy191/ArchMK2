/**
 * Load test: Login page rendering
 *
 * Run: k6 run load-tests/scenarios/login.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, thresholds, shiftChangeover } from "../k6.config.js";

export const options = {
  scenarios: { login_load: shiftChangeover },
  thresholds,
};

export default function () {
  const res = http.get(`${BASE_URL}/login`);

  check(res, {
    "login page returns 200": (r) => r.status === 200,
    "login page contains form": (r) => r.body.includes("form"),
    "response time < 1s": (r) => r.timings.duration < 1000,
  });

  sleep(1);
}

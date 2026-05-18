/**
 * Load test: Auth middleware redirect performance
 * Verifies protected routes redirect quickly under load.
 *
 * Run: k6 run load-tests/scenarios/auth-redirect.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, thresholds, steadyState } from "../k6.config.js";

export const options = {
  scenarios: { redirect_load: steadyState },
  thresholds: {
    ...thresholds,
    http_req_duration: ["p(95)<500"], // middleware should be fast
  },
};

const PROTECTED_ROUTES = [
  "/",
  "/drilling",
  "/production",
  "/safety",
  "/engineering",
  "/control-room",
  "/satellite-monitoring",
  "/admin",
];

export default function () {
  const route = PROTECTED_ROUTES[Math.floor(Math.random() * PROTECTED_ROUTES.length)];
  const res = http.get(`${BASE_URL}${route}`, { redirects: 0 });

  check(res, {
    "unauthenticated request redirects (302/307/308)": (r) =>
      [301, 302, 307, 308].includes(r.status),
    "redirect points to /login": (r) =>
      (r.headers["Location"] || "").includes("/login"),
    "redirect latency < 200ms": (r) => r.timings.duration < 200,
  });

  sleep(0.5);
}

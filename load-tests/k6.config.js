/**
 * k6 Load Testing Configuration
 * Run: k6 run load-tests/k6.config.js
 *
 * Requires k6 installed: https://k6.io/docs/getting-started/installation/
 * Target: http://localhost:3000 (or set BASE_URL env var)
 */

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

/**
 * Shared thresholds applied to all scenarios.
 * Fail the test if p95 response time > 2s or error rate > 1%.
 */
const thresholds = {
  http_req_duration: ["p(95)<2000"],
  http_req_failed: ["rate<0.01"],
};

/**
 * Ramp-up → steady → ramp-down profile
 * mimicking a mining site shift changeover surge (~40 concurrent users).
 */
const shiftChangeover = {
  executor: "ramping-vus",
  startVUs: 0,
  stages: [
    { duration: "30s", target: 10 },  // ramp up
    { duration: "1m",  target: 40 },  // peak load
    { duration: "30s", target: 10 },  // ramp down
    { duration: "15s", target: 0  },  // cool off
  ],
};

/**
 * Constant-load baseline for steady-state throughput measurement.
 */
const steadyState = {
  executor: "constant-vus",
  vus: 15,
  duration: "2m",
};

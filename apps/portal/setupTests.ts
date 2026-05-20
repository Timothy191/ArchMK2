import "@testing-library/jest-dom";

// Mock Highlight server SDK before any module imports it — it pulls in Node-only deps
jest.mock("@highlight-run/next/server", () => ({
  H: {
    init: jest.fn(),
    consumeError: jest.fn(),
    recordMetric: jest.fn(),
  },
}));

// Jest setup file — provide Web API globals that Next.js server modules expect
// but jsdom may not define in all versions.

global.Request =
  global.Request ||
  class Request {
    url: string;
    constructor(input: string | Request) {
      this.url = typeof input === "string" ? input : input.url;
    }
  };

global.Response =
  global.Response ||
  class Response {
    status: number;
    constructor(body?: BodyInit | null, _init?: ResponseInit) {
      this.status = _init?.status ?? 200;
    }
  };

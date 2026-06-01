import "@testing-library/jest-dom";

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

import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || (TextDecoder as any);

// Override environment variables to prevent local development .env from polluting tests
process.env.DISABLE_RATE_LIMIT = "false";
process.env.NEXT_PUBLIC_FUXA_URL = "http://localhost:1881";

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

// Global mock for redis to avoid database connection timeout/hangs in tests
jest.mock("@repo/redis", () => {
  const actual = jest.requireActual("@repo/redis");
  const mockCache = new Map<string, string>();
  const mockRedisClient = {
    get: jest.fn(async (key: string) => mockCache.get(key) ?? null),
    set: jest.fn(async (key: string, value: string) => {
      mockCache.set(key, value);
    }),
    del: jest.fn(async (key: string) => {
      mockCache.delete(key);
    }),
    isOpen: true,
  };
  return {
    ...actual,
    getRedisClient: jest.fn(async () => mockRedisClient),
    closeRedis: jest.fn(async () => {}),
  };
});

jest.mock("../../packages/redis/src/client", () => {
  const mockCache = new Map<string, string>();
  const mockRedisClient = {
    get: jest.fn(async (key: string) => mockCache.get(key) ?? null),
    set: jest.fn(async (key: string, value: string) => {
      mockCache.set(key, value);
    }),
    del: jest.fn(async (key: string) => {
      mockCache.delete(key);
    }),
    isOpen: true,
  };
  return {
    getRedisClient: jest.fn(async () => mockRedisClient),
    closeRedis: jest.fn(async () => {}),
  };
});

/**
 * @jest-environment node
 */
import {
  formatSearchResults,
  formatAIResponse,
  searchGoogle,
  searchGoogleAI,
  searchGoogleMaps,
  searchGoogleNews,
  searchYouTube,
  searchGoogleShopping,
  type SerpApiResponse,
} from "./serpapi";
import { APIError } from "@repo/errors";

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockOkJson(body: unknown) {
  return { ok: true, json: jest.fn().mockResolvedValue(body) };
}

function mockBadResponse(status: number, statusText: string) {
  return { ok: false, status, statusText };
}

// ---------------------------------------------------------------------------
// formatSearchResults
// ---------------------------------------------------------------------------

describe("formatSearchResults", () => {
  it("returns 'No search results found.' for empty organic_results", () => {
    expect(formatSearchResults({ organic_results: [] })).toBe("No search results found.");
  });

  it("returns 'No search results found.' when organic_results is missing", () => {
    expect(formatSearchResults({})).toBe("No search results found.");
  });

  it("formats up to 5 results with title, snippet, and link", () => {
    const results: SerpApiResponse = {
      organic_results: [
        { position: 1, title: "Mining safety tips", snippet: "Key points on safety", link: "https://example.com/1", displayed_link: "example.com/1" },
        { position: 2, title: "Equipment maintenance", snippet: "How to maintain gear", link: "https://example.com/2", displayed_link: "example.com/2" },
      ],
    };
    const output = formatSearchResults(results);
    expect(output).toContain("Mining safety tips");
    expect(output).toContain("Key points on safety");
    expect(output).toContain("https://example.com/1");
    expect(output).toContain("Equipment maintenance");
  });

  it("caps at 5 results even if more are present", () => {
    const results: SerpApiResponse = {
      organic_results: Array.from({ length: 10 }, (_, i) => ({
        position: i + 1,
        title: `Result ${i + 1}`,
        snippet: `Snippet ${i + 1}`,
        link: `https://example.com/${i + 1}`,
        displayed_link: `example.com/${i + 1}`,
      })),
    };
    const output = formatSearchResults(results);
    expect(output).toContain("Result 5");
    expect(output).not.toContain("Result 6");
  });

  it("prefixes output with 'Search Results:'", () => {
    const results: SerpApiResponse = {
      organic_results: [
        { position: 1, title: "Title", snippet: "Snip", link: "http://x.com", displayed_link: "x.com" },
      ],
    };
    expect(formatSearchResults(results)).toMatch(/^Search Results:/);
  });
});

// ---------------------------------------------------------------------------
// formatAIResponse
// ---------------------------------------------------------------------------

describe("formatAIResponse", () => {
  it("returns ai_overview string directly when it is a string", () => {
    const result = formatAIResponse({ ai_overview: "AI overview text" });
    expect(result).toBe("AI overview text");
  });

  it("JSON-stringifies ai_overview when it is an object", () => {
    const result = formatAIResponse({ ai_overview: { key: "value" } });
    expect(result).toContain('"key": "value"');
  });

  it("JSON-stringifies answer_box when ai_overview is absent", () => {
    const result = formatAIResponse({ answer_box: { answer: "42" } });
    expect(result).toContain('"answer": "42"');
  });

  it("falls back to formatSearchResults when neither ai_overview nor answer_box present", () => {
    const result = formatAIResponse({});
    expect(result).toBe("No search results found.");
  });

  it("uses organic_results when available and no ai/answer_box", () => {
    const result = formatAIResponse({
      organic_results: [
        { position: 1, title: "Test", snippet: "Content", link: "http://test.com", displayed_link: "test.com" },
      ],
    });
    expect(result).toContain("Test");
    expect(result).toContain("Content");
  });
});

// ---------------------------------------------------------------------------
// searchGoogle
// ---------------------------------------------------------------------------

describe("searchGoogle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SERPAPI_API_KEY;
  });

  it("throws APIError when SERPAPI_API_KEY is not set", async () => {
    await expect(searchGoogle("test query")).rejects.toThrow(APIError);
    await expect(searchGoogle("test query")).rejects.toThrow("SERPAPI_API_KEY not configured");
  });

  it("throws APIError on non-ok HTTP response", async () => {
    process.env.SERPAPI_API_KEY = "test-key";
    mockFetch.mockResolvedValue(mockBadResponse(429, "Too Many Requests"));

    await expect(searchGoogle("test")).rejects.toThrow(APIError);
  });

  it("returns parsed JSON on success", async () => {
    process.env.SERPAPI_API_KEY = "test-key";
    const mockData = { organic_results: [{ title: "Test", snippet: "Snip", link: "http://x.com", position: 1, displayed_link: "x.com" }] };
    mockFetch.mockResolvedValue(mockOkJson(mockData));

    const result = await searchGoogle("mining safety");
    expect(result).toEqual(mockData);
  });

  it("includes query params in the fetch URL", async () => {
    process.env.SERPAPI_API_KEY = "my-api-key";
    mockFetch.mockResolvedValue(mockOkJson({}));

    await searchGoogle("test query", { num: 5, gl: "us" });

    const calledUrl: string = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain("q=test+query");
    expect(calledUrl).toContain("num=5");
    expect(calledUrl).toContain("gl=us");
    expect(calledUrl).toContain("api_key=my-api-key");
    expect(calledUrl).toContain("engine=google");
  });
});

// ---------------------------------------------------------------------------
// searchGoogleAI
// ---------------------------------------------------------------------------

describe("searchGoogleAI", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SERPAPI_API_KEY;
  });

  it("throws APIError when key missing", async () => {
    await expect(searchGoogleAI("query")).rejects.toThrow(APIError);
  });

  it("uses google_ai_mode engine", async () => {
    process.env.SERPAPI_API_KEY = "key";
    mockFetch.mockResolvedValue(mockOkJson({}));

    await searchGoogleAI("question", { continuable: true });

    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain("engine=google_ai_mode");
    expect(url).toContain("continuable=true");
  });

  it("includes subsequent_request_token when provided", async () => {
    process.env.SERPAPI_API_KEY = "key";
    mockFetch.mockResolvedValue(mockOkJson({}));

    await searchGoogleAI("follow-up", { subsequentRequestToken: "token-123" });

    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain("subsequent_request_token=token-123");
  });
});

// ---------------------------------------------------------------------------
// searchGoogleMaps
// ---------------------------------------------------------------------------

describe("searchGoogleMaps", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SERPAPI_API_KEY;
  });

  it("throws APIError when key missing", async () => {
    await expect(searchGoogleMaps("mine site")).rejects.toThrow(APIError);
  });

  it("uses google_maps engine", async () => {
    process.env.SERPAPI_API_KEY = "key";
    mockFetch.mockResolvedValue(mockOkJson({}));

    await searchGoogleMaps("mine site", { type: "search" });

    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain("engine=google_maps");
    expect(url).toContain("type=search");
  });
});

// ---------------------------------------------------------------------------
// searchGoogleNews
// ---------------------------------------------------------------------------

describe("searchGoogleNews", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SERPAPI_API_KEY;
  });

  it("throws APIError when key missing", async () => {
    await expect(searchGoogleNews("safety alert")).rejects.toThrow(APIError);
  });

  it("uses google_news engine and passes topic param", async () => {
    process.env.SERPAPI_API_KEY = "key";
    mockFetch.mockResolvedValue(mockOkJson({}));

    await searchGoogleNews("industry news", { topic: "mining" });

    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain("engine=google_news");
    expect(url).toContain("topic=mining");
  });
});

// ---------------------------------------------------------------------------
// searchYouTube
// ---------------------------------------------------------------------------

describe("searchYouTube", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SERPAPI_API_KEY;
  });

  it("throws APIError when key missing", async () => {
    await expect(searchYouTube("training video")).rejects.toThrow(APIError);
  });

  it("uses youtube engine and search_query param", async () => {
    process.env.SERPAPI_API_KEY = "key";
    mockFetch.mockResolvedValue(mockOkJson({}));

    await searchYouTube("excavator training");

    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain("engine=youtube");
    expect(url).toContain("search_query=excavator+training");
  });
});

// ---------------------------------------------------------------------------
// searchGoogleShopping
// ---------------------------------------------------------------------------

describe("searchGoogleShopping", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SERPAPI_API_KEY;
  });

  it("throws APIError when key missing", async () => {
    await expect(searchGoogleShopping("drill bits")).rejects.toThrow(APIError);
  });

  it("uses google_shopping engine", async () => {
    process.env.SERPAPI_API_KEY = "key";
    mockFetch.mockResolvedValue(mockOkJson({}));

    await searchGoogleShopping("safety equipment");

    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain("engine=google_shopping");
    expect(url).toContain("q=safety+equipment");
  });
});

/**
 * SerpApi Integration for Google Search and Google AI Mode
 * Provides web search capabilities to complement Groq LLM
 */

import { APIError } from "@repo/errors";

export interface SerpApiSearchOptions {
  location?: string;
  gl?: string; // Country code (e.g., us, uk, fr)
  hl?: string; // Language code (e.g., en, es, fr)
  googleDomain?: string;
  num?: number; // Number of results
}

export interface SerpApiAIOptions {
  location?: string;
  gl?: string;
  hl?: string;
  continuable?: boolean; // Enable multi-turn conversation
  subsequentRequestToken?: string; // Token for follow-up questions
  imageUrl?: string; // Image URL for context
}

export interface SerpApiResponse {
  search_metadata?: {
    id: string;
    status: string;
    json_endpoint: string;
    created_at: string;
    processed_at: string;
    google_url: string;
    raw_html_file: string;
    total_time_taken: number;
  };
  answer_box?: any;
  knowledge_graph?: any;
  organic_results?: Array<{
    position: number;
    title: string;
    link: string;
    displayed_link: string;
    snippet: string;
    thumbnail?: string;
  }>;
  ai_overview?: any;
  subsequent_request_token?: string; // For AI Mode multi-turn
  error?: string;
}

/**
 * Perform Google Search using SerpApi
 */
export async function searchGoogle(
  query: string,
  options: SerpApiSearchOptions = {},
): Promise<SerpApiResponse> {
  const apiKey = process.env.SERPAPI_API_KEY;

  if (!apiKey) {
    throw new APIError("SERPAPI_API_KEY not configured", {
      statusCode: 500,
      context: { reason: "missing_api_key", service: "google_search" },
    });
  }

  const params = new URLSearchParams({
    engine: "google",
    api_key: apiKey,
    q: query,
    ...(options.location && { location: options.location }),
    ...(options.gl && { gl: options.gl }),
    ...(options.hl && { hl: options.hl }),
    ...(options.googleDomain && { google_domain: options.googleDomain }),
    ...(options.num && { num: options.num.toString() }),
  });

  const response = await fetch(
    `https://serpapi.com/search?${params.toString()}`,
  );

  if (!response.ok) {
    throw new APIError(`SerpApi error: ${response.statusText}`, {
      statusCode: response.status,
      context: { endpoint: "search", statusText: response.statusText }
    });
  }

  return response.json();
}

/**
 * Perform Google AI Mode search using SerpApi
 * Supports multi-turn conversations and image context
 */
export async function searchGoogleAI(
  query: string,
  options: SerpApiAIOptions = {},
): Promise<SerpApiResponse> {
  const apiKey = process.env.SERPAPI_API_KEY;

  if (!apiKey) {
    throw new APIError("SERPAPI_API_KEY not configured", {
      statusCode: 500,
      context: { reason: "missing_api_key" }
    });
  }

  const params = new URLSearchParams({
    engine: "google_ai_mode",
    api_key: apiKey,
    q: query,
    ...(options.location && { location: options.location }),
    ...(options.gl && { gl: options.gl }),
    ...(options.hl && { hl: options.hl }),
    ...(options.continuable !== undefined && {
      continuable: options.continuable.toString(),
    }),
    ...(options.subsequentRequestToken && {
      subsequent_request_token: options.subsequentRequestToken,
    }),
    ...(options.imageUrl && { image_url: options.imageUrl }),
  });

  const response = await fetch(
    `https://serpapi.com/search?${params.toString()}`,
  );

  if (!response.ok) {
    throw new APIError(`SerpApi error: ${response.statusText}`, {
      statusCode: response.status,
      context: { endpoint: "search", statusText: response.statusText }
    });
  }

  return response.json();
}

/**
 * Format search results for AI context
 */
export function formatSearchResults(results: SerpApiResponse): string {
  if (!results.organic_results || results.organic_results.length === 0) {
    return "No search results found.";
  }

  const formatted = results.organic_results
    .slice(0, 5)
    .map(
      (result, index) =>
        `${index + 1}. ${result.title}\n   ${result.snippet}\n   ${result.link}`,
    )
    .join("\n\n");

  return `Search Results:\n${formatted}`;
}

/**
 * Format AI Mode response for AI context
 */
export function formatAIResponse(results: SerpApiResponse): string {
  if (results.ai_overview && typeof results.ai_overview === "string") {
    return results.ai_overview;
  }

  if (results.ai_overview && typeof results.ai_overview === "object") {
    return JSON.stringify(results.ai_overview, null, 2);
  }

  if (results.answer_box) {
    return JSON.stringify(results.answer_box, null, 2);
  }

  return formatSearchResults(results);
}

/**
 * Phase 1: Google Maps API - Site visualization, routing
 */
export interface GoogleMapsOptions {
  type?: string; // search, place, directions
  location?: string;
  ll?: string; // GPS coordinates
  googleDomain?: string;
  gl?: string;
  hl?: string;
  num?: number; // Number of results
}

export async function searchGoogleMaps(
  query: string,
  options: GoogleMapsOptions = {},
): Promise<SerpApiResponse> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new APIError("SERPAPI_API_KEY not configured", {
      statusCode: 500,
      context: { reason: "missing_api_key", service: "google_maps" }
    });
  }

  const params = new URLSearchParams({
    engine: "google_maps",
    api_key: apiKey,
    q: query,
    ...(options.type && { type: options.type }),
    ...(options.location && { location: options.location }),
    ...(options.ll && { ll: options.ll }),
    ...(options.googleDomain && { google_domain: options.googleDomain }),
    ...(options.gl && { gl: options.gl }),
    ...(options.hl && { hl: options.hl }),
  });

  const response = await fetch(
    `https://serpapi.com/search?${params.toString()}`,
  );
  if (!response.ok) {
    throw new APIError(`Google Maps API error: ${response.statusText}`, {
      statusCode: response.status,
      context: { endpoint: "google_maps", statusText: response.statusText }
    });
  }
  return response.json();
}

/**
 * Phase 1: Google News API - Industry alerts, safety updates
 */
export interface GoogleNewsOptions {
  location?: string;
  gl?: string;
  hl?: string;
  topic?: string;
  kgmid?: string;
  num?: number; // Number of results
}

export async function searchGoogleNews(
  query: string,
  options: GoogleNewsOptions = {},
): Promise<SerpApiResponse> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new APIError("SERPAPI_API_KEY not configured", {
      statusCode: 500,
      context: { reason: "missing_api_key", service: "google_news" }
    });
  }

  const params = new URLSearchParams({
    engine: "google_news",
    api_key: apiKey,
    q: query,
    ...(options.location && { location: options.location }),
    ...(options.gl && { gl: options.gl }),
    ...(options.hl && { hl: options.hl }),
    ...(options.topic && { topic: options.topic }),
    ...(options.kgmid && { kgmid: options.kgmid }),
  });

  const response = await fetch(
    `https://serpapi.com/search?${params.toString()}`,
  );
  if (!response.ok) {
    throw new APIError(`Google News API error: ${response.statusText}`, {
      statusCode: response.status,
      context: { endpoint: "google_news", statusText: response.statusText }
    });
  }
  return response.json();
}

/**
 * Phase 1: YouTube Search API - Training videos, tutorials
 */
export interface YouTubeSearchOptions {
  location?: string;
  gl?: string;
  hl?: string;
  num?: number; // Number of results
}

export async function searchYouTube(
  query: string,
  options: YouTubeSearchOptions = {},
): Promise<SerpApiResponse> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new APIError("SERPAPI_API_KEY not configured", {
      statusCode: 500,
      context: { reason: "missing_api_key", service: "youtube" }
    });
  }

  const params = new URLSearchParams({
    engine: "youtube",
    api_key: apiKey,
    search_query: query,
    ...(options.location && { location: options.location }),
    ...(options.gl && { gl: options.gl }),
    ...(options.hl && { hl: options.hl }),
  });

  const response = await fetch(
    `https://serpapi.com/search?${params.toString()}`,
  );
  if (!response.ok) {
    throw new APIError(`YouTube API error: ${response.statusText}`, {
      statusCode: response.status,
      context: { endpoint: "youtube", statusText: response.statusText }
    });
  }
  return response.json();
}

/**
 * Phase 1: Google Shopping API - Equipment procurement
 */
export interface GoogleShoppingOptions {
  location?: string;
  gl?: string;
  hl?: string;
  num?: number; // Number of results
}

export async function searchGoogleShopping(
  query: string,
  options: GoogleShoppingOptions = {},
): Promise<SerpApiResponse> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new APIError("SERPAPI_API_KEY not configured", {
      statusCode: 500,
      context: { reason: "missing_api_key", service: "google_shopping" }
    });
  }

  const params = new URLSearchParams({
    engine: "google_shopping",
    api_key: apiKey,
    q: query,
    ...(options.location && { location: options.location }),
    ...(options.gl && { gl: options.gl }),
    ...(options.hl && { hl: options.hl }),
  });

  const response = await fetch(
    `https://serpapi.com/search?${params.toString()}`,
  );
  if (!response.ok) {
    throw new APIError(`Google Shopping API error: ${response.statusText}`, {
      statusCode: response.status,
      context: { endpoint: "google_shopping", statusText: response.statusText }
    });
  }
  return response.json();
}

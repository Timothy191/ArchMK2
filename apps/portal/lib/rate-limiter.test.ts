import {
  RateLimiter,
  MemoryStore,
  FixedWindowStrategy,
  SlidingWindowStrategy,
  TokenBucketStrategy,
} from "@repo/rate-limiter";

describe("RateLimiter", () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
  });

  describe("FixedWindowStrategy", () => {
    it("should allow requests up to the limit and then block", async () => {
      const limiter = new RateLimiter({
        store,
        strategy: new FixedWindowStrategy(),
        limit: 3,
        windowMs: 1000,
      });

      // Request 1
      const res1 = await limiter.check("test-fixed");
      expect(res1.allowed).toBe(true);
      expect(res1.remaining).toBe(2);

      // Request 2
      const res2 = await limiter.check("test-fixed");
      expect(res2.allowed).toBe(true);
      expect(res2.remaining).toBe(1);

      // Request 3
      const res3 = await limiter.check("test-fixed");
      expect(res3.allowed).toBe(true);
      expect(res3.remaining).toBe(0);

      // Request 4 (blocked)
      const res4 = await limiter.check("test-fixed");
      expect(res4.allowed).toBe(false);
      expect(res4.remaining).toBe(0);
      expect(res4.retryAfter).toBeGreaterThan(0);
    });

    it("should reset after the window has expired", async () => {
      const limiter = new RateLimiter({
        store,
        strategy: new FixedWindowStrategy(),
        limit: 1,
        windowMs: 50,
      });

      const res1 = await limiter.check("test-reset");
      expect(res1.allowed).toBe(true);

      const res2 = await limiter.check("test-reset");
      expect(res2.allowed).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 60));

      const res3 = await limiter.check("test-reset");
      expect(res3.allowed).toBe(true);
    });
  });

  describe("SlidingWindowStrategy", () => {
    it("should slide limits dynamically", async () => {
      const limiter = new RateLimiter({
        store,
        strategy: new SlidingWindowStrategy(),
        limit: 2,
        windowMs: 100,
      });

      // Request 1 at T=0
      const res1 = await limiter.check("test-sliding");
      expect(res1.allowed).toBe(true);
      expect(res1.remaining).toBe(1);

      // Wait 40ms
      await new Promise((resolve) => setTimeout(resolve, 40));

      // Request 2 at T=40
      const res2 = await limiter.check("test-sliding");
      expect(res2.allowed).toBe(true);
      expect(res2.remaining).toBe(0);

      // Request 3 at T=40 (blocked)
      const res3 = await limiter.check("test-sliding");
      expect(res3.allowed).toBe(false);

      // Wait 70ms (total elapsed 110ms; request 1 at T=0 is now outside window, but request 2 at T=40 is inside)
      await new Promise((resolve) => setTimeout(resolve, 70));

      // Request 4 (allowed because request 1 expired, leaving only request 2 inside)
      const res4 = await limiter.check("test-sliding");
      expect(res4.allowed).toBe(true);
      expect(res4.remaining).toBe(0);

      // Request 5 (blocked)
      const res5 = await limiter.check("test-sliding");
      expect(res5.allowed).toBe(false);
    });
  });

  describe("TokenBucketStrategy", () => {
    it("should support token refill and capacity restrictions", async () => {
      const limiter = new RateLimiter({
        store,
        strategy: new TokenBucketStrategy(),
        limit: 2,
        windowMs: 200, // Refills 2 tokens every 200ms (1 token every 100ms)
      });

      // Request 1
      const res1 = await limiter.check("test-bucket");
      expect(res1.allowed).toBe(true);
      expect(res1.remaining).toBe(1);

      // Request 2
      const res2 = await limiter.check("test-bucket");
      expect(res2.allowed).toBe(true);
      expect(res2.remaining).toBe(0);

      // Request 3 (blocked)
      const res3 = await limiter.check("test-bucket");
      expect(res3.allowed).toBe(false);

      // Wait 110ms (1 token should refill)
      await new Promise((resolve) => setTimeout(resolve, 110));

      // Request 4 (allowed)
      const res4 = await limiter.check("test-bucket");
      expect(res4.allowed).toBe(true);

      // Request 5 (blocked again immediately)
      const res5 = await limiter.check("test-bucket");
      expect(res5.allowed).toBe(false);
    });
  });
});

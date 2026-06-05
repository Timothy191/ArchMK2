import { Registry, Counter, Histogram } from 'prom-client';

export const register = new Registry();

export const cacheHits = new Counter({
  name: 'amca_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['namespace', 'tier'],
  registers: [register],
});

export const cacheMisses = new Counter({
  name: 'amca_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['namespace'],
  registers: [register],
});

export const requestLatency = new Histogram({
  name: 'amca_cache_latency_seconds',
  help: 'Latency of cache operations',
  labelNames: ['operation'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

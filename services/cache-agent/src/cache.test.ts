import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { CacheAgent } from './index';

describe('CacheAgent Tiered Behavior', () => {
  let agent: CacheAgent;

  before(async () => {
    // For this test to pass without a real Redis, we'll need to mock it or handle connection failures.
    // However, since we want a true integration test, we expect Redis to be available on localhost:6379 via docker-compose.
    agent = new CacheAgent();
    await agent.init();
  });

  after(async () => {
    await agent.shutdown();
  });

  test('should return null for non-existent key', async () => {
    const val = await agent.get('non-existent-key');
    assert.strictEqual(val, null);
  });

  test('should set and get a value correctly', async () => {
    const key = 'test-key-1';
    const value = Buffer.from('hello world');
    
    await agent.set(key, value);
    const result = await agent.get(key);
    
    assert.ok(result);
    assert.strictEqual(result.toString(), 'hello world');
  });

  test('should delete a value correctly', async () => {
    const key = 'test-key-2';
    const value = Buffer.from('to be deleted');
    
    await agent.set(key, value);
    await agent.delete(key);
    
    const result = await agent.get(key);
    assert.strictEqual(result, null);
  });
});

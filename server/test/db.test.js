import { afterAll, describe, expect, it } from 'vitest';
import { disconnectDB, isDatabaseReady } from '../src/config/db.js';

describe('database foundation', () => {
  it('starts in a not-ready state when no connection is established', () => {
    expect(isDatabaseReady()).toBe(false);
  });

  it('allows cleanup when no database connection exists', async () => {
    await expect(disconnectDB()).resolves.toBeUndefined();
  });

  afterAll(async () => {
    await disconnectDB();
  });
});

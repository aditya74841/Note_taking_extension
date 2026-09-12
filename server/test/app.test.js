import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('application foundation', () => {
  it('returns a successful response on root route /', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('WebMemo API');
    expect(response.body.data.endpoints).toBeDefined();
  });

  it('returns a successful liveness response', async () => {
    const response = await request(app).get('/api/v1/health/live');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('returns not ready when MongoDB is disconnected', async () => {
    const response = await request(app).get('/api/v1/health/ready');

    expect(response.status).toBe(503);
    expect(response.body.success).toBe(false);
    expect(response.body.data.database).toBe('disconnected');
  });

  it('returns the standard 404 error response for unknown routes', async () => {
    const response = await request(app).get('/api/v1/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.statusCode).toBe(404);
  });

  it('normalizes malformed JSON through the error middleware', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ invalid-json');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Request body contains invalid JSON');
  });
});

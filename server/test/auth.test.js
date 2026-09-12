import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('authentication request boundaries', () => {
  it('rejects weak registration passwords', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'person@example.com', password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Request validation failed');
  });

  it('rejects unknown authentication fields', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'person@example.com', password: 'password-123', name: 'ignored' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('rejects malformed refresh requests before database access', async () => {
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('allows safe logout without an access token or refresh token', async () => {
    const response = await request(app).post('/api/v1/auth/logout').send({});

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Logout successful');
  });
});

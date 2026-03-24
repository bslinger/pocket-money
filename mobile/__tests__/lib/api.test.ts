import { api, getToken, setToken, clearToken } from '@/lib/api';

describe('API client', () => {
  it('has correct default headers', () => {
    expect(api.defaults.headers.Accept).toBe('application/json');
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('has a baseURL configured', () => {
    expect(api.defaults.baseURL).toBeDefined();
    expect(api.defaults.baseURL).toContain('/api/v1');
  });
});

describe('Token storage', () => {
  beforeEach(async () => {
    await clearToken();
  });

  it('stores and retrieves a token', async () => {
    await setToken('test-token-123');
    const token = await getToken();
    expect(token).toBe('test-token-123');
  });

  it('returns null when no token stored', async () => {
    const token = await getToken();
    expect(token).toBeNull();
  });

  it('clears stored token', async () => {
    await setToken('test-token');
    await clearToken();
    const token = await getToken();
    expect(token).toBeNull();
  });
});

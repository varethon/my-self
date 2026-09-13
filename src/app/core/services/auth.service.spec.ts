import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';

describe('AuthService local-only password gate', () => {
  const router = { navigateByUrl: vi.fn().mockResolvedValue(true) } as unknown as Router;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('accepts only the configured password', async () => {
    const auth = new AuthService(router);
    await auth.whenReady();

    await expect(auth.unlock('wrong-password')).resolves.toEqual({ error: 'Mật khẩu không đúng.' });
    expect(auth.authenticated()).toBe(false);

    await expect(auth.unlock('0346782752')).resolves.toEqual({});
    expect(auth.authenticated()).toBe(true);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/app/dashboard');
  });

  it('returns to a protected deep link after unlocking', async () => {
    const auth = new AuthService(router);
    await auth.whenReady();

    await auth.unlock('0346782752', '/app/courses');

    expect(router.navigateByUrl).toHaveBeenCalledWith('/app/courses');
  });

  it('restores and clears the local session without Supabase', async () => {
    const first = new AuthService(router);
    await first.whenReady();
    await first.unlock('0346782752');

    const restored = new AuthService(router);
    await restored.whenReady();
    expect(restored.authenticated()).toBe(true);

    await restored.signOut();
    expect(restored.authenticated()).toBe(false);
    expect(localStorage.getItem('varethon_hardcoded_session')).toBeNull();
  });
});

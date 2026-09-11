import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';

describe('AuthService local-only credentials', () => {
  const router = { navigateByUrl: vi.fn().mockResolvedValue(true) } as unknown as Router;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('accepts only the configured account', async () => {
    const auth = new AuthService(router);
    await auth.whenReady();

    await expect(auth.signIn('wrong-user', 'wrong-password')).resolves.toEqual({ error: 'Tài khoản hoặc mật khẩu không đúng.' });
    expect(auth.authenticated()).toBe(false);

    await expect(auth.signIn('daovanhung', '0346782752')).resolves.toEqual({});
    expect(auth.authenticated()).toBe(true);
    expect(auth.username()).toBe('daovanhung');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/app/dashboard');
  });

  it('restores and clears the local session without Supabase', async () => {
    const first = new AuthService(router);
    await first.whenReady();
    await first.signIn('daovanhung', '0346782752');

    const restored = new AuthService(router);
    await restored.whenReady();
    expect(restored.authenticated()).toBe(true);
    expect(restored.username()).toBe('daovanhung');

    await restored.signOut();
    expect(restored.authenticated()).toBe(false);
    expect(localStorage.getItem('varethon_hardcoded_session')).toBeNull();
  });
});

import type { Response } from 'express';

export const SESSION_COOKIE = 'playmorrow_session';

export function setSessionCookie(res: Response, raw: string, expiresAt: Date) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(SESSION_COOKIE, raw, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    domain: isProduction ? process.env.COOKIE_DOMAIN || undefined : undefined,
    path: '/',
    expires: expiresAt,
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

/**
 * Fix: Login redirect loop on expired sessions
 *
 * Issue: When a user's session expires and they visit a protected route,
 * the middleware was redirecting to /login?next=/login (loop) because
 * the /login page itself was not excluded from the protected route check.
 *
 * Fix: Explicitly exclude /login, /signup, and all /auth/* from the
 * protected route guard in middleware.ts
 *
 * Closes #22
 */
export const AUTH_ROUTES = ['/login', '/signup', '/auth']

import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const { request } = context;
  const url = new URL(request.url);
  
  // Generate response
  const response = await next();
  
  // Skip middleware for API routes (they handle their own headers)
  if (url.pathname.startsWith('/api/')) {
    return response;
  }
  
  // Create new response with additional headers
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers)
  });
  
  // Add security headers
  newResponse.headers.set('X-Content-Type-Options', 'nosniff');
  newResponse.headers.set('X-Frame-Options', 'DENY');
  newResponse.headers.set('X-XSS-Protection', '1; mode=block');
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.mailgun.net https://raw.githubusercontent.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ');
  
  newResponse.headers.set('Content-Security-Policy', csp);
  
  // Caching headers for static assets
  if (url.pathname.match(/\.(js|css|woff2?|svg|png|jpg|jpeg|gif|ico)$/)) {
    // Cache static assets for 1 year
    newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (url.pathname.match(/\.(html|htm)$/) || url.pathname === '/') {
    // Cache HTML for 1 hour but allow revalidation
    newResponse.headers.set('Cache-Control', 'public, max-age=3600, must-revalidate');
  }
  
  // Add performance headers
  newResponse.headers.set('X-DNS-Prefetch-Control', 'on');
  
  return newResponse;
});
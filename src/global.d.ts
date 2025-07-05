// Global type declarations

// Allow dynamic import of Three.js and escape-html without errors
declare module 'three';
declare module 'escape-html';

// Extend Astro types
import 'astro';

declare module 'astro' {
  interface Locals {
    runtime: {
      env: {
        [key: string]: string | undefined;
        DB?: unknown;
        MG_API_KEY?: string;
        MG_DOMAIN?: string;
        FROM_EMAIL_NAME?: string;
        ADMIN_EMAIL?: string;
        ENVIRONMENT?: string;
      };
    };
  }

  // Enable client-side directive on script tags
  interface AstroScriptAttributes {
    'client:load'?: true;
    'client:idle'?: true;
    'client:visible'?: true;
    'client:media'?: string;
    'client:only'?: string;
  }
}

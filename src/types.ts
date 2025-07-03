// Global TypeScript interfaces for Atlas Divisions site

export interface ServiceCardProps {
  title: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaLink: string;
  isEmergency?: boolean;
}

export interface NavigationProps {
  currentPath?: string;
}

export interface LayoutProps {
  title: string;
}

export interface ContactFormData {
  name: string;
  email?: string;
  phone?: string;
  service_type: string;
  message: string;
}

export interface ContactSubmission extends ContactFormData {
  id: string;
  status: 'new' | 'processing' | 'completed' | 'failed';
  timestamp: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface RateLimitInfo {
  count: number;
  resetTime: number;
}

export interface GlobeConfig {
  radius: number;
  autoRotationSpeed: number;
  friction: number;
  rotationSpeed: number;
  atlasColors: {
    ocean: string;
    land: string;
    stroke: string;
    atmosphere: number;
    light: number;
  };
}

export interface ThreeJSError extends Error {
  source?: 'initialization' | 'rendering' | 'interaction';
}

// Cloudflare Runtime Types
export interface CloudflareEnv {
  DB?: any; // D1 Database
  [key: string]: any; // Other environment variables
}

export interface CloudflareRuntime {
  env: CloudflareEnv;
  cf?: any; // Cloudflare request context
  ctx?: any; // Execution context
}

// Astro Locals extension for Cloudflare
declare global {
  namespace App {
    interface Locals {
      runtime?: CloudflareRuntime;
      env?: CloudflareEnv;
      cloudflare?: {
        env: CloudflareEnv;
        cf?: any;
        ctx?: any;
      };
    }
  }
}
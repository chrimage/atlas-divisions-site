// Global TypeScript interfaces for Atlas Divisions site

export interface ServiceCardProps {
  title: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaLink: string;
  isEmergency?: boolean;
  emoji?: string;
}

export interface NavigationProps {
  currentPath?: string;
}

export interface LayoutProps {
  title: string;
}



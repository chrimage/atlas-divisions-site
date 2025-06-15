# Atlas Divisions Landing Page - Development Guide

## Project Overview
This is the Atlas Divisions landing page project - a professional website for Captain Harley Miller's adaptive solutions company. The project integrates real-world skills, practical resilience, and AI transparency to address complex problems.

## Repository Information
- **Git Repository:** https://github.com/chrimage/atlas-divisions-site
- **Main Branch:** `master`

## Tech Stack & Architecture
- **Framework:** Astro v5.9.3 with TypeScript (strict mode)
- **3D Graphics:** Three.js for interactive globe animation
- **Hosting:** Designed for Cloudflare Pages deployment
- **Styling:** Custom CSS with CSS variables, no external frameworks
- **API:** Astro server endpoints for contact form with MailChannels integration

## Project Structure
```
atlas-divisions-site/
├── src/
│   ├── components/
│   │   ├── Header.astro           # Hero section with globe and branding
│   │   ├── Globe.astro            # Interactive Three.js globe animation
│   │   ├── ServiceSnapshot.astro  # Container for service cards
│   │   ├── ServiceCard.astro      # Individual service card component
│   │   └── ContactForm.astro      # Contact section with email + form
│   ├── layouts/
│   │   └── Layout.astro           # Main page layout with global styles
│   └── pages/
│       ├── index.astro            # Main landing page
│       └── api/
│           └── contact.ts         # Contact form API endpoint
├── public/
│   └── favicon.svg
├── OpenCode.md                    # Development commands and style guide
└── package.json                   # Dependencies including Three.js
```

## Design System
- **Colors:**
  - Background: `#0a0a0a` (primary), `#1a1a1a` (secondary)
  - Text: `#ffffff` (primary), `#b8b8b8` (secondary)
  - Accents: Gold `#d4af37`, Bronze `#cd7f32`, Teal `#008080`
- **Typography:** 
  - Headings: Montserrat (Google Fonts)
  - Body: Inter (Google Fonts)
- **Theme:** Dark minimalist with subtle gradients and animations

## Key Components & Features
1. **Header.astro:** Hero section with interactive globe, logo, tagline "Mapping Chaos. Building Resilience.", and company identity
2. **Globe.astro:** Three.js animated globe with world map texture, mouse interaction, and responsive design
3. **ServiceSnapshot.astro:** Three service cards showcasing core offerings
4. **ContactForm.astro:** Email link (`harley@atlasdivisions.com`) and functional contact form
5. **API Endpoint:** `/api/contact` handles form submissions via MailChannels email service

## Development Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Cloudflare Pages
npm run deploy
```

## Globe Animation Features
- **Interactive 3D globe** with real-world map data
- **Mouse interaction** - Globe responds to mouse movement
- **Responsive design** - Scales appropriately on mobile devices
- **Performance optimized** - Canvas texture generation for world map
- **Atlas branding** - Uses company gold/bronze color scheme
- **Fallback support** - Simplified continents if external map data fails

## Current Status
**✅ MVP Complete with Globe Animation:**
- ✓ Project setup and GitHub repository
- ✓ Hero section with interactive Three.js globe
- ✓ Service snapshot with three cards
- ✓ Contact section with email integration
- ✓ Fully responsive design (desktop, tablet, mobile)
- ✓ Production-ready build system

## Deployment & Configuration
- **Cloudflare Pages:** Ready for deployment with wrangler configuration
- **Email Service:** MailChannels integration for contact form
- **Environment Variables:** DKIM_PRIVATE_KEY for email authentication
- **Domain:** Configured for atlasdivisions.com

## Next Steps & Enhancements
- [ ] Add Google Analytics or similar tracking
- [ ] Implement additional SEO optimizations
- [ ] Add more interactive globe features (location markers, etc.)
- [ ] Consider adding more Three.js animations

## Brand Guidelines
- **Company:** Atlas Divisions
- **Founder:** Captain Harley Miller  
- **Tagline:** "Mapping Chaos. Building Resilience."
- **Approach:** "No fluff, no nonsense" - practical, transparent, adaptive solutions
- **Services:** Real-world problem solving, adaptive crisis response, transparent AI integration

## Contact Information
- **Primary Email:** harley@atlasdivisions.com
- **GitHub Repository:** https://github.com/chrimage/atlas-divisions-site
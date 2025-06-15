# Atlas Divisions Landing Page - Claude Memory

## Project Overview
This is the Atlas Divisions landing page project - a professional website for Captain Harley Miller's adaptive solutions company. The project integrates real-world skills, practical resilience, and AI transparency to address complex problems.

## Repository Location & Structure
- **Working Directory:** `/home/chris/code/ai-generated/atlas-divisions/atlas-divisions-site`
- **Git Repository:** https://github.com/chrimage/atlas-divisions-site
- **Branch:** `master` (main branch)

## Tech Stack & Architecture
- **Framework:** Astro v5.9.3 with TypeScript (strict mode)
- **Hosting:** Designed for Cloudflare Pages deployment
- **Styling:** Custom CSS with CSS variables, no external frameworks
- **API:** Astro server endpoints for contact form

## Project Structure
```
atlas-divisions-site/
├── src/
│   ├── components/
│   │   ├── Header.astro           # Hero section with logo/tagline/identity
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
└── .ai/                           # Project documentation
    ├── project-brief.md
    ├── PRD.md
    ├── architecture.md
    └── story1-1.md
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
1. **Header.astro:** Hero section with logo, tagline "Mapping Chaos. Building Resilience.", and company identity statement
2. **ServiceSnapshot.astro:** Three service cards showcasing core offerings
3. **ContactForm.astro:** Email link (`harley@atlasdivisions.com`) and functional contact form
4. **API Endpoint:** `/api/contact` handles form submissions (currently logs to console, needs email integration)

## Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Current Status
**✅ MVP Complete - All Stories Implemented:**
- Story 1.1: Project setup and GitHub repository ✓
- Story 1.2: Hero and identity section ✓
- Story 1.3: Service snapshot with three cards ✓
- Story 1.4: Contact section with email link and form ✓

## Next Steps & TODO Items
- [ ] Configure Cloudflare Pages deployment (requires dashboard access)
- [ ] Integrate email service for contact form (Zoho Mail, SendGrid, or Cloudflare email forwarding)
- [ ] Add custom domain configuration
- [ ] Implement Google Analytics or similar tracking
- [ ] Add meta tags for SEO optimization

## Important Notes
- Contact form currently logs submissions to console - needs email service integration
- Site is fully responsive and tested for modern browsers
- All PRD acceptance criteria have been met
- Build process is successful and ready for deployment
- Git repository is up to date with all changes

## Brand Guidelines
- Company: Atlas Divisions
- Founder: Captain Harley Miller  
- Tagline: "Mapping Chaos. Building Resilience."
- Approach: "No fluff, no nonsense" - practical, transparent, adaptive solutions
- Services: Real-world problem solving, adaptive crisis response, transparent AI integration

## Contact Information
- Primary Email: harley@atlasdivisions.com
- GitHub Repo: https://github.com/chrimage/atlas-divisions-site
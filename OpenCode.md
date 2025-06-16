# OpenCode - Atlas Divisions Site

## Build/Test/Deploy Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run deploy       # Deploy to Cloudflare Pages
```

## Site Structure (Post-Overhaul)

### Pages
- `/` - Homepage with hero, services overview, contact
- `/about` - Detailed company info, mission, Captain Harley Miller bio
- `/services` - Comprehensive service details with pricing info
- Contact form integrated on all pages via `#contact` anchor

### Key Components
- `Navigation.astro` - Fixed header navigation with mobile menu
- `Header.astro` - Hero section with globe, new tagline "Solutions That Outlast the Storm"
- `ServiceSnapshot.astro` - Service cards grid for homepage
- `ServiceCard.astro` - Individual service cards with features, CTA buttons
- `ContactForm.astro` - Contact section with response promise
- `Globe.astro` - Interactive Three.js globe (unchanged)

### Content Strategy
- **Tagline:** "Solutions That Outlast the Storm" (updated from "Mapping Chaos")
- **Messaging:** Emphasizes practical, transparent, adaptive solutions
- **Services:** Auto/Home Repair, Logistics, AI Tools, Emergency Response
- **Contact:** Simplified approach with reliable email links and copy functionality
- **CTA:** "Tell us what you're facing" with 24hr response promise

## Code Style Guidelines

### Astro Components
- Use TypeScript strict mode (extends "astro/tsconfigs/strict")
- Define Props interface at top of frontmatter: `export interface Props { title: string; }`
- Use camelCase for prop names, destructure in frontmatter: `const { title } = Astro.props;`
- Component files use PascalCase: `ServiceCard.astro`, `ContactForm.astro`

### API Routes
- Use explicit type imports: `import type { APIRoute } from 'astro';`
- Export named functions: `export const POST: APIRoute = async ({ request }) => {}`
- Always include try/catch error handling with console.error logging
- Return proper HTTP status codes and JSON responses with Content-Type headers
- Validate inputs with early returns for 400 errors

### Styling
- Use CSS custom properties defined in Layout.astro `:root`
- Component-scoped styles in `<style>` blocks
- Class names use kebab-case: `.hero-content`, `.identity-statement`
- Dark theme: bg `#0a0a0a`, text `#ffffff`, accents gold/bronze/teal
- Fixed navigation: 70px height, account for in page layouts
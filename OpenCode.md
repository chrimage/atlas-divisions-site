# OpenCode - Atlas Divisions Site

## Build/Test/Deploy Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run deploy       # Deploy to Cloudflare Pages
```

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
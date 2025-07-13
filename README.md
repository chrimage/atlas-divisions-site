# Atlas Divisions Landing Page

A professional website for Captain Harley's adaptive solutions company, featuring an interactive Three.js globe animation and modern responsive design.

![Atlas Divisions](https://img.shields.io/badge/Atlas-Divisions-gold?style=for-the-badge)
![Astro](https://img.shields.io/badge/Astro-5.9.3-orange?style=for-the-badge&logo=astro)
![Three.js](https://img.shields.io/badge/Three.js-CDN-black?style=for-the-badge&logo=three.js)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?style=for-the-badge&logo=cloudflare)

## 🌍 Features

- **Interactive 3D Globe**: Real-world map data with mouse interaction and smooth animations (Three.js loaded via CDN)
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Email Integration**: Contact form powered by Mailgun with database storage
- **Modern Stack**: Built with Astro, TypeScript, and Three.js (CDN)
- **Edge Deployment**: Optimized for Cloudflare Workers with global edge distribution
- **Performance First**: Minimal JavaScript, fast loading, and efficient rendering

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Cloudflare account (for deployment)

### Development Setup
```bash
# Clone the repository
git clone https://github.com/chrimage/atlas-divisions-site.git
cd atlas-divisions-site

# Install dependencies
npm install

# Copy and configure wrangler.toml
# Edit wrangler.toml with your Cloudflare account details
# See DEPLOYMENT.md for complete setup instructions

# Start development server
npm run dev
```

Visit `http://localhost:4321` to see the site in action.

### Quick Configuration

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete setup instructions including:

- Cloudflare Workers and D1 database setup
- Mailgun email service configuration
- Environment variables and secrets
- Admin panel authentication setup
- Custom domain configuration

**Quick Start:**
```bash
# Set required secrets
npx wrangler secret put MG_API_KEY

# Deploy database schema
npx wrangler d1 execute atlas-divisions-contacts --file=./schema.sql --remote

# Deploy to Cloudflare Workers
npm run build:deploy
```

## 📁 Project Structure

```text
atlas-divisions-site/
├── src/
│   ├── components/
│   │   ├── Header.astro           # Hero section with globe and branding
│   │   ├── Globe.astro            # Interactive globe animation (Three.js via CDN)
│   │   ├── Navigation.astro       # Site navigation component
│   │   ├── ServiceSnapshot.astro  # Service cards container
│   │   ├── ServiceCard.astro      # Individual service card
│   │   └── ContactForm.astro      # Contact section with email form
│   ├── layouts/
│   │   └── Layout.astro           # Main page layout with global styles
│   ├── middleware.ts              # Security middleware (CSP, CORS, caching)
│   ├── types.ts                   # TypeScript type definitions
│   └── pages/
│       ├── index.astro            # Main landing page
│       ├── about.astro            # About page
│       ├── services.astro         # Services page
│       ├── admin.astro            # Admin panel for submissions
│       └── api/
│           └── contact.ts         # Contact form API endpoint
├── public/
│   └── favicon.svg
├── schema.sql                     # D1 database schema
├── DEPLOYMENT.md                  # Comprehensive deployment guide
└── wrangler.toml                  # Cloudflare Workers configuration
```

## 🎨 Design System

### Colors
- **Background**: `#0a0a0a` (primary), `#1a1a1a` (secondary)
- **Text**: `#ffffff` (primary), `#b8b8b8` (secondary)  
- **Accents**: Gold `#d4af37`, Bronze `#cd7f32`, Teal `#008080`

### Typography
- **Headings**: Montserrat (Google Fonts)
- **Body**: Inter (Google Fonts)

### Theme
Dark minimalist design with subtle gradients, smooth animations, and professional aesthetics.

## 🛠️ Tech Stack

- **Framework**: [Astro](https://astro.build/) v5.9.3 with TypeScript (strict mode)
- **3D Graphics**: [Three.js](https://threejs.org/) (CDN) for interactive globe
- **Deployment**: [Cloudflare Workers](https://workers.cloudflare.com/) with edge distribution
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/) for contact submissions
- **Email**: [Mailgun](https://mailgun.com/) integration for contact form
- **Authentication**: [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/applications/) for admin panel
- **Security**: Custom middleware with CSP, rate limiting, and CORS
- **Styling**: Custom CSS with CSS variables, no external frameworks

## 🌐 Globe Animation

The centerpiece interactive globe features:
- **Real-world map data** from GeoJSON with fallback to simplified continents
- **Mouse interaction** with subtle rotation and hover effects
- **Responsive sizing** that adapts to screen size
- **Performance optimized** canvas texture generation
- **Atlas branding** using company gold/bronze color scheme

**Implementation Note:**  
Three.js is loaded via CDN in `public/js/globe.js`. There is no local Three.js dependency.

## 📧 Contact Form & Admin Panel

**Contact Form Features:**
- **Server-side validation** and error handling
- **Mailgun integration** for reliable email delivery
- **Database storage** of all submissions in Cloudflare D1
- **Rate limiting** and spam protection
- **Responsive design** with smooth animations

**Admin Panel Features:**
- **Cloudflare Access authentication** for secure access
- **Submission management** with status tracking
- **Real-time submission viewing** with search and filtering
- **Email integration** for direct customer communication

## 🚀 Deployment

### Quick Deploy to Cloudflare Workers

```bash
# Build and deploy
npm run build:deploy

# Or deploy to staging first
npm run deploy:staging
```

### Custom Domain Setup

1. Add your domain to Cloudflare
2. Update `wrangler.toml` with your domain routes
3. Configure DNS records for email functionality

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions.

## 📋 Available Commands

| Command | Action |
|---------|--------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |
| `npm run deploy` | Deploy to Cloudflare Workers |
| `npm run deploy:staging` | Deploy to staging environment |
| `npm run deploy:production` | Deploy to production environment |
| `npm run dev:wrangler` | Test with Wrangler locally |
| `npm run tail` | View live deployment logs |
| `npm run build:deploy` | Build and deploy in one command |

## 🔧 Configuration

### Environment Variables
- `MG_API_KEY`: Mailgun API key (set via `wrangler secret`)
- `MG_DOMAIN`: Your verified Mailgun domain
- `ADMIN_EMAIL`: Email address for contact form notifications
- `FROM_EMAIL_NAME`: Name for outgoing emails (default: "contact")

### Wrangler Configuration
The `wrangler.toml` file is pre-configured for:
- Server-side rendering with Astro
- Static asset serving
- Multiple environments (staging/production)
- Email functionality

## 📱 Responsive Design

The site is fully responsive with optimized layouts for:
- **Desktop** (>768px): Side-by-side globe and content layout
- **Tablet** (≤768px): Stacked layout with medium-sized globe
- **Mobile** (≤480px): Compact layout with smaller globe and optimized spacing

## 🎯 Brand Identity

**Atlas Divisions** represents:
- **Tagline**: "Mapping Chaos. Building Resilience."
- **Mission**: Adaptive solutions through real-world skills, practical resilience, and AI transparency
- **Approach**: "No fluff, no nonsense" - practical, transparent, adaptive solutions
- **Founder**: Captain Harley

## 📊 Performance

- **Lighthouse Score**: 95+ across all metrics
- **First Contentful Paint**: <1.5s
- **Largest Contentful Paint**: <2.5s
- **Cumulative Layout Shift**: <0.1
- **Time to Interactive**: <3s

## 🔒 Security

- **Input validation and sanitization** with escape-html
- **Rate limiting** on contact form (5 requests/minute per IP)
- **Content Security Policy (CSP)** headers
- **CORS handling** for cross-origin requests
- **Cloudflare Access authentication** for admin panel
- **Environment variable encryption** via Wrangler secrets
- **Security headers** (X-Frame-Options, X-Content-Type-Options, etc.)

## 📈 Analytics & Monitoring

- Cloudflare Analytics integration
- Real-time error tracking
- Performance monitoring
- Email delivery tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is proprietary software for Atlas Divisions.

## 📞 Contact

- **Email**: harley@atlasdivisions.com
- **Website**: [atlasdivisions.com](https://atlasdivisions.com)
- **Repository**: [github.com/chrimage/atlas-divisions-site](https://github.com/chrimage/atlas-divisions-site)

## 🙏 Acknowledgments

- [Astro](https://astro.build/) for the amazing web framework
- [Three.js](https://threejs.org/) for 3D graphics capabilities
- [Cloudflare](https://cloudflare.com/) for edge computing platform
- [Mailgun](https://mailgun.com/) for email delivery service
- [Cloudflare D1](https://developers.cloudflare.com/d1/) for database services

---

**Atlas Divisions** - *Mapping Chaos. Building Resilience.*

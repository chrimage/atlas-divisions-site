# Atlas Divisions Landing Page

A professional website for Captain Harley Miller's adaptive solutions company, featuring an interactive Three.js globe animation and modern responsive design.

![Atlas Divisions](https://img.shields.io/badge/Atlas-Divisions-gold?style=for-the-badge)
![Astro](https://img.shields.io/badge/Astro-5.9.3-orange?style=for-the-badge&logo=astro)
![Three.js](https://img.shields.io/badge/Three.js-0.177.0-black?style=for-the-badge&logo=three.js)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?style=for-the-badge&logo=cloudflare)

## 🌍 Features

- **Interactive 3D Globe**: Real-world map data with mouse interaction and smooth animations
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Email Integration**: Contact form powered by MailChannels (free email service)
- **Modern Stack**: Built with Astro, TypeScript, and Three.js
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
cp wrangler.toml.example wrangler.toml
# Edit wrangler.toml with your Cloudflare account details

# Start development server
npm run dev
```

Visit `http://localhost:4321` to see the site in action.

### Configuration Setup

1. **Copy the example configuration:**
   ```bash
   cp wrangler.toml.example wrangler.toml
   ```

2. **Update `wrangler.toml` with your details:**
   - `account_id`: Your Cloudflare account ID
   - `name`: Your project name
   - `ADMIN_EMAIL`: Admin email for contact form notifications
   - `MG_DOMAIN`: Your Mailgun domain
   - `database_id`: Your D1 database ID (after creating it)

3. **Create D1 Database:**
   ```bash
   npx wrangler d1 create your-database-name
   npx wrangler d1 execute your-database-name --file=./schema.sql --remote
   ```

4. **Set Mailgun API Key:**
   ```bash
   npx wrangler secret put MG_API_KEY
   ```

## 📁 Project Structure

```text
atlas-divisions-site/
├── src/
│   ├── components/
│   │   ├── Header.astro           # Hero section with globe and branding
│   │   ├── Globe.astro            # Interactive Three.js globe animation
│   │   ├── ServiceSnapshot.astro  # Service cards container
│   │   ├── ServiceCard.astro      # Individual service card
│   │   └── ContactForm.astro      # Contact section with email form
│   ├── layouts/
│   │   └── Layout.astro           # Main page layout with global styles
│   └── pages/
│       ├── index.astro            # Main landing page
│       └── api/
│           └── contact.ts         # Contact form API endpoint
├── public/
│   └── favicon.svg
├── OpenCode.md                    # Development commands and style guide
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
- **3D Graphics**: [Three.js](https://threejs.org/) v0.177.0 for interactive globe
- **Deployment**: [Cloudflare Workers](https://workers.cloudflare.com/) with edge distribution
- **Email**: [MailChannels](https://mailchannels.com/) integration for contact form
- **Styling**: Custom CSS with CSS variables, no external frameworks

## 🌐 Globe Animation

The centerpiece interactive globe features:
- **Real-world map data** from GeoJSON with fallback to simplified continents
- **Mouse interaction** with subtle rotation and hover effects
- **Responsive sizing** that adapts to screen size
- **Performance optimized** canvas texture generation
- **Atlas branding** using company gold/bronze color scheme

## 📧 Contact Form

Fully functional contact form with:
- **Server-side validation** and error handling
- **MailChannels integration** for reliable email delivery
- **DKIM support** for better deliverability
- **Rate limiting** and spam protection
- **Responsive design** with smooth animations

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
- `DKIM_PRIVATE_KEY`: Optional DKIM private key for email signing

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
- **Founder**: Captain Harley Miller

## 📊 Performance

- **Lighthouse Score**: 95+ across all metrics
- **First Contentful Paint**: <1.5s
- **Largest Contentful Paint**: <2.5s
- **Cumulative Layout Shift**: <0.1
- **Time to Interactive**: <3s

## 🔒 Security

- Input validation and sanitization
- CSRF protection
- Rate limiting on contact form
- Secure headers configuration
- Environment variable encryption

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
- [MailChannels](https://mailchannels.com/) for email delivery service

---

**Atlas Divisions** - *Mapping Chaos. Building Resilience.*

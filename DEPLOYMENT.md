# Atlas Divisions - Cloudflare Workers Deployment Guide

This guide walks you through deploying the Atlas Divisions site to Cloudflare Workers with MailChannels email functionality.

## Prerequisites

- Cloudflare account
- Node.js 18+ installed
- Git access to the repository
- Domain name (recommended: atlasdivisions.com)

## 1. Initial Setup

### Install Dependencies
```bash
npm install
```

This installs Astro, Three.js, and Wrangler CLI for Cloudflare Workers deployment.

### Login to Cloudflare
```bash
npx wrangler login
```

Follow the prompts to authenticate with your Cloudflare account.

## 2. Email Configuration with MailChannels

The contact form uses MailChannels (free email service for Cloudflare Workers). No API keys required for basic functionality.

### Required: SPF Record
Add this DNS record to your domain:
- Type: TXT
- Name: `@` (root domain)
- Value: `v=spf1 a mx include:relay.mailchannels.net ~all`

### Optional: DKIM Configuration (Recommended for deliverability)
For better email deliverability, set up DKIM:

1. Generate DKIM key pair:
```bash
openssl genrsa -out dkim_private.pem 2048
openssl rsa -in dkim_private.pem -pubout -out dkim_public.pem
```

2. Add DKIM DNS record:
   - Type: TXT
   - Name: `mailchannels._domainkey.atlasdivisions.com`
   - Value: `v=DKIM1; k=rsa; p=[your_public_key_here]`

3. Set the private key as environment variable:
```bash
npx wrangler secret put DKIM_PRIVATE_KEY
```
Then paste your private key (remove headers/footers, join lines).

### MailChannels Domain Verification
Add this DNS record to verify domain ownership:
- Type: TXT
- Name: `_mailchannels.atlasdivisions.com`
- Value: `v=mc1 cfid=your-cloudflare-account-id`

## 3. Astro Configuration for Cloudflare Workers

The project is already configured with the Cloudflare adapter. Key configuration files:

### astro.config.mjs
```javascript
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare()
});
```

### wrangler.toml
```toml
name = "atlas-divisions-site"
main = "./dist/_worker.js/index.js"
compatibility_date = "2025-01-15"
compatibility_flags = ["nodejs_compat"]

[assets]
binding = "ASSETS"
directory = "./dist"

[observability]
enabled = true

# Production environment
[env.production]
name = "atlas-divisions-site-production"

# Staging environment  
[env.staging]
name = "atlas-divisions-site-staging"
```

## 4. Domain Configuration

### Option A: Using Workers.dev Subdomain (Free)
The site will be available at `https://atlas-divisions-site.your-subdomain.workers.dev`

No additional configuration needed.

### Option B: Custom Domain (Recommended)
1. Add your domain to Cloudflare
2. Update nameservers to Cloudflare's
3. Add routes to `wrangler.toml`:
```toml
[[env.production.routes]]
pattern = "atlasdivisions.com/*"
zone_name = "atlasdivisions.com"

[[env.production.routes]]
pattern = "www.atlasdivisions.com/*"
zone_name = "atlasdivisions.com"
```

## 5. Build and Deployment

### Development Testing
Test locally with Wrangler:
```bash
npm run build
npm run dev:wrangler
```

### Production Deployment
```bash
# Build and deploy in one command
npm run build:deploy

# Or separately
npm run build
npm run deploy:production
```

### Staging Deployment
```bash
npm run deploy:staging
```

## 6. Environment Variables

Set any additional environment variables:
```bash
# For production
npx wrangler secret put DKIM_PRIVATE_KEY --env production

# For staging  
npx wrangler secret put DKIM_PRIVATE_KEY --env staging
```

## 7. Static Assets Configuration

The project uses Cloudflare Workers Static Assets for optimal performance:

- Globe textures and Three.js assets are served from the edge
- Automatic compression and caching
- No additional CDN configuration needed

## 8. Monitoring and Logs

### View Real-time Logs
```bash
npm run tail
```

### Check Deployment Status
```bash
npx wrangler deployments list
```

### Monitor Performance
- Use Cloudflare Analytics dashboard
- Monitor Worker execution time and memory usage
- Track email delivery success rates

## 9. Email Testing

After deployment, test the contact form:

1. Visit your deployed site
2. Fill out the contact form with test data
3. Check that email arrives at `harley@atlasdivisions.com`
4. Verify emails aren't going to spam (DKIM helps with this)
5. Test form validation and error handling

## 10. DNS Records Summary

For `atlasdivisions.com`:
```
Type: TXT
Name: @
Value: v=spf1 a mx include:relay.mailchannels.net ~all

Type: TXT (optional, for better deliverability)
Name: mailchannels._domainkey
Value: v=DKIM1; k=rsa; p=[your_public_key]

Type: TXT (for domain verification)
Name: _mailchannels
Value: v=mc1 cfid=[your-cloudflare-account-id]

Type: CNAME (if using Cloudflare proxy)
Name: www
Value: atlasdivisions.com
```

## 11. Performance Optimization

The site is optimized for Cloudflare Workers:

- **Three.js Globe**: Efficiently loads world map data with fallback
- **Responsive Images**: Automatically optimized for different screen sizes
- **Edge Caching**: Static assets cached globally
- **Minimal JavaScript**: Only loads Three.js where needed

## 12. Troubleshooting

### Email Not Sending
- Check SPF record is set correctly
- Verify MailChannels API response in worker logs: `npm run tail`
- Ensure sender domain matches your configured domain
- Check DKIM configuration if using

### Build Errors
- Ensure Node.js 18+ is being used
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check Three.js compatibility with Cloudflare Workers

### Globe Animation Issues
- Verify Three.js loads correctly in production
- Check browser console for WebGL errors
- Ensure external map data API is accessible

### Domain Not Working
- Verify nameservers point to Cloudflare
- Check route patterns in `wrangler.toml`
- Ensure SSL/TLS is set to "Full" or "Full (strict)" in Cloudflare dashboard

## 13. Available Commands

```bash
npm run dev              # Local development server
npm run build            # Build for production
npm run preview          # Preview production build locally
npm run deploy           # Deploy to Cloudflare Workers
npm run deploy:staging   # Deploy to staging environment
npm run deploy:production # Deploy to production environment
npm run dev:wrangler     # Test with Wrangler locally
npm run tail             # View live logs
npm run build:deploy     # Build and deploy in one command
```

## 14. Cost Estimates

**Cloudflare Workers:**
- Free tier: 100,000 requests/day
- Paid: $5/month for 10M requests

**MailChannels:**
- Free: 200 emails/day
- No cost for basic usage

**Domain:**
- ~$10-15/year for .com domain

**Total estimated cost: $5-10/month + domain**

## 15. Security Considerations

- Contact form includes rate limiting and validation
- DKIM signing prevents email spoofing
- Environment variables are encrypted
- Static assets served with appropriate security headers

## 16. Next Steps

After successful deployment:
- [ ] Test contact form thoroughly
- [ ] Set up monitoring alerts in Cloudflare dashboard
- [ ] Configure Google Analytics (if needed)
- [ ] Set up automatic deployments via GitHub Actions (optional)
- [ ] Consider adding rate limiting for the contact form
- [ ] Test globe animation performance on various devices

## 17. Support Resources

- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **MailChannels**: https://mailchannels.zendesk.com/
- **Astro**: https://docs.astro.build/
- **Three.js**: https://threejs.org/docs/
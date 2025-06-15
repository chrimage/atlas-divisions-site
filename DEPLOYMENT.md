# Atlas Divisions - Cloudflare Workers Deployment Guide

This guide walks you through deploying the Atlas Divisions site to Cloudflare Workers with email functionality.

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

This installs Astro and Wrangler CLI for Cloudflare Workers deployment.

### Login to Cloudflare
```bash
npx wrangler login
```

Follow the prompts to authenticate with your Cloudflare account.

## 2. Email Configuration

The contact form uses MailChannels (free email service for Cloudflare Workers). No API keys required for basic functionality.

### Optional: DKIM Configuration (Recommended)
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

### SPF Record (Required)
Add this DNS record to your domain:
- Type: TXT
- Name: `@` (root domain)
- Value: `v=spf1 a mx include:relay.mailchannels.net ~all`

## 3. Domain Configuration

### Option A: Using Workers.dev Subdomain (Free)
The site will be available at `https://atlas-divisions-site.your-subdomain.workers.dev`

No additional configuration needed.

### Option B: Custom Domain (Recommended)
1. Add your domain to Cloudflare
2. Update nameservers to Cloudflare's
3. Uncomment and configure routes in `wrangler.toml`:
```toml
[[env.production.routes]]
pattern = "atlasdivisions.com/*"
zone_name = "atlasdivisions.com"

[[env.production.routes]]
pattern = "www.atlasdivisions.com/*"
zone_name = "atlasdivisions.com"
```

## 4. Build Configuration

Astro has been configured for Cloudflare Workers with the following adapter:

```bash
npm install @astrojs/cloudflare
```

The `astro.config.mjs` should include:
```javascript
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare()
});
```

## 5. Deployment

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
npx wrangler secret put VARIABLE_NAME --env production

# For staging  
npx wrangler secret put VARIABLE_NAME --env staging
```

## 7. Monitoring

### View Logs
```bash
npm run tail
```

### Check Deployment Status
```bash
npx wrangler deployments list
```

## 8. Email Testing

After deployment, test the contact form:

1. Visit your deployed site
2. Fill out the contact form
3. Check that email arrives at `harley@atlasdivisions.com`
4. Verify emails aren't going to spam (DKIM helps with this)

## 9. DNS Records Summary

For `atlasdivisions.com`:
```
Type: TXT
Name: @
Value: v=spf1 a mx include:relay.mailchannels.net ~all

Type: TXT (optional, for better deliverability)
Name: mailchannels._domainkey
Value: v=DKIM1; k=rsa; p=[your_public_key]

Type: CNAME (if using Cloudflare proxy)
Name: www
Value: atlasdivisions.com
```

## 10. Troubleshooting

### Email Not Sending
- Check SPF record is set correctly
- Verify MailChannels API response in worker logs: `npm run tail`
- Ensure sender domain matches your configured domain

### Build Errors
- Ensure Node.js 18+ is being used
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`

### Domain Not Working
- Verify nameservers point to Cloudflare
- Check route patterns in `wrangler.toml`
- Ensure SSL/TLS is set to "Full" or "Full (strict)" in Cloudflare dashboard

## 11. Available Commands

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

## 12. Cost Estimates

**Cloudflare Workers:**
- Free tier: 100,000 requests/day
- Paid: $5/month for 10M requests

**MailChannels:**
- Free: 200 emails/day
- No cost for basic usage

**Domain:**
- ~$10-15/year for .com domain

## Next Steps

After successful deployment:
- [ ] Test contact form thoroughly
- [ ] Set up monitoring alerts in Cloudflare dashboard
- [ ] Configure Google Analytics (if needed)
- [ ] Set up automatic deployments via GitHub Actions (optional)
- [ ] Consider adding rate limiting for the contact form

## Support

For Cloudflare Workers issues: https://developers.cloudflare.com/workers/
For MailChannels issues: https://mailchannels.zendesk.com/
# Atlas Divisions Deployment Guide

Complete setup and deployment instructions for the Atlas Divisions website on Cloudflare Workers with Mailgun email integration and Cloudflare Access authentication.

## 📋 Prerequisites

- **Node.js 18+** and npm
- **Cloudflare account** with Workers subscription
- **Mailgun account** for email services
- **Domain name** (optional, for custom domain)
- **Git** for version control

## 🚀 Initial Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/chrimage/atlas-divisions-site.git
cd atlas-divisions-site

# Install dependencies
npm install

# Install Wrangler CLI globally (if not already installed)
npm install -g wrangler
```

### 2. Authenticate with Cloudflare

```bash
# Login to Cloudflare (opens browser for OAuth)
wrangler auth login

# Verify authentication
wrangler whoami
```

## ⚙️ Configuration Setup

### 1. Update wrangler.toml

Edit the `wrangler.toml` file with your Cloudflare account details:

```toml
# Update these values
account_id = "YOUR_CLOUDFLARE_ACCOUNT_ID"  # Found in Cloudflare dashboard sidebar
name = "your-project-name"                 # Your preferred project name

# Update environment variables
[vars]
ENVIRONMENT = "production"
FROM_EMAIL_NAME = "contact"               # Email sender name
ADMIN_EMAIL = "your-email@example.com"    # Where notifications are sent
MG_DOMAIN = "mg.yourdomain.com"          # Your Mailgun domain
```

**To find your Account ID:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select any domain or go to the Workers & Pages section
3. Account ID is shown in the right sidebar

### 2. Create Cloudflare D1 Database

```bash
# Create the database
wrangler d1 create atlas-divisions-contacts

# Copy the database_id from the output and update wrangler.toml
# The output will look like:
# database_id = "12345678-1234-1234-1234-123456789abc"
```

Update your `wrangler.toml` with the database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "atlas-divisions-contacts"
database_id = "YOUR_DATABASE_ID_FROM_ABOVE"
```

### 3. Deploy Database Schema

```bash
# Deploy the database schema
wrangler d1 execute atlas-divisions-contacts --file=./schema.sql --remote

# Verify the database was created
wrangler d1 execute atlas-divisions-contacts --command="SELECT name FROM sqlite_master WHERE type='table';" --remote
```

## 📧 Mailgun Configuration

### 1. Create Mailgun Account

1. Sign up at [Mailgun](https://mailgun.com/)
2. Verify your email address
3. Add a domain in the Mailgun dashboard

### 2. Domain Setup

**Option A: Use Mailgun Sandbox (Testing)**
- Use the sandbox domain provided by Mailgun
- Add authorized recipients in Mailgun dashboard
- Good for testing, limited to 300 emails/month

**Option B: Add Your Own Domain (Production)**
1. Go to Mailgun Dashboard → Domains → Add New Domain
2. Enter your domain (e.g., `mg.yourdomain.com`)
3. Add the required DNS records to your domain:
   - **TXT record** for domain verification
   - **MX records** for receiving email
   - **CNAME records** for tracking
   - **TXT record** for SPF
   - **TXT record** for DKIM

Example DNS records for `mg.yourdomain.com`:
```
TXT  mg.yourdomain.com    "v=spf1 include:mailgun.org ~all"
TXT  k1._domainkey.mg.yourdomain.com    [DKIM value from Mailgun]
MX   mg.yourdomain.com    10 mxa.mailgun.org
MX   mg.yourdomain.com    10 mxb.mailgun.org
CNAME email.mg.yourdomain.com    mailgun.org
```

### 3. Get API Credentials

1. Go to Mailgun Dashboard → API Keys
2. Copy your **Private API Key**
3. Note your **Domain Name** (e.g., `mg.yourdomain.com`)

### 4. Set Cloudflare Secrets

```bash
# Set your Mailgun API key as a secret
wrangler secret put MG_API_KEY
# Paste your Mailgun private API key when prompted

# Verify the secret was set
wrangler secret list
```

## 🔐 Admin Panel Authentication Setup

The admin panel (`/admin`) uses Cloudflare Access for authentication.

### 1. Enable Cloudflare Access

1. Go to [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
2. Navigate to **Access** → **Applications**
3. Click **Add an Application** → **Self-hosted**

### 2. Configure Application

**Application Configuration:**
- **Application name**: Atlas Divisions Admin
- **Application domain**: `your-domain.com/admin` (or your Workers domain)
- **Application type**: Self-hosted

**Authentication:**
- **Policy name**: Admin Access
- **Action**: Allow
- **Rules**: 
  - **Include**: Email addresses you want to allow
  - Example: `admin@yourdomain.com`

### 3. Test Authentication

1. Deploy your application (see deployment steps below)
2. Visit `https://your-domain.com/admin`
3. You should be redirected to Cloudflare Access login
4. After authentication, you'll see the admin panel

## 🌐 Deployment

### 1. Development Testing

```bash
# Test locally with Wrangler
npm run dev:wrangler

# Or test with Astro dev server
npm run dev
```

### 2. Build and Deploy

```bash
# Build the application
npm run build

# Deploy to Cloudflare Workers
npm run deploy

# Or build and deploy in one command
npm run build:deploy
```

### 3. Staging Deployment (Optional)

```bash
# Deploy to staging environment
npm run deploy:staging
```

The staging environment uses the configuration in `wrangler.toml` under `[env.staging]`.

### 4. Production Deployment

```bash
# Deploy to production
npm run deploy:production
```

## 🌍 Custom Domain Setup

### 1. Add Domain to Cloudflare

1. Add your domain to Cloudflare (if not already added)
2. Update nameservers to Cloudflare's
3. Wait for DNS propagation

### 2. Configure Routes in wrangler.toml

Uncomment and update the routes section in `wrangler.toml`:

```toml
[[env.production.routes]]
pattern = "yourdomain.com/*"
zone_name = "yourdomain.com"

[[env.production.routes]]
pattern = "www.yourdomain.com/*"
zone_name = "yourdomain.com"
```

### 3. Deploy with Custom Domain

```bash
# Deploy with custom domain routing
npm run deploy:production
```

### 4. SSL Certificate

Cloudflare automatically provisions SSL certificates for your domain. Verify SSL is working by visiting `https://yourdomain.com`.

## 📊 Monitoring & Logs

### 1. View Deployment Logs

```bash
# View real-time logs
npm run tail

# Or use wrangler directly
wrangler tail
```

### 2. Cloudflare Analytics

1. Go to Cloudflare Dashboard → Your Domain → Analytics
2. View Workers analytics under **Workers** tab
3. Monitor performance, requests, and errors

### 3. Email Delivery Monitoring

1. Go to Mailgun Dashboard → Logs
2. Monitor email delivery, bounces, and complaints
3. Set up webhooks for real-time notifications

## 🐛 Troubleshooting

### Common Issues

**1. Database Connection Errors**
```bash
# Verify database binding
wrangler d1 execute atlas-divisions-contacts --command="SELECT 1;" --remote

# Check wrangler.toml database configuration
```

**2. Email Not Sending**
```bash
# Check Mailgun API key
wrangler secret list

# Verify domain setup in Mailgun dashboard
# Check DNS records are properly configured
```

**3. Admin Panel Access Denied**
- Verify Cloudflare Access application is configured
- Check email is added to Access policy
- Clear browser cache and cookies

**4. Build Failures**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run build
```

**5. CORS Errors**
- Verify middleware.ts is properly configured
- Check request origins in browser dev tools

### Environment-Specific Issues

**Development:**
```bash
# Test with local Wrangler
wrangler dev --local

# Check environment variables
wrangler secret list
```

**Production:**
```bash
# Verify deployment
wrangler deployments list

# Check production logs
wrangler tail --env production
```

## 🔧 Environment Variables Reference

### Required Variables (in wrangler.toml)
- `ENVIRONMENT`: "production" or "staging"
- `ADMIN_EMAIL`: Email for contact form notifications
- `MG_DOMAIN`: Your verified Mailgun domain
- `FROM_EMAIL_NAME`: Sender name for emails

### Required Secrets (via wrangler secret)
- `MG_API_KEY`: Mailgun private API key

### Optional Variables
- Custom variables can be added in the `[vars]` section

## 📋 Security Checklist

### Before Going Live

- [ ] **Email Configuration**
  - [ ] Mailgun domain verified
  - [ ] DNS records properly configured
  - [ ] Test emails sending successfully

- [ ] **Database Security**
  - [ ] D1 database created and schema deployed
  - [ ] Database binding configured correctly
  - [ ] Test contact form submissions

- [ ] **Admin Panel Security**
  - [ ] Cloudflare Access configured
  - [ ] Admin email addresses added to policy
  - [ ] Test admin authentication flow

- [ ] **Application Security**
  - [ ] Environment secrets properly set
  - [ ] Rate limiting tested
  - [ ] CSP headers configured
  - [ ] CORS policies verified

- [ ] **Performance**
  - [ ] Custom domain configured (if applicable)
  - [ ] SSL certificate active
  - [ ] CDN caching working
  - [ ] Performance metrics acceptable

### Post-Deployment

1. **Test all functionality:**
   - Contact form submission
   - Email delivery
   - Admin panel access
   - Mobile responsiveness

2. **Monitor for 24-48 hours:**
   - Check error logs
   - Monitor email delivery rates
   - Verify performance metrics

3. **Set up alerting:**
   - Mailgun webhook notifications
   - Cloudflare error rate alerts
   - Performance degradation monitoring

## 🎯 Next Steps

After successful deployment:

1. **Set up monitoring dashboards**
2. **Configure backup procedures**
3. **Document any custom modifications**
4. **Set up regular security reviews**
5. **Plan for scaling if needed**

## 📞 Support

If you encounter issues during deployment:

1. Check the troubleshooting section above
2. Review Cloudflare Workers and Mailgun documentation
3. Contact support for your respective services
4. Check the GitHub repository for updates

---

**Atlas Divisions** - *Mapping Chaos. Building Resilience.*
// Define APIRoute locally to avoid import issues while maintaining proper typing
type APIRoute = (context: { request: Request; locals: any; clientAddress: string }) => Response | Promise<Response>;
import escapeHtml from 'escape-html';

// Simple in-memory rate limiter (for production, use Redis or similar)
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string, maxRequests: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  
  // Clean old entries
  for (const [key, value] of rateLimiter.entries()) {
    if (value.resetTime < now) {
      rateLimiter.delete(key);
    }
  }
  
  const current = rateLimiter.get(ip);
  
  if (!current) {
    rateLimiter.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }
  
  if (current.resetTime < now) {
    rateLimiter.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }
  
  if (current.count >= maxRequests) {
    return true;
  }
  
  current.count++;
  return false;
}

// CORS preflight handler
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
};

// Only allow POST requests - other methods will automatically get 405 Method Not Allowed
export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID().substring(0, 8);
  const clientIP = clientAddress || request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
  
  console.log(`[${requestId}] Contact form request from ${clientIP}`);
  
  try {
    // Rate limiting
    if (isRateLimited(clientIP)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          error: 'Too many requests. Please wait a minute before trying again.',
          retryAfter: 60
        }),
        { 
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': '60',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Parse request body
    let body: any;
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      body = await request.json();
    } else if (contentType?.includes('application/x-www-form-urlencoded') || contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid content type. Expected application/json, application/x-www-form-urlencoded, or multipart/form-data'
        }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
    // Extract and validate required fields
    const rawName = body.name as string;
    const rawEmail = body.email as string;
    const rawMessage = body.message as string;
    const rawPhone = body.phone as string;
    const rawServiceType = body.service_type as string;

    // Validation errors array
    const errors: string[] = [];
    
    // Validate required fields: name, email, message
    if (!rawName || typeof rawName !== 'string' || rawName.trim().length < 2) {
      errors.push('Name is required and must be at least 2 characters long');
    }
    
    if (rawName && rawName.trim().length > 100) {
      errors.push('Name must be less than 100 characters');
    }
    
    if (!rawEmail || typeof rawEmail !== 'string' || !rawEmail.trim()) {
      errors.push('Email is required');
    }
    
    if (!rawMessage || typeof rawMessage !== 'string' || rawMessage.trim().length < 10) {
      errors.push('Message is required and must be at least 10 characters long');
    }
    
    if (rawMessage && rawMessage.trim().length > 2000) {
      errors.push('Message must be less than 2000 characters');
    }

    // Email validation (required field)
    if (rawEmail && rawEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rawEmail.trim()) || rawEmail.trim().length > 254) {
        errors.push('Please provide a valid email address');
      }
    }
    
    // Phone validation (optional field)
    if (rawPhone && rawPhone.trim()) {
      const phoneRegex = /^[\+]?[\s\-\(\)]*([0-9][\s\-\(\)]*){10,14}$/;
      if (!phoneRegex.test(rawPhone.trim())) {
        errors.push('Please provide a valid phone number');
      }
    }

    // Service type validation
    const validServiceTypes = [
      'Auto & Home Systems Repair',
      'Logistics & Adaptive Operations', 
      'AI Tools & Digital Infrastructure',
      'Emergency & Crisis Response',
      'General Inquiry',
      'Partnership Opportunity'
    ];
    
    const trimmedServiceType = rawServiceType?.trim() || '';
    if (!trimmedServiceType) {
      errors.push('Service type is required');
    } else if (!validServiceTypes.includes(trimmedServiceType)) {
      errors.push('Invalid service type selected');
    }
    
    // Return validation errors
    if (errors.length > 0) {
      console.warn(`[${requestId}] Validation errors:`, errors);
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed',
          details: errors
        }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Sanitize all user inputs with escape-html
    const name = escapeHtml(rawName.trim());
    const email = escapeHtml(rawEmail.trim());
    const message = escapeHtml(rawMessage.trim());
    const phone = rawPhone ? escapeHtml(rawPhone.trim()) : '';
    const service_type = trimmedServiceType; // Already validated against whitelist

    // Check for required environment variables
    const env = locals.runtime?.env;
    const mgApiKey = env?.MG_API_KEY;
    const mgDomain = env?.MG_DOMAIN;
    const fromEmailName = env?.FROM_EMAIL_NAME || 'contact';
    const adminEmail = env?.ADMIN_EMAIL || 'harley@atlasdivisions.com';

    // Create submission record
    const submission = {
      id: crypto.randomUUID(),
      name: name,
      email: email,
      phone: phone || null,
      service_type: service_type,
      message: message,
      status: 'new',
      timestamp: new Date().toISOString()
    };

    // Save to database if available
    if (env?.DB) {
      try {
        await env.DB.prepare(`
          INSERT INTO submissions (id, name, email, phone, service_type, message, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          submission.id, submission.name, submission.email, submission.phone,
          submission.service_type, submission.message, submission.status, submission.timestamp
        ).run();
        console.log(`[${requestId}] Submission saved to database: ${submission.id}`);
      } catch (dbError) {
        console.error(`[${requestId}] Database save error:`, dbError);
        // Don't fail the request if database save fails
      }
    }

    // Send email notification if Mailgun is configured
    console.log(`[${requestId}] Email config check - Domain: ${mgDomain}, Admin: ${adminEmail}, API Key: ${mgApiKey ? 'SET' : 'NOT_SET'}`);
    
    if (mgApiKey && mgDomain && adminEmail) {
      try {
        const subject = `Atlas Divisions Contact: ${service_type} - ${name}`;
        const text = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 New Atlas Divisions Contact Form Submission
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 Customer: ${name}
📧 Email: ${email}
📱 Phone: ${phone || 'Not provided'}
🔧 Service: ${service_type}

💬 Message:
${message}

🕒 Submitted: ${new Date(submission.timestamp).toLocaleString()}
🌐 Environment: ${env?.ENVIRONMENT || 'production'}
📝 Submission ID: ${submission.id}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Solutions That Outlast the Storm - Reply directly to contact the customer.
        `.trim();
        
        // Construct from email using FROM_EMAIL_NAME + MG_DOMAIN
        const fromEmail = `${fromEmailName}@${mgDomain}`;
        
        const params = new URLSearchParams({
          from: `Atlas Divisions Contact System <${fromEmail}>`,
          to: adminEmail,
          subject: subject,
          text: text
        });
        
        const response = await fetch(`https://api.mailgun.net/v3/${mgDomain}/messages`, {
          method: 'POST',
          headers: {
            Authorization: 'Basic ' + btoa(`api:${mgApiKey}`),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[${requestId}] Email failed: ${response.status} ${response.statusText}`);
          console.error(`[${requestId}] Mailgun domain: ${mgDomain}`);
          console.error(`[${requestId}] From email: ${fromEmail}`);
          console.error(`[${requestId}] Error details: ${errorText}`);
        } else {
          console.log(`[${requestId}] Email notification sent successfully for submission ${submission.id}`);
        }
      } catch (emailError) {
        console.error(`[${requestId}] Mailgun email error:`, emailError);
        // Don't fail the request if email fails
      }
    } else {
      console.log(`[${requestId}] MG_API_KEY, MG_DOMAIN, or ADMIN_EMAIL not configured, skipping notification`);
    }

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Contact form submission successful (${duration}ms) - Service: ${service_type}`);
    
    return new Response(
      JSON.stringify({ 
        message: 'Thank you for your submission! We\'ll get back to you within 24 hours.',
        success: true
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] Contact form error (${duration}ms):`, error);
    
    return new Response(
      JSON.stringify({ 
        error: 'An internal server error occurred. Please try again later or email harley@atlasdivisions.com directly.',
        fallbackEmail: 'harley@atlasdivisions.com'
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
};
import type { APIRoute } from 'astro';
import escapeHtml from 'escape-html';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const service_type = formData.get('service_type') as string;
    const message = formData.get('message') as string;

    // Basic validation
    if (!name || !service_type || !message) {
      return new Response(
        JSON.stringify({ error: 'Name, service type, and message are required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Email validation (only if provided)
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Check for required environment variables
    const env = locals.runtime.env;
    const mgApiKey = env.MG_API_KEY;
    const mgDomain = env.MG_DOMAIN;
    const fromEmailName = env.FROM_EMAIL_NAME || 'contact';
    const adminEmail = env.ADMIN_EMAIL || 'harley@atlasdivisions.com';

    // Create submission record
    const submission = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email ? email.trim() : null,
      phone: phone ? phone.trim() : null,
      service_type: service_type.trim(),
      message: message.trim(),
      status: 'new',
      timestamp: new Date().toISOString()
    };

    // Save to database if available
    if (env.DB) {
      try {
        await env.DB.prepare(`
          INSERT INTO submissions (id, name, email, phone, service_type, message, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          submission.id, submission.name, submission.email, submission.phone,
          submission.service_type, submission.message, submission.status, submission.timestamp
        ).run();
        console.log('Submission saved to database:', submission.id);
      } catch (dbError) {
        console.error('Database save error:', dbError);
        // Don't fail the request if database save fails
      }
    }

    // Send email notification if Mailgun is configured
    if (mgApiKey && mgDomain && adminEmail) {
      try {
        const subject = `Atlas Divisions Contact: ${service_type} - ${name}`;
        const text = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 New Atlas Divisions Contact Form Submission
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 Customer: ${name}
📧 Email: ${email || 'Not provided'}
📱 Phone: ${phone || 'Not provided'}
🔧 Service: ${service_type}

💬 Message:
${message}

🕒 Submitted: ${new Date(submission.timestamp).toLocaleString()}
🌐 Environment: ${env.ENVIRONMENT || 'production'}
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
          console.error(`❌ Email failed: ${response.status} ${response.statusText} - ${errorText}`);
        } else {
          console.log(`✅ Email notification sent successfully for submission ${submission.id}`);
        }
      } catch (emailError) {
        console.error('Mailgun email error:', emailError);
        // Don't fail the request if email fails
      }
    } else {
      console.log('❌ MG_API_KEY, MG_DOMAIN, or ADMIN_EMAIL not configured, skipping notification');
    }

    return new Response(
      JSON.stringify({ 
        message: 'Thank you for your submission! We\'ll get back to you within 24 hours.',
        success: true
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred. Please email harley@atlasdivisions.com directly.',
        fallbackEmail: 'harley@atlasdivisions.com'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
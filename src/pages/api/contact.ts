import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import escapeHtml from 'escape-html';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const problemDescription = formData.get('problemDescription') as string;

    // Basic validation
    if (!name || !email || !problemDescription) {
      return new Response(
        JSON.stringify({ error: 'All fields are required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Email validation
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

    // Check for required environment variables
    const env = locals.runtime.env;
    const resendApiKey = env.RESEND_API_KEY;
    const fromEmail = env.FROM_EMAIL || 'contact@atlasdivisions.com';
    const toEmail = env.TO_EMAIL || 'harley@atlasdivisions.com';

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured. Please email harley@atlasdivisions.com directly.' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Resend
    const resend = new Resend(resendApiKey);

    // Prepare email data
    const emailData = {
      from: fromEmail,
      to: toEmail,
      subject: `Atlas Divisions Contact: ${escapeHtml(name)}`,
      html: `
        <h2>New Contact Form Submission - Atlas Divisions</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Problem Description:</strong></p>
        <p>${escapeHtml(problemDescription).replace(/\n/g, '<br>')}</p>
        <hr>
        <p><em>Submitted at: ${new Date().toISOString()}</em></p>
      `,
    };

    console.log('Sending email to:', toEmail, 'from:', fromEmail);

    // Send email via Resend
    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error('Resend API error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send email. Please email harley@atlasdivisions.com directly.',
          fallbackEmail: 'harley@atlasdivisions.com'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Email sent successfully:', data);

    return new Response(
      JSON.stringify({ 
        message: 'Thank you for your submission! We\'ll get back to you soon.',
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
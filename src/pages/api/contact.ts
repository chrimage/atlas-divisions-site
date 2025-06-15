import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
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

    // In a real implementation, this would send an email
    // For now, we'll just log the submission and return success
    console.log('Contact form submission:', {
      name: name.trim(),
      email: email.trim(),
      problemDescription: problemDescription.trim(),
      timestamp: new Date().toISOString()
    });

    // TODO: Integrate with email service (Zoho Mail, SendGrid, etc.)
    // This could be done via:
    // 1. SMTP with nodemailer
    // 2. Email service API (SendGrid, Resend, etc.)
    // 3. Cloudflare Workers with email forwarding

    return new Response(
      JSON.stringify({ message: 'Submission successful' }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
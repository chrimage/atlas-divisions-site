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

    // Send email using MailChannels (works with Cloudflare Workers)
    await sendEmailViaMailChannels({
      name: name.trim(),
      email: email.trim(),
      problemDescription: problemDescription.trim()
    });

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
      JSON.stringify({ error: 'Failed to send message. Please try the email link.' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

async function sendEmailViaMailChannels({ name, email, problemDescription }: {
  name: string;
  email: string;
  problemDescription: string;
}) {
  const emailPayload = {
    personalizations: [
      {
        to: [{ email: 'harley@atlasdivisions.com', name: 'Harley Miller' }],
        dkim_domain: 'atlasdivisions.com',
        dkim_selector: 'mailchannels',
        dkim_private_key: process.env.DKIM_PRIVATE_KEY || ''
      }
    ],
    from: {
      email: 'noreply@atlasdivisions.com',
      name: 'Atlas Divisions Contact Form'
    },
    reply_to: {
      email: email,
      name: name
    },
    subject: `New Contact Form Submission from ${name}`,
    content: [
      {
        type: 'text/html',
        value: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Problem Description:</strong></p>
          <p>${problemDescription.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><small>Submitted at: ${new Date().toISOString()}</small></p>
        `
      },
      {
        type: 'text/plain',
        value: `
New Contact Form Submission

Name: ${name}
Email: ${email}
Problem Description: ${problemDescription}

Submitted at: ${new Date().toISOString()}
        `
      }
    ]
  };

  const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(emailPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MailChannels API error: ${response.status} - ${errorText}`);
  }
}
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

    // Log the submission (for now, until we set up a proper email service)
    console.log('Contact form submission:', {
      name: name.trim(),
      email: email.trim(),
      problemDescription: problemDescription.trim(),
      timestamp: new Date().toISOString()
    });

    // For now, we'll just return success and suggest the direct email
    return new Response(
      JSON.stringify({ 
        message: 'Thank you for your submission! For fastest response, please also email harley@atlasdivisions.com directly.',
        fallbackEmail: 'harley@atlasdivisions.com'
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(
      JSON.stringify({ error: 'Please email harley@atlasdivisions.com directly.' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
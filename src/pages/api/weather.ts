export async function GET({ request }) {
  // Astro v3+ API routes: use import.meta.env for env vars, no APIRoute type needed

  // Get the OWM API key from environment variables
  const apiKey = import.meta.env.OWM_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing OWM API key' }), { status: 500 });
  }

  // Proxy query params to OWM (e.g., ?layer=clouds_new&z=1)
  const url = new URL(request.url);
  const layer = url.searchParams.get('layer') || 'clouds_new';
  const z = url.searchParams.get('z') || '1';

  // Only allow safe layers and zooms
  const allowedLayers = ['clouds_new', 'precipitation_new', 'pressure_new', 'wind_new', 'temp_new'];
  if (!allowedLayers.includes(layer)) {
    return new Response(JSON.stringify({ error: 'Invalid layer' }), { status: 400 });
  }

  // Build OWM tile URLs for 2x2 grid (x=0,1; y=0,1)
  const tileUrls = [];
  for (let x = 0; x < 2; x++) {
    for (let y = 0; y < 2; y++) {
      tileUrls.push(
        `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${apiKey}`
      );
    }
  }

  // Fetch all tiles in parallel and return as base64 PNGs
  const tiles = await Promise.all(
    tileUrls.map(async (tileUrl) => {
      const res = await fetch(tileUrl);
      if (!res.ok) return null;
      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return `data:image/png;base64,${base64}`;
    })
  );

  return new Response(JSON.stringify({ tiles }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

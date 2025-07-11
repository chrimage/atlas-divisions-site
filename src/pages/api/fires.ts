const FIRMS_MAP_KEY = "9ab63c2318fa29d820a146d694f69181";

// Try MODIS_NRT and a 3-day range for more data
const FIRMS_URL = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${FIRMS_MAP_KEY}/MODIS_NRT/-180,-90,180,90/3`;

function parseFIRMSCSV(csv: string) {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');
  const features = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    if (row.length < headers.length) continue;
    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    // Required fields: latitude, longitude, confidence
    if (!obj.latitude || !obj.longitude) continue;
    features.push({
      lat: parseFloat(obj.latitude),
      lon: parseFloat(obj.longitude),
      confidence: obj.confidence,
      brightness: obj.brightness || obj.brightness_ti4 || obj.brightness_ti5,
      acq_date: obj.acq_date,
      acq_time: obj.acq_time,
      satellite: obj.satellite,
      instrument: obj.instrument,
      daynight: obj.daynight,
      ...obj
    });
  }
  return features;
}

export async function GET() {
  try {
    const res = await fetch(FIRMS_URL, {
      headers: {
        "Accept": "text/csv",
        "User-Agent": "Mozilla/5.0 (compatible; AtlasGlobe/1.0; +https://atlasdivisions.com)"
      }
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch FIRMS data" }), { status: 502 });
    }
    const csv = await res.text();
    // Parse CSV to array of fire points
    const fires = parseFIRMSCSV(csv);
    return new Response(JSON.stringify({ fires }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "FIRMS proxy error", details: String(err) }), { status: 500 });
  }
}

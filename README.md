# Atlas Divisions Globe - Weather & Fire Visualization

## Features

- **Interactive 3D Globe** using Three.js
- **City Lights**: 47,000+ cities with population-based scaling
- **Cloud Overlay**: Real-time global clouds from OpenWeatherMap (OWM)
- **Weather Proxy API**: `/api/weather` securely proxies OWM tile requests (API key hidden in `.env`)
- **Fire Mapping**: Global fire/hotspot visualization using NASA FIRMS (MODIS_NRT, 3-day range)
- **Fire Proxy API**: `/api/fires` fetches and parses NASA FIRMS CSV, returns JSON for globe
- **Accessibility**: Reduced motion support, screen reader labels
- **Performance**: Dynamic imports, optimized loading, and error fallback (emoji globe)
- **Security**: All API keys are stored in `.env` and never exposed to the client or git

## How it works

- **Globe**: `src/globe.js` contains the `AtlasGlobe` class with all rendering and overlay logic.
- **Weather API**: `src/pages/api/weather.ts` proxies OWM tile requests, returning base64 PNGs.
- **Fire API**: `src/pages/api/fires.ts` fetches NASA FIRMS CSV, parses to JSON, and returns fire points.
- **Client**: `src/components/Globe.astro` and `Globe.client.js` handle dynamic loading and UI.

## API Keys & Security

- **OpenWeatherMap API key** is stored in `.env`:
  ```
  OWM_API_KEY=your_key_here
  ```
- **NASA FIRMS MAP_KEY** is hardcoded in the server API route, but never sent to the client.
- **.env is git-ignored** (see `.gitignore`):
  ```
  .env
  ```

## Deployment Checklist

- [x] `.env` is present and contains OWM_API_KEY
- [x] `.env` is listed in `.gitignore`
- [x] No API keys are present in committed code or client JS
- [x] All API requests for weather and fire data are proxied through secure server routes

## Commit & Push

1. **Stage all changes:**
   ```
   git add .
   ```
2. **Commit with a clear message:**
   ```
   git commit -m "Add secure weather and fire mapping APIs, globe overlays, and docs"
   ```
3. **Push to your remote:**
   ```
   git push origin main
   ```
   (or your branch name)

---

**Everything is now working: globe, clouds, city lights, and global fire mapping!**

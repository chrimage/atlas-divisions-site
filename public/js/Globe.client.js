/**
 * Standalone Globe Loader using CDN Three.js from cdnjs.cloudflare.com for CSP compatibility.
 * Loads Three.js from CDN and your globe logic, guaranteed to run in browser.
 */

// Import Three.js from CDNJS (ESM build)
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.178.0/three.module.min.js";

// Attach THREE to window for compatibility with globe.js
window.THREE = THREE;

// Import your globe logic (must be compatible with window.THREE)
import "/src/globe.js";

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('globe-canvas');
  if (!container) {
    console.error('[GlobeLoader-CDN] #globe-canvas not found');
    return;
  }

  // Globe config (customize as needed)
  const mode = document.querySelector('.globe-container')?.classList.contains('fullscreen') ? 'fullscreen' : 'standard';
  const globeConfig = {
    container: '#globe-canvas',
    mode: mode,
    colors: {
      ocean: '#001122',
      land: '#d4af37',
      stroke: '#cd7f32',
      atmosphere: 0xd4af37,
      light: 0xd4af37
    },
    animation: {
      autoRotationSpeed: 0.005,
      friction: 0.95,
      rotationSpeed: 0.008
    },
    features: {
      cityLights: true,
      atmosphere: true,
      dragControls: true
    }
  };

  // Create and initialize the globe
  if (window.AtlasGlobe) {
    const globe = new window.AtlasGlobe(globeConfig);
    globe.setThreeJS(window.THREE);
    globe.init();
    console.log('[GlobeLoader-CDN] Globe initialized with CDNJS Three.js');
  } else {
    console.error('[GlobeLoader-CDN] window.AtlasGlobe not found. Make sure /src/globe.js attaches AtlasGlobe to window.');
  }
});

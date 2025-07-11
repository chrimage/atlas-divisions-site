/**
 * Client-side loader for AtlasGlobe in Astro.
 * This script is imported in Globe.astro frontmatter and only runs in the browser.
 * Uses npm 'three' and Vite/Astro bundling for maximum modularity and CSP compatibility.
 */
import * as THREE from 'three';
import AtlasGlobe from '../globe.js';

if (typeof window !== "undefined" && typeof document !== "undefined") {
  let atlasGlobe = null;
  let isInitializing = false;

  function updateGlobeLoading(stepIdx) {
    console.log('[GlobeLoader] Loading step:', stepIdx);
  }

  async function initializeGlobe() {
    console.log('[GlobeLoader] initializeGlobe called');
    if (isInitializing || atlasGlobe) {
      console.log('[GlobeLoader] Already initializing or initialized');
      return;
    }
    const container = document.getElementById('globe-canvas');
    if (!container) {
      console.log('[GlobeLoader] #globe-canvas not found');
      return;
    }
    isInitializing = true;
    updateGlobeLoading(0);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      container.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#d4af37;font-size:8rem;">🌍</div>';
      isInitializing = false;
      return;
    }

    setTimeout(async () => {
      try {
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

        atlasGlobe = new AtlasGlobe(globeConfig);
        atlasGlobe.setThreeJS(THREE);
        await atlasGlobe.init(updateGlobeLoading);

        console.log('[GlobeLoader] Enhanced Atlas Globe initialized successfully');
        isInitializing = false;
      } catch (error) {
        console.error('[GlobeLoader] Atlas Globe initialization failed:', error);
        const container = document.getElementById('globe-canvas');
        if (container) {
          container.innerHTML = `
            <div class="globe-error">
              <div class="error-icon">🌍</div>
              <p>Globe unavailable</p>
            </div>
          `;
        }
        isInitializing = false;
      }
    }, 100);
  }

  document.addEventListener('DOMContentLoaded', initializeGlobe);
  document.addEventListener('astro:page-load', initializeGlobe);
  document.addEventListener('astro:before-preparation', () => {
    if (atlasGlobe && atlasGlobe.dispose) {
      atlasGlobe.dispose();
      atlasGlobe = null;
    }
    isInitializing = false;
  });
}

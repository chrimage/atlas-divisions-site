/**
 * AtlasGlobe - Interactive 3D Globe with Three.js
 * 
 * A standalone class for creating an interactive 3D globe with city lights,
 * drag controls, momentum physics, atmospheric effects, and fire mapping.
 * 
 * Dependencies:
 * - Three.js (dynamically imported)
 * - GeoJSON world data (from external API)
 * - world-cities.csv (for city light positioning)
 * 
 * @author Atlas Divisions
 * @version 1.0.0
 */

let THREE = null;

/**
 * Configuration object for AtlasGlobe
 * @typedef {Object} AtlasGlobeConfig
 * @property {string|HTMLElement} container - Container element selector or HTMLElement
 * @property {string} mode - Display mode ('standard' or 'fullscreen')
 * @property {Object} colors - Color configuration
 * @property {string} colors.ocean - Ocean color (hex)
 * @property {string} colors.land - Land color (hex)
 * @property {string} colors.stroke - Stroke color (hex)
 * @property {number} colors.atmosphere - Atmosphere color (hex number)
 * @property {number} colors.light - Light color (hex number)
 * @property {Object} animation - Animation settings
 * @property {number} animation.autoRotationSpeed - Auto rotation speed
 * @property {number} animation.friction - Friction coefficient for momentum
 * @property {number} animation.rotationSpeed - Manual rotation speed
 * @property {Object} features - Feature toggles
 * @property {boolean} features.cityLights - Enable city lights
 * @property {boolean} features.atmosphere - Enable atmospheric effects
 * @property {boolean} features.dragControls - Enable drag controls
 */

export class AtlasGlobe {
  /**
   * @param {AtlasGlobeConfig} config - Configuration object
   */
  constructor(config = {}) {
    // Scene objects
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.globeMesh = null;
    this.cityLightsGroup = null;
    this.firesGroup = null;
    
    // Interaction properties
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.rotationVelocity = { x: 0, y: 0 };
    
    // Configuration with defaults
    this.config = this.mergeConfig(config);
    
    // Container element
    this.container = this.resolveContainer(this.config.container);
    
    // Mode configuration
    this.mode = this.config.mode || 'standard';
    
    // Animation properties
    this.autoRotationSpeed = this.config.animation.autoRotationSpeed;
    this.friction = this.config.animation.friction;
    this.rotationSpeed = this.config.animation.rotationSpeed;
    
    // Color configuration
    this.atlasColors = this.config.colors;
    
    // Feature flags
    this.features = this.config.features;
    
    // Size configuration based on mode
    this.sizeConfig = this.getSizeConfig();
  }
  
  mergeConfig(userConfig) {
    const defaults = {
      container: '#globe-canvas',
      mode: 'standard',
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
    return {
      container: userConfig.container || defaults.container,
      mode: userConfig.mode || defaults.mode,
      colors: { ...defaults.colors, ...userConfig.colors },
      animation: { ...defaults.animation, ...userConfig.animation },
      features: { ...defaults.features, ...userConfig.features }
    };
  }
  
  resolveContainer(container) {
    if (typeof container === 'string') {
      return document.querySelector(container);
    }
    return container instanceof HTMLElement ? container : null;
  }
  
  getSizeConfig() {
    if (this.mode === 'fullscreen') {
      return {
        sphereRadius: 2.5,
        atmosphereRadius: 2.65,
        cameraDistance: 6,
        cityLightSize: {
          base: 0.006,
          multiplier: 0.020
        },
        textureSize: {
          width: 4096,
          height: 2048
        }
      };
    } else {
      return {
        sphereRadius: 2.2,
        atmosphereRadius: 2.35,
        cameraDistance: 5.5,
        cityLightSize: {
          base: 0.006,
          multiplier: 0.018
        },
        textureSize: {
          width: 3072,
          height: 1536
        }
      };
    }
  }
  
  setThreeJS(threeLibrary) {
    THREE = threeLibrary;
  }
  
  async init(onLoadingStep) {
    if (!THREE && typeof window !== 'undefined' && window.THREE) {
      THREE = window.THREE;
    }
    if (!THREE) {
      console.error('Three.js not loaded. Use loadThreeJS() first.');
      return;
    }
    if (!this.container) {
      console.error('Container element not found');
      return;
    }
    try {
      await new Promise(resolve => {
        setTimeout(() => {
          this.createScene();
          resolve();
        }, 100);
      });

      if (onLoadingStep) onLoadingStep(0); // Globe
      await this.createGlobeBaseOnly();
      if (this.features.atmosphere) {
        this.createAtmosphere();
      }
      if (onLoadingStep) onLoadingStep(1); // Clouds
      await this.addOWMCloudOverlay();
      if (onLoadingStep) onLoadingStep(2); // City lights
      await this.addCityLights();
      if (onLoadingStep) onLoadingStep(3); // Fires
      await this.addFIRMSFires();
      if (onLoadingStep) onLoadingStep(4); // Ready

      if (this.features.dragControls) {
        this.setupEventListeners();
      }
      this.animate();
    } catch (error) {
      console.error('Globe initialization failed:', error);
      this.showError();
    }
  }
  
  showError() {
    if (this.container) {
      this.container.innerHTML = `
        <div class="globe-error">
          <div class="error-icon">🌍</div>
          <p>Globe unavailable</p>
        </div>
      `;
    }
  }
  
  createScene() {
    if (!this.container) return;
    const width = this.container.offsetWidth || this.container.clientWidth || 400;
    const height = this.container.offsetHeight || this.container.clientHeight || 400;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000, 0);
    this.container.appendChild(this.renderer.domElement);
    this.camera.position.z = this.sizeConfig.cameraDistance;
    this.setupLighting();
  }
  
  async createGlobeBaseOnly() {
    const geometry = new THREE.SphereGeometry(this.sizeConfig.sphereRadius, 64, 64);
    const texture = await this.createAtlasTexture();
    this.globeGroup = new THREE.Group();
    this.scene.add(this.globeGroup);
    this.globeGroup.rotation.y = Math.PI;
    this.globeGroup.rotation.x = 0.4102;
    this.globeMesh = new THREE.Mesh(geometry, texture ? new THREE.MeshPhongMaterial({
      map: texture,
      transparent: false,
      shininess: 1
    }) : undefined);
    this.globeGroup.add(this.globeMesh);
    this.rotationVelocity.x = 0;
    this.rotationVelocity.y = this.autoRotationSpeed;
  }

  async createGlobe() {
    await this.createGlobeBaseOnly();
    if (this.features.atmosphere) {
      this.createAtmosphere();
    }
    if (this.features.cityLights) {
      await this.addCityLights();
    }
    await this.addOWMCloudOverlay();
    await this.addFIRMSFires();
    this.animate();
  }

  async addOWMCloudOverlay() {
    const layer = "clouds_new";
    const z = 1;
    const tileSize = 256;
    const canvasSize = tileSize * 2;
    const canvas = document.createElement("canvas");
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext("2d");

    const res = await fetch(`/api/weather?layer=${layer}&z=${z}`);
    const data = await res.json();
    if (!data.tiles || !Array.isArray(data.tiles)) {
      console.error("Failed to load OWM tiles from API proxy");
      return;
    }

    let i = 0;
    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 2; y++) {
        const img = new window.Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          ctx.globalAlpha = 1.0;
          ctx.drawImage(img, x * tileSize, y * tileSize, tileSize, tileSize);
        };
        img.src = data.tiles[i++];
      }
    }

    const cloudTexture = new THREE.CanvasTexture(canvas);
    cloudTexture.wrapS = THREE.RepeatWrapping;
    cloudTexture.wrapT = THREE.ClampToEdgeWrapping;

    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 1.0,
      depthWrite: false
    });

    this.cloudMesh = new THREE.Mesh(
      new THREE.SphereGeometry(this.sizeConfig.sphereRadius + 0.01, 64, 64),
      cloudMaterial
    );
    this.globeGroup.add(this.cloudMesh);
  }

  async addFIRMSFires() {
    try {
      const res = await fetch('/api/fires');
      if (!res.ok) {
        console.error('Failed to fetch FIRMS fire data');
        return;
      }
      const data = await res.json();
      if (!data.fires || !Array.isArray(data.fires)) {
        console.error('Invalid FIRMS fire data');
        return;
      }

      // Remove previous fire markers if any
      if (this.firesGroup) {
        this.globeGroup.remove(this.firesGroup);
      }
      this.firesGroup = new THREE.Group();
      this.globeGroup.add(this.firesGroup);

      data.fires.forEach(fire => {
        const lat = fire.lat;
        const lon = fire.lon;
        if (typeof lat !== "number" || typeof lon !== "number") return;
        // Convert lat/lon to 3D position
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (-lon) * (Math.PI / 180);
        const radius = this.sizeConfig.sphereRadius + 0.012;

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);

        // Color/size by confidence
        let color = 0xff4500; // orange-red
        let size = 0.018;
        const conf = (fire.confidence || '').toLowerCase();
        if (conf === 'nominal') color = 0xffa500;
        if (conf === 'low') color = 0xffff00;
        if (conf === 'high') { color = 0xff0000; size = 0.025; }

        const geometry = new THREE.SphereGeometry(size, 8, 8);
        const material = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        this.firesGroup.add(mesh);
      });

      console.log(`FIRMS fires loaded: ${data.fires.length}`);
    } catch (err) {
      console.error('Error loading FIRMS fires:', err);
    }
  }
  
  createAtmosphere() {
    const atmosphereGeometry = new THREE.SphereGeometry(this.sizeConfig.atmosphereRadius, 64, 64);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: this.atlasColors.atmosphere,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    this.scene.add(atmosphere);
  }
  
  setupLighting() {
    const ambientLight = new THREE.AmbientLight(this.atlasColors.light, 0.35);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(this.atlasColors.light, 0.6);
    const sunLon = -120;
    const sunLat = 0;
    const sunPhi = (90 - sunLat) * (Math.PI / 180);
    const sunTheta = (sunLon + 180) * (Math.PI / 180);
    const sunX = 5 * Math.sin(sunPhi) * Math.cos(sunTheta);
    const sunY = 5 * Math.cos(sunPhi);
    const sunZ = 5 * Math.sin(sunPhi) * Math.sin(sunTheta);
    directionalLight.position.set(sunX, sunY, sunZ);
    this.scene.add(directionalLight);
  }
  
  async createAtlasTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = this.sizeConfig.textureSize.width;
    canvas.height = this.sizeConfig.textureSize.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);
    ctx.fillStyle = this.atlasColors.ocean;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    try {
      const response = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
      const geoData = await response.json();
      await this.drawWorldMap(ctx, geoData, canvas.width, canvas.height);
    } catch (error) {
      this.drawFallbackMap(ctx, canvas.width, canvas.height);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }
  
  async drawWorldMap(ctx, geoData, width, height) {
    ctx.fillStyle = this.atlasColors.land;
    ctx.strokeStyle = this.atlasColors.stroke;
    ctx.lineWidth = 1;
    geoData.features.forEach((feature) => {
      if (feature.geometry.type === 'Polygon') {
        this.drawPolygon(ctx, feature.geometry.coordinates, width, height);
      } else if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach((polygon) => {
          this.drawPolygon(ctx, polygon, width, height);
        });
      }
    });
  }
  
  drawPolygon(ctx, coordinates, width, height) {
    coordinates.forEach((ring) => {
      ctx.beginPath();
      ring.forEach((coord, index) => {
        const x = ((coord[0] + 180) / 360) * width;
        const y = ((90 - coord[1]) / 180) * height;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }
  
  drawFallbackMap(ctx, width, height) {
    const continents = [
      { x: 0.2, y: 0.3, w: 0.25, h: 0.4 },
      { x: 0.25, y: 0.5, w: 0.15, h: 0.35 },
      { x: 0.48, y: 0.25, w: 0.12, h: 0.15 },
      { x: 0.5, y: 0.35, w: 0.15, h: 0.4 },
      { x: 0.6, y: 0.2, w: 0.3, h: 0.35 },
      { x: 0.75, y: 0.65, w: 0.12, h: 0.1 }
    ];
    ctx.fillStyle = this.atlasColors.land;
    continents.forEach(continent => {
      ctx.fillRect(
        continent.x * width,
        continent.y * height,
        continent.w * width,
        continent.h * height
      );
    });
  }
  
  async addCityLights() {
    try {
      const csvRes = await fetch('/js/world-cities.csv');
      if (!csvRes.ok) return;
      const csvText = await csvRes.text();
      const lines = csvText.split('\n').slice(1);
      this.cityLightsGroup = new THREE.Group();
      this.globeGroup.add(this.cityLightsGroup);
      const allCities = [];
      lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length < 10) return;
        const lat = parseFloat(parts[2].replace(/"/g, ''));
        const lon = parseFloat(parts[3].replace(/"/g, ''));
        const population = parseInt(parts[9].replace(/"/g, ''), 10);
        const country = parts[4].replace(/"/g, '');
        if (isNaN(lat) || isNaN(lon) || isNaN(population) || population < 1000) return;
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (-lon) * (Math.PI / 180);
        const radius = this.sizeConfig.sphereRadius - 0.01;
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        const minPop = 1000;
        const maxPop = 38000000;
        const popNormalized = Math.min(1, Math.max(0, (Math.log10(population) - Math.log10(minPop)) / (Math.log10(maxPop) - Math.log10(minPop))));
        const minIntensity = 0.15;
        const minSize = 0.002;
        const size = minSize + popNormalized * this.sizeConfig.cityLightSize.multiplier;
        const intensity = Math.max(minIntensity, 0.15 + popNormalized * 0.45);
        let lightColor = 0xffffff;
        if (country === 'China' || country === 'India') {
          lightColor = 0xfff8e1;
        } else if (country === 'United States' || country === 'United Kingdom' || country === 'Japan') {
          lightColor = 0xf0f8ff;
        } else if (country === 'Nigeria' || country === 'Pakistan' || country === 'Bangladesh') {
          lightColor = 0xffa500;
        } else if (country === 'Brazil' || country === 'Argentina' || country === 'Chile') {
          lightColor = 0xfff5dc;
        }
        allCities.push({ x, y, z, population, color: lightColor, name: parts[0], size, intensity });
      });
      this.createIndividualCityLights(allCities);
      console.log(`City lights optimized: ${allCities.length} cities with population-based scaling`);
    } catch (err) {
      console.error('Failed to add city lights:', err);
    }
  }
  
  createIndividualCityLights(cities) {
    if (cities.length === 0) return;
    cities.forEach(city => {
      const geometry = new THREE.SphereGeometry(city.size, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: city.intensity,
        blending: THREE.AdditiveBlending,
        color: city.color
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(city.x, city.y, city.z);
      this.cityLightsGroup.add(mesh);
    });
  }
  
  setupEventListeners() {
    if (!this.container) return;
    this.container.style.cursor = 'grab';
    this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.container.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.container.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    this.container.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.container.addEventListener('touchmove', this.onTouchMove.bind(this));
    this.container.addEventListener('touchend', this.onTouchEnd.bind(this));
    window.addEventListener('resize', this.onWindowResize.bind(this));
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === this.container) {
            this.onWindowResize();
          }
        }
      });
      resizeObserver.observe(this.container);
    }
  }
  
  onMouseDown(event) {
    this.startDragging(event.clientX, event.clientY);
    if (this.container) this.container.style.cursor = 'grabbing';
  }
  onMouseMove(event) {
    if (this.isDragging) {
      this.updateRotation(event.clientX, event.clientY);
    }
  }
  onMouseUp() {
    this.stopDragging();
    if (this.container) this.container.style.cursor = 'grab';
  }
  onMouseLeave() {
    this.stopDragging();
    if (this.container) this.container.style.cursor = 'grab';
  }
  onTouchStart(event) {
    event.preventDefault();
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.startDragging(touch.clientX, touch.clientY);
    }
  }
  onTouchMove(event) {
    event.preventDefault();
    if (this.isDragging && event.touches.length === 1) {
      const touch = event.touches[0];
      this.updateRotation(touch.clientX, touch.clientY);
    }
  }
  onTouchEnd(event) {
    event.preventDefault();
    this.stopDragging();
  }
  startDragging(clientX, clientY) {
    this.isDragging = true;
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    this.previousMousePosition = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }
  updateRotation(clientX, clientY) {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    const currentMousePosition = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
    const deltaX = currentMousePosition.x - this.previousMousePosition.x;
    this.rotationVelocity.x = 0;
    this.rotationVelocity.y = deltaX * this.rotationSpeed;
    this.previousMousePosition = currentMousePosition;
  }
  stopDragging() {
    this.isDragging = false;
  }
  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.offsetWidth || this.container.clientWidth;
    const height = this.container.offsetHeight || this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    if (this.globeGroup) {
      if (this.isDragging) {
        this.globeGroup.rotation.y += this.rotationVelocity.y;
      } else {
        this.rotationVelocity.y *= this.friction;
        if (Math.abs(this.rotationVelocity.y) > 0.001) {
          this.globeGroup.rotation.y += this.rotationVelocity.y;
        } else {
          this.rotationVelocity.y = 0;
          this.globeGroup.rotation.y += this.autoRotationSpeed;
        }
      }
    }
    this.renderer.render(this.scene, this.camera);
    this.renderer.render(this.scene, this.camera);
  }
  rotateGlobeByPhoenix(dx, dy) {
    if (!this.globeGroup) return;
    const sensitivity = 0.005;
    this.globeGroup.rotation.y += dx * sensitivity;
  }
  snapBackGlobeOrientation() {
    if (!this.globeGroup) return;
    const targetY = this.globeGroup.rotation.y;
    const startY = this.globeGroup.rotation.y;
    const duration = 0.7;
    const startTime = performance.now();
    const animateSnap = (now) => {
      const t = Math.min(1, (now - startTime) / (duration * 1000));
      const ease = 1 - Math.pow(1 - t, 3);
      this.globeGroup.rotation.x = 0.4102;
      this.globeGroup.rotation.y = startY + (targetY - startY) * ease;
      if (t < 1) {
        requestAnimationFrame(animateSnap);
      }
    };
    requestAnimationFrame(animateSnap);
  }
  dispose() {
    if (this.renderer) {
      this.renderer.dispose();
      if (this.container && this.renderer.domElement) {
        this.container.removeChild(this.renderer.domElement);
      }
    }
    if (this.scene) {
      this.scene.clear();
    }
    if (this.container && this.features.dragControls) {
      this.container.removeEventListener('mousedown', this.onMouseDown);
      this.container.removeEventListener('mousemove', this.onMouseMove);
      this.container.removeEventListener('mouseup', this.onMouseUp);
      this.container.removeEventListener('mouseleave', this.onMouseLeave);
      this.container.removeEventListener('touchstart', this.onTouchStart);
      this.container.removeEventListener('touchmove', this.onTouchMove);
      this.container.removeEventListener('touchend', this.onTouchEnd);
    }
  }
}

// Export AtlasGlobe as default for compatibility with dynamic import
export default AtlasGlobe;

// Export THREE for external use (after loading)
export { THREE };

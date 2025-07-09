/**
 * AtlasGlobe - Interactive 3D Globe with Three.js
 * 
 * A standalone class for creating an interactive 3D globe with city lights,
 * drag controls, momentum physics, and atmospheric effects.
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

/**
 * AtlasGlobe Class
 * 
 * Creates and manages an interactive 3D globe with Three.js
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
    
    // Don't auto-initialize - wait for explicit init() call
    // This ensures THREE is properly loaded first
  }
  
  /**
   * Merge user config with defaults
   * @param {AtlasGlobeConfig} userConfig - User configuration
   * @returns {AtlasGlobeConfig} Merged configuration
   */
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
  
  /**
   * Resolve container element from string selector or HTMLElement
   * @param {string|HTMLElement} container - Container selector or element
   * @returns {HTMLElement|null} Container element
   */
  resolveContainer(container) {
    if (typeof container === 'string') {
      return document.querySelector(container);
    }
    return container instanceof HTMLElement ? container : null;
  }
  
  /**
   * Get size configuration based on mode
   * @returns {Object} Size configuration object
   */
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
  
  /**
   * Set the THREE.js library reference
   * @param {Object} threeLibrary - The THREE.js library object
   */
  setThreeJS(threeLibrary) {
    THREE = threeLibrary;
  }
  
  /**
   * Initialize the globe (staggered loading after scene is ready)
   */
  async init(onLoadingStep) {
    // Use global THREE if available, otherwise use module-level THREE
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
      // Create scene, camera, renderer, etc.
      await new Promise(resolve => {
        setTimeout(() => {
          this.createScene();
          resolve();
        }, 100);
      });

      // Staggered loading after scene is ready
      if (onLoadingStep) onLoadingStep(0); // Globe
      await this.createGlobeBaseOnly();
      if (this.features.atmosphere) {
        this.createAtmosphere();
      }
      if (onLoadingStep) onLoadingStep(1); // Clouds
      await this.addOWMCloudOverlay();
      if (onLoadingStep) onLoadingStep(2); // City lights
      await this.addCityLights();
      if (onLoadingStep) onLoadingStep(3); // Ready

      if (this.features.dragControls) {
        this.setupEventListeners();
      }

      // Start animation loop ONLY after all layers are loaded
      this.animate();
    } catch (error) {
      console.error('Globe initialization failed:', error);
      this.showError();
    }
  }
  
  /**
   * Show error state in container
   */
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
  
  /**
   * Create the Three.js scene (no globe/layers, just scene/camera/renderer)
   */
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

    // Use dynamic camera distance based on mode
    this.camera.position.z = this.sizeConfig.cameraDistance;

    // Only set up lighting and animation loop here
    this.setupLighting();
    // Do NOT start animation loop here!
  }
  
  /**
   * Create the globe base only (scene, camera, renderer, globe group, mesh)
   * For staggered loading: call this first, then add clouds/lights.
   */
  async createGlobeBaseOnly() {
    // Create geometry and texture
    const geometry = new THREE.SphereGeometry(this.sizeConfig.sphereRadius, 64, 64);
    const texture = await this.createAtlasTexture();

    // Create a parent group for all globe elements
    this.globeGroup = new THREE.Group();
    this.scene.add(this.globeGroup);

    // Apply initial Y rotation so 0° longitude faces camera, then axial tilt
    this.globeGroup.rotation.y = Math.PI; // 180° so 0° longitude is at front
    this.globeGroup.rotation.x = 0.4102; // 23.5 degrees tilt

    // Globe mesh
    this.globeMesh = new THREE.Mesh(geometry, texture ? new THREE.MeshPhongMaterial({
      map: texture,
      transparent: false,
      shininess: 1
    }) : undefined);
    // No per-mesh rotation!
    this.globeGroup.add(this.globeMesh);

    // Initialize with auto-rotation
    this.rotationVelocity.x = 0;
    this.rotationVelocity.y = this.autoRotationSpeed;
  }

  /**
   * (Legacy) Create the globe mesh with all layers at once
   */
  async createGlobe() {
    await this.createGlobeBaseOnly();
    if (this.features.atmosphere) {
      this.createAtmosphere();
    }
    if (this.features.cityLights) {
      await this.addCityLights();
    }
    await this.addOWMCloudOverlay();
    this.animate();
  }

  /**
   * Fetch and overlay OpenWeatherMap cloud tiles as a texture
   */
  async addOWMCloudOverlay() {
    // Settings
    const apiKey = "5c40eeabe3fb01c8a4f85b28e754833c";
    const layer = "clouds_new";
    const z = 1; // Low zoom for global coverage (2x2 tiles)
    const tileSize = 256;
    const canvasSize = tileSize * 2;
    const canvas = document.createElement("canvas");
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext("2d");

    // Fetch and draw 2x2 tiles
    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 2; y++) {
        const url = `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${apiKey}`;
        await new Promise((resolve) => {
          const img = new window.Image();
          img.crossOrigin = "Anonymous";
          img.onload = () => {
            ctx.globalAlpha = 1.0; // Fully opaque for debugging
            ctx.drawImage(img, x * tileSize, y * tileSize, tileSize, tileSize);
            console.log("Loaded OWM tile:", url);
            resolve();
          };
          img.onerror = resolve;
          img.src = url;
        });
      }
    }

    // Create texture and overlay as a new mesh
    const cloudTexture = new THREE.CanvasTexture(canvas);
    cloudTexture.wrapS = THREE.RepeatWrapping;
    cloudTexture.wrapT = THREE.ClampToEdgeWrapping;

    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 1.0, // Fully opaque for debugging
      depthWrite: false
    });

    this.cloudMesh = new THREE.Mesh(
      new THREE.SphereGeometry(this.sizeConfig.sphereRadius + 0.01, 64, 64),
      cloudMaterial
    );
    // Do NOT set cloudMesh rotation; let it inherit from globeGroup
    this.globeGroup.add(this.cloudMesh);
  }
  
  /**
   * Create atmospheric layer
   */
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
  
  /**
   * Setup lighting system
   */
  setupLighting() {
    const ambientLight = new THREE.AmbientLight(this.atlasColors.light, 0.35);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(this.atlasColors.light, 0.6);
    
    // Position light to create realistic day/night terminator
    const sunLon = -120; // Pacific daylight
    const sunLat = 0;
    const sunPhi = (90 - sunLat) * (Math.PI / 180);
    const sunTheta = (sunLon + 180) * (Math.PI / 180);
    
    const sunX = 5 * Math.sin(sunPhi) * Math.cos(sunTheta);
    const sunY = 5 * Math.cos(sunPhi);
    const sunZ = 5 * Math.sin(sunPhi) * Math.sin(sunTheta);
    
    directionalLight.position.set(sunX, sunY, sunZ);
    this.scene.add(directionalLight);
  }
  
  /**
   * Create texture with world map and city lights
   */
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
      console.log('Using fallback map');
      this.drawFallbackMap(ctx, canvas.width, canvas.height);
      // Only draw city lights on texture if 3D lights are disabled
      // if (this.features.cityLights) {
      //   await this.drawCityLights(ctx, canvas.width, canvas.height);
      // }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }
  
  /**
   * Draw world map from GeoJSON data
   */
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

    // Only draw city lights on texture if 3D lights are disabled
    // if (this.features.cityLights) {
    //   await this.drawCityLights(ctx, width, height);
    // }
  }
  
  /**
   * Draw polygon on canvas
   */
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
  
  /**
   * Draw fallback map with simple continent shapes
   */
  drawFallbackMap(ctx, width, height) {
    const continents = [
      { x: 0.2, y: 0.3, w: 0.25, h: 0.4 }, // North America
      { x: 0.25, y: 0.5, w: 0.15, h: 0.35 }, // South America
      { x: 0.48, y: 0.25, w: 0.12, h: 0.15 }, // Europe
      { x: 0.5, y: 0.35, w: 0.15, h: 0.4 }, // Africa
      { x: 0.6, y: 0.2, w: 0.3, h: 0.35 }, // Asia
      { x: 0.75, y: 0.65, w: 0.12, h: 0.1 } // Australia
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
  
  /**
   * Add 3D city lights from CSV data
   */
  async addCityLights() {
    try {
      const csvRes = await fetch('/js/world-cities.csv');
      if (!csvRes.ok) return;
      const csvText = await csvRes.text();
      const lines = csvText.split('\n').slice(1);
      
    this.cityLightsGroup = new THREE.Group();
    // Do NOT set cityLightsGroup rotation; let it inherit from globeGroup
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

// Convert coordinates to 3D position
const phi = (90 - lat) * (Math.PI / 180);
const theta = (-lon) * (Math.PI / 180);
// Move city lights halfway into the globe for "grounded" effect
const radius = this.sizeConfig.sphereRadius - 0.01;
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        
        // Calculate size and intensity based on population
const minPop = 1000;
const maxPop = 38000000;
const popNormalized = Math.min(1, Math.max(0, (Math.log10(population) - Math.log10(minPop)) / (Math.log10(maxPop) - Math.log10(minPop))));

// Make the minimum size and intensity lower for small cities
const minIntensity = 0.15;
const minSize = 0.002;
const size = minSize + popNormalized * this.sizeConfig.cityLightSize.multiplier;
const intensity = Math.max(minIntensity, 0.15 + popNormalized * 0.45);
        
        // Determine light color based on region
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
  
  /**
   * Create individual city light meshes
   */
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
  
  /**
   * Draw city lights on texture canvas
   */
  async drawCityLights(ctx, width, height) {
    try {
      const csvRes = await fetch('/js/world-cities.csv');
      if (!csvRes.ok) throw new Error('Failed to load city lights CSV: ' + csvRes.status);
      const csvText = await csvRes.text();
      const lines = csvText.split('\n').slice(1);
      
      ctx.save();
      ctx.globalAlpha = 0.9;
      let cityCount = 0;
      
      lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length < 10) return;
        
        const lat = parseFloat(parts[2].replace(/"/g, ''));
        const lon = parseFloat(parts[3].replace(/"/g, ''));
        const population = parseInt(parts[9].replace(/"/g, ''), 10);
        const country = parts[4].replace(/"/g, '');
        
        if (isNaN(lat) || isNaN(lon) || isNaN(population) || population <= 0) return;
        
        const x = ((lon + 180) / 360) * width;
        const y = ((90 - lat) / 180) * height;
        
        const maxPop = 40000000;
        const minRadius = 0.5;
        const maxRadius = 5;
        const r = minRadius + (Math.log10(population) / Math.log10(maxPop)) * (maxRadius - minRadius);

        // Color variations based on region
        let centerColor = 'rgba(255, 255, 255, 1)';
        let midColor = 'rgba(255, 255, 255, 0.9)';
        let edgeColor = 'rgba(200, 220, 255, 0)';
        
        if (country === 'China' || country === 'India') {
          centerColor = 'rgba(255, 248, 220, 1)';
          midColor = 'rgba(255, 248, 220, 0.9)';
        } else if (country === 'United States' || country === 'United Kingdom' || country === 'Japan') {
          centerColor = 'rgba(240, 248, 255, 1)';
          midColor = 'rgba(240, 248, 255, 0.9)';
        } else if (country === 'Nigeria' || country === 'Pakistan' || country === 'Bangladesh') {
          centerColor = 'rgba(255, 165, 0, 1)';
          midColor = 'rgba(255, 165, 0, 0.9)';
          edgeColor = 'rgba(255, 140, 0, 0)';
        } else if (country === 'Brazil' || country === 'Argentina' || country === 'Chile') {
          centerColor = 'rgba(255, 245, 220, 1)';
          midColor = 'rgba(255, 245, 220, 0.9)';
        }
        
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 1.2);
        grad.addColorStop(0, centerColor);
        grad.addColorStop(0.1, midColor);
        grad.addColorStop(0.2, edgeColor);
        grad.addColorStop(1, 'rgba(100, 150, 255, 0)');
        
        ctx.beginPath();
        ctx.arc(x, y, r * 1.2, 0, 2 * Math.PI);
        ctx.fillStyle = grad;
        ctx.fill();
        cityCount++;
      });
      
      ctx.restore();
      console.log('City lights drawn:', cityCount);
    } catch (err) {
      console.error('City lights error:', err);
    }
  }
  
  /**
   * Setup event listeners for drag controls
   */
  setupEventListeners() {
    if (!this.container) return;
    
    this.container.style.cursor = 'grab';
    
    // Mouse events
    this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.container.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.container.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    
    // Touch events
    this.container.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.container.addEventListener('touchmove', this.onTouchMove.bind(this));
    this.container.addEventListener('touchend', this.onTouchEnd.bind(this));
    
    // Resize handling
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
  
  /**
   * Mouse down event handler
   */
  onMouseDown(event) {
    this.startDragging(event.clientX, event.clientY);
    if (this.container) this.container.style.cursor = 'grabbing';
  }
  
  /**
   * Mouse move event handler
   */
  onMouseMove(event) {
    if (this.isDragging) {
      this.updateRotation(event.clientX, event.clientY);
    }
  }
  
  /**
   * Mouse up event handler
   */
  onMouseUp() {
    this.stopDragging();
    if (this.container) this.container.style.cursor = 'grab';
  }
  
  /**
   * Mouse leave event handler
   */
  onMouseLeave() {
    this.stopDragging();
    if (this.container) this.container.style.cursor = 'grab';
  }
  
  /**
   * Touch start event handler
   */
  onTouchStart(event) {
    event.preventDefault();
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.startDragging(touch.clientX, touch.clientY);
    }
  }
  
  /**
   * Touch move event handler
   */
  onTouchMove(event) {
    event.preventDefault();
    if (this.isDragging && event.touches.length === 1) {
      const touch = event.touches[0];
      this.updateRotation(touch.clientX, touch.clientY);
    }
  }
  
  /**
   * Touch end event handler
   */
  onTouchEnd(event) {
    event.preventDefault();
    this.stopDragging();
  }
  
  /**
   * Start dragging interaction
   */
  startDragging(clientX, clientY) {
    this.isDragging = true;
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    this.previousMousePosition = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }
  
  /**
   * Update rotation based on mouse/touch movement
   */
  updateRotation(clientX, clientY) {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    const currentMousePosition = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
    
    const deltaX = currentMousePosition.x - this.previousMousePosition.x;
    
    // Only allow Y-axis rotation (horizontal dragging)
    this.rotationVelocity.x = 0;
    this.rotationVelocity.y = deltaX * this.rotationSpeed;
    
    this.previousMousePosition = currentMousePosition;
  }
  
  /**
   * Stop dragging interaction
   */
  stopDragging() {
    this.isDragging = false;
  }
  
  /**
   * Handle window resize
   */
  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    
    const width = this.container.offsetWidth || this.container.clientWidth;
    const height = this.container.offsetHeight || this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  
  /**
   * Animation loop
   */
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    if (this.globeGroup) {
      // Only spin around Y axis (Earth's axis), never touch X after initial tilt
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
  
  /**
   * Rotate the globe freely in 3D by Phoenix drag (dx, dy in pixels)
   */
  rotateGlobeByPhoenix(dx, dy) {
    if (!this.globeGroup) return;
    // Sensitivity factor (tweak as needed)
    const sensitivity = 0.005;
    // Only allow rotation around Y axis (realistic Earth spin)
    this.globeGroup.rotation.y += dx * sensitivity;
    // Optionally, ignore dy or use it for a subtle "nod" effect if desired, but not for real Earth
  }

  /**
   * Animate the globe back to default orientation (Earth tilt, north up)
   */
  snapBackGlobeOrientation() {
    if (!this.globeGroup) return;
    // Only snap Y axis, X stays at 23.5 deg tilt
    const targetY = this.globeGroup.rotation.y;
    const startY = this.globeGroup.rotation.y;
    const duration = 0.7; // seconds
    const startTime = performance.now();

    const animateSnap = (now) => {
      const t = Math.min(1, (now - startTime) / (duration * 1000));
      // Ease out cubic
      const ease = 1 - Math.pow(1 - t, 3);
      this.globeGroup.rotation.x = 0.4102; // Always reset to tilt
      this.globeGroup.rotation.y = startY + (targetY - startY) * ease;
      if (t < 1) {
        requestAnimationFrame(animateSnap);
      }
    };
    requestAnimationFrame(animateSnap);
  }

  /**
   * Clean up Three.js resources
   */
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
    
    // Remove event listeners
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

/**
 * Load Three.js library dynamically
 * @returns {Promise<boolean>} Success status
 */
export async function loadThreeJS() {
  try {
    const threeModule = await import('three');
    THREE = threeModule;
    return true;
  } catch (error) {
    console.error('Failed to load Three.js:', error);
    return false;
  }
}

/**
 * Initialize globe with default settings
 * @param {string|HTMLElement} container - Container element
 * @param {AtlasGlobeConfig} config - Configuration object
 * @returns {Promise<AtlasGlobe|null>} Globe instance or null if failed
 */
export async function initializeGlobe(container = '#globe-canvas', config = {}) {
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  const containerElement = typeof container === 'string' ? 
    document.querySelector(container) : container;
  
  if (!containerElement) {
    console.error('Container element not found');
    return null;
  }
  
  if (prefersReducedMotion) {
    // Show static globe for users who prefer reduced motion
    containerElement.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#d4af37;font-size:8rem;">🌍</div>';
    return null;
  }
  
  // Load Three.js if not already loaded
  if (!THREE) {
    const threeLoaded = await loadThreeJS();
    if (!threeLoaded) {
      // Fallback to static globe
      containerElement.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#d4af37;font-size:8rem;">🌍</div>';
      return null;
    }
  }
  
  try {
    const globe = new AtlasGlobe({ container, ...config });
    await globe.init();
    return globe;
  } catch (error) {
    console.error('Globe initialization failed:', error);
    containerElement.innerHTML = `
      <div class="globe-error">
        <div class="error-icon">🌍</div>
        <p>Globe unavailable</p>
      </div>
    `;
    return null;
  }
}

/**
 * Clean up globe instance
 * @param {AtlasGlobe} globe - Globe instance to clean up
 */
export function cleanupGlobe(globe) {
  if (globe) {
    globe.dispose();
  }
}

// Export THREE for external use (after loading)
export { THREE };

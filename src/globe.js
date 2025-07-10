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
    
    // Interaction properties
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.cameraOrbitVelocity = { x: 0, y: 0 };
    
    // Camera orbit properties
    this.cameraRadius = this.sizeConfig ? this.sizeConfig.cameraDistance : 6;
    this.cameraTheta = 0; // Horizontal orbit angle
    this.cameraPhi = Math.PI / 2; // Vertical orbit angle (start at equator)
    
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
   * Initialize the globe
   */
  async init() {
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
      this.createScene();
      if (this.features.dragControls) {
        this.setupEventListeners();
      }
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
   * Create the Three.js scene
   */
  createScene() {
    if (!this.container) return;
    
    // Wait for container to be properly sized
    setTimeout(() => {
      const width = this.container.offsetWidth || this.container.clientWidth || 400;
      const height = this.container.offsetHeight || this.container.clientHeight || 400;
      
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      
      this.renderer.setSize(width, height);
      this.renderer.setClearColor(0x000000, 0);
      this.container.appendChild(this.renderer.domElement);
      
      // Set initial camera position using orbit system
      this.cameraRadius = this.sizeConfig.cameraDistance;
      this.updateCameraPosition();
      
      this.createGlobe();
      this.setupLighting();
      this.animate();
    }, 100);
  }
  
  /**
   * Create the globe mesh with night lights texture
   */
  async createGlobe() {
    const geometry = new THREE.SphereGeometry(this.sizeConfig.sphereRadius, 64, 64);
    
    // Load both textures - black marble for main surface, custom lightmap for emissive
    const [blackMarbleTexture, customLightmap] = await Promise.all([
      this.loadBlackMarbleTexture(),
      this.loadCinzanoLightmap()
    ]);
    
    const material = new THREE.MeshPhongMaterial({
      map: blackMarbleTexture,              // Main texture shows night lights colors
      emissiveMap: customLightmap,          // Your custom lightmap controls glow
      emissive: new THREE.Color(0xffcc00),  // Gold glow to match site theme
      emissiveIntensity: 0.3,               // Moderate intensity
      transparent: false,
      shininess: 1
    });
    
    this.globeMesh = new THREE.Mesh(geometry, material);
    this.globeMesh.rotation.x = 0.1; // Slight tilt
    this.scene.add(this.globeMesh);
    
    if (this.features.atmosphere) {
      this.createAtmosphere();
    }
    
    // Initialize with globe rotation only (no auto camera orbit)
    this.cameraOrbitVelocity.x = 0;
    this.cameraOrbitVelocity.y = 0;
    this.rotationVelocity = { x: 0, y: this.autoRotationSpeed };
  }
  
  /**
   * Load day map texture for main surface
   */
  async loadBlackMarbleTexture() {
    try {
      const textureLoader = new THREE.TextureLoader();
      const texture = await new Promise((resolve, reject) => {
        textureLoader.load(
          'https://clouds.matteason.co.uk/images/2048x1024/earth.jpg',
          resolve,
          undefined,
          reject
        );
      });
      
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      
      console.log('Day map texture loaded successfully');
      return texture;
    } catch (error) {
      console.warn('Failed to load day map texture:', error);
      return null;
    }
  }

  /**
   * Load Earth lightmap for emissive mapping
   */
  async loadCinzanoLightmap() {
    try {
      const textureLoader = new THREE.TextureLoader();
      const texture = await new Promise((resolve, reject) => {
        textureLoader.load(
          '/js/earth_lightmap.png',
          resolve,
          undefined,
          reject
        );
      });
      
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      
      console.log('Earth lightmap loaded successfully');
      return texture;
    } catch (error) {
      console.warn('Failed to load Earth lightmap:', error);
      return null;
    }
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
   * Update camera position based on orbit angles
   */
  updateCameraPosition() {
    // Convert spherical coordinates to Cartesian
    const x = this.cameraRadius * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);
    const y = this.cameraRadius * Math.cos(this.cameraPhi);
    const z = this.cameraRadius * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);
    
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0); // Always look at the center of the globe
  }

  /**
   * Setup lighting for "dark side of Earth" view
   */
  setupLighting() {
    // No ambient light - pure directional lighting from the sun
    
    // Sun positioned on the far side of Earth from camera
    // Camera is at positive Z, so sun should be at negative Z
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(0, 0, -10); // Far behind the globe
    directionalLight.target.position.set(0, 0, 0); // Point toward Earth center
    
    this.scene.add(directionalLight);
    this.scene.add(directionalLight.target);
    
    console.log('Pure directional lighting: Sun behind Earth, no ambient light');
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
   * Update camera orbit based on mouse/touch movement
   */
  updateRotation(clientX, clientY) {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    const currentMousePosition = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
    
    const deltaX = currentMousePosition.x - this.previousMousePosition.x;
    const deltaY = currentMousePosition.y - this.previousMousePosition.y;
    
    // Update camera orbit velocities
    this.cameraOrbitVelocity.y = deltaX * this.rotationSpeed; // Horizontal orbit
    this.cameraOrbitVelocity.x = deltaY * this.rotationSpeed; // Vertical orbit
    
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
    
    if (this.camera) {
      if (this.isDragging) {
        // Direct camera orbit while dragging
        this.cameraTheta += this.cameraOrbitVelocity.y;
        this.cameraPhi += this.cameraOrbitVelocity.x;
        
        // Clamp vertical angle to prevent camera from going through poles
        this.cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraPhi));
        
        this.updateCameraPosition();
      } else {
        // Apply friction to momentum
        this.cameraOrbitVelocity.y *= this.friction;
        this.cameraOrbitVelocity.x *= this.friction;
        
        // Continue momentum or return to auto-orbit
        if (Math.abs(this.cameraOrbitVelocity.y) > 0.001 || Math.abs(this.cameraOrbitVelocity.x) > 0.001) {
          this.cameraTheta += this.cameraOrbitVelocity.y;
          this.cameraPhi += this.cameraOrbitVelocity.x;
          
          // Clamp vertical angle
          this.cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraPhi));
          
          this.updateCameraPosition();
        } else {
          // Stop camera orbit when momentum stops (no auto-orbit)
          this.cameraOrbitVelocity.y = 0;
          this.cameraOrbitVelocity.x = 0;
        }
      }
      
      // Keep globe rotating with slight tilt
      if (this.globeMesh) {
        this.globeMesh.rotation.y += this.rotationVelocity.y;
        this.globeMesh.rotation.x = 0.1;
      }
    }
    
    this.renderer.render(this.scene, this.camera);
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
      this.container.removeEventListener('mousedown', this.onMouseDown.bind(this));
      this.container.removeEventListener('mousemove', this.onMouseMove.bind(this));
      this.container.removeEventListener('mouseup', this.onMouseUp.bind(this));
      this.container.removeEventListener('mouseleave', this.onMouseLeave.bind(this));
      this.container.removeEventListener('touchstart', this.onTouchStart.bind(this));
      this.container.removeEventListener('touchmove', this.onTouchMove.bind(this));
      this.container.removeEventListener('touchend', this.onTouchEnd.bind(this));
    }
    
    if (window.removeEventListener) {
      window.removeEventListener('resize', this.onWindowResize.bind(this));
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
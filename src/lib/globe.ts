// Standalone Globe initializer module

import * as THREE from 'three';
import type { GeoJsonObject } from 'geojson';

class AtlasGlobe {
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;
  globeMesh!: THREE.Mesh;
  isDragging = false;
  previousMousePosition = { x: 0, y: 0 };
  rotationVelocity = { x: 0, y: 0 };
  autoRotationSpeed = 0.005;
  friction = 0.95;
  rotationSpeed = 0.008;
  atlasColors = {
    ocean: '#001122',
    land: '#d4af37',
    stroke: '#cd7f32',
    atmosphere: 0xd4af37,
    light: 0xd4af37
  };

  constructor() {
    this.init();
  }

  private async init() {
    try {
      this.createScene();
      await this.loadDataAndBuildGlobe();
      this.setupEventListeners();
    } catch {
      this.showError();
    }
  }

  private showError() {
    const container = document.getElementById('globe-canvas');
    if (container) {
      container.innerHTML = '<div class="globe-error"><div class="error-icon">🌍</div><p>Globe unavailable</p></div>';
    }
  }

  private createScene() {
    const container = document.getElementById('globe-canvas');
    if (!container) throw new Error('Canvas container missing');
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000, 0);
    container.appendChild(this.renderer.domElement);
    this.camera.position.z = 4;

    // Lighting
    this.scene.add(new THREE.AmbientLight(this.atlasColors.light, 0.4));
    const dir = new THREE.DirectionalLight(this.atlasColors.light, 0.8);
    dir.position.set(5, 3, 5);
    this.scene.add(dir);
  }

  private async loadDataAndBuildGlobe() {
    const geometry = new THREE.SphereGeometry(1.5, 64, 64);
    const texture = await this.createAtlasTexture();
    const material = new THREE.MeshPhongMaterial({ map: texture, transparent: true, opacity: 0.9 });
    this.globeMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.globeMesh);

    // Atmosphere
    const atmGeo = new THREE.SphereGeometry(1.6, 64, 64);
    const atmMat = new THREE.MeshBasicMaterial({
      color: this.atlasColors.atmosphere,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    this.scene.add(new THREE.Mesh(atmGeo, atmMat));

    this.animate();
  }

  private async createAtlasTexture(): Promise<THREE.Texture> {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = this.atlasColors.ocean;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    try {
      const res = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
      const geoData = (await res.json()) as GeoJsonObject;
      this.drawGeoJson(ctx, geoData, canvas.width, canvas.height);
    } catch {
      this.drawFallback(ctx, canvas.width, canvas.height);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  private drawGeoJson(ctx: CanvasRenderingContext2D, data: GeoJsonObject, w: number, h: number) {
    ctx.fillStyle = this.atlasColors.land;
    ctx.strokeStyle = this.atlasColors.stroke;
    ctx.lineWidth = 1;
    (data as any).features.forEach((f: any) => {
      const coords = f.geometry.coordinates as any;
      if (f.geometry.type === 'Polygon') this.fillPoly(ctx, coords, w, h);
      else coords.forEach((poly: any) => this.fillPoly(ctx, poly, w, h));
    });
  }

  private fillPoly(ctx: CanvasRenderingContext2D, rings: number[][][], w: number, h: number) {
    rings.forEach((ring) => {
      ctx.beginPath();
      ring.forEach((c, i) => {
        const x = ((c[0] + 180) / 360) * w;
        const y = ((90 - c[1]) / 180) * h;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }

  private drawFallback(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const conts = [
      { x: 0.2, y: 0.3, w: 0.25, h: 0.4 },
      { x: 0.25, y: 0.5, w: 0.15, h: 0.35 },
      { x: 0.48, y: 0.25, w: 0.12, h: 0.15 },
      { x: 0.5, y: 0.35, w: 0.15, h: 0.4 },
      { x: 0.6, y: 0.2, w: 0.3, h: 0.35 },
      { x: 0.75, y: 0.65, w: 0.12, h: 0.1 }
    ];
    ctx.fillStyle = this.atlasColors.land;
    conts.forEach((r) => ctx.fillRect(r.x * w, r.y * h, r.w * w, r.h * h));
  }

  private setupEventListeners() {
    const c = document.getElementById('globe-canvas');
    if (!c) return;
    c.style.cursor = 'grab';
    c.addEventListener('mousedown', this.onDown.bind(this));
    c.addEventListener('mousemove', this.onMove.bind(this));
    c.addEventListener('mouseup', this.onUp.bind(this));
    c.addEventListener('mouseleave', this.onUp.bind(this));
    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onDown(e: MouseEvent) {
    this.isDragging = true;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    this.previousMousePosition = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private onMove(e: MouseEvent) {
    if (!this.isDragging) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cur = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const dx = cur.x - this.previousMousePosition.x;
    this.rotationVelocity.y = dx * this.rotationSpeed;
    this.previousMousePosition = cur;
  }

  private onUp() {
    this.isDragging = false;
  }

  private onResize() {
    const c = document.getElementById('globe-canvas');
    if (!c) return;
    const w = c.clientWidth,
      h = c.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private animate() {
    requestAnimationFrame(() => this.animate());
    if (this.globeMesh) {
      if (!this.isDragging) {
        this.rotationVelocity.y *= this.friction;
        if (Math.abs(this.rotationVelocity.y) < 0.001) {
          this.rotationVelocity.y = this.autoRotationSpeed;
        }
      }
      this.globeMesh.rotation.y += this.rotationVelocity.y;
      this.globeMesh.rotation.x = 0.1;
    }
    this.renderer.render(this.scene, this.camera);
  }
}

export default function initGlobe() {
  new AtlasGlobe();
}

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.177.0/three.module.min.js';

(function () {
  let globe = null;
  const setup = () => {
    const container = document.getElementById('globe-canvas');
    if (!container) return;
    container.innerHTML = '';
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth/container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    camera.position.z = 4;

    scene.add(new THREE.AmbientLight(0xd4af37, 0.4));
    const dir = new THREE.DirectionalLight(0xd4af37, 0.8);
    dir.position.set(5,3,5);
    scene.add(dir);

    const geo = new THREE.SphereGeometry(1.5, 64, 64);
    const tempMat = new THREE.MeshPhongMaterial({ color: 0xd4af37, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(geo, tempMat);
    scene.add(mesh);

    let isDragging = false;
    let prev = { x: 0, y: 0 };
    let vel = 0;
    const baseVel = 0.005;
    const friction = 0.95;
    const minVel = 0.0008;

    const makeTexture = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2048; canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#001122';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      try {
        const res = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
        const data = await res.json();
        ctx.fillStyle = '#d4af37';
        ctx.strokeStyle = '#cd7f32';
        ctx.lineWidth = 1;
        data.features.forEach(f => {
          const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
          polys.forEach(poly => {
            ctx.beginPath();
            poly.forEach(ring => ring.forEach((pt,i) => {
              const x = ((pt[0]+180)/360) * canvas.width;
              const y = ((90-pt[1])/180) * canvas.height;
              i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
            }));
            ctx.closePath(); ctx.fill(); ctx.stroke();
          });
        });
      } catch {
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(0,0,canvas.width,canvas.height);
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      mesh.material = new THREE.MeshPhongMaterial({ map: texture, transparent: true, opacity: 0.9 });
    };
    makeTexture();

    container.style.cursor = 'grab';
    container.addEventListener('mousedown', e => {
      isDragging = true;
      const rect = container.getBoundingClientRect();
      prev = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    });
    container.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const rect = container.getBoundingClientRect();
      const cur = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      vel = (cur.x - prev.x) * 0.008;
      prev = cur;
    });
    container.addEventListener('mouseup', () => isDragging = false);
    container.addEventListener('mouseleave', () => isDragging = false);

    const onResize = () => {
      camera.aspect = container.clientWidth/container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    let frame;
    let lastTime = performance.now();
    function animate(now) {
      frame = requestAnimationFrame(animate);
      const delta = (now - lastTime) / 1000; // seconds
      lastTime = now;

      if (!isDragging) {
        vel *= friction;
        if (Math.abs(vel) < minVel) vel = 0;
      }
      mesh.rotation.y += (baseVel + vel) * (delta * 60); // base spin + user velocity

      renderer.render(scene, camera);
    }
    animate(lastTime);

    return () => {
      cancelAnimationFrame(frame);
      renderer.dispose();
      renderer.forceContextLoss();
      container.innerHTML = '';
      window.removeEventListener('resize', onResize);
    };
  };

  let cleanup = null;

  function mount() {
    if (cleanup) cleanup();
    cleanup = setup();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  document.addEventListener('astro:after-swap', mount);
})();

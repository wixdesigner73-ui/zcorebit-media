import * as THREE from 'three';
import { clamp, wrap } from '../../utils/math';

export type GalleryItem = {
  key: string;
  slug: string;
  label: string;
  category: string;
  aspect: number;
  color: string;
  small: string;
  large: string;
};

export type ScreenRect = { x: number; y: number; w: number; h: number };

type Options = {
  /** Let the mouse wheel / trackpad pan the gallery (fullscreen mode). */
  wheel: boolean;
  reducedMotion: boolean;
  compact: boolean;
  onOpen: (item: GalleryItem, rect: ScreenRect) => void;
  onHover: (item: GalleryItem | null) => void;
  onInteract?: () => void;
};

type Tile = {
  item: GalleryItem;
  column: number;
  baseX: number;
  baseY: number;
  w: number;
  h: number;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  hover: number;
  visible: boolean;
  requested: boolean;
  /** Last projected screen-space corners (tl, tr, br, bl). */
  quad: { x: number; y: number }[];
};

const vertexShader = /* glsl */ `
  uniform vec2 uViewport;
  uniform float uCurve;
  uniform vec2 uCursor;
  uniform float uLens;
  uniform float uLensRadius;
  uniform vec2 uVelocity;
  varying vec2 vUv;
  varying float vEdge;

  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vec2 n = world.xy / (uViewport * 0.5);
    float d2 = dot(n, n);
    // Dome: edges recede and spread like a wide-angle lens.
    world.xy *= 1.0 + 0.12 * d2;
    world.z -= d2 * uCurve;
    // Magnifier under the cursor.
    vec2 dc = world.xy - uCursor;
    float fall = exp(-dot(dc, dc) / (uLensRadius * uLensRadius));
    world.xy += dc * 0.24 * uLens * fall;
    world.z += 70.0 * uLens * fall;
    // Fabric-like bend while flinging.
    world.x += uVelocity.x * n.y * n.y * 0.9;
    world.y += uVelocity.y * n.x * n.x * 0.9;
    vEdge = clamp(d2 * 0.55, 0.0, 1.0);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec2 uPlane;
  uniform vec2 uImage;
  uniform vec3 uColor;
  uniform float uLoaded;
  uniform float uHover;
  uniform float uDim;
  uniform float uOpacity;
  uniform float uRadius;
  varying vec2 vUv;
  varying float vEdge;

  void main() {
    // object-fit: cover
    float planeAspect = uPlane.x / uPlane.y;
    float imageAspect = uImage.x / uImage.y;
    vec2 ratio = vec2(min(planeAspect / imageAspect, 1.0), min(imageAspect / planeAspect, 1.0));
    vec2 uv = vUv * ratio + (1.0 - ratio) * 0.5;
    uv = (uv - 0.5) * (1.0 - 0.07 * uHover) + 0.5;
    vec3 tex = texture2D(uMap, uv).rgb;
    vec3 col = mix(uColor, tex, uLoaded);
    col *= mix(1.0, 0.5, vEdge) * (0.82 + 0.18 * uHover) * uDim;

    // Rounded corners.
    vec2 p = (vUv - 0.5) * uPlane;
    vec2 q = abs(p) - uPlane * 0.5 + uRadius;
    float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
    float alpha = 1.0 - smoothstep(-0.75, 0.75, sd);
    gl_FragColor = vec4(col, alpha * uOpacity);
  }
`;

function hexToVec3(hex: string) {
  const v = parseInt(hex.replace('#', ''), 16);
  return new THREE.Vector3(((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255);
}

export class GalleryScene {
  private container: HTMLElement;
  private items: GalleryItem[];
  private opts: Options;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private geometry = new THREE.PlaneGeometry(1, 1, 24, 24);
  private tiles: Tile[] = [];
  private textures = new Map<string, THREE.Texture>();
  private loader = new THREE.TextureLoader();
  private shared = {
    uViewport: { value: new THREE.Vector2(1, 1) },
    uCurve: { value: 240 },
    uCursor: { value: new THREE.Vector2(9999, 9999) },
    uLens: { value: 0 },
    uLensRadius: { value: 300 },
    uVelocity: { value: new THREE.Vector2() },
  };

  private width = 1;
  private height = 1;
  private dist = 1;
  private colW = 300;
  private gap = 18;
  private columns = 0;
  private totalW = 1;
  private columnHeights: number[] = [];
  private columnSpeed: number[] = [];

  private x = 0; private y = 0;
  private targetX = 0; private targetY = 0;
  private vx = 0; private vy = 0;
  private cursor = { x: 9999, y: 9999, tx: 9999, ty: 9999, inside: false };
  private lens = 0;
  private dim = 1;
  private pointerId: number | null = null;
  private dragStart = { x: 0, y: 0, tx: 0, ty: 0 };
  private last = { x: 0, y: 0, t: 0 };
  private dragDistance = 0;
  private hovered: Tile | null = null;
  private opening = false;
  private running = false;
  private frame = 0;
  private lastTime = 0;
  private resizeObserver: ResizeObserver;
  private resizeTimer = 0;

  constructor(container: HTMLElement, items: GalleryItem[], opts: Options) {
    this.container = container;
    this.items = items;
    this.opts = opts;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.compact ? 1.5 : 1.75));
    this.renderer.domElement.className = 'gallery__canvas';
    container.appendChild(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(35, 1, 10, 10000);

    this.resize();
    this.bind();
    this.resizeObserver = new ResizeObserver(() => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => this.resize(), 120);
    });
    this.resizeObserver.observe(container);
  }

  /* ───────────── layout ───────────── */

  private resize() {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.width = w;
    this.height = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.dist = h / 2 / Math.tan((this.camera.fov * Math.PI) / 360);
    this.camera.position.set(0, 0, this.dist);
    this.camera.near = 10;
    this.camera.far = this.dist * 4;
    this.camera.updateProjectionMatrix();
    this.shared.uViewport.value.set(w, h);
    this.shared.uCurve.value = Math.min(w, h) * 0.32;
    this.build();
  }

  private build() {
    this.tiles.forEach((t) => { t.mesh.material.dispose(); this.scene.remove(t.mesh); });
    this.tiles = [];

    const narrow = this.width < 700;
    this.colW = narrow ? clamp(this.width / 2.25, 140, 230) : clamp(this.width / 4.6, 190, 360);
    this.gap = Math.round(this.colW * 0.07);
    this.shared.uLensRadius.value = this.colW * 1.3;
    const step = this.colW + this.gap;
    this.columns = Math.max(5, Math.ceil((this.width + step * 2) / step));
    if (this.columns % 2 === 0) this.columns++;
    this.totalW = this.columns * step;
    this.columnHeights = [];
    this.columnSpeed = [];

    const minColumnH = this.height + this.colW * 3.2;
    let cursor = 0;
    for (let c = 0; c < this.columns; c++) {
      // Alternate column depth: slightly different speeds read as parallax.
      this.columnSpeed.push(1 + (c % 3 === 1 ? -0.07 : c % 3 === 2 ? 0.05 : 0));
      let yCursor = 0;
      let count = 0;
      while (yCursor < minColumnH || count < 3) {
        const item = this.items[cursor % this.items.length];
        cursor += 3; // stride keeps neighbours from repeating the same project
        if (cursor % this.items.length === 0) cursor++;
        const aspect = clamp(item.aspect, 0.66, 1.5);
        const w = this.colW;
        const h = Math.round(w / aspect);
        this.tiles.push(this.createTile(item, c, c * step, yCursor + h / 2, w, h));
        yCursor += h + this.gap;
        count++;
      }
      this.columnHeights.push(yCursor);
    }
    this.update(0);
  }

  private createTile(item: GalleryItem, column: number, baseX: number, baseY: number, w: number, h: number): Tile {
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        ...this.shared,
        uMap: { value: null },
        uPlane: { value: new THREE.Vector2(w, h) },
        uImage: { value: new THREE.Vector2(item.aspect, 1) },
        uColor: { value: hexToVec3(item.color) },
        uLoaded: { value: 0 },
        uHover: { value: 0 },
        uDim: { value: 1 },
        uOpacity: { value: 1 },
        uRadius: { value: Math.max(4, w * 0.022) },
      },
    });
    const mesh = new THREE.Mesh(this.geometry, material);
    mesh.scale.set(w, h, 1);
    mesh.frustumCulled = false;
    this.scene.add(mesh);
    const cached = this.textures.get(item.key);
    if (cached) { material.uniforms.uMap.value = cached; material.uniforms.uLoaded.value = 1; }
    return { item, column, baseX, baseY, w, h, mesh, hover: 0, visible: true, requested: Boolean(cached), quad: [] };
  }

  private requestTexture(tile: Tile) {
    if (tile.requested) return;
    tile.requested = true;
    const cached = this.textures.get(tile.item.key);
    if (cached) { this.applyTexture(tile.item.key, cached); return; }
    const hiDpi = tile.w * this.renderer.getPixelRatio() > 720;
    this.loader.load(hiDpi ? tile.item.large : tile.item.small, (texture) => {
      texture.colorSpace = THREE.NoColorSpace;
      texture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      this.textures.set(tile.item.key, texture);
      this.applyTexture(tile.item.key, texture);
    });
  }

  private applyTexture(key: string, texture: THREE.Texture) {
    for (const t of this.tiles) {
      if (t.item.key !== key) continue;
      t.requested = true;
      const u = t.mesh.material.uniforms;
      if (u.uMap.value === texture) continue;
      u.uMap.value = texture;
      u.uLoaded.value = 0;
    }
  }

  /** CPU copy of the vertex warp (without lens) for picking and rects. */
  private project(px: number, py: number) {
    const nx = px / (this.width / 2);
    const ny = py / (this.height / 2);
    const d2 = nx * nx + ny * ny;
    const wx = px * (1 + 0.12 * d2);
    const wy = py * (1 + 0.12 * d2);
    const wz = -d2 * this.shared.uCurve.value;
    const k = this.dist / (this.dist - wz);
    return { x: this.width / 2 + wx * k, y: this.height / 2 - wy * k };
  }

  /* ───────────── frame ───────────── */

  private update(dt: number) {
    const f = dt / 16.67;
    const reduced = this.opts.reducedMotion;
    if (this.pointerId === null && !reduced && !this.opening) {
      this.targetX += this.vx * f;
      this.targetY += this.vy * f;
      this.vx *= Math.pow(0.92, f);
      this.vy *= Math.pow(0.92, f);
    }
    const blend = reduced ? 1 : 1 - Math.pow(0.88, f);
    const prevX = this.x, prevY = this.y;
    this.x += (this.targetX - this.x) * blend;
    this.y += (this.targetY - this.y) * blend;

    // Velocity drives the bend; clamp so flings never tear the layout.
    const velX = clamp((this.x - prevX) / Math.max(f, 0.001), -60, 60);
    const velY = clamp((this.y - prevY) / Math.max(f, 0.001), -60, 60);
    const vel = this.shared.uVelocity.value;
    vel.x += (velX * 1.2 - vel.x) * 0.15;
    vel.y += (-velY * 1.2 - vel.y) * 0.15;

    this.cursor.x += (this.cursor.tx - this.cursor.x) * (1 - Math.pow(0.86, f));
    this.cursor.y += (this.cursor.ty - this.cursor.y) * (1 - Math.pow(0.86, f));
    this.shared.uCursor.value.set(this.cursor.x - this.width / 2, this.height / 2 - this.cursor.y);
    const calm = 1 / (1 + (Math.abs(velX) + Math.abs(velY)) / 6);
    const wantLens = !reduced && this.cursor.inside && this.pointerId === null && !this.opening ? calm : 0;
    this.lens += (wantLens - this.lens) * (1 - Math.pow(0.9, f));
    this.shared.uLens.value = this.lens;

    const step = this.colW + this.gap;
    const halfW = this.width / 2 + step * 1.2;
    const halfH = this.height / 2 + this.colW * 1.6;
    for (const tile of this.tiles) {
      const colH = this.columnHeights[tile.column];
      const speed = this.columnSpeed[tile.column];
      const sx = wrap(tile.baseX + this.x - (this.columns - 1) * step * 0.5, this.totalW);
      const stagger = tile.column % 2 ? this.colW * 0.45 : 0;
      const sy = wrap(tile.baseY + stagger + this.y * speed - colH / 2, colH);
      const visible = Math.abs(sx) < halfW && Math.abs(sy) < halfH;
      tile.visible = visible;
      tile.mesh.visible = visible;
      if (!visible) continue;
      this.requestTexture(tile);
      tile.mesh.position.set(sx, -sy, 0);

      const u = tile.mesh.material.uniforms;
      if (u.uMap.value && u.uLoaded.value < 1) u.uLoaded.value = Math.min(1, u.uLoaded.value + 0.06 * f);
      const targetHover = this.hovered === tile ? 1 : 0;
      tile.hover += (targetHover - tile.hover) * (1 - Math.pow(0.85, f));
      u.uHover.value = tile.hover;
      u.uDim.value = this.opening && this.hovered !== tile ? this.dim : 1;
      const scale = 1 + tile.hover * 0.03;
      tile.mesh.scale.set(tile.w * scale, tile.h * scale, 1);

      const hw = tile.w / 2, hh = tile.h / 2;
      tile.quad = [
        this.project(sx - hw, -sy + hh),
        this.project(sx + hw, -sy + hh),
        this.project(sx + hw, -sy - hh),
        this.project(sx - hw, -sy - hh),
      ];
    }
  }

  private loop = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(now - this.lastTime, 50);
    this.lastTime = now;
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.loop);
  };

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  /* ───────────── picking ───────────── */

  private pick(x: number, y: number): Tile | null {
    let best: Tile | null = null;
    for (const tile of this.tiles) {
      if (!tile.visible || tile.quad.length !== 4) continue;
      if (inQuad(x, y, tile.quad)) best = tile;
    }
    return best;
  }

  private rectOf(tile: Tile): ScreenRect {
    const bounds = this.container.getBoundingClientRect();
    const xs = tile.quad.map((p) => p.x);
    const ys = tile.quad.map((p) => p.y);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    return { x: bounds.left + minX, y: bounds.top + minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY };
  }

  private setHovered(tile: Tile | null) {
    if (this.hovered === tile) return;
    this.hovered = tile;
    this.container.dataset.cursor = tile ? 'view' : 'drag';
    this.opts.onHover(tile?.item ?? null);
  }

  /* ───────────── input ───────────── */

  private local(e: PointerEvent | MouseEvent) {
    const r = this.container.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private onPointerDown = (e: PointerEvent) => {
    if (this.opening || e.button !== 0) return;
    this.pointerId = e.pointerId;
    const p = this.local(e);
    this.dragStart = { x: p.x, y: p.y, tx: this.targetX, ty: this.targetY };
    this.last = { x: p.x, y: p.y, t: performance.now() };
    this.dragDistance = 0;
    this.vx = this.vy = 0;
    this.container.classList.add('is-dragging');
    this.container.dataset.cursor = 'drag';
    if (e.pointerType === 'mouse') this.renderer.domElement.setPointerCapture(e.pointerId);
    this.opts.onInteract?.();
  };

  private onPointerMove = (e: PointerEvent) => {
    const p = this.local(e);
    this.cursor.tx = p.x;
    this.cursor.ty = p.y;
    this.cursor.inside = e.pointerType === 'mouse';
    if (this.pointerId === e.pointerId) {
      const dx = p.x - this.dragStart.x;
      const dy = p.y - this.dragStart.y;
      this.dragDistance = Math.max(this.dragDistance, Math.hypot(dx, dy));
      // Touch on the in-page gallery only pans horizontally (vertical = page scroll).
      const lockY = e.pointerType !== 'mouse' && !this.opts.wheel;
      this.targetX = this.dragStart.tx + dx * 1.15;
      if (!lockY) this.targetY = this.dragStart.ty + dy * 1.15;
      const now = performance.now();
      const dt = Math.max(1, now - this.last.t);
      this.vx = ((p.x - this.last.x) / dt) * 16.67 * 1.15;
      this.vy = lockY ? 0 : ((p.y - this.last.y) / dt) * 16.67 * 1.15;
      this.last = { x: p.x, y: p.y, t: now };
      if (this.dragDistance > 6) this.setHovered(null);
    } else if (e.pointerType === 'mouse' && !this.opening) {
      this.setHovered(this.pick(p.x, p.y));
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    if (this.pointerId !== e.pointerId) return;
    this.pointerId = null;
    this.container.classList.remove('is-dragging');
    // Stale velocity (pointer held still before release) shouldn't fling.
    if (performance.now() - this.last.t > 90) { this.vx = 0; this.vy = 0; }
    if (e.type === 'pointerup' && this.dragDistance < 7) {
      const p = this.local(e);
      const tile = this.pick(p.x, p.y);
      if (tile) this.open(tile);
    }
  };

  private onPointerLeave = () => {
    this.cursor.inside = false;
    if (this.pointerId === null) this.setHovered(null);
  };

  private onWheel = (e: WheelEvent) => {
    if (!this.opts.wheel || this.opening) return;
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? this.height : 1;
    const dx = (e.shiftKey ? e.deltaY : e.deltaX) * unit;
    const dy = (e.shiftKey ? 0 : e.deltaY) * unit;
    this.targetX -= dx * 0.9;
    this.targetY -= dy * 0.9;
    this.opts.onInteract?.();
  };

  private onKey = (e: KeyboardEvent) => {
    if (this.opening) return;
    const step = this.colW + this.gap;
    const keys: Record<string, () => void> = {
      ArrowLeft: () => { this.targetX += step; },
      ArrowRight: () => { this.targetX -= step; },
      ArrowUp: () => { this.targetY += step * 0.8; },
      ArrowDown: () => { this.targetY -= step * 0.8; },
      Home: () => this.reset(),
      r: () => this.reset(),
      R: () => this.reset(),
      Enter: () => { const t = this.pick(this.width / 2, this.height / 2) ?? this.nearestToCentre(); if (t) this.open(t); },
    };
    const fn = keys[e.key];
    if (!fn) return;
    if (!this.opts.wheel && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) return; // let the page scroll
    e.preventDefault();
    fn();
    this.opts.onInteract?.();
  };

  private nearestToCentre() {
    let best: Tile | null = null;
    let bestD = Infinity;
    for (const t of this.tiles) {
      if (!t.visible) continue;
      const d = Math.hypot(t.mesh.position.x, t.mesh.position.y);
      if (d < bestD) { bestD = d; best = t; }
    }
    return best;
  }

  private bind() {
    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
    el.addEventListener('pointerleave', this.onPointerLeave);
    el.addEventListener('wheel', this.onWheel, { passive: false });
    this.container.addEventListener('keydown', this.onKey);
    el.addEventListener('dragstart', (e) => e.preventDefault());
  }

  /* ───────────── actions ───────────── */

  reset() {
    this.vx = this.vy = 0;
    this.targetX = 0;
    this.targetY = 0;
  }

  /** Focus the tile: centre it, dim the rest, then hand off to the project. */
  open(tile: Tile) {
    if (this.opening) return;
    this.opening = true;
    this.hovered = tile;
    this.vx = this.vy = 0;
    const p = tile.mesh.position;
    this.targetX = this.x - p.x;
    this.targetY = this.y + p.y / this.columnSpeed[tile.column];
    const start = performance.now();
    const duration = this.opts.reducedMotion ? 10 : 620;
    const fade = () => {
      const t = Math.min(1, (performance.now() - start) / duration);
      this.dim = 1 - 0.82 * t;
      if (t < 1) requestAnimationFrame(fade);
      else this.opts.onOpen(tile.item, this.rectOf(tile));
    };
    requestAnimationFrame(fade);
  }

  /** Called when returning to the gallery view. */
  release() {
    this.opening = false;
    this.dim = 1;
    this.setHovered(null);
  }

  dispose() {
    this.stop();
    clearTimeout(this.resizeTimer);
    this.resizeObserver.disconnect();
    const el = this.renderer.domElement;
    el.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    el.removeEventListener('pointerleave', this.onPointerLeave);
    el.removeEventListener('wheel', this.onWheel);
    this.container.removeEventListener('keydown', this.onKey);
    this.tiles.forEach((t) => t.mesh.material.dispose());
    this.textures.forEach((t) => t.dispose());
    this.geometry.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    el.remove();
  }
}

function inQuad(x: number, y: number, q: { x: number; y: number }[]) {
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const a = q[i], b = q[(i + 1) % 4];
    const cross = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
    if (cross !== 0) {
      const s = Math.sign(cross);
      if (sign === 0) sign = s;
      else if (s !== sign) return false;
    }
  }
  return true;
}

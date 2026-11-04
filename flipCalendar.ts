/**
 * Calendário de mesa em 3D (cavalete). As folhas presas na espiral viram
 * por cima, curvando como papel, e caem do outro lado. Ao abrir, ele passa
 * da capa até o mês do próximo evento; a rolagem continua virando folhas.
 */
import * as THREE from 'three';
import type { CalendarEvent } from '../domain/types';
import { PAGE_H, PAGE_W, drawBack, drawCover, drawMonth, type ArtOptions } from './pageArt';

export interface FlipOptions {
  year: number;
  events: CalendarEvent[];
  /** Mês (0–11) em que o calendário deve parar ao abrir. */
  startMonth: number;
  reducedMotion: boolean;
  font: string;
  palette: { accent: string; ink: string; muted: string; board: string };
  organization: string;
}

export interface FlipHandle {
  setScroll: (p: number) => void;
  dispose: () => void;
}

const W = 4.2;
const H = W * (PAGE_H / PAGE_W);
const ALPHA = 0.24; // inclinação das faces do cavalete
const RINGS = 13;

// Deformação da folha: cada ponto segue um arco que gira em torno da espiral.
// uFlip 0 = folha na frente; 1 = folha caída atrás. uLag curva a folha no meio do giro.
const FLIP_GLSL = /* glsl */ `
  uniform float uFlip;
  uniform float uLag;
  uniform float uLayer;
  uniform float uH;
  uniform float uAlpha;
  vec3 flipPos(vec3 p, out vec3 n) {
    float s = -p.y;
    float theta = uAlpha + uFlip * (6.28318530718 - 2.0 * uAlpha);
    float k = uLag * sin(3.14159265 * uFlip) / uH;
    float phi = theta - k * s;
    n = vec3(0.0, sin(phi), cos(phi));
    float y; float z;
    if (abs(k) < 1e-4) {
      y = -s * cos(theta);
      z = s * sin(theta);
    } else {
      y = (sin(theta - k * s) - sin(theta)) / k;
      z = (cos(theta - k * s) - cos(theta)) / k;
    }
    return vec3(p.x, y, z) + n * uLayer;
  }
`;

interface PageUniforms {
  uFlip: { value: number };
  uLag: { value: number };
  uLayer: { value: number };
  uH: { value: number };
  uAlpha: { value: number };
}

function patch<T extends THREE.Material>(mat: T, u: PageUniforms, depth = false): T {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = FLIP_GLSL + shader.vertexShader;
    if (depth) {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        'vec3 fN; vec3 transformed = flipPos(position, fN);',
      );
    } else {
      shader.vertexShader = shader.vertexShader
        .replace('#include <beginnormal_vertex>', 'vec3 fN; vec3 fP = flipPos(position, fN); vec3 objectNormal = fN;')
        .replace('#include <begin_vertex>', 'vec3 transformed = fP;');
    }
  };
  mat.customProgramCacheKey = () => (depth ? 'flip-depth' : 'flip');
  return mat;
}

export function mountFlipCalendar(canvas: HTMLCanvasElement, opts: FlipOptions): FlipHandle | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d0d2, 1.35));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(-4, 9, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -6;
  key.shadow.camera.right = 6;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -4;
  key.shadow.radius = 5;
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffeef0, 0.6);
  rim.position.set(5, 4, -6);
  scene.add(rim);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // cavalete: a espiral fica no topo, as faces descem inclinadas
  const BOARD = H + 0.12;
  const apexY = BOARD * Math.cos(ALPHA);
  const rig = new THREE.Group();
  rig.position.y = apexY;
  scene.add(rig);

  const boardMat = new THREE.MeshStandardMaterial({ color: opts.palette.board, roughness: 0.8 });
  for (const side of [1, -1]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(W + 0.14, BOARD, 0.05), boardMat);
    const a = side === 1 ? ALPHA : -ALPHA;
    // centro da placa ao longo da face, um pouco para dentro do cavalete
    b.position.set(
      0,
      (-BOARD / 2) * Math.cos(a) - side * 0.06 * Math.sin(a),
      (BOARD / 2) * Math.sin(a) - side * 0.06 * Math.cos(a),
    );
    b.rotation.x = -a;
    b.castShadow = true;
    b.receiveShadow = true;
    rig.add(b);
  }

  // espiral
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xb9b6b8, metalness: 0.9, roughness: 0.28 });
  const ringGeo = new THREE.TorusGeometry(0.11, 0.013, 10, 28);
  for (let i = 1; i <= RINGS; i++) {
    const r = new THREE.Mesh(ringGeo, ringMat);
    r.rotation.y = Math.PI / 2;
    r.position.set(-W / 2 + (i * W) / (RINGS + 1), -0.03, 0);
    r.castShadow = true;
    rig.add(r);
  }

  // folhas: capa + 12 meses
  const art: ArtOptions = {
    year: opts.year,
    events: opts.events,
    font: opts.font,
    accent: opts.palette.accent,
    ink: opts.palette.ink,
    muted: opts.palette.muted,
    organization: opts.organization,
  };
  const tex = (c: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    return t;
  };
  const backTex = tex(drawBack(art, RINGS));
  const fronts = [drawCover(art, RINGS), ...Array.from({ length: 12 }, (_, m) => drawMonth(art, m, RINGS))].map(tex);
  const geo = new THREE.PlaneGeometry(W, H, 1, 56);
  geo.translate(0, -H / 2 - 0.06, 0);

  interface Page {
    u: PageUniforms;
    p: number;
    v: number;
    meshes: THREE.Mesh[];
  }
  const pages: Page[] = fronts.map((map) => {
    const u: PageUniforms = {
      uFlip: { value: 0 },
      uLag: { value: 0 },
      uLayer: { value: 0 },
      uH: { value: H },
      uAlpha: { value: ALPHA },
    };
    const front = new THREE.Mesh(geo, patch(new THREE.MeshStandardMaterial({ map, roughness: 0.92, side: THREE.FrontSide }), u));
    const back = new THREE.Mesh(geo, patch(new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.95, side: THREE.BackSide }), u));
    const depth = patch(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }), u, true);
    for (const m of [front, back]) {
      m.customDepthMaterial = depth;
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false;
      rig.add(m);
    }
    return { u, p: 0, v: 0, meshes: [front, back] };
  });

  const total = pages.length;
  // folhas a virar ao abrir: capa + meses até o mês de destino
  const intro = Math.min(total - 1, opts.startMonth + 1);
  let target = opts.reducedMotion ? intro : 0;
  let scrollExtra = 0;
  if (opts.reducedMotion) pages.forEach((pg, i) => (pg.p = i < intro ? 1 : 0));

  const layer = () => {
    const flipped = pages.filter((pg) => pg.p > 0.5).length;
    pages.forEach((pg, i) => {
      // folhas da frente: a de cima fica mais para fora; atrás, a última virada fica por fora
      const front = pg.p <= 0.5;
      const depth = front ? total - (i - flipped) : i + 1;
      pg.u.uLayer.value = (front ? 1 : -1) * (0.004 + depth * 0.0045);
      pg.u.uFlip.value = pg.p;
      pg.u.uLag.value = THREE.MathUtils.clamp(0.75 + pg.v * 0.25, 0.3, 1.4);
    });
  };

  let width = 0;
  let height = 0;
  const frame = () => {
    const aspect = width / height;
    const half = THREE.MathUtils.degToRad(camera.fov / 2);
    const objH = apexY + 0.5;
    const objW = W + 0.8;
    const dist = Math.max(objH / (2 * Math.tan(half)), objW / (2 * Math.tan(half) * aspect)) * 1.08;
    const elev = 0.2;
    camera.position.set(0, apexY * 0.5 + Math.sin(elev) * dist, Math.cos(elev) * dist);
    camera.lookAt(0, apexY * 0.47, 0);
  };
  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h || (w === width && h === height)) return;
    width = w;
    height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    frame();
    render();
  };

  const mouse = { x: 0, y: 0 };
  const onMove = (e: PointerEvent) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  };

  let t = 0;
  const render = () => {
    layer();
    renderer.render(scene, camera);
  };

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  let visible = true;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(canvas);
  resize();

  let raf = 0;
  let last = performance.now();
  const t0 = last;
  let turn = -0.32;
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!visible || document.hidden) return;
    t = (now - t0) / 1000;

    // abertura: uma folha a cada 0,55 s, começando depois de 0,7 s
    if (t > 0.7) target = Math.min(intro, Math.floor((t - 0.7) / 0.55) + 1);
    const goal = Math.min(total - 1, target + (t > 0.7 + intro * 0.55 ? scrollExtra : 0));

    pages.forEach((pg, i) => {
      const want = i < goal ? 1 : 0;
      // mola levemente amortecida: a folha acelera, desacelera e assenta
      const stiffness = 38;
      const damping = 10.5;
      const a = (want - pg.p) * stiffness - pg.v * damping;
      pg.v += a * dt;
      pg.p += pg.v * dt;
      if (pg.p < 0) {
        pg.p = 0;
        pg.v = 0;
      }
      if (pg.p > 1) {
        pg.p = 1;
        pg.v *= -0.25;
      }
    });

    // giro lento do cavalete, seguindo o mouse
    const goalTurn = -0.32 + mouse.x * 0.28 + Math.sin(t * 0.35) * 0.05;
    turn += (goalTurn - turn) * 0.04;
    rig.rotation.y = turn;
    rig.rotation.x = mouse.y * 0.04;
    render();
  };

  if (opts.reducedMotion) {
    rig.rotation.y = -0.32;
    render();
  } else {
    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(loop);
  }

  return {
    setScroll(p) {
      scrollExtra = Math.round(Math.max(0, Math.min(1, p)) * 4);
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      geo.dispose();
      ringGeo.dispose();
      fronts.forEach((f) => f.dispose());
      backTex.dispose();
      pages.forEach((pg) => pg.meshes.forEach((m) => (m.material as THREE.Material).dispose()));
      renderer.dispose();
    },
  };
}

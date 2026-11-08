// 3D scene for Pour the Tea: a teapot over a kitchen table, seen from across the table. Turning the
// forearm tips the pot left or right (the pot turns in the same direction as the hand, so what you see
// matches what you do). Tea streams from the spout into a glass cup with a green fill line. Pour too fast
// and tea splashes out; keep pouring past the line and the cup overflows. Full cups slide to the back of
// the table, so the row of served cups shows progress.
(() => {
"use strict";
const RC = window.RC, S3 = RC.Scene3D;
const P3 = { ensure: () => S3.ensure(), ready: () => S3.ready() };

const TABLE_Y = 0.75, CUP_X = 0.27, CUP_Z = -0.02, POT_Y = 1.07, CUP_H = 0.11, LINE_H = 0.088;

P3.create = function (opts) {
  if (!S3.ready()) return null;
  const THREE = S3.THREE, R = S3.getRenderer();
  if (!R) return null;
  const count = Math.max(1, Math.min(20, opts.count || 10)), calm = !!opts.calm;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe9dcc8);
  const glowTex = S3.glowTexture(), wood = S3.woodTexture("#9a6a44", 512, 256);
  wood.repeat.set(1, 1);

  // ---- light: warm morning sun through the window, soft fill
  scene.add(new THREE.HemisphereLight(0xfff3e0, 0x8a6a50, 1.5));
  const sun = new THREE.DirectionalLight(0xffe2b8, 2.6); sun.position.set(-1.2, 2.4, 0.6);
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.01;
  Object.assign(sun.shadow.camera, { left: -1.2, right: 1.2, top: 1.2, bottom: -1.2, near: 0.5, far: 6 });
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xcfe0ff, 0.6); rim.position.set(1.5, 1.6, -1.5); scene.add(rim);

  // ---- room: wall with wainscot, a window with curtains, a plant and a shelf
  const wallM = new THREE.MeshStandardMaterial({ color: 0xf1e3cc, roughness: 0.95 });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), wallM); wall.position.set(0, 1.6, -1.0); wall.receiveShadow = true; scene.add(wall);
  const wains = new THREE.Mesh(new THREE.BoxGeometry(8, 0.9, 0.03), new THREE.MeshStandardMaterial({ color: 0x7ea89a, roughness: 0.8 })); wains.position.set(0, 0.45, -0.98); scene.add(wains);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(8, 0.04, 0.05), new THREE.MeshStandardMaterial({ color: 0xf7efe2, roughness: 0.6 })); cap.position.set(0, 0.92, -0.97); scene.add(cap);
  {
    const win = new THREE.Group(); win.position.set(-0.55, 1.62, -0.985); scene.add(win);
    const skyC = document.createElement("canvas"); skyC.width = 64; skyC.height = 128;
    const sg = skyC.getContext("2d"), grd = sg.createLinearGradient(0, 0, 0, 128);
    grd.addColorStop(0, "#9fd0f0"); grd.addColorStop(0.7, "#e8f4fa"); grd.addColorStop(0.71, "#a9cf8f"); grd.addColorStop(1, "#7fb06a");
    sg.fillStyle = grd; sg.fillRect(0, 0, 64, 128);
    const skyT = new THREE.CanvasTexture(skyC); skyT.colorSpace = THREE.SRGBColorSpace;
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.8), new THREE.MeshBasicMaterial({ map: skyT })); win.add(pane);
    const frameM = new THREE.MeshStandardMaterial({ color: 0xfaf6ee, roughness: 0.5 });
    for (const [w, h, x, y] of [[1.0, 0.06, 0, 0.43], [1.0, 0.08, 0, -0.43], [0.06, 0.92, -0.48, 0], [0.06, 0.92, 0.48, 0], [0.035, 0.8, 0, 0], [0.9, 0.035, 0, 0.05]]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), frameM); b.position.set(x, y, 0.02); win.add(b);
    }
    const sill = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.035, 0.14), frameM); sill.position.set(0, -0.47, 0.06); win.add(sill);
    const curtM = new THREE.MeshStandardMaterial({ color: 0xe58f6f, roughness: 0.9, side: THREE.DoubleSide });
    for (const s of [-1, 1]) {
      const geo = new THREE.PlaneGeometry(0.32, 1.15, 12, 1), pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 40) * 0.02);
      geo.computeVertexNormals();
      const c = new THREE.Mesh(geo, curtM); c.position.set(s * 0.6, 0.0, 0.08); win.add(c);
    }
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.6, 8), new THREE.MeshStandardMaterial({ color: 0x6b4a30 })); rod.rotation.z = Math.PI / 2; rod.position.set(0, 0.58, 0.09); win.add(rod);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xfff1d0, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.set(1.8, 1.5, 1); glow.position.set(0, 0, 0.05); win.add(glow);
  }
  { // shelf with jars on the right
    const shelfM = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.7 });
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.035, 0.18), shelfM); shelf.position.set(0.85, 1.55, -0.9); shelf.castShadow = true; scene.add(shelf);
    const jarCols = [0xd9b26f, 0x9cc4b2, 0xe8a184, 0xc9d3e6];
    jarCols.forEach((c, i) => {
      const h = 0.12 + (i % 2) * 0.05;
      const j = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, h, 20), new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 }));
      j.position.set(0.55 + i * 0.2, 1.57 + h / 2, -0.88); j.castShadow = true; scene.add(j);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.02, 20), new THREE.MeshStandardMaterial({ color: 0x6b4a30 }));
      lid.position.set(0.55 + i * 0.2, 1.57 + h + 0.01, -0.88); scene.add(lid);
    });
  }
  { // plant on the window sill side of the table
    const potM = new THREE.MeshStandardMaterial({ color: 0xc8714a, roughness: 0.8 });
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.12, 20), potM); pot.position.set(-0.95, TABLE_Y + 0.06, -0.5); pot.castShadow = true; scene.add(pot);
    const leafM = new THREE.MeshStandardMaterial({ color: 0x4f8a4a, roughness: 0.7, side: THREE.DoubleSide });
    for (let i = 0; i < 9; i++) {
      const lf = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), leafM); lf.scale.set(0.45, 1.3, 0.12);
      const a = (i / 9) * Math.PI * 2; lf.position.set(-0.95 + Math.cos(a) * 0.04, TABLE_Y + 0.2 + (i % 3) * 0.03, -0.5 + Math.sin(a) * 0.04);
      lf.rotation.set(Math.sin(a) * 0.6, a, Math.cos(a) * 0.6); lf.castShadow = true; scene.add(lf);
    }
  }

  // ---- table with a linen runner
  const table = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.05, 1.3), new THREE.MeshStandardMaterial({ map: wood, roughness: 0.55 }));
  table.position.set(0, TABLE_Y - 0.025, -0.25); table.receiveShadow = true; scene.add(table);
  {
    const c = document.createElement("canvas"); c.width = 256; c.height = 64; const g = c.getContext("2d");
    g.fillStyle = "#f6efe2"; g.fillRect(0, 0, 256, 64); g.fillStyle = "rgba(200,110,80,0.55)";
    for (const y of [6, 12, 52, 58]) g.fillRect(0, y, 256, 2.5);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.set(4, 1);
    const run = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.42), new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }));
    run.rotation.x = -Math.PI / 2; run.position.set(0, TABLE_Y + 0.001, -0.05); run.receiveShadow = true; scene.add(run);
  }

  // ---- materials shared by the cups
  const glassM = new THREE.MeshPhysicalMaterial({ color: 0xeaf6ff, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.34, side: THREE.DoubleSide, depthWrite: false, clearcoat: 1 });
  const rimM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, transparent: true, opacity: 0.6 });
  const teaM = new THREE.MeshStandardMaterial({ color: 0x9a4512, roughness: 0.1, emissive: 0x3a1204, emissiveIntensity: 0.5, transparent: true, opacity: 0.88 });
  const saucerM = new THREE.MeshPhysicalMaterial({ color: 0xfbf7f0, roughness: 0.3, clearcoat: 0.6 });
  const lineM = new THREE.MeshBasicMaterial({ color: 0x22b866 });
  const saucerGeo = new THREE.LatheGeometry([V(0, 0, 0), V(0.07, 0, 0), V(0.082, 0.008, 0), V(0.09, 0.016, 0), V(0.088, 0.018, 0), V(0.075, 0.01, 0), V(0, 0.008, 0)].map((p) => new THREE.Vector2(p.x, p.y)), 40);
  const glassGeo = new THREE.CylinderGeometry(0.046, 0.04, CUP_H, 40, 1, true);
  const baseGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.008, 40);
  const rimGeo = new THREE.TorusGeometry(0.046, 0.0022, 6, 48);
  const handleGeo = new THREE.TorusGeometry(0.028, 0.006, 8, 24, Math.PI);
  const liquidGeo = new THREE.CylinderGeometry(1, 1, 1, 40); liquidGeo.translate(0, 0.5, 0);
  const lineGeo = new THREE.TorusGeometry(0.0475, 0.0028, 6, 48);
  const radAt = (y) => 0.0395 + (0.0055 * y) / CUP_H; // inside radius at height y in the cup

  function makeCup() {
    const grp = new THREE.Group();
    const saucer = new THREE.Mesh(saucerGeo, saucerM); saucer.receiveShadow = true; saucer.castShadow = true; grp.add(saucer);
    const body = new THREE.Group(); body.position.y = 0.012; grp.add(body);
    const liquid = new THREE.Mesh(liquidGeo, teaM); liquid.position.y = 0.006; liquid.scale.set(0.001, 0.001, 0.001); body.add(liquid);
    const base = new THREE.Mesh(baseGeo, glassM); base.position.y = 0.004; body.add(base);
    const glass = new THREE.Mesh(glassGeo, glassM); glass.position.y = CUP_H / 2; glass.castShadow = true; body.add(glass);
    const rimT = new THREE.Mesh(rimGeo, rimM); rimT.rotation.x = Math.PI / 2; rimT.position.y = CUP_H; body.add(rimT);
    const handle = new THREE.Mesh(handleGeo, glassM); handle.rotation.z = -Math.PI / 2; handle.position.set(0.046, CUP_H * 0.55, 0); handle.rotation.y = 0; body.add(handle);
    const line = new THREE.Mesh(lineGeo, lineM); line.rotation.x = Math.PI / 2; line.position.y = 0.006 + LINE_H; line.scale.setScalar(radAt(LINE_H) / 0.0395 * 0.98 + 0.03); body.add(line);
    scene.add(grp);
    return { grp, body, liquid, line, handle, fill: 0 };
  }
  function setFill(cup, f) { // f: 1 = at the line; above 1 rises to the brim
    cup.fill = f;
    const h = Math.max(0.0005, Math.min(CUP_H - 0.004, f * LINE_H));
    const r = radAt(h * 0.5);
    cup.liquid.scale.set(r, h, r); cup.liquid.visible = f > 0.002;
  }

  // ---- teapot: ceramic body (lathe), lid, spout and handle; spout points along +x
  const pot = new THREE.Group(); pot.position.set(0, POT_Y, -0.05); scene.add(pot);
  const yaw = new THREE.Group(); pot.add(yaw);
  const potM = new THREE.MeshPhysicalMaterial({ color: 0x2f7d78, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15 });
  const goldM = new THREE.MeshStandardMaterial({ color: 0xd8aa52, metalness: 0.9, roughness: 0.25 });
  {
    const prof = [[0, -0.07], [0.055, -0.07], [0.075, -0.064], [0.097, -0.042], [0.108, -0.01], [0.106, 0.02], [0.094, 0.045], [0.072, 0.062], [0.05, 0.068], [0.048, 0.068]];
    const body = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 56), potM); body.castShadow = true; yaw.add(body);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.1075, 0.0035, 8, 64), goldM); band.rotation.x = Math.PI / 2; band.position.y = -0.012; yaw.add(band);
    const lidProf = [[0, 0.098], [0.012, 0.097], [0.03, 0.088], [0.045, 0.076], [0.053, 0.069], [0.05, 0.066], [0, 0.066]];
    const lid = new THREE.Mesh(new THREE.LatheGeometry(lidProf.map(([x, y]) => new THREE.Vector2(x, y)), 40), potM); lid.castShadow = true; yaw.add(lid);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.014, 16, 12), goldM); knob.position.y = 0.106; yaw.add(knob);
    const spoutCurve = new THREE.CatmullRomCurve3([V(0.085, -0.025, 0), V(0.125, -0.012, 0), V(0.152, 0.018, 0), V(0.172, 0.056, 0)]);
    const spout = new THREE.Mesh(new THREE.TubeGeometry(spoutCurve, 24, 0.0145, 16, false), potM); spout.castShadow = true; yaw.add(spout);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.0145, 0.003, 8, 20), goldM); lip.position.set(0.172, 0.056, 0); lip.rotation.set(Math.PI / 2, 0.5, 0); yaw.add(lip);
    const handleCurve = new THREE.CatmullRomCurve3([V(-0.098, 0.04, 0), V(-0.155, 0.045, 0), V(-0.17, 0.0, 0), V(-0.145, -0.04, 0), V(-0.1, -0.045, 0)]);
    const handle = new THREE.Mesh(new THREE.TubeGeometry(handleCurve, 24, 0.011, 12, false), potM); handle.castShadow = true; yaw.add(handle);
  }
  const SPOUT = V(0.176, 0.06, 0), SPOUT_DIR = V(0.45, 0.9, 0).normalize();

  // ---- stream, splash ring, steam, drops and puddles
  const streamM = new THREE.MeshStandardMaterial({ color: 0xb8601f, roughness: 0.1, emissive: 0x5a2006, emissiveIntensity: 0.45, transparent: true, opacity: 0.92 });
  let stream = null;
  const splash = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffe6c0, transparent: true, opacity: 0, depthWrite: false })); splash.scale.setScalar(0.05); scene.add(splash);
  const steamM = new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
  const steam = []; for (let i = 0; i < 10; i++) { const s = new THREE.Sprite(steamM.clone()); s.visible = false; scene.add(s); steam.push({ s, k: i / 10 }); }
  const dropGeo = new THREE.SphereGeometry(0.006, 8, 6), drops = [];
  const puddleGeo = new THREE.CircleGeometry(1, 32), puddles = [];
  function addDrop(p, v) { const m = new THREE.Mesh(dropGeo, streamM); m.position.copy(p); scene.add(m); drops.push({ m, v, life: 1.6 }); }
  function addPuddle(x, z, r) {
    const m = new THREE.Mesh(puddleGeo, new THREE.MeshStandardMaterial({ color: 0x5e2a0c, roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.8 }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, TABLE_Y + 0.0015 + puddles.length * 0.0002, z); m.scale.set(0.001, 0.001 * 0.8, 1); scene.add(m);
    puddles.push({ m, r, grow: 0, life: 4 });
  }

  // ---- cups: the one being filled, and the row of served cups at the back
  let active = makeCup(), served = [], sliding = [], lastCup = 0, lastSpills = 0, curYaw = 0, overT = 0;
  const slot = (i) => { const sp = Math.min(0.13, 1.5 / count); return V((i - (count - 1) / 2) * sp, TABLE_Y, -0.52); };
  const sideX = (d) => d * CUP_X;
  active.grp.position.set(sideX(opts.dir || 1), TABLE_Y, CUP_Z);

  const cam = new THREE.PerspectiveCamera(40, 16 / 9, 0.05, 30);
  cam.position.set(0, 1.24, 0.72); cam.lookAt(0, 0.96, -0.08);

  const tipW = V(0, 0, 0), dirW = V(0, 0, 0), land = V(0, 0, 0), tmp = V(0, 0, 0);
  const world = {
    spout: tipW, cupTop: V(0, 0, 0), lineAt: V(0, 0, 0), pot: pot.position,
    // st: { roll (deg), dir, cup (reps done), fill (0..1 = to the line), pouring, rate (0..1), full, spills, overflow }
    frame(W, H, pr, st, t, dt) {
      cam.aspect = W / H; cam.fov = W / H < 1.3 ? 56 : 44; cam.updateProjectionMatrix();
      // a new cup: the full one slides to the back row, a fresh one slides in on the other side
      if (st.cup !== lastCup) {
        if (st.cup > lastCup) {
          const done = active; setFill(done, 1); done.line.visible = false;
          sliding.push({ cup: done, from: done.grp.position.clone(), to: slot(served.length), k: 0 }); served.push(done);
          active = makeCup(); active.grp.position.set(sideX(st.dir) * 3.2, TABLE_Y, CUP_Z);
          sliding.push({ cup: active, from: active.grp.position.clone(), to: V(sideX(st.dir), TABLE_Y, CUP_Z), k: 0 });
        }
        lastCup = st.cup;
      }
      sliding = sliding.filter((s) => {
        s.k = Math.min(1, s.k + dt / (calm ? 0.01 : 0.8)); const e = s.k * s.k * (3 - 2 * s.k);
        s.cup.grp.position.lerpVectors(s.from, s.to, e);
        s.cup.grp.position.y = TABLE_Y + Math.sin(e * Math.PI) * 0.03 * (s.to.z < -0.3 ? 1 : 0);
        if (s.to.z < -0.3) s.cup.grp.scale.setScalar(1 - 0.2 * e);
        return s.k < 1;
      });
      // the active cup's handle faces away from the pot
      active.handle.position.x = 0.046 * st.dir; active.handle.rotation.z = st.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
      setFill(active, st.overflow ? Math.max(st.fill, (CUP_H - 0.004) / LINE_H) : st.fill);
      active.line.material = lineM; lineM.color.set(st.fill >= 0.999 ? 0xf0b030 : 0x22b866);

      // pot: turn to face the cup, then tip with the forearm
      const wantYaw = st.dir > 0 ? 0 : Math.PI;
      curYaw += (wantYaw - curYaw) * (calm ? 1 : 1 - Math.exp(-dt * 6));
      yaw.rotation.y = curYaw;
      pot.rotation.z = -Math.max(-95, Math.min(95, st.roll)) * Math.PI / 180;
      pot.updateMatrixWorld(true);
      yaw.localToWorld(tipW.copy(SPOUT)); dirW.copy(SPOUT_DIR).transformDirection(yaw.matrixWorld);

      const cupP = active.grp.position, surf = 0.012 + 0.006 + Math.min(CUP_H, active.fill * LINE_H);
      land.set(cupP.x, cupP.y + surf, cupP.z);
      world.cupTop.set(cupP.x, cupP.y + 0.012 + CUP_H, cupP.z);
      world.lineAt.set(cupP.x + 0.05 * st.dir, cupP.y + 0.018 + LINE_H, cupP.z);

      // stream from spout to the tea's surface; thicker when tipped further
      if (stream) { stream.geometry.dispose(); scene.remove(stream); stream = null; }
      if (st.pouring) {
        const ctrl = tmp.copy(tipW).addScaledVector(dirW, 0.05 + st.rate * 0.05);
        const wob = calm ? 0 : Math.sin(t * 20) * 0.002;
        const curve = new THREE.QuadraticBezierCurve3(tipW.clone(), ctrl.clone(), V(land.x + wob, land.y, land.z));
        stream = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.0035 + st.rate * 0.0045, 8, false), streamM);
        scene.add(stream);
        splash.position.copy(land); splash.material.opacity = 0.7; splash.scale.setScalar(0.04 + (calm ? 0 : Math.sin(t * 25) * 0.008) + st.rate * 0.02);
      } else splash.material.opacity = Math.max(0, splash.material.opacity - dt * 4);

      // spills: too fast (a splash from the spout) or overflowing (tea runs over the rim)
      if (st.spills > lastSpills) {
        lastSpills = st.spills;
        const x = cupP.x + (Math.random() - 0.5) * 0.06, z = cupP.z + 0.06;
        addPuddle(x, z, 0.09); addPuddle(cupP.x - st.dir * 0.08, cupP.z + 0.02, 0.05);
        if (!calm) for (let i = 0; i < 18; i++) addDrop(tipW.clone(), V(dirW.x * 0.6 + (Math.random() - 0.5) * 0.8, 0.4 + Math.random() * 0.6, (Math.random() - 0.2) * 0.5));
      }
      if (st.overflow) {
        overT += dt;
        if (overT > 0.25) { overT = 0; if (puddles.length < 30) addPuddle(cupP.x + (Math.random() - 0.5) * 0.12, cupP.z + 0.04 + Math.random() * 0.05, 0.05); if (!calm) addDrop(V(cupP.x + (Math.random() - 0.5) * 0.09, cupP.y + 0.012 + CUP_H, cupP.z + 0.045), V(0, 0, 0.1)); }
      }
      drops.forEach((d) => {
        d.v.y -= 9.8 * dt * 0.6; d.m.position.addScaledVector(d.v, dt); d.life -= dt;
        if (d.m.position.y < TABLE_Y + 0.004) { d.m.position.y = TABLE_Y + 0.004; d.v.set(0, 0, 0); d.life = Math.min(d.life, 0.4); }
      });
      for (const d of drops.filter((d) => d.life <= 0)) scene.remove(d.m);
      for (let i = drops.length - 1; i >= 0; i--) if (drops[i].life <= 0) drops.splice(i, 1);
      puddles.forEach((p) => {
        p.grow = Math.min(1, p.grow + dt * 3); p.life -= dt;
        const s = p.r * (1 - Math.pow(1 - p.grow, 3)); p.m.scale.set(s, s * 0.75, 1);
        p.m.material.opacity = 0.8 * Math.min(1, p.life / 1.5);
      });
      for (let i = puddles.length - 1; i >= 0; i--) if (puddles[i].life <= 0) { scene.remove(puddles[i].m); puddles[i].m.material.dispose(); puddles.splice(i, 1); }

      // steam over a full cup
      steam.forEach((q, i) => {
        q.s.visible = !calm && st.full;
        if (!q.s.visible) return;
        q.k = (q.k + dt * 0.35) % 1;
        q.s.position.set(cupP.x + Math.sin(t * 1.3 + i) * 0.015 * (1 + q.k * 2), cupP.y + 0.012 + Math.min(CUP_H, active.fill * LINE_H) + 0.02 + q.k * 0.22, cupP.z);
        q.s.scale.setScalar(0.04 + q.k * 0.09); q.s.material.opacity = 0.32 * Math.sin(q.k * Math.PI);
      });

      return S3.renderTo(R, scene, cam, W, H, pr);
    },
    toScreen(p, W, H) { return S3.toScreen(cam, p, W, H); },
    dispose() { if (stream) stream.geometry.dispose(); S3.dispose(scene, [glowTex, wood]); },
  };
  return world;
};

RC.Pour3D = P3;
})();

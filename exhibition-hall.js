import * as T from './vendor/three.module.js';
import { box, mesh, material, glow, panel, room, copper } from './models.js';
import { mountThumbstick } from './touch-play.js';

// Each pedestal is a working miniature, viewed from the same walkable room.
export function createExhibitionHall(host, exhibits, onInspect, onRun) {
  const renderer = new T.WebGLRenderer({ antialias: true });
  const canvas = renderer.domElement;
  host.prepend(canvas);
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'Powder exhibition. Drag to look, use WASD or the arrow keys to walk. Select a machine to start its experiment.');
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.xr.enabled = true;
  const scene = new T.Scene();
  scene.background = new T.Color(0x172720);
  const rig = new T.Group();
  const camera = new T.PerspectiveCamera(53, 1, .05, 70);
  scene.add(rig); rig.add(camera);
  rig.position.set(0, 0, 7.9); camera.position.y = 2.25;
  camera.rotation.order = 'YXZ'; camera.rotation.x = -.12;
  scene.add(new T.HemisphereLight(0xf3f7d6, 0x485f54, 2.4));
  const lamp = new T.DirectionalLight(0xffdbad, 2.1);
  lamp.position.set(-4, 6, 4);
  scene.add(lamp);
  const fill = new T.DirectionalLight(0xa5e3db, .85);
  fill.position.set(5, 5, -3);
  scene.add(fill);
  const slate = material(0x50635a), brass = material(copper, { metalness: .36 });
  const ivory = material(0xd5c7a1), dark = material(0x34483d), aqua = glow(0x9ed9bb);
  const stationPositions = exhibits.map((_, index) => (index - 1) * 4.15);
  const gallery = room(scene, true);
  gallery.name = 'Powder gallery';
  gallery.scale.set(1.28, 1, 1.10);
  panel(scene, 5.45, .55, 0, 4.06, -4.48).draw('POWDER EXHIBITION');
  const circuitBoard = material(0x43614f);
  const stations = exhibits.map((e,i)=>{
    const group = new T.Group();
    group.name = `${e.field} station`;
    group.position.x = stationPositions[i];
    scene.add(group);
    box(group,[3.54,.12,1.94],dark,0,.10,0);
    box(group,[3.45,.68,1.87],dark,0,.47,0);
    box(group,[3.64,.14,2.04],brass,0,.87,0);
    const action = panel(group,2.89,.33,0,.49,.944);
    action.draw(e.action, '', '#c9e7d5');
    panel(group,2.84,.40,0,3.35,-4.43).draw(e.field, '', '#e8c29a');
    const proxy=box(group,[3.7,2.9,2.6],new T.MeshBasicMaterial({visible:false}),0,1.3,0);
    proxy.userData.index=i;
    return { group, proxy, action, start: null, duration: 0 };
  });
  const cornerPoints = [];
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      const x = side * 1.57;
      const y = end * .235;
      cornerPoints.push(new T.Vector3(x - side * .26, y, 0), new T.Vector3(x, y, 0),
        new T.Vector3(x, y, 0), new T.Vector3(x, y - end * .13, 0));
    }
  }
  const hint = new T.LineSegments(new T.BufferGeometry().setFromPoints(cornerPoints),
    new T.LineBasicMaterial({ color: 0xffd18c, toneMapped: false }));
  hint.position.set(0, .49, .989);
  hint.visible = false;
  scene.add(hint);
  let guided = -1;
  function guide(index) {
    if (guided === index) return;
    if (guided >= 0) stations[guided].action.draw(exhibits[guided].action, '', '#c9e7d5');
    guided = index;
    hint.visible = index >= 0;
    if (!hint.visible) return;
    const station = stations[index];
    hint.position.x = station.group.position.x;
    station.action.draw(exhibits[index].action, '', '#ffd18c', '#403525');
  }
  const circuit=stations[0].group;
  box(circuit,[2.85,.12,1.46],circuitBoard,0,1.13,0);
  for(const z of [-.40,.40]) box(circuit,[2.03,.06,.10],brass,0,1.22,z);
  box(circuit,[.14,.27,.89],dark,-1,1.33,0);
  box(circuit,[.13,.12,.88],brass,1,1.28,0);
  const bulb=mesh(circuit,new T.SphereGeometry(.28,22,16),material(0x738d72),.98,1.55,0);
  const bridge=box(circuit,[.64,.10,.16],brass,0,1.26,.4);
  const gap=box(circuit,[.61,.08,.17],circuitBoard,0,1.24,.4);
  const dots=Array.from({length:8},(_,j)=>mesh(circuit,new T.SphereGeometry(.041,8,6),aqua,0,1.3,0));
  let powderSample;
  let disposed = false;
  async function loadPowderSample() {
    const { GLTFLoader } = await import('./vendor/GLTFLoader.js');
    const { scene: model, animations } = await new GLTFLoader().loadAsync(new URL('./copper-grains.glb', import.meta.url).href);
    const clip = T.AnimationClip.findByName(animations, 'CopperGrainsJoin');
    if (disposed || !clip) {
      model.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); });
      return;
    }
    model.name = 'Copper grain sample GLB';
    model.position.set(0, 1.309, .40);
    circuit.add(model);
    const mixer = new T.AnimationMixer(model);
    const action = mixer.clipAction(clip);
    action.setLoop(T.LoopOnce, 0);
    action.clampWhenFinished = true;
    action.play();
    powderSample = { mixer, action, clip, lastProgress: 0 };
  }
  void loadPowderSample().catch(error => {
    if (!disposed) console.warn('Copper grain close-up unavailable', error);
  });
  const printer=stations[1].group;
  for(const x of [-1.14,1.14]) box(printer,[.15,1.6,.26],slate,x,1.76,-.25);
  box(printer,[2.45,.16,.3],ivory,0,2.55,-.25);
  box(printer,[2.15,.12,1.15],dark,0,1.04,0);
  const head=box(printer,[.32,.25,.35],brass,0,2.35,0);
  const beam=box(printer,[.024,1,.024],glow(0xffb878),0,1.75,0);
  const coils=[0,Math.PI].map(offset=>{
    const pts=Array.from({length:80},(_,j)=>new T.Vector3(.32*Math.cos(j/79*Math.PI*4+offset),1.11+j/79*.97,.32*Math.sin(j/79*Math.PI*4+offset)));
    return mesh(printer,new T.TubeGeometry(new T.CatmullRomCurve3(pts),80,.054,7,false),brass);
  });
  const tester=stations[2].group;
  const brushed = material(0xbaaeaa, { roughness: .43, metalness: .30 });
  const oilTone = material(0x966435, { roughness: .32, metalness: .24 });
  const wearInk = material(0x563237);
  const oilSteps = ['1 · Oil between discs', '2 · Press and spin', '3 · Lift the top discs'];
  const oilStepSign = panel(tester, 2.62, .26, 0, 2.54, .27);
  oilStepSign.face.visible = false;
  let currentOilStep = -1;
  const wearRigs = [-.78,.78].map((x, index) => {
    const disc = mesh(tester, new T.CylinderGeometry(.57,.62,.20,36), brushed, x, 1.08, 0);
    const oil = mesh(disc, new T.CylinderGeometry(.54,.54,.014,32), oilTone, 0,.103,0);
    box(disc,[.11,.019,.078],ivory,.471,.105,0);
    box(tester,[.14,1.20,.18],slate,x,1.60,-.57);
    box(tester,[.30,.14,.85],brass,x,2.16,-.22);
    const shaft = mesh(tester,new T.CylinderGeometry(.077,.092,.56,12),slate,x,1.86,0);
    const cap = mesh(tester, new T.CylinderGeometry(.43,.47,.15,32),brushed,x,1.76,0);
    box(cap,[.125,.018,.075],ivory,.31,.079,0);
    const marks = new T.Group();
    marks.name = index ? 'Copper oil wear marks' : 'Plain oil wear marks';
    disc.add(marks);
    for (let mark = 0; mark < (index ? 2 : 6); mark++) {
      const ring = mesh(marks, new T.TorusGeometry(.235+mark*.047,index ? .011 : .022,5,28,
        index ? 2.95 : 4.85), wearInk, 0,.116,0);
      ring.rotation.set(-Math.PI/2,0,mark*.68);
    }
    panel(tester,1.40,.24,x,.775,1.04).draw(index ? 'Oil + copper' : 'Plain oil','',index ? '#c9e7d5' : '#ebc49e');
    const verdict = panel(tester,1.33,.23,x,2.48,-.15);
    verdict.draw(index ? 'Fewer scratches' : 'More scratches','',index ? '#c9e7d5' : '#ebc49e');
    return { disc, oil, cap, shaft, marks, verdict: verdict.face };
  });
  function showWearTrial(progress) {
    const step = progress <= 0 || progress >= .94 ? -1 : progress < .22 ? 0 : progress < .78 ? 1 : 2;
    if (currentOilStep !== step) {
      currentOilStep = step;
      oilStepSign.face.visible = step >= 0;
      if (step >= 0) oilStepSign.draw(oilSteps[step], '', '#ffdea4', '#463924');
    }
    const press = T.MathUtils.smoothstep(progress,.22,.35) * (1 - T.MathUtils.smoothstep(progress,.78,.94));
    const spin = T.MathUtils.clamp((progress - .30) / .47,0,1) * Math.PI * 4.8;
    for (const { disc, oil, cap, shaft, marks, verdict } of wearRigs) {
      oil.visible = progress > .08;
      disc.rotation.y = spin;
      cap.rotation.y = -spin;
      cap.position.y = 1.80 - press * .53;
      shaft.position.y = (cap.position.y + 2.13) / 2;
      shaft.scale.y = (2.13 - cap.position.y) / .56;
      marks.visible = verdict.visible = progress >= .94;
    }
  }
  showWearTrial(0);
  const tracks=new Set(), ray=new T.Raycaster(), mouse=new T.Vector2();
  const look=new T.Vector3();
  const touchMove = new T.Vector2();
  const stick = mountThumbstick(host, (x, y) => touchMove.set(x, y));
  let pointer=null, last, hover=-1, session;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  function run(i, start, duration) {
    stations[i].start = start;
    stations[i].duration = duration;
  }
  const targets=stations.map(s=>s.proxy);
  function pick(e){
    const b=canvas.getBoundingClientRect();
    mouse.set((e.clientX-b.left)/b.width*2-1,1-(e.clientY-b.top)/b.height*2);
    ray.setFromCamera(mouse,camera);
    return ray.intersectObjects(targets,false)[0]?.object.userData.index ?? -1;
  }
  canvas.addEventListener('pointerdown', e => {
    if (pointer || e.button !== 0) return;
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(e.pointerId);
    pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, drag: false };
  });
  canvas.addEventListener('pointermove',e=>{
    if(pointer){
      if (pointer.id !== e.pointerId) return;
      const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
      if(Math.hypot(dx,dy)>=(e.pointerType === 'touch' ? 10 : 5) || pointer.drag){
        pointer.drag=true;camera.rotation.y-=dx*.005;
        camera.rotation.x=T.MathUtils.clamp(camera.rotation.x-dy*.004,-.9,.75);
        pointer.x=e.clientX;pointer.y=e.clientY;
      }
    } else {const i=pick(e);if(i!==hover && i>=0)onInspect(i);hover=i;canvas.style.cursor=i>=0?'pointer':'grab';}
  });
  canvas.addEventListener('pointerup', e => {
    if (pointer?.id !== e.pointerId) return;
    const clicked = !pointer.drag;
    pointer = null;
    if (!clicked) return;
    const i = pick(e);
    if (i >= 0) onRun(i);
  });
  for (const type of ['pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(type, e => { if (pointer?.id === e.pointerId) pointer = null; });
  }
  const keys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyW','KeyA','KeyS','KeyD'];
  function clearInput() {
    tracks.clear();
    pointer = null;
    stick.reset();
  }
  canvas.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || ['Escape', 'Tab', 'ContextMenu'].includes(event.key)) {
      clearInput();
      return;
    }
    if (!keys.includes(event.code) || renderer.xr.isPresenting) return;
    event.preventDefault();
    if (event.repeat) return;
    tracks.add(event.code);
  });
  const inputEvents = new AbortController();
  const listener = { signal: inputEvents.signal };
  // A release can land on another control or be consumed by a browser menu.
  window.addEventListener('keyup', event => tracks.delete(event.code), { ...listener, capture: true });
  window.addEventListener('contextmenu', clearInput, { ...listener, capture: true });
  canvas.addEventListener('blur', clearInput);
  window.addEventListener('blur', clearInput, listener);
  window.addEventListener('pagehide', clearInput, listener);
  window.addEventListener('resize', clearInput, listener);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearInput(); }, listener);
  const controller=renderer.xr.getController(0);rig.add(controller);
  const laser= new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-8)]),new T.LineBasicMaterial({color:0x9dddc2}));
  controller.add(laser);
  controller.addEventListener('select',()=>{ray.setFromXRController(controller);const h=ray.intersectObjects(targets,false)[0];if(h)onRun(h.object.userData.index);});
  const vr=host.querySelector('[data-hall-vr]');
  navigator.xr?.isSessionSupported('immersive-vr').then(ok=>vr.hidden=!ok).catch(()=>{});
  vr.onclick = async () => {
    try {
      session = await navigator.xr.requestSession('immersive-vr',{ optionalFeatures: ['local-floor'] });
      session.addEventListener('end', () => { session = undefined; requestAnimationFrame(applySize); }, { once: true });
      clearInput();
      await renderer.xr.setSession(session);
    } catch {
      session?.end().catch(() => {});
      vr.textContent = 'VR unavailable';
    }
  };
  function applySize() {
    const { clientWidth: width, clientHeight: height } = host;
    if (!width || !height || renderer.xr.isPresenting) return;
    const scale = Math.min(devicePixelRatio, 1.5, Math.sqrt(1_250_000 / (width * height)));
    renderer.setDrawingBufferSize(width,height,scale);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  applySize();
  const resize = new ResizeObserver(applySize);
  resize.observe(host);
  let visible = true;
  const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
  visibility.observe(host);
  renderer.setAnimationLoop(now=>{
    const dt = Math.min(.06, (now - (last ?? now)) / 1000);
    last = now;
    const reduced = motion.matches;
    if ((tracks.size || touchMove.lengthSq()) && !renderer.xr.isPresenting) {
      const x = Number(tracks.has('KeyD') || tracks.has('ArrowRight')) - Number(tracks.has('KeyA') || tracks.has('ArrowLeft'));
      const z = Number(tracks.has('KeyS') || tracks.has('ArrowDown')) - Number(tracks.has('KeyW') || tracks.has('ArrowUp'));
      look.set(x + touchMove.x, 0, z + touchMove.y).clampLength(0, 1).applyAxisAngle(T.Object3D.DEFAULT_UP, camera.rotation.y);
      rig.position.addScaledVector(look, dt * 3);
      rig.position.x=T.MathUtils.clamp(rig.position.x,-7.4,7.4);rig.position.z=T.MathUtils.clamp(rig.position.z,1.65,9);
    }
    const [a,b,c] = stations.map(({ start, duration }) => start === null ? 0
      : reduced ? 1 : T.MathUtils.clamp((now - start) / duration, 0, 1));
    if (powderSample && a !== powderSample.lastProgress) {
      const { mixer, action, clip, lastProgress } = powderSample;
      if (a < lastProgress) action.reset().play();
      mixer.setTime(clip.duration * a);
      powderSample.lastProgress = a;
    }
    bridge.visible=a>.45;gap.visible=!bridge.visible;bulb.material.emissive.setHex(bridge.visible?0xffcf47:0);
    dots.forEach((dot,i)=>{dot.visible=a>.45;const t=(i/8+(reduced?0:now*.0003))%1;dot.position.x=t<.5?-1+4*t:3-4*t;dot.position.z=t<.5?.4:-.4;});
    for(const coil of coils)coil.geometry.setDrawRange(0,Math.floor(b*80)*7*6);
    head.position.x=.32*Math.cos(b*4*Math.PI);head.position.z=.32*Math.sin(b*4*Math.PI);
    beam.visible=b>0&&b<1;beam.position.set(head.position.x,1.68+b*.45,head.position.z);beam.scale.y=1.15-b*.85;
    showWearTrial(c);
    if (visible || renderer.xr.isPresenting) renderer.render(scene,camera);
  });
  return { run, guide, dispose() {
    disposed = true;
    inputEvents.abort();
    stick.dispose();
    resize.disconnect();
    visibility.disconnect();
    renderer.setAnimationLoop(null);
    session?.end().catch(() => {});
    vr.onclick = null;
    powderSample?.mixer.stopAllAction();
    scene.traverse(o => { o.geometry?.dispose(); if (o.material) { o.material.map?.dispose(); o.material.dispose(); } });
    renderer.dispose();
    canvas.remove();
  } };
}

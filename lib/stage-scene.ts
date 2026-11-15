import * as THREE from "three";
import { INSTRUMENTS, type InstrumentId, type Score } from "./score";
import { STAGE_SECTIONS, playerPositions, sectionActivity } from "./stage";

export type StageState = {
  playing: boolean;
  selected: InstrumentId;
  step: number;
  score: Score;
  crescendo: number;
  motion: boolean;
  solo: InstrumentId | null;
  livePlaying: boolean;
};

// A small architectural maquette. No remote models, textures or animation assets.
export function createStage(
  host: HTMLDivElement,
  state: () => StageState,
  onSelect: (id: InstrumentId) => void,
) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);
  const scene = new THREE.Scene(),
    stage = new THREE.Group();
  scene.add(stage);
  const camera = new THREE.OrthographicCamera(-8, 8, 4, -4, 0.1, 80);
  const baseCamera = new THREE.Vector3(4.2, 11.5, 14.8);
  camera.position.copy(baseCamera);
  camera.lookAt(0, 0.1, 0);
  scene.add(new THREE.HemisphereLight(0xfff5db, 0x667b77, 2.3));
  const key = new THREE.DirectionalLight(0xffefd4, 3.2);
  key.position.set(-4, 9, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -8;
  key.shadow.camera.right = 8;
  key.shadow.camera.top = 6;
  key.shadow.camera.bottom = -6;
  key.shadow.normalBias = 0.035;
  key.shadow.bias = -0.0003;
  key.shadow.blurSamples = 4;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xd7e4eb, 1.6);
  fill.position.set(6, 5, -2);
  scene.add(fill);

  const geometries = new Set<THREE.BufferGeometry>(),
    materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const material = (
    color: THREE.ColorRepresentation,
    roughness = 0.8,
    metalness = 0,
  ) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    materials.add(m);
    return m;
  };
  const wood = material("#b8a88d"),
    edge = material("#85715a"),
    black = material("#282e2d"),
    metal = material("#555b57", 0.5, 0.5);
  const paper = material("#f2e9d0"),
    skin = material("#b4a38a"),
    stringsWood = material("#9a5630", 0.35),
    brass = material("#ba9452", 0.28, 0.65),
    silver = material("#a7b7b5", 0.3, 0.65);
  const mesh = (
    geometry: THREE.BufferGeometry,
    mat: THREE.Material | THREE.Material[],
    parent: THREE.Object3D,
    x = 0,
    y = 0,
    z = 0,
  ) => {
    geometries.add(geometry);
    const object = new THREE.Mesh(geometry, mat);
    object.position.set(x, y, z);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  };
  const box = (
    parent: THREE.Object3D,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) => mesh(new THREE.BoxGeometry(w, h, d), mat, parent, x, y, z);
  const rod = (
    parent: THREE.Object3D,
    mat: THREE.Material,
    a: THREE.Vector3,
    b: THREE.Vector3,
    radius: number,
  ) => {
    const direction = b.clone().sub(a);
    const object = mesh(
      new THREE.CylinderGeometry(radius, radius, direction.length(), 6),
      mat,
      parent,
    );
    object.position.copy(a).add(b).multiplyScalar(0.5);
    object.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize(),
    );
    return object;
  };
  const sphere = (
    parent: THREE.Object3D,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    radius: number,
  ) => mesh(new THREE.SphereGeometry(radius, 10, 8), mat, parent, x, y, z);

  // Procedural oak board grain, sized once and reused by the stage top.
  const grainCanvas = document.createElement("canvas");
  grainCanvas.width = grainCanvas.height = 512;
  const grain = grainCanvas.getContext("2d");
  if (grain) {
    grain.fillStyle = "#d5c7ae";
    grain.fillRect(0, 0, 512, 512);
    for (let board = 0; board < 16; board++) {
      grain.fillStyle =
        board % 3 === 0 ? "#d8cbb4" : board % 3 === 1 ? "#d4c6ac" : "#cfbfa3";
      grain.fillRect(board * 32, 0, 31, 512);
      for (let i = 0; i < 10; i++) {
        grain.strokeStyle = `rgba(91,64,34,${0.018 + (i % 3) * 0.01})`;
        grain.beginPath();
        grain.moveTo(board * 32 + i * 3, 0);
        grain.bezierCurveTo(
          board * 32 + i * 3 + 5,
          150,
          board * 32 + i * 3 - 4,
          350,
          board * 32 + i * 3,
          512,
        );
        grain.stroke();
      }
    }
    const texture = new THREE.CanvasTexture(grainCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    textures.add(texture);
    wood.map = texture;
  }
  const floor = mesh(
    new THREE.CylinderGeometry(6.25, 6.25, 0.22, 96),
    [wood, wood, edge],
    stage,
    0,
    -0.15,
    0,
  );
  floor.scale.z = 0.65;
  const shadowMat = new THREE.ShadowMaterial({ opacity: 0.13 });
  materials.add(shadowMat);
  const ground = mesh(
    new THREE.PlaneGeometry(40, 30),
    shadowMat,
    scene,
    0,
    -0.29,
    0,
  );
  ground.rotation.x = -Math.PI / 2;
  ground.castShadow = false;
  // Low terraces give the back rows height, without enclosing the small stage.
  box(stage, edge, 0, -0.005, -2.5, 7.1, 0.15, 1.65);
  box(stage, wood, 0, 0.075, -2.5, 7.1, 0.025, 1.65);
  // Acoustic timber fins at the rear, as seen in a concert hall.
  for (let i = 0; i < 15; i++) {
    const x = (i - 7) * 0.62,
      z = -3.45 + Math.abs(i - 7) * 0.085;
    const fin = box(stage, i % 2 ? wood : edge, x, 0.65, z, 0.08, 1.3, 0.15);
    fin.castShadow = false;
  }

  type Player = {
    id: InstrumentId;
    pivot: THREE.Group;
    bow?: THREE.Group;
    arms?: THREE.Group;
    phase: number;
    cloth: THREE.MeshStandardMaterial;
  };
  const players: Player[] = [];
  const mallets: { pivot: THREE.Group; phase: number }[] = [];
  const targets: THREE.Object3D[] = [];
  function musicStand(parent: THREE.Object3D, x = 0, z = 0.45) {
    rod(
      parent,
      metal,
      new THREE.Vector3(x, 0.04, z),
      new THREE.Vector3(x, 0.64, z),
      0.012,
    );
    for (const angle of [0, 2.1, 4.2])
      rod(
        parent,
        metal,
        new THREE.Vector3(x, 0.04, z),
        new THREE.Vector3(
          x + Math.cos(angle) * 0.12,
          0.025,
          z + Math.sin(angle) * 0.12,
        ),
        0.008,
      );
    const desk = box(parent, black, x, 0.7, z, 0.28, 0.19, 0.016);
    desk.rotation.x = -0.24;
    const sheet = box(parent, paper, x, 0.702, z + 0.012, 0.22, 0.15, 0.003);
    sheet.rotation.x = -0.24;
    for (let line = 0; line < 4; line++)
      box(parent, metal, x, 0.67 + line * 0.024, z + 0.024, 0.15, 0.002, 0.002);
  }
  function seatedPlayer(
    id: InstrumentId,
    parent: THREE.Object3D,
    x: number,
    z: number,
    i: number,
  ) {
    const root = new THREE.Group();
    root.position.set(x, z < -1.8 ? 0.09 : 0, z);
    root.rotation.y = Math.atan2(-x, 3.2 - z) * 0.32;
    parent.add(root);
    const inst = INSTRUMENTS.find((s) => s.id === id)!;
    const seat = material(inst.color);
    box(root, seat, 0, 0.29, 0, 0.3, 0.055, 0.27);
    const back = box(root, black, 0, 0.47, -0.11, 0.28, 0.19, 0.035);
    back.rotation.x = -0.08;
    for (const sx of [-0.11, 0.11])
      for (const sz of [-0.1, 0.1])
        rod(
          root,
          metal,
          new THREE.Vector3(sx, 0.28, sz),
          new THREE.Vector3(sx * 1.15, 0.025, sz * 1.2),
          0.012,
        );
    const pivot = new THREE.Group();
    pivot.position.set(0, 0.32, 0);
    root.add(pivot);
    const cloth = material(new THREE.Color(inst.color).multiplyScalar(0.42));
    const body = mesh(
      new THREE.CylinderGeometry(0.075, 0.12, 0.29, 8),
      cloth,
      pivot,
      0,
      0.18,
      0,
    );
    body.scale.z = 0.8;
    sphere(pivot, skin, 0, 0.42, 0.015, 0.075);
    sphere(pivot, black, 0, 0.46, -0.01, 0.07).scale.y = 0.58;
    for (const sx of [-0.07, 0.07]) {
      rod(
        root,
        black,
        new THREE.Vector3(sx, 0.3, 0.06),
        new THREE.Vector3(sx, 0.17, 0.2),
        0.032,
      );
      rod(
        root,
        black,
        new THREE.Vector3(sx, 0.17, 0.2),
        new THREE.Vector3(sx, 0.035, 0.22),
        0.025,
      );
    }
    const arms = new THREE.Group();
    arms.position.set(0, 0.24, 0.02);
    pivot.add(arms);
    rod(
      arms,
      cloth,
      new THREE.Vector3(-0.08, 0, 0),
      new THREE.Vector3(-0.17, -0.06, 0.2),
      0.025,
    );
    rod(
      arms,
      cloth,
      new THREE.Vector3(0.08, 0, 0),
      new THREE.Vector3(0.17, -0.04, 0.17),
      0.025,
    );
    musicStand(root, 0, 0.48);
    let bow: THREE.Group | undefined;
    if (id === "strings" || id === "cello") {
      const instrument = new THREE.Group();
      pivot.add(instrument);
      instrument.position.set(
        id === "strings" ? -0.1 : 0,
        id === "strings" ? 0.27 : 0.04,
        id === "strings" ? 0.16 : 0.25,
      );
      instrument.rotation.z = id === "strings" ? -1.05 : -0.1;
      const shape = sphere(
        instrument,
        stringsWood,
        0,
        0,
        0,
        id === "strings" ? 0.1 : 0.17,
      );
      shape.scale.set(0.6, 1, 0.24);
      sphere(
        instrument,
        stringsWood,
        0,
        0.08,
        0,
        id === "strings" ? 0.065 : 0.11,
      ).scale.set(0.7, 1, 0.24);
      rod(
        instrument,
        black,
        new THREE.Vector3(0, 0, 0.025),
        new THREE.Vector3(0, id === "strings" ? 0.24 : 0.38, 0.025),
        0.012,
      );
      bow = new THREE.Group();
      bow.position.set(0, 0.04, 0.04);
      instrument.add(bow);
      rod(
        bow,
        paper,
        new THREE.Vector3(-0.18, -0.04, 0),
        new THREE.Vector3(0.2, 0.04, 0),
        0.005,
      );
    } else if (id === "woodwinds") {
      rod(
        pivot,
        silver,
        new THREE.Vector3(-0.22, 0.31, 0.17),
        new THREE.Vector3(0.2, 0.31, 0.17),
        0.011,
      );
    } else if (id === "brass") {
      const ring = mesh(
        new THREE.TorusGeometry(0.095, 0.018, 6, 16),
        brass,
        pivot,
        0.01,
        0.17,
        0.19,
      );
      ring.rotation.y = 0.4;
      const bell = mesh(
        new THREE.ConeGeometry(0.08, 0.14, 12, 1, true),
        brass,
        pivot,
        0.15,
        0.13,
        0.22,
      );
      bell.rotation.z = -0.9;
    }
    players.push({ id, pivot, bow, arms, phase: i * 0.7, cloth });
  }
  for (const section of STAGE_SECTIONS) {
    const group = new THREE.Group();
    group.userData.section = section.id;
    stage.add(group);
    for (const [i, p] of playerPositions(section).entries()) {
      if (["strings", "cello", "woodwinds", "brass"].includes(section.id))
        seatedPlayer(section.id, group, p.x, p.z, i);
      else if (section.id === "percussion") {
        const mallet = new THREE.Group();
        mallet.position.set(p.x + 0.15, 0.68, p.z + 0.12);
        group.add(mallet);
        rod(
          mallet,
          stringsWood,
          new THREE.Vector3(),
          new THREE.Vector3(-0.15, 0.14, -0.1),
          0.009,
        );
        sphere(mallet, paper, -0.15, 0.14, -0.1, 0.035);
        mallets.push({ pivot: mallet, phase: i * 0.9 });
        const drum = mesh(
          new THREE.SphereGeometry(
            0.27,
            16,
            10,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2,
          ),
          brass,
          group,
          p.x,
          0.53,
          p.z,
        );
        drum.rotation.x = Math.PI;
        mesh(
          new THREE.CylinderGeometry(0.27, 0.27, 0.024, 24),
          paper,
          group,
          p.x,
          0.545,
          p.z,
        );
        for (const dx of [-0.16, 0.16])
          rod(
            group,
            metal,
            new THREE.Vector3(p.x + dx, 0.31, p.z),
            new THREE.Vector3(p.x + dx * 1.3, 0.06, p.z + 0.1),
            0.014,
          );
      } else if (section.id === "harp") {
        rod(
          group,
          brass,
          new THREE.Vector3(p.x - 0.2, 0.05, p.z),
          new THREE.Vector3(p.x - 0.2, 1.3, p.z),
          0.04,
        );
        rod(
          group,
          stringsWood,
          new THREE.Vector3(p.x - 0.2, 1.3, p.z),
          new THREE.Vector3(p.x + 0.35, 0.9, p.z),
          0.05,
        );
        rod(
          group,
          stringsWood,
          new THREE.Vector3(p.x + 0.35, 0.9, p.z),
          new THREE.Vector3(p.x - 0.2, 0.05, p.z),
          0.055,
        );
        for (let j = 1; j < 9; j++)
          rod(
            group,
            paper,
            new THREE.Vector3(p.x - 0.2 + j * 0.055, 1.3 - j * 0.04, p.z),
            new THREE.Vector3(p.x - 0.2 + j * 0.055, 0.05 + j * 0.082, p.z),
            0.002,
          );
      } else {
        const synth = box(group, black, p.x, 0.67, p.z, 0.82, 0.09, 0.35);
        synth.rotation.x = -0.1;
        if (section.id === "pulse")
          for (let j = 0; j < 16; j++)
            box(
              group,
              paper,
              p.x - 0.35 + j * 0.045,
              0.73,
              p.z + 0.06,
              0.04,
              0.015,
              0.18,
            );
        else
          for (let j = 0; j < 12; j++)
            sphere(
              group,
              j % 3 ? silver : brass,
              p.x - 0.3 + (j % 6) * 0.12,
              0.73,
              p.z + (j < 6 ? -0.07 : 0.07),
              0.015,
            );
        for (const dx of [-0.3, 0.3])
          rod(
            group,
            metal,
            new THREE.Vector3(p.x + dx, 0.6, p.z),
            new THREE.Vector3(p.x - dx, 0.03, p.z),
            0.02,
          );
      }
    }
    // A generous transparent target makes the entire section clickable.
    const targetMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    materials.add(targetMaterial);
    const target = box(
      group,
      targetMaterial,
      section.x,
      0.6,
      section.z,
      Math.max(1, section.columns * 0.67),
      1.3,
      Math.max(1, section.rows * 0.78),
    );
    target.castShadow = target.receiveShadow = false;
    target.userData.section = section.id;
    targets.push(target);
  }

  const podium = box(stage, edge, 0, 0.08, 3.15, 0.85, 0.16, 0.62);
  podium.receiveShadow = true;
  box(stage, wood, 0, 0.17, 3.15, 0.85, 0.03, 0.62);
  const conductor = new THREE.Group();
  conductor.position.set(0, 0.19, 3.15);
  conductor.rotation.y = Math.PI;
  stage.add(conductor);
  for (const x of [-0.09, 0.09])
    rod(
      conductor,
      black,
      new THREE.Vector3(x, 0.05, 0),
      new THREE.Vector3(x, 0.44, 0),
      0.04,
    );
  mesh(
    new THREE.CylinderGeometry(0.11, 0.15, 0.38, 10),
    black,
    conductor,
    0,
    0.6,
    0,
  );
  sphere(conductor, skin, 0, 0.91, 0.02, 0.09);
  const baton = new THREE.Group();
  baton.position.set(-0.1, 0.73, 0);
  conductor.add(baton);
  rod(
    baton,
    black,
    new THREE.Vector3(),
    new THREE.Vector3(-0.2, -0.02, 0.17),
    0.03,
  );
  rod(
    baton,
    paper,
    new THREE.Vector3(-0.2, -0.02, 0.17),
    new THREE.Vector3(-0.43, 0.2, 0.3),
    0.007,
  );
  rod(
    conductor,
    black,
    new THREE.Vector3(0.1, 0.73, 0),
    new THREE.Vector3(0.28, 0.71, 0.2),
    0.03,
  );
  musicStand(conductor, 0, 0.47);

  const pointer = new THREE.Vector2(),
    targetPointer = new THREE.Vector2(),
    zeroPointer = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const pointerMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const rect = canvas.getBoundingClientRect();
    targetPointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      ((event.clientY - rect.top) / rect.height) * 2 - 1,
    );
  };
  const pointerLeave = () => targetPointer.set(0, 0);
  const click = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    raycaster.setFromCamera(
      new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      camera,
    );
    const hit = raycaster.intersectObjects(targets, false)[0];
    if (hit) onSelect(hit.object.userData.section as InstrumentId);
  };
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerleave", pointerLeave);
  canvas.addEventListener("click", click);
  let dirty = true;
  let previous: StageState | undefined;
  let settleUntil = 0;
  const resize = () => {
    const width = host.clientWidth,
      height = host.clientHeight;
    if (!width || !height) return;
    const aspect = width / height,
      vertical = Math.max(7.25, 14.5 / aspect);
    camera.left = (-vertical * aspect) / 2;
    camera.right = (vertical * aspect) / 2;
    camera.top = vertical / 2;
    camera.bottom = -vertical / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    dirty = true;
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();
  let visible = true,
    disposed = false,
    frame = 0,
    last = 0,
    lastStep = -1,
    stepTime = 0;
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) dirty = true;
  });
  visibility.observe(host);
  const draw = (now: number) => {
    if (disposed) return;
    frame = requestAnimationFrame(draw);
    if (!visible || document.hidden || now - last < 1000 / 30) return;
    last = now;
    const s = state();
    const changed =
      !previous ||
      previous.score !== s.score ||
      previous.selected !== s.selected ||
      previous.motion !== s.motion ||
      previous.playing !== s.playing ||
      previous.livePlaying !== s.livePlaying ||
      previous.crescendo !== s.crescendo ||
      previous.solo !== s.solo;
    if (changed) settleUntil = now + 850;
    const pointerMoving =
      pointer.distanceTo(s.motion ? targetPointer : zeroPointer) > 0.002;
    const moving = s.motion && (s.playing || s.livePlaying);
    if (!dirty && !changed && !moving && !pointerMoving && now > settleUntil)
      return;
    previous = s;
    dirty = false;
    if (s.step !== lastStep) {
      stepTime = now;
      lastStep = s.step;
    }
    const stepFraction = Math.min(
      1,
      (now - stepTime) / (60000 / s.score.bpm / 4),
    );
    const beat = s.playing
      ? Math.max(0, s.step + stepFraction) / 4
      : (now * s.score.bpm) / 60000;
    pointer.lerp(s.motion ? targetPointer : zeroPointer, 0.045);
    camera.position.set(
      baseCamera.x + pointer.x * 0.3,
      baseCamera.y - pointer.y * 0.2,
      baseCamera.z,
    );
    camera.lookAt(0, 0.1, 0);
    for (const player of players) {
      const activity =
        s.crescendo > 0 && ["cello", "pulse"].includes(player.id)
          ? 0
          : sectionActivity(
              s.score,
              player.id,
              s.step,
              s.solo,
              s.selected,
              s.livePlaying,
              s.playing,
            );
      const swing = moving
        ? Math.sin(beat * Math.PI * 2 + player.phase * 0.08) * activity
        : 0;
      player.pivot.rotation.z = THREE.MathUtils.lerp(
        player.pivot.rotation.z,
        swing * 0.015,
        0.18,
      );
      if (player.bow)
        player.bow.position.x = THREE.MathUtils.lerp(
          player.bow.position.x,
          swing * 0.055,
          0.25,
        );
      if (player.arms)
        player.arms.rotation.x = THREE.MathUtils.lerp(
          player.arms.rotation.x,
          swing * 0.025,
          0.2,
        );
      player.cloth.emissive.set(
        s.selected === player.id
          ? INSTRUMENTS.find((i) => i.id === player.id)!.color
          : "#000000",
      );
      player.cloth.emissiveIntensity = 0.12;
    }
    const percussion = sectionActivity(
      s.score,
      "percussion",
      s.step,
      s.solo,
      s.selected,
      s.livePlaying,
      s.playing,
    );
    for (const mallet of mallets) {
      const hit =
        moving && percussion
          ? Math.max(0, Math.sin(beat * Math.PI * 2 + mallet.phase)) * 0.25
          : 0;
      mallet.pivot.rotation.z = THREE.MathUtils.lerp(
        mallet.pivot.rotation.z,
        hit,
        0.2,
      );
    }
    baton.rotation.z = THREE.MathUtils.lerp(
      baton.rotation.z,
      s.motion && s.playing ? Math.sin(beat * Math.PI * 2) * 0.22 : -0.08,
      0.25,
    );
    baton.rotation.x = THREE.MathUtils.lerp(
      baton.rotation.x,
      s.motion && s.playing ? Math.cos(beat * Math.PI * 2) * 0.14 : 0,
      0.25,
    );
    key.intensity = THREE.MathUtils.lerp(
      key.intensity,
      3.2 + s.crescendo * 0.8,
      0.04,
    );
    renderer.render(scene, camera);
  };
  draw(performance.now());
  return {
    canvas,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibility.disconnect();
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerleave", pointerLeave);
      canvas.removeEventListener("click", click);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}

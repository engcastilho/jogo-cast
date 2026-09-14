(() => {
  const container = document.getElementById('game');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlaySubtitle = document.getElementById('overlaySubtitle');

  // Coordenadas lógicas do jogo (mesma física do Pong 2D original)
  const W = 800;
  const H = 500;

  const PADDLE_W = 12;
  const PADDLE_H = 90;
  const PADDLE_SPEED = 6.5;
  const BALL_SIZE = 12;
  const BALL_SPEED_START = 5;
  const BALL_SPEED_MAX = 12;
  const WIN_SCORE = 7;

  const score1El = document.getElementById('score1');
  const score2El = document.getElementById('score2');
  const p2LabelEl = document.getElementById('p2Label');
  const mode1pBtn = document.getElementById('mode1p');
  const mode2pBtn = document.getElementById('mode2p');
  const pauseBtn = document.getElementById('pauseBtn');
  const restartBtn = document.getElementById('restartBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');

  let vsCPU = true;
  let paused = false;
  let gameOver = false;

  const state = {
    p1: { x: 20, y: H / 2 - PADDLE_H / 2, dy: 0 },
    p2: { x: W - 20 - PADDLE_W, y: H / 2 - PADDLE_H / 2, dy: 0 },
    ball: { x: W / 2, y: H / 2, dx: BALL_SPEED_START, dy: BALL_SPEED_START * 0.6 },
    score1: 0,
    score2: 0,
  };

  const keys = {};

  window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ') {
      e.preventDefault();
      togglePause();
    }
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
  });

  function togglePause() {
    if (gameOver) return;
    paused = !paused;
    pauseBtn.textContent = paused ? 'Continuar' : 'Pausar';
    updateOverlay();
  }

  pauseBtn.addEventListener('click', togglePause);
  restartBtn.addEventListener('click', resetGame);

  function toggleFullscreen() {
    const isFs = document.fullscreenElement || document.webkitFullscreenElement;
    if (isFs) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else {
      const req = container.requestFullscreen || container.webkitRequestFullscreen;
      req.call(container);
    }
  }

  function updateFullscreenBtn() {
    const isFs = document.fullscreenElement || document.webkitFullscreenElement;
    fullscreenBtn.textContent = isFs ? 'Sair da tela cheia' : 'Tela cheia';
    resize();
  }

  if (container.requestFullscreen || container.webkitRequestFullscreen) {
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', updateFullscreenBtn);
    document.addEventListener('webkitfullscreenchange', updateFullscreenBtn);
  } else {
    fullscreenBtn.hidden = true;
  }

  mode1pBtn.addEventListener('click', () => setMode(true));
  mode2pBtn.addEventListener('click', () => setMode(false));

  function setMode(cpu) {
    vsCPU = cpu;
    mode1pBtn.classList.toggle('active', cpu);
    mode2pBtn.classList.toggle('active', !cpu);
    p2LabelEl.textContent = cpu ? 'CPU' : 'Jogador 2';
    resetGame();
  }

  function resetGame() {
    state.score1 = 0;
    state.score2 = 0;
    score1El.textContent = '0';
    score2El.textContent = '0';
    gameOver = false;
    paused = false;
    pauseBtn.textContent = 'Pausar';
    resetBall(Math.random() < 0.5 ? 1 : -1);
    state.p1.y = H / 2 - PADDLE_H / 2;
    state.p2.y = H / 2 - PADDLE_H / 2;
    updateOverlay();
  }

  function resetBall(direction) {
    state.ball.x = W / 2;
    state.ball.y = H / 2;
    const angle = (Math.random() * 0.6 - 0.3);
    state.ball.dx = BALL_SPEED_START * direction;
    state.ball.dy = BALL_SPEED_START * angle * 2;
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function update() {
    if (paused || gameOver) return;

    if (keys['w']) state.p1.y -= PADDLE_SPEED;
    if (keys['s']) state.p1.y += PADDLE_SPEED;
    state.p1.y = clamp(state.p1.y, 0, H - PADDLE_H);

    if (vsCPU) {
      const target = state.ball.y - PADDLE_H / 2;
      const center = state.p2.y;
      const diff = target - center;
      const cpuSpeed = PADDLE_SPEED * 0.82;
      if (Math.abs(diff) > 4) {
        state.p2.y += clamp(diff, -cpuSpeed, cpuSpeed);
      }
    } else {
      if (keys['arrowup']) state.p2.y -= PADDLE_SPEED;
      if (keys['arrowdown']) state.p2.y += PADDLE_SPEED;
    }
    state.p2.y = clamp(state.p2.y, 0, H - PADDLE_H);

    const b = state.ball;
    b.x += b.dx;
    b.y += b.dy;

    if (b.y - BALL_SIZE / 2 <= 0) {
      b.y = BALL_SIZE / 2;
      b.dy *= -1;
    } else if (b.y + BALL_SIZE / 2 >= H) {
      b.y = H - BALL_SIZE / 2;
      b.dy *= -1;
    }

    if (
      b.dx < 0 &&
      b.x - BALL_SIZE / 2 <= state.p1.x + PADDLE_W &&
      b.x - BALL_SIZE / 2 >= state.p1.x &&
      b.y >= state.p1.y &&
      b.y <= state.p1.y + PADDLE_H
    ) {
      b.x = state.p1.x + PADDLE_W + BALL_SIZE / 2;
      const hitPos = (b.y - (state.p1.y + PADDLE_H / 2)) / (PADDLE_H / 2);
      const speed = Math.min(Math.hypot(b.dx, b.dy) * 1.06, BALL_SPEED_MAX);
      b.dx = Math.abs(speed * Math.cos(hitPos * 0.9));
      b.dy = speed * Math.sin(hitPos * 0.9);
      bumpBall(1);
    }

    if (
      b.dx > 0 &&
      b.x + BALL_SIZE / 2 >= state.p2.x &&
      b.x + BALL_SIZE / 2 <= state.p2.x + PADDLE_W &&
      b.y >= state.p2.y &&
      b.y <= state.p2.y + PADDLE_H
    ) {
      b.x = state.p2.x - BALL_SIZE / 2;
      const hitPos = (b.y - (state.p2.y + PADDLE_H / 2)) / (PADDLE_H / 2);
      const speed = Math.min(Math.hypot(b.dx, b.dy) * 1.06, BALL_SPEED_MAX);
      b.dx = -Math.abs(speed * Math.cos(hitPos * 0.9));
      b.dy = speed * Math.sin(hitPos * 0.9);
      bumpBall(2);
    }

    if (b.x < -BALL_SIZE) {
      state.score2++;
      score2El.textContent = state.score2;
      flashScore(score2El);
      checkWin();
      if (!gameOver) resetBall(1);
    } else if (b.x > W + BALL_SIZE) {
      state.score1++;
      score1El.textContent = state.score1;
      flashScore(score1El);
      checkWin();
      if (!gameOver) resetBall(-1);
    }
  }

  function checkWin() {
    if (state.score1 >= WIN_SCORE || state.score2 >= WIN_SCORE) {
      gameOver = true;
      updateOverlay();
    }
  }

  function updateOverlay() {
    if (gameOver) {
      const winner = state.score1 > state.score2 ? 'Jogador 1' : (vsCPU ? 'CPU' : 'Jogador 2');
      overlayTitle.textContent = `${winner} venceu!`;
      overlaySubtitle.textContent = 'Clique em Reiniciar para jogar novamente';
      overlay.hidden = false;
    } else if (paused) {
      overlayTitle.textContent = 'PAUSADO';
      overlaySubtitle.textContent = '';
      overlay.hidden = false;
    } else {
      overlay.hidden = true;
    }
  }

  // Microinteração puramente visual no HUD — não afeta placar/regras.
  let flashTimer = null;
  function flashScore(el) {
    el.classList.remove('pulse');
    // eslint-disable-next-line no-unused-expressions
    void el.offsetWidth; // reinicia a animação CSS
    el.classList.add('pulse');
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => el.classList.remove('pulse'), 260);
  }

  // ---------------------------------------------------------------------
  // Cena 3D (Three.js) — camada puramente visual, não interfere na física
  // ---------------------------------------------------------------------

  const SCALE = 0.02; // px do jogo -> unidades 3D
  const COURT_W = W * SCALE; // 16
  const COURT_D = H * SCALE; // 10
  const PADDLE_DEPTH = 0.42; // altura da raquete (eixo Y)
  const BALL_RADIUS = (BALL_SIZE / 2) * SCALE * 1.125; // ~12% maior só visualmente

  const COLOR_P1 = 0x22d3ee;
  const COLOR_P2 = 0xff3d81;
  const COLOR_BALL = 0xfff4cf;
  const COLOR_BG = 0x070a12;

  function toWorldX(gameX) {
    return (gameX - W / 2) * SCALE;
  }
  function toWorldZ(gameY) {
    return (gameY - H / 2) * SCALE;
  }

  // --- Texturas procedurais (sem assets externos) -----------------------

  function makeCourtTexture() {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 320;
    const ctx = c.getContext('2d');

    const grad = ctx.createRadialGradient(
      c.width / 2, c.height * 0.38, c.height * 0.1,
      c.width / 2, c.height * 0.5, c.height * 0.95
    );
    grad.addColorStop(0, '#232c46');
    grad.addColorStop(0.45, '#1b2235');
    grad.addColorStop(1, '#111827');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, c.width, c.height);

    // Ruído sutil em faixas finas para quebrar o gradiente "chapado"
    ctx.globalAlpha = 0.035;
    for (let i = 0; i < 2200; i++) {
      const x = Math.random() * c.width;
      const y = Math.random() * c.height;
      ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;

    // Vinheta discreta nas bordas da quadra
    const vignette = ctx.createRadialGradient(
      c.width / 2, c.height / 2, c.height * 0.25,
      c.width / 2, c.height / 2, c.height * 0.75
    );
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, c.width, c.height);

    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4;
    return tex;
  }

  function makeBackgroundTexture() {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(
      c.width / 2, c.height * 0.42, 10,
      c.width / 2, c.height * 0.5, c.width * 0.75
    );
    grad.addColorStop(0, '#131a2c');
    grad.addColorStop(0.5, '#0a0e18');
    grad.addColorStop(1, '#05070d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, c.width, c.height);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function makeBlobShadowTexture() {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0,0,0,0.55)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.22)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, c.width, c.height);
    return new THREE.CanvasTexture(c);
  }

  // --- Cena, câmera, renderer --------------------------------------------

  const scene = new THREE.Scene();
  scene.background = makeBackgroundTexture();
  scene.fog = new THREE.Fog(COLOR_BG, 15, 27);

  const camera = new THREE.PerspectiveCamera(48, 800 / 500, 0.1, 100);
  camera.position.set(0, 11, 9.5);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(COLOR_BG, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.insertBefore(renderer.domElement, overlay);

  // Bloom controlado (só pega áreas realmente brilhantes: bola e acentos)
  const bloomSupported = !!(window.THREE && THREE.EffectComposer && THREE.RenderPass && THREE.UnrealBloomPass);
  let composer = null;
  let bloomPass = null;
  if (bloomSupported) {
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));
    bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(800, 500), 0.42, 0.55, 0.86);
    composer.addPass(bloomPass);
  }

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (composer) {
      composer.setSize(w, h);
      if (bloomPass) bloomPass.resolution.set(w, h);
    }
  }
  window.addEventListener('resize', resize);
  resize();

  // --- Iluminação (key / fill / rim / ambient) ---------------------------

  scene.add(new THREE.AmbientLight(0x33456e, 0.55));

  const keyLight = new THREE.DirectionalLight(0xeaf1ff, 1.35);
  keyLight.position.set(-4.5, 11, 6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.left = -10;
  keyLight.shadow.camera.right = 10;
  keyLight.shadow.camera.top = 8;
  keyLight.shadow.camera.bottom = -8;
  keyLight.shadow.bias = -0.0018;
  keyLight.shadow.radius = 3;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x4a6fa5, 0.4);
  fillLight.position.set(5, 5, -3);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0x9fb8ff, 0.65);
  rimLight.position.set(0, 5, -9);
  scene.add(rimLight);

  // --- Quadra --------------------------------------------------------------

  const court = new THREE.Mesh(
    new THREE.PlaneGeometry(COURT_W, COURT_D),
    new THREE.MeshPhysicalMaterial({
      map: makeCourtTexture(),
      roughness: 0.55,
      metalness: 0.18,
      clearcoat: 0.25,
      clearcoatRoughness: 0.35,
    })
  );
  court.rotation.x = -Math.PI / 2;
  court.receiveShadow = true;
  scene.add(court);

  // Linha central tracejada — discreta, some no ponto de fuga
  const dashCount = 18;
  const dashMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.24 });
  for (let i = 0; i < dashCount; i++) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.015, COURT_D / dashCount * 0.5), dashMat);
    dash.position.set(0, 0.009, -COURT_D / 2 + (i + 0.5) * (COURT_D / dashCount));
    scene.add(dash);
  }

  // --- Bordas: trilhos metálicos finos com aresta luminosa ---------------

  const borderBaseMat = new THREE.MeshStandardMaterial({ color: 0x1a2032, roughness: 0.35, metalness: 0.85 });
  const borderAccentMat = new THREE.MeshBasicMaterial({ color: 0xaebfe0, transparent: true, opacity: 0.55 });

  [-1, 1].forEach((side) => {
    const group = new THREE.Group();

    const base = new THREE.Mesh(new THREE.BoxGeometry(COURT_W + 0.3, 0.12, 0.14), borderBaseMat);
    base.position.y = 0.06;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const top = new THREE.Mesh(new THREE.BoxGeometry(COURT_W + 0.22, 0.05, 0.09), borderBaseMat);
    top.position.y = 0.135;
    top.castShadow = true;
    group.add(top);

    const accent = new THREE.Mesh(new THREE.BoxGeometry(COURT_W + 0.22, 0.012, 0.012), borderAccentMat);
    accent.position.set(0, 0.163, side * -0.038);
    group.add(accent);

    group.position.set(0, 0, side * (COURT_D / 2 + 0.04));
    scene.add(group);

    // Sombra de contato falsa (AO) onde a borda encontra o piso
    const aoStrip = new THREE.Mesh(
      new THREE.PlaneGeometry(COURT_W + 0.3, 0.32),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false })
    );
    aoStrip.rotation.x = -Math.PI / 2;
    aoStrip.position.set(0, 0.002, side * (COURT_D / 2 - 0.1));
    scene.add(aoStrip);
  });

  // --- Raquetes: material escuro + glow de borda aditivo ------------------

  function buildPaddle(color) {
    const group = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(PADDLE_W * SCALE, PADDLE_DEPTH, PADDLE_H * SCALE);
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x0c1018,
      emissive: color,
      emissiveIntensity: 0.35,
      roughness: 0.32,
      metalness: 0.55,
      clearcoat: 0.6,
      clearcoatRoughness: 0.25,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const glowGeo = new THREE.BoxGeometry(PADDLE_W * SCALE * 1.35, PADDLE_DEPTH * 1.2, PADDLE_H * SCALE * 1.1);
    const glowMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.16,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    group.add(glow);

    // Sombra de contato falsa sob a raquete
    const ao = new THREE.Mesh(
      new THREE.CircleGeometry(PADDLE_H * SCALE * 0.55, 20),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false })
    );
    ao.rotation.x = -Math.PI / 2;
    ao.position.y = 0.003;
    group.add(ao);

    group.userData.body = body;
    group.userData.glow = glow;
    return group;
  }

  const paddle1 = buildPaddle(COLOR_P1);
  const paddle2 = buildPaddle(COLOR_P2);
  paddle1.position.y = PADDLE_DEPTH / 2;
  paddle2.position.y = PADDLE_DEPTH / 2;
  scene.add(paddle1, paddle2);

  // --- Bola: ponto focal da cena ------------------------------------------

  const ballGroup = new THREE.Group();

  const ballMat = new THREE.MeshPhysicalMaterial({
    color: COLOR_BALL,
    emissive: COLOR_BALL,
    emissiveIntensity: 0.55,
    roughness: 0.22,
    metalness: 0.05,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
  });
  const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(BALL_RADIUS, 28, 28), ballMat);
  ballMesh.castShadow = true;
  ballGroup.add(ballMesh);

  const ballHaloMat = new THREE.MeshBasicMaterial({
    color: COLOR_BALL,
    transparent: true,
    opacity: 0.14,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ballHalo = new THREE.Mesh(new THREE.SphereGeometry(BALL_RADIUS * 1.8, 16, 16), ballHaloMat);
  ballGroup.add(ballHalo);

  scene.add(ballGroup);

  const ballLight = new THREE.PointLight(COLOR_BALL, 0.7, 3.2);
  scene.add(ballLight);

  // Sombra de contato (blob) da bola — reage à altura do "salto"
  const blobTex = makeBlobShadowTexture();
  const ballShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false })
  );
  ballShadow.rotation.x = -Math.PI / 2;
  scene.add(ballShadow);

  // --- Microinterações: salto ao rebater + flash de impacto --------------

  let bounceT = 1; // 0 -> 1, controla o salto vertical visual da bola
  let hitFlash = 0; // 1 -> 0, pulso de brilho/escala no impacto
  let hitPaddle = null;

  function bumpBall(which) {
    bounceT = 0;
    hitFlash = 1;
    hitPaddle = which === 1 ? paddle1 : which === 2 ? paddle2 : null;
  }

  function syncScene() {
    paddle1.position.set(toWorldX(state.p1.x + PADDLE_W / 2), PADDLE_DEPTH / 2, toWorldZ(state.p1.y + PADDLE_H / 2));
    paddle2.position.set(toWorldX(state.p2.x + PADDLE_W / 2), PADDLE_DEPTH / 2, toWorldZ(state.p2.y + PADDLE_H / 2));

    bounceT = Math.min(bounceT + 0.05, 1);
    const hop = Math.sin(bounceT * Math.PI) * 0.32;

    const ballX = toWorldX(state.ball.x);
    const ballZ = toWorldZ(state.ball.y);
    ballGroup.position.set(ballX, BALL_RADIUS + hop, ballZ);
    ballLight.position.copy(ballGroup.position);

    // Sombra de contato: menor/mais escura perto do chão, maior/mais clara no auge do salto
    const hopNorm = clamp(hop / 0.32, 0, 1);
    const shadowScale = BALL_RADIUS * (3.6 + hopNorm * 1.6);
    ballShadow.scale.set(shadowScale, shadowScale, 1);
    ballShadow.position.set(ballX, 0.003, ballZ);
    ballShadow.material.opacity = 0.85 - hopNorm * 0.45;

    // Flash de impacto: pulso curto de brilho na bola e glow na raquete atingida
    hitFlash = Math.max(hitFlash - 0.07, 0);
    ballMat.emissiveIntensity = 0.55 + hitFlash * 0.9;
    ballHalo.scale.setScalar(1 + hitFlash * 0.5);
    ballHaloMat.opacity = 0.14 + hitFlash * 0.22;

    [paddle1, paddle2].forEach((p) => {
      const isHit = p === hitPaddle;
      const targetGlow = isHit ? 0.16 + hitFlash * 0.35 : 0.16;
      p.userData.glow.material.opacity += (targetGlow - p.userData.glow.material.opacity) * 0.3;
      const targetEmissive = isHit ? 0.35 + hitFlash * 0.5 : 0.35;
      p.userData.body.material.emissiveIntensity += (targetEmissive - p.userData.body.material.emissiveIntensity) * 0.3;
    });
  }

  function render() {
    if (composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }

  function loop() {
    update();
    syncScene();
    render();
    requestAnimationFrame(loop);
  }

  resetGame();
  loop();
})();

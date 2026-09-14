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
      bumpBall();
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
      bumpBall();
    }

    if (b.x < -BALL_SIZE) {
      state.score2++;
      score2El.textContent = state.score2;
      checkWin();
      if (!gameOver) resetBall(1);
    } else if (b.x > W + BALL_SIZE) {
      state.score1++;
      score1El.textContent = state.score1;
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

  // ---------------------------------------------------------------------
  // Cena 3D (Three.js)
  // ---------------------------------------------------------------------

  const SCALE = 0.02; // px do jogo -> unidades 3D
  const COURT_W = W * SCALE; // 16
  const COURT_D = H * SCALE; // 10
  const PADDLE_DEPTH = 0.5; // altura da raquete (eixo Y)
  const BALL_RADIUS = (BALL_SIZE / 2) * SCALE;

  function toWorldX(gameX) {
    return (gameX - W / 2) * SCALE;
  }
  function toWorldZ(gameY) {
    return (gameY - H / 2) * SCALE;
  }

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x05050a, 14, 28);

  const camera = new THREE.PerspectiveCamera(50, 800 / 500, 0.1, 100);
  camera.position.set(0, 11, 9.5);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setClearColor(0x05050a, 1);
  renderer.shadowMap.enabled = true;
  container.insertBefore(renderer.domElement, overlay);

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // Luzes
  scene.add(new THREE.AmbientLight(0x50597a, 1.8));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
  keyLight.position.set(-4, 10, 6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.left = -12;
  keyLight.shadow.camera.right = 12;
  keyLight.shadow.camera.top = 10;
  keyLight.shadow.camera.bottom = -10;
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0x4ee1ff, 0.5);
  fillLight.position.set(5, 6, -5);
  scene.add(fillLight);

  // Quadra
  const court = new THREE.Mesh(
    new THREE.PlaneGeometry(COURT_W, COURT_D),
    new THREE.MeshStandardMaterial({ color: 0x141428, roughness: 0.85, metalness: 0.1 })
  );
  court.rotation.x = -Math.PI / 2;
  court.receiveShadow = true;
  scene.add(court);

  // Linha central tracejada
  const dashCount = 16;
  for (let i = 0; i < dashCount; i++) {
    const dash = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.02, COURT_D / dashCount * 0.55),
      new THREE.MeshBasicMaterial({ color: 0x4ee1ff, transparent: true, opacity: 0.5 })
    );
    dash.position.set(0, 0.011, -COURT_D / 2 + (i + 0.5) * (COURT_D / dashCount));
    scene.add(dash);
  }

  // Bordas (paredes baixas para reforçar os limites)
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x4ee1ff, emissive: 0x0c3a44, roughness: 0.4 });
  [-1, 1].forEach((side) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(COURT_W + 0.4, 0.16, 0.12), wallMat);
    wall.position.set(0, 0.08, side * (COURT_D / 2 + 0.04));
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
  });

  // Raquetes
  const paddleGeo = new THREE.BoxGeometry(PADDLE_W * SCALE, PADDLE_DEPTH, PADDLE_H * SCALE);
  const paddle1Mat = new THREE.MeshStandardMaterial({ color: 0x4ee1ff, emissive: 0x0d4652, roughness: 0.35, metalness: 0.2 });
  const paddle2Mat = new THREE.MeshStandardMaterial({ color: 0xff6b9d, emissive: 0x521228, roughness: 0.35, metalness: 0.2 });
  const paddle1Mesh = new THREE.Mesh(paddleGeo, paddle1Mat);
  const paddle2Mesh = new THREE.Mesh(paddleGeo, paddle2Mat);
  paddle1Mesh.castShadow = true;
  paddle2Mesh.castShadow = true;
  paddle1Mesh.position.y = PADDLE_DEPTH / 2;
  paddle2Mesh.position.y = PADDLE_DEPTH / 2;
  scene.add(paddle1Mesh, paddle2Mesh);

  // Bola
  const ballMesh = new THREE.Mesh(
    new THREE.SphereGeometry(BALL_RADIUS, 24, 24),
    new THREE.MeshStandardMaterial({ color: 0xffe14e, emissive: 0x5a4200, roughness: 0.25, metalness: 0.1 })
  );
  ballMesh.castShadow = true;
  scene.add(ballMesh);

  const ballLight = new THREE.PointLight(0xffe14e, 1.2, 4);
  scene.add(ballLight);

  let bounceT = 1; // controla o "salto" visual da bola ao rebater
  function bumpBall() {
    bounceT = 0;
  }

  function syncScene() {
    paddle1Mesh.position.set(toWorldX(state.p1.x + PADDLE_W / 2), PADDLE_DEPTH / 2, toWorldZ(state.p1.y + PADDLE_H / 2));
    paddle2Mesh.position.set(toWorldX(state.p2.x + PADDLE_W / 2), PADDLE_DEPTH / 2, toWorldZ(state.p2.y + PADDLE_H / 2));

    bounceT = Math.min(bounceT + 0.05, 1);
    const hop = Math.sin(bounceT * Math.PI) * 0.35;
    ballMesh.position.set(toWorldX(state.ball.x), BALL_RADIUS + hop, toWorldZ(state.ball.y));
    ballLight.position.copy(ballMesh.position);
  }

  function loop() {
    update();
    syncScene();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  resetGame();
  loop();
})();

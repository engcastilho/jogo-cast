(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const W = canvas.width;
  const H = canvas.height;

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
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(78, 225, 255, 0.4)';
    ctx.setLineDash([10, 12]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#4ee1ff';
    ctx.fillRect(state.p1.x, state.p1.y, PADDLE_W, PADDLE_H);
    ctx.fillRect(state.p2.x, state.p2.y, PADDLE_W, PADDLE_H);

    ctx.fillStyle = '#ffe14e';
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, BALL_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    if (paused && !gameOver) {
      drawOverlay('PAUSADO');
    }

    if (gameOver) {
      const winner = state.score1 > state.score2 ? 'Jogador 1' : (vsCPU ? 'CPU' : 'Jogador 2');
      drawOverlay(`${winner} venceu!`, 'Clique em Reiniciar para jogar novamente');
    }
  }

  function drawOverlay(title, subtitle) {
    ctx.fillStyle = 'rgba(5, 5, 10, 0.75)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#eaeaea';
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px "Courier New", monospace';
    ctx.fillText(title, W / 2, H / 2 - (subtitle ? 10 : 0));
    if (subtitle) {
      ctx.font = '16px "Courier New", monospace';
      ctx.fillStyle = '#8a8aa0';
      ctx.fillText(subtitle, W / 2, H / 2 + 24);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  resetGame();
  loop();
})();

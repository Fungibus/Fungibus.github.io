const toggle = document.getElementById('navToggle');
const links  = document.getElementById('navLinks');
const contactLinks = document.querySelectorAll('[data-contact-link]');

if (toggle && links) {
  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  links.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 640) {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

const decodeEmailPart = (codes) => codes.map((code) => String.fromCharCode(code)).join('');
const contactEmail = [
  decodeEmailPart([104, 101, 108, 108, 111]),
  decodeEmailPart([99, 104, 105, 99, 107, 101, 110, 99, 111, 111, 112, 103, 97, 109, 101, 115, 46, 99, 97])
].join('@');

contactLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();

    const subject = link.dataset.subject ? `?subject=${encodeURIComponent(link.dataset.subject)}` : '';
    window.location.href = `mailto:${contactEmail}${subject}`;
  });
});

const runnerCanvas = document.getElementById('runnerCanvas');
const runnerButton = document.getElementById('runnerButton');
const runnerOverlay = document.getElementById('runnerOverlay');
const runnerState = document.getElementById('runnerState');
const runnerScore = document.getElementById('runnerScore');
const runnerBest = document.getElementById('runnerBest');

if (runnerCanvas && runnerButton && runnerOverlay && runnerState && runnerScore && runnerBest) {
  const ctx = runnerCanvas.getContext('2d');
  const width = runnerCanvas.width;
  const height = runnerCanvas.height;
  const groundY = 205;
  const bestKey = 'coopRunnerBest';
  const chicken = new Image();

  let mode = 'ready';
  let lastTime = 0;
  let elapsed = 0;
  let score = 0;
  let bestScore = 0;
  let speed = 330;
  let nextObstacle = 1.15;
  let groundOffset = 0;
  let obstacles = [];

  const player = {
    x: 78,
    y: groundY - 76,
    width: 76,
    height: 76,
    velocityY: 0,
    grounded: true
  };

  try {
    bestScore = Number(localStorage.getItem(bestKey)) || 0;
  } catch (error) {
    bestScore = 0;
  }

  runnerBest.textContent = String(bestScore);

  const setOverlay = (text, isVisible, isGameOver = false) => {
    runnerState.textContent = text;
    runnerOverlay.classList.toggle('show', isVisible);
    runnerOverlay.classList.toggle('game-over', isGameOver);
  };

  const setScore = (value) => {
    runnerScore.textContent = String(Math.floor(value));
  };

  const resetRun = () => {
    score = 0;
    speed = 330;
    nextObstacle = 0.9;
    groundOffset = 0;
    obstacles = [];
    player.y = groundY - player.height;
    player.velocityY = 0;
    player.grounded = true;
    setScore(0);
  };

  const startRun = () => {
    resetRun();
    mode = 'running';
    lastTime = performance.now();
    runnerButton.textContent = 'Restart';
    setOverlay('', false);
    runnerCanvas.focus({ preventScroll: true });
  };

  const endRun = () => {
    mode = 'gameover';
    bestScore = Math.max(bestScore, Math.floor(score));
    runnerBest.textContent = String(bestScore);

    try {
      localStorage.setItem(bestKey, String(bestScore));
    } catch (error) {
      // Storage can be unavailable in private browsing modes.
    }

    runnerButton.textContent = 'Again';
    setOverlay('Game Over', true, true);
  };

  const jump = () => {
    if (!player.grounded || mode !== 'running') return;

    player.velocityY = -720;
    player.grounded = false;
  };

  const handleAction = (event) => {
    if (event) event.preventDefault();

    if (mode === 'running') {
      jump();
      return;
    }

    startRun();
  };

  const spawnObstacle = () => {
    const isFence = Math.random() > 0.42;
    const obstacle = isFence
      ? { type: 'fence', x: width + 24, width: 34, height: 58 }
      : { type: 'hay', x: width + 24, width: 46, height: 38 };

    obstacle.y = groundY - obstacle.height;
    obstacles.push(obstacle);
  };

  const getPlayerBounds = () => ({
    x: player.x + 20,
    y: player.y + 18,
    width: player.width - 34,
    height: player.height - 28
  });

  const overlaps = (a, b) => (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );

  const update = (dt) => {
    elapsed += dt;
    speed = Math.min(650, speed + dt * 11);
    score += dt * speed * 0.035;
    groundOffset = (groundOffset + speed * dt) % 36;
    nextObstacle -= dt;

    if (nextObstacle <= 0) {
      spawnObstacle();
      nextObstacle = Math.max(0.72, 1.45 - speed / 760) + Math.random() * 0.45;
    }

    player.velocityY += 1850 * dt;
    player.y += player.velocityY * dt;

    if (player.y >= groundY - player.height) {
      player.y = groundY - player.height;
      player.velocityY = 0;
      player.grounded = true;
    }

    obstacles.forEach((obstacle) => {
      obstacle.x -= speed * dt;
    });
    obstacles = obstacles.filter((obstacle) => obstacle.x + obstacle.width > -20);

    const playerBounds = getPlayerBounds();
    const hit = obstacles.some((obstacle) => {
      const obstacleBounds = {
        x: obstacle.x + 4,
        y: obstacle.y + 4,
        width: obstacle.width - 8,
        height: obstacle.height - 4
      };

      return overlaps(playerBounds, obstacleBounds);
    });

    setScore(score);

    if (hit) {
      endRun();
    }
  };

  const drawPixelRect = (x, y, rectWidth, rectHeight, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(rectWidth), Math.round(rectHeight));
  };

  const drawBackground = () => {
    ctx.fillStyle = '#f8edd9';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(105,180,200,0.14)';
    ctx.fillRect(86, 44, 54, 10);
    ctx.fillRect(110, 32, 72, 12);
    ctx.fillRect(610, 56, 76, 10);
    ctx.fillRect(646, 42, 56, 14);

    ctx.fillStyle = 'rgba(224,122,95,0.12)';
    for (let x = width - 120; x > 0; x -= 180) {
      ctx.fillRect(x, 96, 8, 8);
      ctx.fillRect(x + 18, 82, 6, 6);
    }

    drawPixelRect(0, groundY, width, 5, '#3d2a1a');
    drawPixelRect(0, groundY + 5, width, height - groundY, '#f0e2c6');

    for (let x = -groundOffset; x < width; x += 36) {
      drawPixelRect(x, groundY + 14, 18, 4, '#c4a88a');
      drawPixelRect(x + 24, groundY + 30, 8, 4, '#d8bd98');
    }
  };

  const drawObstacle = (obstacle) => {
    if (obstacle.type === 'fence') {
      drawPixelRect(obstacle.x + 4, obstacle.y, 8, obstacle.height, '#6b4e38');
      drawPixelRect(obstacle.x + 22, obstacle.y + 8, 8, obstacle.height - 8, '#6b4e38');
      drawPixelRect(obstacle.x, obstacle.y + 20, obstacle.width, 8, '#9a7a62');
      drawPixelRect(obstacle.x, obstacle.y + 38, obstacle.width, 7, '#9a7a62');
      drawPixelRect(obstacle.x + 5, obstacle.y - 5, 6, 5, '#3d2a1a');
      drawPixelRect(obstacle.x + 23, obstacle.y + 3, 6, 5, '#3d2a1a');
      return;
    }

    drawPixelRect(obstacle.x, obstacle.y + 8, obstacle.width, obstacle.height - 8, '#f0b840');
    drawPixelRect(obstacle.x + 4, obstacle.y, obstacle.width - 8, 8, '#f6ca63');
    drawPixelRect(obstacle.x + 7, obstacle.y + 15, obstacle.width - 14, 5, '#c98f2f');
    drawPixelRect(obstacle.x + 12, obstacle.y + 27, obstacle.width - 24, 4, '#c98f2f');
    drawPixelRect(obstacle.x, obstacle.y + obstacle.height - 5, obstacle.width, 5, '#9a7a62');
  };

  const drawChicken = () => {
    const bob = player.grounded && mode === 'running' ? Math.sin(elapsed * 24) * 2 : 0;
    const drawX = Math.round(player.x - 10);
    const drawY = Math.round(player.y - 12 + bob);
    const drawSize = 98;

    if (chicken.complete && chicken.naturalWidth) {
      ctx.drawImage(chicken, 150, 150, 740, 720, drawX, drawY, drawSize, drawSize);
      return;
    }

    drawPixelRect(player.x + 14, player.y + 22, 46, 36, '#fff2d8');
    drawPixelRect(player.x + 50, player.y + 12, 20, 24, '#fff2d8');
    drawPixelRect(player.x + 55, player.y + 6, 14, 8, '#e07a5f');
    drawPixelRect(player.x + 68, player.y + 24, 10, 6, '#f0b840');
    drawPixelRect(player.x + 23, player.y + 54, 8, 12, '#6b4e38');
  };

  const drawScene = () => {
    drawBackground();
    obstacles.forEach(drawObstacle);
    drawChicken();

    if (mode === 'ready') {
      setOverlay('', false);
    }
  };

  const loop = (time) => {
    const dt = Math.min((time - lastTime) / 1000 || 0, 0.032);
    lastTime = time;

    if (mode === 'running') {
      update(dt);
    }

    drawScene();
    requestAnimationFrame(loop);
  };

  runnerButton.addEventListener('click', startRun);
  runnerCanvas.addEventListener('pointerdown', handleAction);

  document.addEventListener('keydown', (event) => {
    const activeTag = document.activeElement ? document.activeElement.tagName : '';
    const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';
    const isJumpKey = event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW';

    if (!isTyping && isJumpKey) {
      handleAction(event);
    }
  });

  chicken.onload = drawScene;
  chicken.src = 'images/chicken-pixel.png';
  resetRun();
  drawScene();
  requestAnimationFrame(loop);
}

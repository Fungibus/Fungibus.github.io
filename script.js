const SELECTORS = {
  contactLink: '[data-contact-link]',
  navLinks: '#navLinks',
  navToggle: '#navToggle',
  runnerBest: '#runnerBest',
  runnerButton: '#runnerButton',
  runnerCanvas: '#runnerCanvas',
  runnerOverlay: '#runnerOverlay',
  runnerScore: '#runnerScore',
  runnerState: '#runnerState'
};

const RUNNER_STORAGE_KEY = 'coopRunnerBest';
const CONTACT_EMAIL_CODES = {
  local: [104, 101, 108, 108, 111],
  domain: [99, 104, 105, 99, 107, 101, 110, 99, 111, 111, 112, 103, 97, 109, 101, 115, 46, 99, 97]
};

const RUNNER_COLORS = {
  bg: '#f8edd9',
  bgAlt: '#f0e2c6',
  chickenBody: '#fff2d8',
  chickenComb: '#e07a5f',
  cloud: 'rgba(105,180,200,0.14)',
  coralSoft: 'rgba(224,122,95,0.12)',
  dark: '#3d2a1a',
  groundDash: '#c4a88a',
  groundDashAlt: '#d8bd98',
  hay: '#f0b840',
  hayDark: '#c98f2f',
  hayLight: '#f6ca63',
  wood: '#6b4e38',
  woodLight: '#9a7a62'
};

const query = (selector) => document.querySelector(selector);

const queryAll = (selector) => Array.from(document.querySelectorAll(selector));

const decodeEmailPart = (codes) => codes.map((code) => String.fromCharCode(code)).join('');

const getContactEmail = () => [
  decodeEmailPart(CONTACT_EMAIL_CODES.local),
  decodeEmailPart(CONTACT_EMAIL_CODES.domain)
].join('@');

const getStoredNumber = (key) => {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch (error) {
    return 0;
  }
};

const setStoredNumber = (key, value) => {
  try {
    localStorage.setItem(key, String(value));
  } catch (error) {
    // Storage can be unavailable in private browsing modes.
  }
};

const initializeNavigation = () => {
  const toggle = query(SELECTORS.navToggle);
  const links = query(SELECTORS.navLinks);

  if (!toggle || !links) return;

  const closeMenu = () => {
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  links.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 640) closeMenu();
  });
};

const initializeContactLinks = () => {
  const contactEmail = getContactEmail();

  queryAll(SELECTORS.contactLink).forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();

      const subject = link.dataset.subject ? `?subject=${encodeURIComponent(link.dataset.subject)}` : '';
      window.location.href = `mailto:${contactEmail}${subject}`;
    });
  });
};

const initializeRunner = () => {
  const canvas = query(SELECTORS.runnerCanvas);
  const button = query(SELECTORS.runnerButton);
  const overlay = query(SELECTORS.runnerOverlay);
  const state = query(SELECTORS.runnerState);
  const scoreOutput = query(SELECTORS.runnerScore);
  const bestOutput = query(SELECTORS.runnerBest);

  if (!canvas || !button || !overlay || !state || !scoreOutput || !bestOutput) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const groundY = 205;
  const chicken = new Image();

  let mode = 'ready';
  let lastTime = 0;
  let elapsed = 0;
  let score = 0;
  let bestScore = getStoredNumber(RUNNER_STORAGE_KEY);
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

  bestOutput.textContent = String(bestScore);

  const setOverlay = (text, isVisible, isGameOver = false) => {
    state.textContent = text;
    overlay.classList.toggle('show', isVisible);
    overlay.classList.toggle('game-over', isGameOver);
  };

  const setScore = (value) => {
    scoreOutput.textContent = String(Math.floor(value));
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
    button.textContent = 'Restart';
    setOverlay('', false);
    canvas.focus({ preventScroll: true });
  };

  const endRun = () => {
    mode = 'gameover';
    bestScore = Math.max(bestScore, Math.floor(score));
    bestOutput.textContent = String(bestScore);
    setStoredNumber(RUNNER_STORAGE_KEY, bestScore);
    button.textContent = 'Again';
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

    if (hit) endRun();
  };

  const drawPixelRect = (x, y, rectWidth, rectHeight, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(rectWidth), Math.round(rectHeight));
  };

  const drawBackground = () => {
    ctx.fillStyle = RUNNER_COLORS.bg;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = RUNNER_COLORS.cloud;
    ctx.fillRect(86, 44, 54, 10);
    ctx.fillRect(110, 32, 72, 12);
    ctx.fillRect(610, 56, 76, 10);
    ctx.fillRect(646, 42, 56, 14);

    ctx.fillStyle = RUNNER_COLORS.coralSoft;
    for (let x = width - 120; x > 0; x -= 180) {
      ctx.fillRect(x, 96, 8, 8);
      ctx.fillRect(x + 18, 82, 6, 6);
    }

    drawPixelRect(0, groundY, width, 5, RUNNER_COLORS.dark);
    drawPixelRect(0, groundY + 5, width, height - groundY, RUNNER_COLORS.bgAlt);

    for (let x = -groundOffset; x < width; x += 36) {
      drawPixelRect(x, groundY + 14, 18, 4, RUNNER_COLORS.groundDash);
      drawPixelRect(x + 24, groundY + 30, 8, 4, RUNNER_COLORS.groundDashAlt);
    }
  };

  const drawObstacle = (obstacle) => {
    if (obstacle.type === 'fence') {
      drawPixelRect(obstacle.x + 4, obstacle.y, 8, obstacle.height, RUNNER_COLORS.wood);
      drawPixelRect(obstacle.x + 22, obstacle.y + 8, 8, obstacle.height - 8, RUNNER_COLORS.wood);
      drawPixelRect(obstacle.x, obstacle.y + 20, obstacle.width, 8, RUNNER_COLORS.woodLight);
      drawPixelRect(obstacle.x, obstacle.y + 38, obstacle.width, 7, RUNNER_COLORS.woodLight);
      drawPixelRect(obstacle.x + 5, obstacle.y - 5, 6, 5, RUNNER_COLORS.dark);
      drawPixelRect(obstacle.x + 23, obstacle.y + 3, 6, 5, RUNNER_COLORS.dark);
      return;
    }

    drawPixelRect(obstacle.x, obstacle.y + 8, obstacle.width, obstacle.height - 8, RUNNER_COLORS.hay);
    drawPixelRect(obstacle.x + 4, obstacle.y, obstacle.width - 8, 8, RUNNER_COLORS.hayLight);
    drawPixelRect(obstacle.x + 7, obstacle.y + 15, obstacle.width - 14, 5, RUNNER_COLORS.hayDark);
    drawPixelRect(obstacle.x + 12, obstacle.y + 27, obstacle.width - 24, 4, RUNNER_COLORS.hayDark);
    drawPixelRect(obstacle.x, obstacle.y + obstacle.height - 5, obstacle.width, 5, RUNNER_COLORS.woodLight);
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

    drawPixelRect(player.x + 14, player.y + 22, 46, 36, RUNNER_COLORS.chickenBody);
    drawPixelRect(player.x + 50, player.y + 12, 20, 24, RUNNER_COLORS.chickenBody);
    drawPixelRect(player.x + 55, player.y + 6, 14, 8, RUNNER_COLORS.chickenComb);
    drawPixelRect(player.x + 68, player.y + 24, 10, 6, RUNNER_COLORS.hay);
    drawPixelRect(player.x + 23, player.y + 54, 8, 12, RUNNER_COLORS.wood);
  };

  const drawScene = () => {
    drawBackground();
    obstacles.forEach(drawObstacle);
    drawChicken();

    if (mode === 'ready') setOverlay('', false);
  };

  const loop = (time) => {
    const dt = Math.min((time - lastTime) / 1000 || 0, 0.032);
    lastTime = time;

    if (mode === 'running') update(dt);

    drawScene();
    requestAnimationFrame(loop);
  };

  button.addEventListener('click', startRun);
  canvas.addEventListener('pointerdown', handleAction);

  document.addEventListener('keydown', (event) => {
    const activeTag = document.activeElement ? document.activeElement.tagName : '';
    const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';
    const isJumpKey = event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW';

    if (!isTyping && isJumpKey) handleAction(event);
  });

  chicken.onload = drawScene;
  chicken.src = 'images/chicken-pixel.png';
  resetRun();
  drawScene();
  requestAnimationFrame(loop);
};

initializeNavigation();
initializeContactLinks();
initializeRunner();

// ===================== FACE DETECTION SETUP =====================
// face-api.js runs entirely in the browser — the photo never leaves the device.
const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";
let modelsLoaded = false;
let modelsLoadingPromise = null;

function loadModels() {
  if (modelsLoadingPromise) return modelsLoadingPromise;
  modelsLoadingPromise = faceapi.nets.tinyFaceDetector
    .loadFromUri(MODEL_URL)
    .then(() => {
      modelsLoaded = true;
    })
    .catch((err) => {
      console.error("Failed to load face detection models:", err);
    });
  return modelsLoadingPromise;
}

// crop a circular region of `img` centered on `box` (with padding) onto a new canvas
function cropFaceToCircle(img, box, size = 200) {
  const pad = box.width * 0.35;
  const sx = Math.max(0, box.x - pad);
  const sy = Math.max(0, box.y - pad);
  const sSize = box.width + pad * 2;

  const out = document.createElement("canvas");
  out.width = size;
  out.height = size;
  const octx = out.getContext("2d");

  octx.save();
  octx.beginPath();
  octx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  octx.clip();
  octx.drawImage(img, sx, sy, sSize, sSize, 0, 0, size, size);
  octx.restore();

  return out;
}

// ===================== UPLOAD SCREEN =====================
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const photoInput = document.getElementById("photo-input");
const previewImg = document.getElementById("preview-img");
const previewPlaceholder = document.getElementById("preview-placeholder");
const statusText = document.getElementById("status-text");
const btnStart = document.getElementById("btn-start");
const btnSkip = document.getElementById("btn-skip");

let birdImageCanvas = null; // circular canvas used as the bird sprite, or null for emoji fallback

photoInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  statusText.textContent = "Loading face detector...";
  await loadModels();

  const img = new Image();
  img.onload = async () => {
    statusText.textContent = "Detecting your face...";

    try {
      const detection = await faceapi.detectSingleFace(
        img,
        new faceapi.TinyFaceDetectorOptions()
      );

      if (detection) {
        birdImageCanvas = cropFaceToCircle(img, detection.box);
        previewImg.src = birdImageCanvas.toDataURL();
        previewImg.classList.remove("hidden");
        previewPlaceholder.classList.add("hidden");
        statusText.textContent = "Face found! Ready to fly.";
      } else {
        birdImageCanvas = null;
        previewImg.classList.add("hidden");
        previewPlaceholder.classList.remove("hidden");
        statusText.textContent = "No face detected — using the default bird instead.";
      }
    } catch (err) {
      console.error(err);
      birdImageCanvas = null;
      statusText.textContent = "Something went wrong — using the default bird instead.";
    }
  };
  img.src = URL.createObjectURL(file);
});

btnSkip.addEventListener("click", () => {
  birdImageCanvas = null;
  goToGameScreen();
});

btnStart.addEventListener("click", () => {
  goToGameScreen();
});

function goToGameScreen() {
  startScreen.classList.remove("active");
  gameScreen.classList.add("active");
  startGame();
}

// ===================== GAME =====================
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

const GRAVITY = 0.45;
const JUMP_VELOCITY = -8;
const PIPE_WIDTH = 56;
const PIPE_GAP = 150;
const PIPE_SPEED = 2.4;
const PIPE_INTERVAL = 90; // frames between new pipes
const BIRD_RADIUS = 22;

const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("best-score");
const gameOverPanel = document.getElementById("game-over-panel");
const gameOverText = document.getElementById("game-over-text");
const btnRestart = document.getElementById("btn-restart");
const btnChangePhoto = document.getElementById("btn-change-photo");
const btnJump = document.getElementById("btn-jump");
const btnJumpOverlay = document.getElementById("btn-jump-overlay");

let best = Number(localStorage.getItem("flappy-face-best") || 0);
bestScoreEl.textContent = best;

let bird, pipes, frame, score, running, gameLoopId;

function initState() {
  bird = { x: 90, y: H / 2, vy: 0, rotation: 0 };
  pipes = [];
  frame = 0;
  score = 0;
  scoreEl.textContent = 0;
  gameOverPanel.classList.add("hidden");
}

function startGame() {
  initState();
  running = true;
  cancelAnimationFrame(gameLoopId);
  loop();
}

function jump() {
  if (!running) {
    // if the game has already ended, tapping the board restarts instead
    if (gameOverPanel.classList.contains("hidden")) return;
    startGame();
    return;
  }
  bird.vy = JUMP_VELOCITY;
}

function spawnPipe() {
  const margin = 50;
  const gapY = margin + Math.random() * (H - margin * 2 - PIPE_GAP);
  pipes.push({ x: W, gapY, passed: false });
}

function update() {
  frame++;

  bird.vy += GRAVITY;
  bird.y += bird.vy;
  bird.rotation = Math.max(-0.5, Math.min(1.1, bird.vy / 10));

  if (frame % PIPE_INTERVAL === 0) spawnPipe();

  pipes.forEach((p) => (p.x -= PIPE_SPEED));
  pipes = pipes.filter((p) => p.x + PIPE_WIDTH > 0);

  // scoring
  pipes.forEach((p) => {
    if (!p.passed && p.x + PIPE_WIDTH < bird.x) {
      p.passed = true;
      score++;
      scoreEl.textContent = score;
    }
  });

  // collisions: ground / ceiling
  if (bird.y + BIRD_RADIUS > H || bird.y - BIRD_RADIUS < 0) {
    return endGame();
  }

  // collisions: pipes
  for (const p of pipes) {
    const withinX = bird.x + BIRD_RADIUS > p.x && bird.x - BIRD_RADIUS < p.x + PIPE_WIDTH;
    if (withinX) {
      const withinGap = bird.y - BIRD_RADIUS > p.gapY && bird.y + BIRD_RADIUS < p.gapY + PIPE_GAP;
      if (!withinGap) return endGame();
    }
  }
}

function drawBackground() {
  ctx.fillStyle = "#bdeaff";
  ctx.fillRect(0, 0, W, H);

  // simple clouds
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  [[60, 60, 26], [200, 100, 20], [260, 50, 18]].forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });

  // ground strip
  ctx.fillStyle = "#ded895";
  ctx.fillRect(0, H - 18, W, 18);
  ctx.fillStyle = "#c9c07a";
  ctx.fillRect(0, H - 18, W, 4);
}

function drawPipes() {
  pipes.forEach((p) => {
    ctx.fillStyle = "#4ec04e";
    ctx.strokeStyle = "#2e8b2e";
    ctx.lineWidth = 3;

    // top pipe
    ctx.fillRect(p.x, 0, PIPE_WIDTH, p.gapY);
    ctx.strokeRect(p.x, 0, PIPE_WIDTH, p.gapY);

    // bottom pipe
    ctx.fillRect(p.x, p.gapY + PIPE_GAP, PIPE_WIDTH, H - (p.gapY + PIPE_GAP));
    ctx.strokeRect(p.x, p.gapY + PIPE_GAP, PIPE_WIDTH, H - (p.gapY + PIPE_GAP));
  });
}

function drawBird() {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  if (birdImageCanvas) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(
      birdImageCanvas,
      -BIRD_RADIUS,
      -BIRD_RADIUS,
      BIRD_RADIUS * 2,
      BIRD_RADIUS * 2
    );
    ctx.restore();
    ctx.beginPath();
    ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = "#2e8b2e";
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    // the 🐦 emoji faces left by default in most fonts — flip it so it faces
    // the direction the bird is flying (right)
    ctx.scale(-1, 1);
    ctx.font = `${BIRD_RADIUS * 2}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🐦", 0, 2);
  }

  ctx.restore();
}

function draw() {
  drawBackground();
  drawPipes();
  drawBird();
}

function loop() {
  if (!running) return;
  update();
  draw();
  gameLoopId = requestAnimationFrame(loop);
}

function endGame() {
  running = false;
  cancelAnimationFrame(gameLoopId);

  if (score > best) {
    best = score;
    bestScoreEl.textContent = best;
    localStorage.setItem("flappy-face-best", best);
  }

  gameOverText.textContent = `Game over — score: ${score}`;
  gameOverPanel.classList.remove("hidden");
  draw();
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText("Game over", W / 2, H / 2 - 16);
  ctx.font = "600 15px sans-serif";
  ctx.fillText("Tap to play again", W / 2, H / 2 + 14);
}

// ===================== CONTROLS =====================
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    jump();
  }
});

btnJump.addEventListener("click", jump);
btnJumpOverlay.addEventListener("click", jump);
canvas.addEventListener("mousedown", jump);

btnRestart.addEventListener("click", () => {
  startGame();
});

btnChangePhoto.addEventListener("click", () => {
  running = false;
  cancelAnimationFrame(gameLoopId);
  gameScreen.classList.remove("active");
  startScreen.classList.add("active");
});

// initial idle draw before first start
initState();
draw();
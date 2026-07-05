// ===================== AVATAR PRESETS =====================
const AVATAR_PRESETS = ["😀", "🦸", "🐱", "🐶", "🤖", "👽", "🦁", "🐸"];

let avatars = {
  p1: { type: "text", value: "P1" },
  p2: { type: "text", value: "P2" },
};

function renderAvatarInto(el, player) {
  const a = avatars[player];
  el.innerHTML = "";
  if (a.type === "image") {
    const img = document.createElement("img");
    img.src = a.value;
    el.appendChild(img);
  } else {
    const span = document.createElement("span");
    span.textContent = a.value;
    el.appendChild(span);
  }
}

function updateAllAvatarDisplays() {
  renderAvatarInto(document.getElementById("avatar-p1"), "p1");
  renderAvatarInto(document.getElementById("avatar-p2"), "p2");
  renderAvatarInto(document.getElementById("game-avatar-p1"), "p1");
  renderAvatarInto(document.getElementById("game-avatar-p2"), "p2");
}

// build preset picker grids
document.querySelectorAll(".avatar-preset-grid").forEach((grid) => {
  const player = grid.dataset.player;
  AVATAR_PRESETS.forEach((emoji) => {
    const btn = document.createElement("button");
    btn.className = "avatar-preset-btn";
    btn.textContent = emoji;
    btn.addEventListener("click", () => {
      avatars[player] = { type: "text", value: emoji };
      grid.querySelectorAll(".avatar-preset-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      updateAllAvatarDisplays();
    });
    grid.appendChild(btn);
  });
});

function handleAvatarUpload(player, inputId) {
  document.getElementById(inputId).addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      avatars[player] = { type: "image", value: reader.result };
      updateAllAvatarDisplays();
    };
    reader.readAsDataURL(file);
  });
}
handleAvatarUpload("p1", "upload-p1");
handleAvatarUpload("p2", "upload-p2");

updateAllAvatarDisplays();

// ===================== DIFFICULTY =====================
let difficulty = "medium";
const DIFFICULTY_SETTINGS = {
  easy: { speed: 3.0, error: 40 },
  medium: { speed: 4.4, error: 18 },
  hard: { speed: 6.2, error: 4 },
};

document.querySelectorAll(".diff-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    difficulty = btn.dataset.diff;
    document.querySelectorAll(".diff-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// ===================== SCREEN NAV =====================
const homeScreen = document.getElementById("home-screen");
const gameScreen = document.getElementById("game-screen");

document.getElementById("btn-back").addEventListener("click", () => {
  stopGame();
  gameScreen.classList.remove("active");
  homeScreen.classList.add("active");
});

document.getElementById("btn-vs-computer").addEventListener("click", () => startMatch("computer"));
document.getElementById("btn-vs-friend").addEventListener("click", () => startMatch("friend"));

// ===================== GAME SETUP =====================
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

const PADDLE_W = 10;
const PADDLE_H = 64;
const PADDLE_MARGIN = 12;
const BALL_R = 7;
const WIN_SCORE = 5;

let mode, p1Y, p2Y, ball, scoreP1, scoreP2, running, loopId;
let keys = { w: false, s: false, up: false, down: false };
let aiErrorOffset = 0;
let lastBallDirection = 1;

function startMatch(newMode) {
  mode = newMode;
  p1Y = H / 2 - PADDLE_H / 2;
  p2Y = H / 2 - PADDLE_H / 2;
  scoreP1 = 0;
  scoreP2 = 0;
  document.getElementById("score-p1").textContent = 0;
  document.getElementById("score-p2").textContent = 0;
  document.getElementById("game-over-panel").classList.add("hidden");

  resetBall(Math.random() < 0.5 ? 1 : -1);

  homeScreen.classList.remove("active");
  gameScreen.classList.add("active");

  running = true;
  cancelAnimationFrame(loopId);
  loop();
}

function resetBall(direction) {
  ball = {
    x: W / 2,
    y: H / 2,
    vx: 3.2 * direction,
    vy: (Math.random() * 2 - 1) * 2.5,
  };
}

function stopGame() {
  running = false;
  cancelAnimationFrame(loopId);
}

// ===================== INPUT: KEYBOARD =====================
document.addEventListener("keydown", (e) => {
  if (e.key === "w" || e.key === "W") keys.w = true;
  if (e.key === "s" || e.key === "S") keys.s = true;
  if (e.key === "ArrowUp") { keys.up = true; e.preventDefault(); }
  if (e.key === "ArrowDown") { keys.down = true; e.preventDefault(); }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "w" || e.key === "W") keys.w = false;
  if (e.key === "s" || e.key === "S") keys.s = false;
  if (e.key === "ArrowUp") keys.up = false;
  if (e.key === "ArrowDown") keys.down = false;
});

// ===================== INPUT: TOUCH DRAG =====================
canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const scaleY = H / rect.height;

  Array.from(e.touches).forEach((touch) => {
    const touchX = touch.clientX - rect.left;
    const touchY = (touch.clientY - rect.top) * scaleY;

    if (touchX < rect.width / 2) {
      p1Y = clamp(touchY - PADDLE_H / 2, 0, H - PADDLE_H);
    } else if (mode === "friend") {
      p2Y = clamp(touchY - PADDLE_H / 2, 0, H - PADDLE_H);
    }
  });
}, { passive: false });

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// ===================== GAME LOOP =====================
function update() {
  const paddleSpeed = 5;

  if (keys.w) p1Y -= paddleSpeed;
  if (keys.s) p1Y += paddleSpeed;
  if (mode === "computer") {
    if (keys.up) p1Y -= paddleSpeed;
    if (keys.down) p1Y += paddleSpeed;
  }
  p1Y = clamp(p1Y, 0, H - PADDLE_H);

  if (mode === "friend") {
    if (keys.up) p2Y -= paddleSpeed;
    if (keys.down) p2Y += paddleSpeed;
    p2Y = clamp(p2Y, 0, H - PADDLE_H);
  } else {
    const cfg = DIFFICULTY_SETTINGS[difficulty];

    // only re-roll the AI's aiming error once per rally (when the ball
    // starts heading toward it), instead of every frame — recalculating
    // constantly made the paddle flinch/jitter instead of tracking smoothly
    if (ball.vx > 0 && lastBallDirection <= 0) {
      aiErrorOffset = Math.random() * cfg.error * 2 - cfg.error;
    }
    lastBallDirection = ball.vx;

    const target = ball.vx > 0
      ? ball.y - PADDLE_H / 2 + aiErrorOffset
      : H / 2 - PADDLE_H / 2; // drift back to center while ball is away

    if (p2Y < target) p2Y += cfg.speed;
    if (p2Y > target) p2Y -= cfg.speed;
    p2Y = clamp(p2Y, 0, H - PADDLE_H);
  }

  ball.x += ball.vx;
  ball.y += ball.vy;

  // top/bottom walls
  if (ball.y - BALL_R < 0 || ball.y + BALL_R > H) {
    ball.vy *= -1;
    ball.y = clamp(ball.y, BALL_R, H - BALL_R);
  }

  // left paddle collision
  if (
    ball.x - BALL_R < PADDLE_MARGIN + PADDLE_W &&
    ball.x - BALL_R > PADDLE_MARGIN - 4 &&
    ball.y > p1Y &&
    ball.y < p1Y + PADDLE_H &&
    ball.vx < 0
  ) {
    ball.vx *= -1.06;
    ball.vx = Math.min(ball.vx, 9);
    const hitPos = (ball.y - (p1Y + PADDLE_H / 2)) / (PADDLE_H / 2);
    ball.vy = hitPos * 4.5;
    ball.x = PADDLE_MARGIN + PADDLE_W + BALL_R;
  }

  // right paddle collision
  const rightX = W - PADDLE_MARGIN - PADDLE_W;
  if (
    ball.x + BALL_R > rightX &&
    ball.x + BALL_R < rightX + PADDLE_W + 4 &&
    ball.y > p2Y &&
    ball.y < p2Y + PADDLE_H &&
    ball.vx > 0
  ) {
    ball.vx *= -1.06;
    ball.vx = Math.min(ball.vx, 9);
    const hitPos = (ball.y - (p2Y + PADDLE_H / 2)) / (PADDLE_H / 2);
    ball.vy = hitPos * 4.5;
    ball.x = rightX - BALL_R;
  }

  // scoring
  if (ball.x < 0) {
    scoreP2++;
    document.getElementById("score-p2").textContent = scoreP2;
    checkGameOver() || resetBall(1);
  } else if (ball.x > W) {
    scoreP1++;
    document.getElementById("score-p1").textContent = scoreP1;
    checkGameOver() || resetBall(-1);
  }
}

function checkGameOver() {
  if (scoreP1 >= WIN_SCORE || scoreP2 >= WIN_SCORE) {
    stopGame();
    const winner = scoreP1 >= WIN_SCORE ? "p1" : "p2";
    const label = mode === "computer"
      ? (winner === "p1" ? "You win! 🎉" : "Computer wins!")
      : (winner === "p1" ? "Player 1 wins! 🎉" : "Player 2 wins! 🎉");
    document.getElementById("game-over-text").textContent = label;
    document.getElementById("game-over-panel").classList.remove("hidden");
    return true;
  }
  return false;
}

function draw() {
  ctx.fillStyle = "#1f8a4c";
  ctx.fillRect(0, 0, W, H);

  // center dashed line
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(W / 2, 0);
  ctx.lineTo(W / 2, H);
  ctx.stroke();
  ctx.setLineDash([]);

  // paddles
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(PADDLE_MARGIN, p1Y, PADDLE_W, PADDLE_H);
  ctx.fillRect(W - PADDLE_MARGIN - PADDLE_W, p2Y, PADDLE_W, PADDLE_H);

  // ball
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fillStyle = "#ff7043";
  ctx.fill();
}

function loop() {
  if (!running) return;
  update();
  draw();
  loopId = requestAnimationFrame(loop);
}

// ===================== RESTART =====================
document.getElementById("btn-play-again").addEventListener("click", () => {
  startMatch(mode);
});

// idle initial draw
p1Y = H / 2 - PADDLE_H / 2;
p2Y = H / 2 - PADDLE_H / 2;
ball = { x: W / 2, y: H / 2, vx: 0, vy: 0 };
draw();
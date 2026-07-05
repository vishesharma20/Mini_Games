// ===== setup =====
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const GRID_SIZE = 15;          // 15x15 grid
const CELL = canvas.width / GRID_SIZE;
const SPEED_MS = 130;          // lower = faster

let snake, direction, nextDirection, food, score, best, loopId, running;

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best-score");
const bannerEl = document.getElementById("banner");
const startBtn = document.getElementById("btn-start");

best = Number(localStorage.getItem("snake-best") || 0);
bestEl.textContent = best;

// ===== game setup =====
function resetGame() {
  snake = [
    { x: 7, y: 7 },
    { x: 6, y: 7 },
    { x: 5, y: 7 },
  ];
  direction = "right";
  nextDirection = "right";
  score = 0;
  scoreEl.textContent = score;
  bannerEl.classList.add("hidden");
  placeFood();
  draw();
}

function placeFood() {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  food = pos;
}

// ===== drawing =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // food
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--food-color");
  ctx.beginPath();
  ctx.arc(
    food.x * CELL + CELL / 2,
    food.y * CELL + CELL / 2,
    CELL / 2.6,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // snake
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--snake-color");
  snake.forEach((seg, i) => {
    const pad = i === 0 ? 1 : 2;
    ctx.fillRect(seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2);
  });
}

// ===== game loop =====
function tick() {
  direction = nextDirection;
  const head = { ...snake[0] };

  if (direction === "up") head.y--;
  if (direction === "down") head.y++;
  if (direction === "left") head.x--;
  if (direction === "right") head.x++;

  // wall collision
  if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
    return gameOver();
  }

  // self collision
  if (snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
    return gameOver();
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = score;
    placeFood();
  } else {
    snake.pop();
  }

  draw();
}

function gameOver() {
  clearInterval(loopId);
  running = false;
  startBtn.querySelector(".mode-title").textContent = "Play again";

  if (score > best) {
    best = score;
    bestEl.textContent = best;
    localStorage.setItem("snake-best", best);
  }

  bannerEl.textContent = `Game over — score: ${score}`;
  bannerEl.classList.remove("hidden");
}

function startGame() {
  resetGame();
  running = true;
  startBtn.querySelector(".mode-title").textContent = "Restart";
  clearInterval(loopId);
  loopId = setInterval(tick, SPEED_MS);
}

startBtn.addEventListener("click", startGame);

// ===== direction handling (prevents reversing into yourself) =====
function setDirection(dir) {
  const opposite = { up: "down", down: "up", left: "right", right: "left" };
  if (dir === opposite[direction]) return;
  nextDirection = dir;
}

// ===== keyboard controls =====
document.addEventListener("keydown", (e) => {
  const map = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    s: "down",
    a: "left",
    d: "right",
  };
  if (map[e.key]) {
    e.preventDefault();
    setDirection(map[e.key]);
  }
});

// ===== on-screen d-pad buttons =====
document.querySelectorAll(".dpad-btn").forEach((btn) => {
  btn.addEventListener("click", () => setDirection(btn.dataset.dir));
});

// ===== swipe controls on the canvas =====
let touchStart = null;

canvas.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  touchStart = { x: t.clientX, y: t.clientY };
});

canvas.addEventListener("touchend", (e) => {
  if (!touchStart) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    setDirection(dx > 0 ? "right" : "left");
  } else {
    setDirection(dy > 0 ? "down" : "up");
  }
  touchStart = null;
});

// ===== initial render (idle board before first start) =====
resetGame();

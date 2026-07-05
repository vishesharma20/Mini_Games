// ===================== ICON SETS =====================
const ICON_SETS = [
  { id: "classic", p1: { type: "text", value: "✕" }, p2: { type: "text", value: "◯" } },
  { id: "spooky", p1: { type: "text", value: "🎃" }, p2: { type: "text", value: "👻" } },
  { id: "cute", p1: { type: "text", value: "🐱" }, p2: { type: "text", value: "🐶" } },
  { id: "space", p1: { type: "text", value: "🌟" }, p2: { type: "text", value: "🌙" } },
  { id: "nature", p1: { type: "text", value: "🌸" }, p2: { type: "text", value: "🍀" } },
];

let selectedSetIndex = 0; // default = classic X / O
let customIcons = { p1: null, p2: null }; // data URLs override the preset when set

function getMark(player) {
  if (customIcons[player]) return { type: "image", value: customIcons[player] };
  return ICON_SETS[selectedSetIndex][player];
}

function renderMarkInto(el, player) {
  const mark = getMark(player);
  el.innerHTML = "";
  if (mark.type === "image") {
    const img = document.createElement("img");
    img.src = mark.value;
    el.appendChild(img);
  } else {
    el.textContent = mark.value;
  }
}

// ===================== HOME SCREEN SETUP =====================
const iconSetGrid = document.getElementById("icon-set-grid");
const previewBoard = document.getElementById("preview-board");
const uploadP1 = document.getElementById("upload-p1");
const uploadP2 = document.getElementById("upload-p2");
const difficultyRow = document.getElementById("difficulty-row");

let difficulty = "medium";

ICON_SETS.forEach((set, i) => {
  const btn = document.createElement("button");
  btn.className = "icon-set-btn" + (i === selectedSetIndex ? " active" : "");
  const label = (m) => (m.type === "text" ? m.value : "🖼️");
  btn.textContent = `${label(set.p1)} vs ${label(set.p2)}`;
  btn.addEventListener("click", () => {
    selectedSetIndex = i;
    customIcons = { p1: null, p2: null };
    document.querySelectorAll(".icon-set-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    drawPreviewBoard();
  });
  iconSetGrid.appendChild(btn);
});

function handleUpload(player, input) {
  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      customIcons[player] = reader.result;
      drawPreviewBoard();
    };
    reader.readAsDataURL(file);
  });
}
handleUpload("p1", uploadP1);
handleUpload("p2", uploadP2);

function drawPreviewBoard() {
  // decorative 3x3 preview mixing p1/p2 icons, similar to the reference layout
  const pattern = ["p1", "p2", "p2", "p2", "p1", "p2", "p1", "p2", "p1"];
  previewBoard.innerHTML = "";
  pattern.forEach((player) => {
    const cell = document.createElement("div");
    cell.className = "cell";
    renderMarkInto(cell, player);
    previewBoard.appendChild(cell);
  });
}
drawPreviewBoard();

difficultyRow.querySelectorAll(".diff-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    difficulty = btn.dataset.diff;
    difficultyRow.querySelectorAll(".diff-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// ===================== SCREEN NAVIGATION =====================
const homeScreen = document.getElementById("home-screen");
const gameScreen = document.getElementById("game-screen");

document.getElementById("btn-back").addEventListener("click", () => {
  gameScreen.classList.remove("active");
  homeScreen.classList.add("active");
});

document.getElementById("btn-vs-computer").addEventListener("click", () => {
  startMatch("computer");
});

document.getElementById("btn-vs-friend").addEventListener("click", () => {
  startMatch("friend");
});

// ===================== GAME STATE =====================
const boardEl = document.getElementById("board");
const winLineEl = document.getElementById("win-line");
const turnIndicator = document.getElementById("turn-indicator");
const resultBanner = document.getElementById("result-banner");
const scoreLine = document.getElementById("score-line");

const WIN_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],            // diagonals
];

let board, mode, currentPlayer, gameOver;
let scores = { p1: 0, p2: 0, draws: 0 };

function startMatch(newMode) {
  mode = newMode;
  board = Array(9).fill(null);
  currentPlayer = "p1";
  gameOver = false;

  resultBanner.classList.add("hidden");
  winLineEl.classList.add("hidden");
  winLineEl.innerHTML = "";

  renderBoard();
  updateTurnIndicator();
  updateScoreLine();

  homeScreen.classList.remove("active");
  gameScreen.classList.add("active");
}

function renderBoard() {
  boardEl.innerHTML = "";
  board.forEach((val, i) => {
    const cell = document.createElement("div");
    cell.className = "cell";
    if (val) renderMarkInto(cell, val);
    cell.addEventListener("click", () => handleCellClick(i));
    boardEl.appendChild(cell);
  });
}

function updateTurnIndicator() {
  if (mode === "computer") {
    turnIndicator.textContent = currentPlayer === "p1" ? "Your turn" : "Computer's turn";
  } else {
    turnIndicator.textContent = currentPlayer === "p1" ? "Player 1's turn" : "Player 2's turn";
  }
}

function updateScoreLine() {
  scoreLine.textContent = `P1: ${scores.p1} | P2: ${scores.p2} | Draws: ${scores.draws}`;
}

function handleCellClick(index) {
  if (gameOver || board[index]) return;
  if (mode === "computer" && currentPlayer === "p2") return; // block clicks during computer's turn

  makeMove(index, currentPlayer);

  if (!gameOver && mode === "computer" && currentPlayer === "p2") {
    turnIndicator.textContent = "Computer's turn";
    setTimeout(computerMove, 450);
  }
}

function makeMove(index, player) {
  board[index] = player;
  renderBoard();

  const combo = checkWinner(board, player);
  if (combo) {
    return endMatch(player, combo);
  }
  if (board.every((c) => c)) {
    return endMatch(null, null);
  }

  currentPlayer = currentPlayer === "p1" ? "p2" : "p1";
  updateTurnIndicator();
}

function checkWinner(b, player) {
  for (const combo of WIN_COMBOS) {
    if (combo.every((i) => b[i] === player)) return combo;
  }
  return null;
}

function endMatch(winner, combo) {
  gameOver = true;

  if (winner) {
    scores[winner]++;
    const name = mode === "computer"
      ? (winner === "p1" ? "You win!" : "Computer wins!")
      : (winner === "p1" ? "Player 1 wins!" : "Player 2 wins!");
    resultBanner.textContent = name;
    drawWinLine(combo);
  } else {
    scores.draws++;
    resultBanner.textContent = "It's a draw!";
  }

  resultBanner.classList.remove("hidden");
  updateScoreLine();
}

function drawWinLine(combo) {
  const [a, , c] = combo;
  const cellCenters = [
    [50, 50], [150, 50], [250, 50],
    [50, 150], [150, 150], [250, 150],
    [50, 250], [150, 250], [250, 250],
  ];
  const [x1, y1] = cellCenters[a];
  const [x2, y2] = cellCenters[c];

  winLineEl.innerHTML = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
  winLineEl.classList.remove("hidden");
}

// ===================== COMPUTER AI =====================
function computerMove() {
  if (gameOver) return;
  const empties = board.map((v, i) => (v ? null : i)).filter((v) => v !== null);
  let index;

  if (difficulty === "easy") {
    index = empties[Math.floor(Math.random() * empties.length)];
  } else if (difficulty === "medium") {
    index = Math.random() < 0.5
      ? bestMove()
      : empties[Math.floor(Math.random() * empties.length)];
  } else {
    index = bestMove();
  }

  makeMove(index, "p2");
}

function bestMove() {
  let bestScore = -Infinity;
  let move = null;
  board.forEach((val, i) => {
    if (!val) {
      board[i] = "p2";
      const score = minimax(board, 0, false);
      board[i] = null;
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  });
  return move;
}

function minimax(b, depth, isMaximizing) {
  if (checkWinner(b, "p2")) return 10 - depth;
  if (checkWinner(b, "p1")) return depth - 10;
  if (b.every((c) => c)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    b.forEach((val, i) => {
      if (!val) {
        b[i] = "p2";
        best = Math.max(best, minimax(b, depth + 1, false));
        b[i] = null;
      }
    });
    return best;
  } else {
    let best = Infinity;
    b.forEach((val, i) => {
      if (!val) {
        b[i] = "p1";
        best = Math.min(best, minimax(b, depth + 1, true));
        b[i] = null;
      }
    });
    return best;
  }
}

// ===================== RESTART / RESET =====================
document.getElementById("btn-play-again").addEventListener("click", () => {
  startMatch(mode);
});

document.getElementById("btn-reset-score").addEventListener("click", () => {
  scores = { p1: 0, p2: 0, draws: 0 };
  updateScoreLine();
});
// ===== constants =====
const CHOICES = ["rock", "paper", "scissors"];
const EMOJI = { rock: "✊", paper: "🖐️", scissors: "✌️" };

// beats[a] = the choice that a beats
const BEATS = { rock: "scissors", paper: "rock", scissors: "paper" };

// ===== state =====
let scores = {
  playerVsComputer: 0,
  computer: 0,
  p1: 0,
  p2: 0,
};

let friendChoices = { p1: null, p2: null };

// ===== screen navigation =====
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

document.querySelectorAll("[data-back]").forEach((btn) => {
  btn.addEventListener("click", () => showScreen(btn.dataset.back));
});

document.getElementById("btn-vs-computer").addEventListener("click", () => {
  showScreen("computer-screen");
});

document.getElementById("btn-vs-friend").addEventListener("click", () => {
  friendChoices = { p1: null, p2: null };
  showScreen("friend-turn1-screen");
});

// ===== winner logic =====
// returns "player", "computer"/"opponent", or "tie"
function decideWinner(a, b) {
  if (a === b) return "tie";
  return BEATS[a] === b ? "a" : "b";
}

// ===== COMPUTER MODE =====
document.querySelectorAll("#computer-screen .choice-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const playerChoice = btn.dataset.choice;
    const computerChoice = CHOICES[Math.floor(Math.random() * 3)];

    document.getElementById("player-hand").textContent = EMOJI[playerChoice];
    document.getElementById("computer-hand").textContent = EMOJI[computerChoice];

    const outcome = decideWinner(playerChoice, computerChoice);
    const banner = document.getElementById("computer-result");

    if (outcome === "tie") {
      banner.textContent = "It's a tie!";
    } else if (outcome === "a") {
      scores.playerVsComputer++;
      banner.textContent = `${playerChoice} wins`;
    } else {
      scores.computer++;
      banner.textContent = `${computerChoice} wins`;
    }

    document.getElementById("computer-score").textContent = scores.playerVsComputer;
    document.getElementById("cpu-score").textContent = scores.computer;
  });
});

document.getElementById("reset-computer").addEventListener("click", () => {
  scores.playerVsComputer = 0;
  scores.computer = 0;
  document.getElementById("computer-score").textContent = 0;
  document.getElementById("cpu-score").textContent = 0;
  document.getElementById("computer-result").textContent = "Make your move!";
  document.getElementById("player-hand").textContent = "❔";
  document.getElementById("computer-hand").textContent = "❔";
});

// ===== FRIEND MODE =====
// Player 1 picks
document.querySelectorAll('[data-friend-choice][data-player="1"]').forEach((btn) => {
  btn.addEventListener("click", () => {
    friendChoices.p1 = btn.dataset.friendChoice;
    showScreen("friend-pass-screen");
  });
});

document.getElementById("btn-ready-p2").addEventListener("click", () => {
  showScreen("friend-turn2-screen");
});

// Player 2 picks -> reveal
document.querySelectorAll('[data-friend-choice][data-player="2"]').forEach((btn) => {
  btn.addEventListener("click", () => {
    friendChoices.p2 = btn.dataset.friendChoice;
    revealFriendResult();
  });
});

function revealFriendResult() {
  const { p1, p2 } = friendChoices;
  document.getElementById("p1-hand").textContent = EMOJI[p1];
  document.getElementById("p2-hand").textContent = EMOJI[p2];

  const outcome = decideWinner(p1, p2);
  const banner = document.getElementById("friend-result");

  if (outcome === "tie") {
    banner.textContent = "It's a tie!";
  } else if (outcome === "a") {
    scores.p1++;
    banner.textContent = `${p1} wins — Player 1 takes it!`;
  } else {
    scores.p2++;
    banner.textContent = `${p2} wins — Player 2 takes it!`;
  }

  document.getElementById("p1-score").textContent = scores.p1;
  document.getElementById("p2-score").textContent = scores.p2;

  showScreen("friend-reveal-screen");
}

document.getElementById("btn-play-again").addEventListener("click", () => {
  friendChoices = { p1: null, p2: null };
  showScreen("friend-turn1-screen");
});

document.getElementById("reset-friend").addEventListener("click", () => {
  scores.p1 = 0;
  scores.p2 = 0;
  document.getElementById("p1-score").textContent = 0;
  document.getElementById("p2-score").textContent = 0;
});
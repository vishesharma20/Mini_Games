const DIFFICULTIES = {
  "1": { label: "EASY",   max: 50,  attempts: 10, base: 100, step: 5  },
  "2": { label: "MEDIUM", max: 100, attempts: 7,  base: 200, step: 10 },
  "3": { label: "HARD",   max: 200, attempts: 5,  base: 300, step: 20 },
};

let state = {};

const screens = {
  difficulty: document.getElementById("screen-difficulty"),
  game: document.getElementById("screen-game"),
  result: document.getElementById("screen-result"),
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
}

function startGame(diffKey) {
  const d = DIFFICULTIES[diffKey];
  state = {
    diffKey,
    max: d.max,
    maxAttempts: d.attempts,
    secret: Math.floor(Math.random() * d.max) + 1,
    attempts: 0,
    guesses: [],
    startTime: Date.now(),
  };

  document.getElementById("rangeText").textContent =
    `> I'm thinking of a number between 1 and ${d.max}`;
  updateAttemptsText();
  document.getElementById("feedback").textContent = "";
  document.getElementById("feedback").className = "feedback";
  document.getElementById("historyList").textContent = "";
  document.getElementById("meterFill").style.width = "0%";
  document.getElementById("guessInput").value = "";

  showScreen("game");
  document.getElementById("guessInput").focus();
}

function updateAttemptsText() {
  document.getElementById("attemptsText").textContent =
    `Attempt ${state.attempts + 1}/${state.maxAttempts}`;
}

function handleGuess(e) {
  e.preventDefault();
  const input = document.getElementById("guessInput");
  const guess = parseInt(input.value, 10);
  const feedback = document.getElementById("feedback");

  if (isNaN(guess) || guess < 1 || guess > state.max) {
    feedback.className = "feedback";
    feedback.textContent = `Please guess between 1 and ${state.max}.`;
    input.value = "";
    return;
  }

  state.attempts++;
  state.guesses.push(guess);
  input.value = "";

  const diff = Math.abs(guess - state.secret);
  const closeness = diff <= 5 ? "🔥 Very close!" : diff <= 15 ? "🙂 Getting close" : "🥶 Very far";

  document.getElementById("historyList").textContent = state.guesses.join(", ");

  if (guess === state.secret) {
    endGame(true);
    return;
  }

  feedback.className = "feedback " + (guess < state.secret ? "low" : "high");
  feedback.textContent =
    (guess < state.secret ? ">>LOW!\n" : ">>HIGH!\n") + closeness;

  const meterPct = Math.max(0, 100 - (diff / state.max) * 100);
  document.getElementById("meterFill").style.width = meterPct + "%";

  if (state.attempts >= state.maxAttempts) {
    endGame(false);
    return;
  }

  updateAttemptsText();
}

function endGame(won) {
  const box = document.getElementById("resultBox");
  const d = DIFFICULTIES[state.diffKey];

  if (won) {
    const seconds = Math.round((Date.now() - state.startTime) / 1000);
    const score = d.base - (state.attempts - 1) * d.step;
    const accuracy = ((1 / state.attempts) * 100).toFixed(1);

    box.innerHTML =
      `<span class="win">YOU WIN! 🎉</span>\n\n` +
      `Guessed in ${state.attempts} attempt(s)\n` +
      `Time taken: ${seconds}s\n` +
      `Score: ${score}\n` +
      `Accuracy: ${accuracy}%\n` +
      `History: ${state.guesses.join(", ")}`;
  } else {
    box.innerHTML =
      `<span class="lose">GAME OVER</span>\n\n` +
      `The secret number was ${state.secret}\n` +
      `History: ${state.guesses.join(", ")}`;
  }

  showScreen("result");
}

document.querySelectorAll(".opt").forEach(btn => {
  btn.addEventListener("click", () => startGame(btn.dataset.diff));
});

document.getElementById("guessForm").addEventListener("submit", handleGuess);

document.getElementById("playAgainBtn").addEventListener("click", () => {
  showScreen("difficulty");
});
# Mini Games 🎮

Just a bunch of small browser games I made for fun over a few sessions.
Nothing fancy, no frameworks, plain HTML, CSS, and JavaScript for every
single one, so they all just run by opening `index.html`, no build step,
no install, nothing.

## What's in here

- **rock, paper & scissor** — the classic, with a vs Computer mode and a
  vs Friend pass-and-play mode
- **snake game** — the classic snake, styled to match the rock paper
  scissors game, with swipe + on-screen d-pad controls
- **flappy bird** *(Flappy Face)* — the twist here: upload a photo and it
  detects your face and turns it into the bird using face-api.js, all
  running in-browser. Made it to prank people and it worked 😄
- **tic tac toe** — vs Computer with adjustable difficulty (hard mode uses
  the minimax algorithm and is unbeatable), vs Friend mode, and you can
  swap X/O for built-in icon sets or upload your own images
- **ping pong** — classic Pong with custom player avatars (presets or your
  own photo), vs Computer and vs Friend modes
- **number quest** — a number guessing game with higher/lower hints until
  you land on the right number

## Tech used

- HTML / CSS / JavaScript, no frameworks or build tools
- `localStorage` for saving high scores where relevant (snake, flappy face)
- `face-api.js` (via CDN) for the face-detection bit in Flappy Face — runs
  entirely client-side, nothing gets uploaded anywhere
- Canvas API for snake, flappy bird, and ping pong; plain DOM/CSS for tic
  tac toe and rock paper scissors

## How to run any of them

Just open that game's `index.html` in your browser. No server, no setup.

## Structure

```
games/
├── rock, paper & scissor/
├── snake game/
├── flappy bird/
├── tic tac toe/
├── ping pong/
└── number quest/
```

Each folder is fully self-contained (its own `index.html`, `style.css`,
`script.js`, and README with screenshots).
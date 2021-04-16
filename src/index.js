'use strict';

require('./style.css');

const { resizeCanvas } = require('./resize');
const { loadImage, loadSound } = require('./loadAsset');
const Control = require('./control');
const Note = require('./note');
const Lane = require('./lane');

const { CANVAS_WIDTH, CANVAS_HEIGHT, noteSize, targetY, BOARD_WIDTH, RATE } = require('./constants');

const MAPS = {
   insight: {
      background: loadImage('insight.png'),
      data: require('./insight.json'),
      song: loadSound('insight.mp3'),
      name: 'Insight',
   },
   ing: {
      background: loadImage('in-the-garden.jpg'),
      data: require('./in-the-garden.json'),
      song: loadSound('in-the-garden.mp3'),
      name: 'In the Garden',
   },
};

let MAP = MAPS['ing'];

const params = new URLSearchParams(window.location.search);

if (params.has('map')) {
   const map = params.get('map');
   if (map === 'insight') {
      MAP = MAPS['insight'];
   } else if (map === 'in-the-garden') {
      MAP = MAPS['ing'];
   }
}

const background = {
   image: MAP.background,
   x: 0,
   y: 0,
};

const judgements = {
   miss: [loadImage('miss.png')],
   bad: [loadImage('bad.png')],
   good: [loadImage('good.png')],
   great: [loadImage('great.png')],
   perfect: [loadImage('perfect.png')],
   excellent: [loadImage('excellent-1.png'), loadImage('excellent-2.png'), loadImage('excellent-3.png')],
};
const mapData = MAP.data;
const board = {
   x: Math.round(CANVAS_WIDTH / 2 - BOARD_WIDTH / 2),
   y: 0,
   width: BOARD_WIDTH,
   height: CANVAS_HEIGHT,
};
const startText = {
   x: Math.round(CANVAS_WIDTH / 2),
   y: Math.round(CANVAS_HEIGHT / 2 + CANVAS_HEIGHT / 5),
   range: [30, 40],
   speed: 20,
   up: false,
   size: 25,
};
const lanesCount = 4;
const laneWidth = Math.round(BOARD_WIDTH / lanesCount);
const lanes = makeLanes(lanesCount, ['KeyS', 'KeyD', 'KeyL', 'Semicolon']);

const controls = mapControls(['KeyS', 'KeyD', 'KeyL', 'Semicolon', 'Space', 'KeyM']);
const hitControls = { KeyS: 0, KeyD: 1, KeyL: 2, Semicolon: 3 };

const keyDown = {};

const game = {
   started: false,
   skin: 'circle',
   timer: 0,
   score: 0,
   notesHit: 0,
   notesMiss: 0,
   bestCombo: 0,
   show: null,
   scoreUp: null,
   excellentCount: 0,
   noteScore: 0,
};

const showJudgementTime = 0.5;
const scoreUpTime = 0.2;
const minimumShowScoreUpHits = 8;
const MAKING_MAP = true;
const map_notes = [];

const canvas = document.querySelector('.main-canvas');
const ctx = canvas.getContext('2d');
resizeCanvas([canvas]);
window.addEventListener('keydown', trackKeys);
window.addEventListener('keyup', trackKeys);
window.addEventListener('resize', () => resizeCanvas([canvas]));

let lastTime = 0;

window.addEventListener('load', () => {
   (function run(time = 0) {
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      updateGame(delta);
      renderGame();
      requestAnimationFrame(run);
   })();
});
function updateTimer(object, delta, max) {
   if (object != null) {
      object.timer += delta;
      if (object.timer >= max) {
         return true;
      }
   }
   return false;
}

function updateGame(dt) {
   const delta = dt * RATE;
   if (keyDown['Space'] && !game.started) {
      startGame();
   }
   if (!game.started) {
      updateStartText(delta);
      return;
   }
   game.timer += delta;
   game.excellentCount += judgements['excellent'].length * 5 * delta;
   if (game.excellentCount >= judgements['excellent'].length) {
      game.excellentCount = 0;
   }
   if (updateTimer(game.show, delta, showJudgementTime)) {
      game.show = null;
   }
   if (updateTimer(game.scoreUp, delta, scoreUpTime)) {
      game.scoreUp.hits--;
      game.scoreUp.hits = Math.max(game.scoreUp.hits, 0);
   }
   if (game.show && game.show.size) {
      game.show.size += delta * 0.8;
      if (game.show.size >= 0.15) {
         game.show.size = 0.15;
      }
   }
}

function drawBoard() {
   ctx.fillStyle = 'rgba(0, 0, 0, 1)';
   ctx.fillRect(board.x, board.y, board.width, board.height);
}
function drawLanes() {
   for (let i = 0; i < lanesCount; i++) {
      lanes[i].render(game, ctx);
   }
}
function renderGame() {
   ctx.clearRect(0, 0, canvas.width, canvas.height);
   ctx.drawImage(background.image, background.x, background.y, canvas.width, canvas.height);
   if (!game.started) {
      renderStartText();
      return;
   }
   drawBoard();
   drawLanes();
   bottomCircles();
   drawScore();
}

async function startGame() {
   await parseNotes(mapData.notes);
   window.music = MAP.song;
   game.started = true;
   window.music.volume = 0.4;
   window.music.playbackRate = RATE;
   window.music.play();
   // leaderboard part

   window.music.addEventListener('ended', function handle() {
      const leaderboard = document.querySelector('.leaderboard-container');
      const leaderboardDiv = document.querySelector('.leaderboard');
      const gameDiv = document.querySelector('.game');

      leaderboardDiv.classList.remove('hidden');
      gameDiv.classList.add('hidden');

      const name = String(prompt('Want to submit this score to the leaderboard!? Put your name here!')).slice(0, 15);

      window.ws = new WebSocket('wss://osu-mania-leaderboard.zerotixdev.repl.co');

      window.ws.addEventListener('open', () => {
         const max = (game.notesHit + game.notesMiss) * 3;
         const accuracy = round((game.noteScore / max) * 100, 2);
         window.ws.send(JSON.stringify({ type: 'func', mode: 'set', name, score: accuracy, map: MAP.name }));
      });

      window.ws.addEventListener('message', (msg) => {
         const data = JSON.parse(msg.data);
         if (data.info) {
            const array = [...data.info];
            array.sort((a, b) => b.score - a.score);
            const html = array.reduce(
               (acc, cur) =>
                  acc +
                  `
				<div class="leaderboard-div">
					<h1 class="leaderboard-name">${cur.name}</h1>
					<h1 class="leaderboard-score">${cur.score}%</h1>
					<h1 class="leaderboard-map">${cur.map}</h1>
				</div>
				`,
               ''
            );
            leaderboard.innerHTML = html;
         }
      });

      setInterval(() => {
         if (window.ws === undefined || window.ws.readyState !== 1) return;
         window.ws.send(JSON.stringify({ type: 'refresh' }));
      }, 2000);

      window.ws.addEventListener('close', () => {
         alert('The connection has closed. Try refreshing or check your connection');
      });
      window.music.removeEventListener('ended', handle);
   });
}

function renderStartText() {
   ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
   ctx.fillRect(startText.x - 200, startText.y - 50, 400, 200);
   ctx.fillStyle = 'white';
   ctx.textAlign = 'center';
   ctx.textBaseline = 'middle';
   ctx.font = `${Math.round(startText.size)}px Arial`;
   ctx.fillText('press space to start', startText.x, startText.y);
   ctx.font = `${Math.round(startText.size - 5)}px Arial`;
   ctx.fillText('controls: [s, d, l, ;]', startText.x, startText.y + 50);
   ctx.fillText(`Map: ${MAP.name}`, startText.x, startText.y + 100);
}

function updateStartText(delta) {
   if (!startText.up) {
      startText.size -= startText.speed * delta;
      if (startText.size <= startText.range[0]) {
         startText.up = !startText.up;
         startText.size = startText.range[0];
      }
   } else if (startText.up) {
      startText.size += startText.speed * delta;
      if (startText.size >= startText.range[1]) {
         startText.up = !startText.up;
         startText.size = startText.range[1];
      }
   }
}

function mapControls(controls) {
   const object = Object.create(null);
   for (const control of controls) {
      object[control] = new Control();
   }
   return object;
}

function bottomCircles() {
   ctx.strokeStyle = 'white';
   ctx.lineWidth = 3;
   for (let i = 0; i < lanesCount; i++) {
      const x = Math.round(board.x + i * laneWidth + laneWidth / 2);
      const keydown = keyDown[lanes[i].key] !== undefined && keyDown[lanes[i].key] != false;
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(x, targetY, noteSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      if (keydown) {
         ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      }
      ctx.beginPath();
      ctx.arc(x, targetY, noteSize, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
   }
}

function drawScore() {
   ctx.fillStyle = game.scoreUp != null && game.scoreUp.hits >= minimumShowScoreUpHits ? '#dbc70f' : 'white';
   ctx.textAlign = 'center';
   ctx.textBaseline = 'middle';
   ctx.font = `${50 + 4 * Math.min(2, game.scoreUp?.hits ?? 0 / minimumShowScoreUpHits)}px Mukta`;
   ctx.fillText(game.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);
   if (game.show != null) {
      let image = judgements[game.show.type][0];
      if (game.show.type === 'excellent' || game.show.type === 'perfect') {
         if (game.show.type === 'excellent') {
            image = judgements[game.show.type][Math.floor(game.excellentCount)];
         }
         const ratio = image.width / image.height;
         const width = image.width * ratio * (game.show.size + 0.01);
         const height = image.height * ratio * (game.show.size + 0.01);
         ctx.drawImage(image, CANVAS_WIDTH / 2 - width / 2, CANVAS_HEIGHT / 2 - height / 2, width, height);
      } else if (game.show.type !== 'excellent' && game.show.type !== 'perfect') {
         const ratio = image.width / image.height;
         const width = image.width * ratio * (game.show.size + 0.15);
         const height = image.height * ratio * (game.show.size + 0.15);
         ctx.drawImage(image, CANVAS_WIDTH / 2 - width / 2, CANVAS_HEIGHT / 2 - height / 2, width, height);
      }
   }
   ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
   ctx.textAlign = 'start';
   ctx.textBaseline = 'alphabetic';
   ctx.fillRect(0, 0, 250, 200);
   ctx.font = '25px Mukta';
   ctx.fillStyle = 'white';
   ctx.fillText(`Notes Hit: ${game.notesHit}`, 20, 40);
   ctx.fillText(`Notes Miss: ${game.notesMiss}`, 20, 70);
   ctx.fillText(`Best Combo: ${game.bestCombo}`, 20, 100);
   const max = (game.notesHit + game.notesMiss) * 3;
   const accuracy = round((game.noteScore / max) * 100, 2);
   ctx.fillText(`Accuracy: ${accuracy}%`, 20, 130);
   ctx.font = `40px Arial`;
   ctx.fillText(`GRADE: ${grade()}`, 20, 180);
}

function grade() {
   const max = (game.notesHit + game.notesMiss) * 3;
   const accuracy = round((game.noteScore / max) * 100, 2);
   if (accuracy >= 100) {
      return 'SS';
   } else if (accuracy >= 95) {
      return 'S';
   } else if (accuracy >= 93) {
      return 'A';
   } else if (accuracy >= 90) {
      return 'A-';
   } else if (accuracy >= 87) {
      return 'B+';
   } else if (accuracy >= 83) {
      return 'B';
   } else if (accuracy >= 80) {
      return 'B-';
   } else if (accuracy >= 70) {
      return 'C';
   } else if (accuracy >= 60) {
      return 'D';
   } else {
      return 'F';
   }
}
function trackKeys(event) {
   const control = controls[event.code];
   if (!control) return;
   if (event.type === 'keydown') {
      if (!control.lock) {
         keyDown[event.code] = true;
         detectHit(event.code);
         control.lock = true;
         if (event.code === 'KeyM' && MAKING_MAP) {
            console.log('console logging map making notes....');
            console.log(JSON.stringify(map_notes));
         }
      }
   } else if (event.type === 'keyup') {
      control.lock = false;
      keyDown[event.code] = false;
   }
}

function makeLanes(lanes, controls) {
   const object = Object.create(null);
   for (let i = 0; i < lanes; i++) {
      object[i] = new Lane(controls[i], i);
   }
   return object;
}

function addNote(index, object) {
   lanes[index].notes.push(object);
}

function parseNotes(notes) {
   return new Promise((resolve) => {
      for (const [index, time] of notes) {
         addNote(index, new Note(Math.round(board.x + index * laneWidth + laneWidth / 2), time));
      }
      resolve();
   });
}

function detectHit(code) {
   if (MAKING_MAP && hitControls[String(code)] != undefined) {
      map_notes.push([hitControls[String(code)], round(game.timer, 2)]);
   }
   if (!game.started || hitControls[String(code)] === undefined) return;
   const lane = lanes[hitControls[String(code)]];
   if (!lane) return;
   const note = lane.notes[0];
   if (!note) return;
   function hit() {
      lane.notes.splice(0, 1);
      game.score += 1;
      game.notesHit += 1;
      if (game.score >= game.bestCombo) {
         game.bestCombo = game.score;
      }
      if (game.scoreUp != null) {
         const hits = game.scoreUp.hits;
         game.scoreUp = { timer: 0, hits: hits + 1 };
      } else {
         game.scoreUp = { timer: 0, hits: 0 };
      }
   }
   const timeBetween = Math.abs(game.timer - note.time);
   if (timeBetween < 0.04) {
      hit();
      game.show = { type: 'excellent', timer: 0, size: 0.08 };
      game.noteScore += 3;
   } else if (timeBetween < 0.08) {
      hit();
      game.show = { type: 'perfect', timer: 0, size: 0.08 };
      game.noteScore += 3;
   } else if (timeBetween < 0.12) {
      hit();
      game.show = { type: 'great', timer: 0, size: 0.08 };
      game.noteScore += 2;
   } else if (timeBetween < 0.16) {
      hit();
      game.show = { type: 'good', timer: 0, size: 0.08 };
      game.noteScore += 1;
   } else if (timeBetween <= 0.2) {
      hit();
      game.show = { type: 'bad', timer: 0, size: 0.08 };
      game.noteScore += 0.5;
   }
}

function round(value, decimals) {
   return Math.round(value * 10 ** decimals) / 10 ** decimals;
}

const readline = require('readline');

const map = [];

const width = 34;
const height = 14;

let player = {
	x: 15,
	y: 2,
	char: '@',
};

let mobs = [];

function createMap() {
	for (let y = 0; y < height; y++) {
		map[y] = [];
		for (let x = 0; x < width; x++) {
			if (y === 0 || x === 0 || y === height - 1 || x === width - 1) {
				map[y][x] = '#';
			} else {
				map[y][x] = '.';
			}
		}
	}
}

function drawMap() {
	console.clear();
	let output = '';
	for (let y = 0; y < height; y++) {
		let row = '';

		for (let x = 0; x < width; x++) {
			const mob = getMob(x, y);
			if (player.x === x && player.y === y) {
				row += player.char;
			} else if (mob) {
				row += mob.char;
			} else {
				row += map[y][x];
			}
		}
		output += row + '\n';
	}
	output += '\nWASD / arrows — move, Q — quit\n';
	console.log(output);
}

function getMob(x, y) {
	return mobs.find(mob => {
		return mob.x === x && mob.y === y;
	});
}

function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getFreeCell(x, y) {
	if (map[y][x] === '#') {
		return false;
	}

	if (player.x === x && player.y === y) {
		return false;
	}

	if (getMob(x, y)) {
		return false;
	}
	return true;
}

function getRandomFreeCells() {
	while (true) {
		const x = randomInt(1, width - 2);
		const y = randomInt(1, height - 2);

		if (getFreeCell(x, y)) {
			return { x, y };
		}
	}
}

function createMobs(count) {
	for (let i = 0; i < count; i++) {
		let pos = getRandomFreeCells();

		mobs.push({
			x: pos.x,
			y: pos.y,
			char: 'M',
		});
	}
}

function movePlayer(dx, dy) {
	const nextY = player.y + dy;
	const nextX = player.x + dx;

	if (map[nextY][nextX] === '#') {
		return;
	}

	player.x = nextX;
	player.y = nextY;

	drawMap();
}

function handleInput(key) {
	switch (key.name) {
		case 'w':
		case 'up':
			movePlayer(0, -1);
			break;

		case 's':
		case 'down':
			movePlayer(0, 1);
			break;

		case 'a':
		case 'left':
			movePlayer(-1, 0);
			break;

		case 'd':
		case 'right':
			movePlayer(1, 0);
			break;

		case 'q':
			process.exit();
	}
}

readline.emitKeypressEvents(process.stdin);

if (process.stdin.isTTY) {
	process.stdin.setRawMode(true);
}

process.stdin.on('keypress', function (str, key) {
	if (key.ctrl && key.name === 'c') {
		process.exit();
	}

	handleInput(key);
});

createMap();
createMobs(5);
drawMap();

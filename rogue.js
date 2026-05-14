const readline = require('readline');

const map = [];

let mode = 'game';
let currentShop = null;

const width = 34;
const height = 14;

let message = ``;

let player = {
	x: 15,
	y: 2,
	char: '@',
	hp: 15,
	hits: 4,
	gold: 75,
};

let mobs = [];

const shops = [
	{
		x: 10,
		y: 10,
		char: '$',
		name: 'Shop!!!',
	},
];

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
			const shop = getShop(x, y);
			if (player.x === x && player.y === y) {
				row += player.char;
			} else if (mob) {
				row += mob.char;
			} else if (shop) {
				row += shop.char;
			} else {
				row += map[y][x];
			}
		}
		output += row + '\n';
	}
	output += '\nWASD / arrows — move, Q — quit\n';
	output += `Hp: ${player.hp}, hits: ${player.hits}, gold: ${player.gold}\n`;
	output += `Message: ${message}\n`;

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

function getShop(x, y) {
	return shops.find(shop => {
		return shop.x === x && shop.y === y;
	});
}

function createMobs(count) {
	for (let i = 0; i < count; i++) {
		let pos = getRandomFreeCells();

		mobs.push({
			x: pos.x,
			y: pos.y,
			char: 'M',
			hp: 10,
			gold: 10,
			hits: 2,
		});
	}
}

function movePlayer(dx, dy) {
	const nextY = player.y + dy;
	const nextX = player.x + dx;

	if (map[nextY][nextX] === '#') {
		message = 'You hit wall haha';
		drawMap();
		return;
	}

	const mob = getMob(nextX, nextY);

	if (mob) {
		fightMod(mob);
		message = `You hit mob. Mob HP: ${player.hp}. Mob hit you for ${mob.hits}.`;
		drawMap();
		return;
	}

	const shop = getShop(nextX, nextY);

	if (shop) {
		mode = 'shop';
		currentShop = shop;
		message = 'Welcome!';
		drawShop(shop);
		return;
	}

	player.x = nextX;
	player.y = nextY;

	message = '';

	drawMap();
}

function handleInput(key) {
	if (mode === 'game') {
		handleGameInput(key);
	} else if (mode === 'shop') {
		handleShopInput(key);
	}
}

function handleGameInput(key) {
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

function handleShopInput(key) {
	switch (key.name) {
		case '1':
			getPotion();
			drawShop(currentShop);
			break;
		case '2':
			getSword();
			drawShop(currentShop);
			break;
		case '3':
		case 'escape':
			mode = 'game';
			currentShop = null;
			message = 'You left the shop.';
			drawMap();
			break;
	}
}

function drawShop(shop) {
	console.clear();

	let output = ``;

	output += '====================\n';
	output += `      ${currentShop.name}\n`;
	output += '====================\n\n';

	output += `Your gold: ${player.gold}\n`;
	output += `Your HP: ${player.hp}\n\n`;

	output += '1 — Buy potion (+5 HP) — 10 gold\n';
	output += '2 — Buy sword (+1 damage) — 25 gold\n';
	output += '3 — Leave shop\n\n';

	output += `Message: ${message}\n`;

	console.log(output);
}

function getSword() {
	if (player.gold < 25) {
		message = `Not enough gold`;
		return;
	}

	player.hits += 1;
	player.gold -= 25;

	message = `You buy sword. +1 hit`;
}

function getPotion() {
	if (player.gold < 10) {
		message = `Not enough gold`;
		return;
	}

	player.hp += 5;
	player.gold -= 10;

	message = `You buy potion. +5 hp`;
}

function fightMod(mob) {
	mob.hp -= player.hits;

	if (mob.hp <= 0) {
		player.gold += mob.gold;

		let index = mobs.indexOf(mob);
		mobs.splice(index, 1);

		message = `You killed mob! Gold: +${mob.gold}`;

		return;
	}
	player.hp -= mob.hits;

	if (player.hp <= 0) {
		console.clear();
		console.log('You died.');
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

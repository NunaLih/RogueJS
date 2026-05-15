const readline = require('readline');

const map = [];

let mode = 'game';
let currentShop = null;
let currentShip = null;

const width = 34;
const height = 14;

let currentWidth = width;
let currentHeight = height;

let worldLevel = 1;

let message = ``;

const maxMobs = 8;
const minMobs = 2;

let location;

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

const ships = [
	{
		x: 25,
		y: 10,
		char: 'S',
		name: 'Ship...',
		price: 30,
	},
];

const dungeon = [
	{
		x: 30,
		y: 6,
		char: '>',
		name: 'dungeon',
	},
];

function createBaseMap(w, h) {
	for (let y = 0; y < h; y++) {
		map[y] = [];
		for (let x = 0; x < w; x++) {
			if (y === 0 || x === 0 || y === h - 1 || x === w - 1) {
				map[y][x] = '#';
			} else {
				map[y][x] = '.';
			}
		}
	}
}

function createMap() {
	currentHeight = height;
	currentWidth = width;

	location = 'world';

	player.x = 15;
	player.y = 2;

	createBaseMap(currentWidth, currentHeight);
	drawMap();
}

function createDungeon() {
	currentHeight = 10;
	currentWidth = 10;

	location = 'dungeon';

	player.x = 2;
	player.y = 2;

	mobs = [];

	createBaseMap(currentWidth, currentHeight);

	map[3][3] = '~';
	map[3][4] = '~';
	map[4][3] = '~';

	createMobsDungeon(4);

	message = 'You entered the dungeon.';
	drawMap();
}

function createDungeonMob() {
	const pos = getRandomFreeCells();

	mobs.push({
		x: pos.x,
		y: pos.y,
		char: 'R',
		hp: 8 + worldLevel * 2,
		gold: 5 + worldLevel * 2,
		hits: 1 + worldLevel,
		type: 'dungeonMob',
	});
}

function createDungeonBoss() {
	const pos = getRandomFreeCells();

	mobs.push({
		x: pos.x,
		y: pos.y,
		char: 'B',
		hp: 25 + worldLevel * 2,
		gold: 60 + worldLevel * 2,
		hits: 2 + worldLevel,
		type: 'dungeonBoss',
	});
}

function createMobsDungeon(count) {
	mobs = [];
	for (let i = 0; i < count; i++) {
		createDungeonMob();
	}
	createDungeonBoss();
}

function drawMap() {
	console.clear();
	let output = '';

	for (let y = 0; y < currentHeight; y++) {
		let row = '';

		for (let x = 0; x < currentWidth; x++) {
			const mob = getMob(x, y);
			const shop = getShop(x, y);
			const ship = getShip(x, y);
			const dungeon = getDungeon(x, y);

			if (player.x === x && player.y === y) {
				row += player.char;
			} else if (mob) {
				row += mob.char;
			} else if (shop) {
				row += shop.char;
			} else if (ship) {
				row += ship.char;
			} else if (dungeon) {
				row += dungeon.char;
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

	if (getShip(x, y)) {
		return false;
	}

	if (getShop(x, y)) {
		return false;
	}

	if (getMob(x, y)) {
		return false;
	}

	if (getDungeon(x, y)) {
		return false;
	}

	return true;
}

function getRandomFreeCells() {
	while (true) {
		const x = randomInt(1, currentWidth - 2);
		const y = randomInt(1, currentHeight - 2);

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
			hp: 10 + worldLevel * 2,
			gold: 10 + worldLevel * 2,
			hits: worldLevel,
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
		message = `You hit mob. Mob HP: ${mob.hp}. Mob hit you for ${mob.hits}.`;
		// moveMobs();
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

	const ship = getShip(nextX, nextY);

	if (ship) {
		mode = 'ship';
		currentShip = ship;
		message = 'Welcome ship!';
		drawShip(ship);
		return;
	}

	const dungeon = getDungeon(nextX, nextY);

	if (dungeon) {
		mode = 'game';
		return;
	}

	player.x = nextX;
	player.y = nextY;

	message = '';
	moveMobs();
	if (location === 'world') {
		generationNewMobs();
	}

	drawMap();
}

function handleInput(key) {
	if (mode === 'game') {
		handleGameInput(key);
	} else if (mode === 'shop') {
		handleShopInput(key);
	} else if (mode === 'ship') {
		handleShipInput(key);
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

		case 'u':
			createDungeon();
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

function handleShipInput(key) {
	switch (key.name) {
		case '1':
			travelToNewWorld();
			break;
		case '2':
			mode = 'game';
			currentShip = null;
			message = 'You left the ship.';
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

function getShip(x, y) {
	return ships.find(ship => {
		return ship.x === x && ship.y === y;
	});
}

function drawShip(ship) {
	console.clear();

	let output = '';

	output += '====================\n';
	output += `      ${ship.name}\n`;
	output += '====================\n\n';

	output += `Current world: ${worldLevel}\n`;
	output += `Your gold: ${player.gold}\n\n`;

	output += `1 — Travel to next world — ${ship.price} gold\n`;
	output += '2 — Leave ship\n\n';

	output += `Message: ${message}\n`;

	console.log(output);
}

function travelToNewWorld() {
	if (player.gold < currentShip.price) {
		message = `Not enough gold`;
		drawShip(currentShip);
		return;
	}

	player.gold -= currentShip.price;

	worldLevel += 1;
	createNewWorld();

	message = `You travel new world.`;

	drawMap();
}

function createNewWorld() {
	mobs = [];

	player.x = 15;
	player.y = 2;

	createMap();
	createMobs(8);

	mode = 'game';
	currentShip = null;
}

function generationNewMobs() {
	if (mobs.length >= minMobs) {
		return;
	}

	const mobsQuan = maxMobs - mobs.length;
	createMobs(mobsQuan);

	message = 'Spawn more mobs...';
}

function moveMobs() {
	let mobsDirection = [
		{ dx: 1, dy: 0 },
		{ dx: -1, dy: 0 },
		{ dx: 0, dy: 1 },
		{ dx: 0, dy: -1 },
		{ dx: 0, dy: 0 },
	];

	for (const mob of mobs) {
		const dxToPlayer = player.x - mob.x;
		const dyToPlayer = player.y - mob.y;

		const distanceToPlayer = Math.abs(dxToPlayer) + Math.abs(dyToPlayer);
		const direction = mobsDirection[randomInt(0, mobsDirection.length - 1)];

		const nextY = mob.y + direction.dy;
		const nextX = mob.x + direction.dx;

		if (distanceToPlayer === 1) {
			player.hp -= mob.hits;
			message = `Mob hit you -${mob.hits}.`;

			if (player.hp <= 0) {
				console.clear();
				message = 'You died.';
				process.exit();
			}
			continue;
		}

		if (getFreeCell(nextX, nextY)) {
			mob.x = nextX;
			mob.y = nextY;
		}
	}
}

function getDungeon(x, y) {
	return dungeon.find(dung => {
		return dung.x === x && dung.y === y;
	});
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

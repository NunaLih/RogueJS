const { type } = require('os');
const readline = require('readline');

const reset = '\x1b[0m';
const red = '\x1b[31m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const blue = '\x1b[34m';

let mode = 'game';

let worldLevel = 1;

let message = ``;

const maxMobs = 8;
const minMobs = 2;

let currentShip = null;
let currentShop = null;

let player = {
	x: 15,
	y: 2,
	char: '@',
	hp: 15,
	maxHp: 50,
	hits: 4,
	gold: 75,

	inventory: [],

	equipment: {
		weapon: null,
		armor: null,
	},
};

const worlds = {
	overworld: createWorld(34, 14, 'world'),
	dungeon: createWorld(10, 10, 'dungeon'),
};

let activeWorld = worlds.overworld;

const shopItems = [
	{ name: 'Base heal', type: 'potion', value: 5, price: 10 },
	{ name: 'Medium heal', type: 'potion', value: 15, price: 35 },
	{ name: 'Super heal', type: 'potion', value: 60, price: 90 },
	{ name: 'Base weapon', type: 'weapon', damage: 1, price: 20 },
	{ name: 'Dragonsword', type: 'weapon', damage: 10, price: 150 },
	{ name: 'Claw', type: 'weapon', damage: 4, price: 70 },
];

function createBaseMap(w, h) {
	activeWorld.map = [];
	for (let y = 0; y < h; y++) {
		activeWorld.map[y] = [];
		for (let x = 0; x < w; x++) {
			if (y === 0 || x === 0 || y === h - 1 || x === w - 1) {
				activeWorld.map[y][x] = '#';
			} else {
				activeWorld.map[y][x] = '.';
			}
		}
	}
}

function createWorld(width, height, type) {
	return {
		type,
		map: [],
		width: width,
		height: height,
		mobs: [],
		shops: [],
		ships: [],
		dungeon: [],
		door: [],
	};
}

function generateWorldOjects(world) {
	world.ships = [];
	world.shops = [];
	world.dungeon = [];
	world.door = [];

	if (world.type === 'world') {
		world.shops.push({
			x: randomInt(2, world.width - 3),
			y: randomInt(2, world.height - 3),
			char: '$',
			name: 'Shop!!!',
			items: [],
		});

		world.ships.push({
			x: randomInt(2, world.width - 3),
			y: randomInt(2, world.height - 3),
			char: 'S',
			name: 'Ship...',
			price: 30,
		});

		world.dungeon.push({
			x: randomInt(2, world.width - 3),
			y: randomInt(2, world.height - 3),
			char: '>',
			name: 'dungeon',
		});
	}

	if (world.type === 'dungeon') {
		world.door.push({
			x: randomInt(2, world.width - 3),
			y: randomInt(2, world.height - 3),
			char: '<',
			target: 'outside',
		});
	}
}

function createMap(world) {
	activeWorld = world;

	player.x = 15;
	player.y = 2;

	createBaseMap(activeWorld.width, activeWorld.height);
	generateWorldOjects(activeWorld);
	drawMap();
}

function createDungeon() {
	worlds.dungeon = createWorld(10, 10, 'dungeon');

	activeWorld = worlds.dungeon;
	createMap(activeWorld);

	player.x = 2;
	player.y = 2;

	activeWorld.map[3][3] = '~';
	activeWorld.map[3][4] = '~';
	activeWorld.map[4][3] = '~';

	createMobsDungeon(4);

	message = 'You entered the dungeon.';
	drawMap();
}

function createDungeonMob() {
	const pos = getRandomFreeCells();

	activeWorld.mobs.push({
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

	activeWorld.mobs.push({
		x: pos.x,
		y: pos.y,
		char: `${blue + 'B' + reset}`,
		hp: 25 + worldLevel * 2,
		gold: 60 + worldLevel * 2,
		hits: 2 + worldLevel,
		type: 'dungeonBoss',
	});
}

function createMobsDungeon(count) {
	activeWorld.mobs = [];
	for (let i = 0; i < count; i++) {
		createDungeonMob();
	}
	createDungeonBoss();
}

function drawMap() {
	console.clear();
	let output = '';

	for (let y = 0; y < activeWorld.height; y++) {
		let row = '';

		for (let x = 0; x < activeWorld.width; x++) {
			const mob = getMob(x, y);
			const shop = getShop(x, y);
			const ship = getShip(x, y);
			const dungeon = getDungeon(x, y);
			const door = activeWorld.type === 'dungeon' ? getDoor(x, y) : null;

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
			} else if (door) {
				row += door.char;
			} else {
				row += activeWorld.map[y][x];
			}
		}
		output += row + '\n';
	}
	output += '\nWASD/arrows — move, I - inventory, Q — quit\n\n';
	output += `Hp: ${red + player.hp + reset}/${red + player.maxHp + reset}, hits: ${getPlayerDamage()}, gold: ${yellow + player.gold + reset}\n`;
	output += `Weapon: ${player.equipment.weapon ? green + player.equipment.weapon.name + reset : 'none'}  `;
	output += `Armor: ${player.equipment.armor ? green + player.equipment.armor.name + reset : 'none'}\n`;
	output += `Inventory: ${player.inventory.length} item\n`;
	output += `Message: ${message}\n`;

	console.log(output);
}

function getMob(x, y) {
	return activeWorld.mobs.find(mob => {
		return mob.x === x && mob.y === y;
	});
}

function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getFreeCell(x, y) {
	if (activeWorld.map[y][x] === '#') {
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
		const x = randomInt(1, activeWorld.width - 2);
		const y = randomInt(1, activeWorld.height - 2);

		if (getFreeCell(x, y)) {
			return { x, y };
		}
	}
}

function getShop(x, y) {
	return activeWorld.shops.find(shop => {
		return shop.x === x && shop.y === y;
	});
}

function createMobs(count) {
	for (let i = 0; i < count; i++) {
		let pos = getRandomFreeCells();

		activeWorld.mobs.push({
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

	if (activeWorld.map[nextY][nextX] === '#') {
		message = 'You hit wall haha';
		drawMap();
		return;
	}

	const mob = getMob(nextX, nextY);

	if (mob) {
		fightMod(mob);
		message = `You hit mob. Mob HP: ${red + mob.hp + reset}. Mob hit you for ${mob.hits}.`;
		drawMap();
		return;
	}

	const shop = getShop(nextX, nextY);

	if (shop) {
		mode = 'shop';
		currentShop = shop;
		message = 'Welcome!';

		if (shop.items.length <= 0) {
			shop.items = generateShopItems(5);
		}

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
		createDungeon();
		return;
	}

	const doorExit = getDoor(nextX, nextY);

	if (doorExit && doorExit.target === 'outside') {
		getOutside();
		return;
	}

	player.x = nextX;
	player.y = nextY;

	message = '';
	moveMobs();
	if (activeWorld.type === 'world') {
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
	} else if (mode === 'inventory') {
		handleInventory(key);
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

		case 'e':
			createDungeon();
			break;

		case 'i':
			mode = 'inventory';
			openInventory();
			break;

		case 'q':
			process.exit();
	}
}

function openInventory() {
	console.clear();

	let output = '==== Inventory ====\n\n';

	if (player.inventory.length === 0) {
		output += 'Inventory empty..\n\n';
	} else {
		player.inventory.forEach((item, index) => {
			output += `${index + 1}. - ${item.name}\n`;
		});
	}
	output += `\n${yellow + '+==+===' + green + 'Equipment' + yellow + '+==+===' + reset}\n`;
	output += `${green + 'Weapon' + reset}: ${player.equipment.weapon ? player.equipment.weapon.name : 'none'}\n`;
	output += `\n${green + 'Armor' + reset}: ${player.equipment.armor ? player.equipment.armor.name : 'none'}\n`;

	output += '\n\nEsc - close inventory';
	console.log(output);
}

function handleInventory(key) {
	if (key.name === 'escape') {
		mode = 'game';
		drawMap();
		return;
	}

	const index = Number(key.name) - 1;

	const item = player.inventory[index];

	if (!item) {
		return;
	}

	if (item.type === 'potion') {
		player.hp = Math.min(item.value + player.hp, player.maxHp);

		player.inventory.splice(index, 1);

		message = `Used ${item.name} + ${item.value}hp`;

		mode = 'game';
		drawMap();
		return;
	}

	if (item.type === 'weapon') {
		if (player.equipment.weapon) {
			player.inventory.push(player.equipment.weapon);
		}

		player.equipment.weapon = item;

		player.inventory.splice(index, 1);

		message = `Equipped ${item.name} +${item.damage} hit`;
		mode = 'game';
		drawMap();
		return;
	}
}

function getPlayerDamage() {
	let damage = player.hits;

	if (player.equipment.weapon) {
		damage += player.equipment.weapon.damage;
	}

	return damage;
}

function getArmorPlayer() {}

function generateShopItems(item) {
	const shuffl = shopItems.sort(() => {
		return 0.5 - Math.random();
	});
	const randomElem = shuffl.slice(0, item);
	return randomElem;
}

function buyItem(item) {
	if (player.gold < item.price) {
		message = `Not enough gold`;
		return;
	}

	player.gold -= item.price;

	if (item.type === 'weapon') {
		player.inventory.push({
			name: item.name,
			type: item.type,
			damage: item.damage,
		});
		console.log((message = `Added inventory ${item.name} +${item.damage} hit`));
	}
	if (item.type === 'potion') {
		player.inventory.push({
			name: item.name,
			type: item.type,
			value: item.value,
		});
		console.log((message = `Added inventory ${item.name} +${item.value}hp`));
	}
}

function handleShopInput(key) {
	if (key.name === 'escape') {
		mode = 'game';
		drawMap();
		return;
	}

	const index = Number(key.name) - 1;

	const item = currentShop.items[index];

	buyItem(item);
	drawShop(currentShop);
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

	let item = shop.items;

	output += '====================\n';
	output += `${shop.name}\n`;
	output += '====================\n\n';
	output += `Your gold: ${yellow + player.gold + reset}\n`;
	output += `Your HP: ${red + player.hp + reset}\n\n`;

	item.forEach((elem, index) => {
		if (elem.type === 'weapon') {
			return (output += `${index + 1}. ${elem.name} (${elem.damage})hit — ${elem.price} gold\n`);
		}
		if (elem.type === 'potion') {
			return (output += `${index + 1}. ${elem.name} +(${elem.value})hp — ${elem.price} gold\n`);
		}
	});
	output += `\nMessage: ${message}\n`;
	output += '\n\nExit shop - Esc';

	console.log(output);
}

function fightMod(mob) {
	mob.hp -= getPlayerDamage();

	if (mob.hp <= 0) {
		player.gold += mob.gold;

		let index = activeWorld.mobs.indexOf(mob);
		activeWorld.mobs.splice(index, 1);

		message = `You killed mob! Gold: +${yellow + mob.gold + reset}`;

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
	return activeWorld.ships.find(ship => {
		return ship.x === x && ship.y === y;
	});
}

function drawShip(ship) {
	console.clear();

	let output = '';

	output += '====================\n';
	output += `      ${activeWorld.ships.name}\n`;
	output += '====================\n\n';

	output += `Current world: ${worldLevel}\n`;
	output += `Your gold: ${player.gold}\n\n`;

	output += `1 — Travel to next world — ${currentShip.price} gold\n`;
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
	activeWorld.mobs = [];

	player.x = 15;
	player.y = 2;

	createMap(worlds.overworld);
	createMobs(8);
	mode = 'game';
}

function generationNewMobs() {
	if (activeWorld.mobs.length >= minMobs) {
		return;
	}

	const mobsQuan = maxMobs - activeWorld.mobs.length;
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

	for (const mob of activeWorld.mobs) {
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
	return activeWorld.dungeon.find(dung => {
		return dung.x === x && dung.y === y;
	});
}

function getDoor(x, y) {
	return activeWorld.door.find(dung => {
		return dung.x === x && dung.y === y;
	});
}

function getOutside() {
	activeWorld.mobs = [];
	createMap(worlds.overworld);
	createMobs(8);
	drawMap();
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

createMap(worlds.overworld);
createMobs(5);
drawMap();

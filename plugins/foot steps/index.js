// config
const FOOT_PRINT_TEXTURE = '⋂';
const FOOT_PRINT_PROBABILITY = .015;
const MAX_FOOTSTEPS = 5000;

const { chunks } = require('./bullet');
const bullet = require('./bullet');
const plugin = bullet.makePlugin('FootSteps');
const INVALID_TILES = ['w', 'M', 't', 'T', 'H', 'C'];
let footSteps = [];

let tick = 0;

let dirToChar = {
	'n': '<span>' + FOOT_PRINT_TEXTURE + '</span>',
	'e': '<span style="transform:rotate(90deg);display:inline-block;">' + FOOT_PRINT_TEXTURE + '</span>',
	's': '<span style="transform:rotate(180deg);display:inline-block;">' + FOOT_PRINT_TEXTURE + '</span>',
	'w': '<span style="transform:rotate(270deg);display:inline-block;">' + FOOT_PRINT_TEXTURE + '</span>',
	'ne': '<span style="transform:rotate(45deg);display:inline-block;">' + FOOT_PRINT_TEXTURE + '</span>',
	'nw': '<span style="transform:rotate(315deg);display:inline-block;">' + FOOT_PRINT_TEXTURE + '</span>',
	'se': '<span style="transform:rotate(135deg);display:inline-block;">' + FOOT_PRINT_TEXTURE + '</span>',
	'sw': '<span style="transform:rotate(225deg);display:inline-block;">' + FOOT_PRINT_TEXTURE + '</span>'
};

/**
 * @param {bullet.players.player} player
 */
function playerTick(player) {
	const {x, y} = player.public;
	let visiblePrints = [];
	const canPlayerSee = (location) => {
		return location.x <= x + 15 && location.x >= x - 15 && location.y <= y + 15 && location.y >= y - 15;
	}
	for(const print of footSteps) {
		if(canPlayerSee(print)) {
			visiblePrints.push(print);
		}
	}
	if(visiblePrints.length > 0) {// don't write empty data to be sent to the client
		if(player.temp.proximity === undefined) {
			player.temp.proximity = {};
		}
		if(player.temp.proximity.objs === undefined) {
			player.temp.proximity.objs = [];
		}
		const objs = player.temp.proximity.objs;// pointer
		for(const print of visiblePrints) {
			objs.push({
				x: print.x,
				y: print.y,
				char: print.char,
				is_breakable: false,
				is_door: false,
				walk_over: true
			})
		}
		player.addPropToQueue('proximity')
	}
}

/**
 * @param {bullet.players.player} player
 */
function movePlayer(player) {
	const {x, y} = player.public;
	if(Math.random() < FOOT_PRINT_PROBABILITY && !INVALID_TILES.includes(bullet.generateTileAt(x, y)) && !chunks.isObjectHere(x, y) && footSteps.find(loc => loc.x === x && loc.y === y) === undefined && player?.cache?.travelData?.dir !== '') {
		footSteps.push({x: x, y: y, char: dirToChar[player.cache.travelData.dir]});
	}
}

plugin.on('gameTick', () => {
	tick++;
	while(footSteps.length > MAX_FOOTSTEPS) {
		footSteps.shift();
	}
	footSteps = footSteps.filter(footstep => !chunks.isObjectHere(footstep.x, footstep.y));
}, -10);
plugin.on('playerTick', playerTick, -10);
plugin.on('travelers::onPlayerStep', movePlayer, -10);
plugin.on('ready', () => {
	bullet.emit('tileDescriptors', 'addTileDescription', FOOT_PRINT_TEXTURE, 'a footprint.');
})
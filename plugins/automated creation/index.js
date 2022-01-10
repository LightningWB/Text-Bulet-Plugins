const bullet = require('./bullet');
const items = require('./items.json');
const noise = require('./noise');
const STEEL_CRATE_SIZE = 500;
const COST_ITEM = 'battery';
const COST_ITEM_WEIGHT = 4;
let storage;

const plug = bullet.makePlugin('automated-creation');
let config = plug.getStorage();
if(Object.keys(config).length === 0) {
	config = {
		oilSeed: Math.random(),
		copperSeed: Math.random(),
		ironSeed: Math.random(),
		sulfurSeed: Math.random()
	};
	plug.setStorage(config);
}

const oilNoise = noise(config.oilSeed);

const noises = [
	{
		name: 'copper',
		noise: noise(config.copperSeed)
	},
	{
		name: 'iron',
		noise: noise(config.ironSeed)
	},
	{
		name: 'sulfur',
		noise: noise(config.sulfurSeed)
	}
];

function getTier(noise, x, y) {
	const val = noise.simplex2(x / 180, y / 180);
	if(val > .85)return 5;
	else if(val > .5)return 4;
	else if(val > -.05)return 3;
	else if(val > -.25)return 2;
	else return 1;
};

plug.on('travelers::canPlaceStructure', (data, player, out) => {
	switch(data.id) {
		case 'lumber_mill':
			for(let x = data.x - 10; x <= data.x + 10; x++) {
				for(let y = data.y - 10; y <= data.y + 10; y++) {
					if(bullet.generateBiomeAt(x, y) !== 'forest' || bullet.chunks.isObjectHere(x, y)) {
						out.set(false);
						return false;
					}
				}
			}
			out.set(true);
			return false;
			break;

		case 'oil_rig':
			for(let x = data.x - 5; x <= data.x + 5; x++) {
				for(let y = data.y - 5; y <= data.y + 5; y++) {
					if(bullet.generateTileAt(x, y) !== 'w') {
						out.set(false);
						return false;
					}
				}
			}
			out.set(bullet.chunks.getObject(data.x, data.y)?.private?.structureId === 'ocean_platform');
			return false;
			break;

		case 'mineshaft':
			for(let x = data.x - 15; x <= data.x + 15; x++) {
				for(let y = data.y - 15; y <= data.y + 15; y++) {
					const biome = bullet.generateBiomeAt(x, y);
					if(biome !== 'mountains' || bullet.chunks.isObjectHere(x, y)) {
						out.set(false);
						return false;
					}
				}
			}
			out.set(true);
			return false;
			break;

		case 'solar_panel':
			for(let x = data.x - 10; x <= data.x + 10; x++) {
				for(let y = data.y - 10; y <= data.y + 10; y++) {
					if(bullet.generateBiomeAt(x, y) !== 'desert') {
						out.set(false);
						return false;
					}
				}
			}
			break;
	}
}, 100);

// generate the resource for the event
plug.on('travelers::calcPlayerEvent', (player) => {
	const {x, y} = player.public;
	if(bullet.chunks.isObjectHere(x, y)) {
		const obj = bullet.chunks.getObject(x, y);
		const eventData = player.private?.eventData;
		const fullLoot = obj.private?.eventData?.loot;
		let prevTime = obj.private.prevTime;
		if(eventData && eventData.room === storage && prevTime && fullLoot) {
			const loot = fullLoot[storage] || {};
			let changed = false;
			switch(eventData.type) {
				// not greater thans because undefined storage values
				case 'structure_lumber_mill':
					while(prevTime < Date.now() - 1000 * 60 * 60 && loot[COST_ITEM] >= 1 && !(loot.wood_stick >= 200)) {
						changed = true;
						bullet.emit('travelers', 'addItem', 'wood_stick', 21 + Math.floor(Math.random() * 5), loot);
						bullet.emit('travelers', 'removeItem', COST_ITEM, 1, loot);
						prevTime += 1000 * 60 * 60;
					}
					break;
				
				case 'structure_mineshaft':
					let targetItem = obj.private.target;
					if(targetItem) {
						const id = {
							copper: 'copper_ore',
							iron: 'iron_ore',
							sulfur: 'sulfur'
						}[targetItem];
						const tier = getTier(noises.find(n=>n.name === targetItem).noise, x, y);
						const scaler = {
							copper: .6 * tier,
							iron: .5 * tier,
							sulfur: .3 * tier
						}[targetItem];
						const weight = {
							copper: 6,
							iron: 6,
							sulfur: 2
						}[targetItem];
						while(prevTime < Date.now() - 1000 * 60 * 60 && loot[COST_ITEM] >= 1 && !(loot[id] * weight >= 250)) {
							changed = true;
							const amount = Math.floor(Math.random() * 5 * scaler) + 1;
							bullet.emit('travelers', 'addItem', id, amount, loot);
							bullet.emit('travelers', 'removeItem', COST_ITEM, 1, loot);
							prevTime += 1000 * 60 * 60;
						}
					}
					break;
				
				case 'structure_oil_rig':
					let tier = getTier(oilNoise, x, y);
					while(prevTime < Date.now() - 1000 * 60 * 60 * 2 && loot[COST_ITEM] >= 1 && !(loot.oil_drum >= 6)) {
						changed = true;
						bullet.emit('travelers', 'addItem', 'oil_drum', 1 - Math.round(-tier * .3 * Math.random()), loot);
						bullet.emit('travelers', 'removeItem', COST_ITEM, 1, loot);
						prevTime += 1000 * 60 * 60 * 2;
					}
					break;
					
				case 'structure_solar_panel':
					while(prevTime < Date.now() - 1000 * 60 * 60 * 6 && !(loot.battery >= 12)) {
						changed = true;
						bullet.emit('travelers', 'addItem', 'battery', 1, loot);
						prevTime += 1000 * 60 * 60 * 6;
					}
					break;
			}
			if(changed) {
				prevTime = Date.now();
			}
			obj.private.prevTime = prevTime;
		} else if(eventData && eventData.room === storage && fullLoot) {
			// if everything but prevTime was there
			obj.private.prevTime = Date.now();
		}
	}
}, 100);

// ui rendering
plug.on('travelers::calcPlayerEvent', (player) => {
	const {x, y} = player.public;
	if(bullet.chunks.isObjectHere(x, y)) {
		const obj = bullet.chunks.getObject(x, y);
		const eventData = player.private?.eventData;
		if(eventData && eventData.room === 'main' && eventData.type === 'structure_mineshaft') {
			player.temp.event_data.stage_data.desc = player.temp.event_data.stage_data.desc.replace('[[mineral]]', obj.private.target || 'unset');
		}
	}
}, -100);

plug.on('actions::genmsg', (packet, player) => {
	if(packet.option === 'setMineshaftTargetResource' && player.private.eventData && player.private.eventData.type === 'structure_mineshaft' && bullet.chunks.isObjectHere(player.public.x, player.public.y)) {
		const r = packet.text || '';
		const obj = bullet.chunks.getObject(player.public.x, player.public.y);
		if(['copper', 'iron', 'sulfur'].includes(r)) {
			obj.private.target = r;
			bullet.emit('travelers', 'eventLog', 'set mineral to ' + r + '.', player);
			bullet.emit('travelers', 'calcPlayerEvent', player);
		} else {
			bullet.emit('travelers', 'eventLog', 'invalid mineral type.', player);
		}
		return false;
	}
}, 1000);

plug.on('equip_actions::ground_analyzer::analyze', player => {
	const {x, y} = player.public;
	const biome = bullet.generateBiomeAt(x, y);
	if(biome !== 'mountains' && biome !== 'hills') {
		bullet.emit('travelers', 'eventLog', `unable to analyze rock here.`, player);
		return;
	}
	const tierToDescription = {
		5: 'a gigantic vein',
		4: 'a large vein',
		3: 'an average vein',
		2: 'a small vein',
		1: 'a tiny vein'
	};
	let result = '';
	for(const noise of noises) {
		const tier = getTier(noise.noise, x, y);
		result += `detected ${tierToDescription[tier]} of ${noise.name}\n`;
	}
	player.raw(`POPUP.new("analysis", ${JSON.stringify(result)})`);
});

plug.on('equip_actions::boat::check_oil_levels', player => {
	const {x, y} = player.public;
	if(bullet.generateTileAt(x, y) === 'w' && player.private.supplies.water_analyzer > 0) {
		const tier = getTier(oilNoise, x, y);
		const dec = {
			5: 'a very large amount of oil detected',
			4: 'a large amount of oil detected',
			3: 'an average amount of oil detected',
			2: 'a small amount of oil detected',
			1: 'a tiny amount of oil detected'
		}[tier];
		bullet.emit('travelers', 'eventLog', `the machine flashes and shows a message. ${dec}. (${x}, ${y})`, player);
	}
});

// only solar panel since the other ones need you to open them up to add batteries anyways
plug.on('travelers::structurePlaced::solar_panel', (obj) => {
	obj.private.prevTime = Date.now();
}, -100);

plug.on('travelers::addGameItem', (id, item) => {
	if(id === 'boat') {
		if(item.func_actions === undefined) {
			item.func_actions = {};
		}
		item.func_actions.check_oil_levels = {
			server: 'check_oil_levels',
			client: "if(YOU.currentTile !== 'w') {ENGINE.log('unable to analyze here.', false);} else if (SUPPLIES.current['water_analyzer'] !== undefined) {ENGINE.log('analyzing...', false);} else {ENGINE.log('you don\\'t have a water analyzer.');}",
			btn_text: 'check oil levels'
		};
	}
}, 10);

plug.on('ready', () => {
	for(const item of items) {
		if(item.craft_time) {
			item.craft_time = Math.floor(item.craft_time * bullet.options.tps);
		}
		if(item.break_time) {
			item.break_time = Math.floor(item.break_time * bullet.options.tps);
		}
		bullet.emit('travelers', 'addGameItem', item.name, item);
	}
	bullet.emit('travelers', 'addCraftableItem', 'lumber_mill', 44);
	bullet.emit('travelers', 'addCraftableItem', 'refinery', 49);
	bullet.emit('travelers', 'addCraftableItem', 'oil_rig', 59);
	bullet.emit('travelers', 'addCraftableItem', 'water_analyzer', 59);
	bullet.emit('travelers', 'addCraftableItem', 'mineshaft', 64);
	bullet.emit('travelers', 'addCraftableItem', 'ground_analyzer', 64);
	bullet.emit('travelers', 'addCraftableItem', 'factory', 69);
	bullet.emit('travelers', 'addCraftableItem', 'solar_panel', 74);
	bullet.emit('travelers', 'addStructureData', {
		id: 'lumber_mill',
		placingItem: 'lumber_mill',
		char: '∸',
		eventId: 'structure_lumber_mill',
		eventType: 'structure_lumber_mill',
		isBreakable: true,
		breakTime: Math.floor(2400 * bullet.options.tps)
	});
	bullet.emit('travelers', 'addStructureData', {
		id: 'refinery',
		placingItem: 'refinery',
		char: '⌬',
		eventId: 'structure_refinery',
		eventType: 'structure_refinery',
		isBreakable: true,
		breakTime: Math.floor(2400 * bullet.options.tps)
	});
	bullet.emit('travelers', 'addStructureData', {
		id: 'oil_rig',
		placingItem: 'oil_rig',
		char: '⦜',
		eventId: 'structure_oil_rig',
		eventType: 'structure_oil_rig',
		isBreakable: true,
		breakTime: Math.floor(2400 * bullet.options.tps)
	});
	bullet.emit('travelers', 'addStructureData', {
		id: 'mineshaft',
		placingItem: 'mineshaft',
		char: 'Π',
		eventId: 'structure_mineshaft',
		eventType: 'structure_mineshaft',
		isBreakable: true,
		breakTime: Math.floor(2400 * bullet.options.tps)
	});
	bullet.emit('travelers', 'addStructureData', {
		id: 'factory',
		placingItem: 'factory',
		char: '⌂',
		eventId: 'structure_factory',
		eventType: 'structure_factory',
		isBreakable: true,
		breakTime: Math.floor(2400 * bullet.options.tps)
	});
	bullet.emit('travelers', 'addStructureData', {
		id: 'solar_panel',
		placingItem: 'solar_panel',
		char: '▤',
		eventId: 'structure_solar_panel',
		eventType: 'structure_solar_panel',
		isBreakable: true,
		breakTime: Math.floor(2400 * bullet.options.tps)
	});
	bullet.emit('tileDescriptors', 'addTileDescription', '∸', 'a lumber mill.');
	bullet.emit('tileDescriptors', 'addTileDescription', '⌬', 'a refinery.');
	bullet.emit('tileDescriptors', 'addTileDescription', '⦜', 'an offshore oil rig.');
	bullet.emit('tileDescriptors', 'addTileDescription', 'Π', 'a mine.');
	bullet.emit('tileDescriptors', 'addTileDescription', '⌂', 'a factory.');
	bullet.emit('tileDescriptors', 'addTileDescription', '▤', 'a solar panel.');
	bullet.emit('travelers', 'addEvent', 'structure_lumber_mill', require('./structure_lumber_mill.json'));
	bullet.emit('travelers', 'addEvent', 'structure_refinery', require('./structure_refinery.json'));
	bullet.emit('travelers', 'addEvent', 'structure_oil_rig', require('./structure_oil_rig.json'));
	bullet.emit('travelers', 'addEvent', 'structure_mineshaft', require('./structure_mineshaft.json'));
	bullet.emit('travelers', 'addEvent', 'structure_factory', require('./structure_factory.json'));
	bullet.emit('travelers', 'addEvent', 'structure_solar_panel', require('./structure_solar_panel.json'));
	let out = bullet.util.out('', 'string');
	bullet.emit('travelers', 'getHashedValue', 'storage', out);
	storage = out.get();
});
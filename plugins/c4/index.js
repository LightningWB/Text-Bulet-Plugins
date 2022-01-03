const bullet = require('./bullet');

const plug = bullet.makePlugin('c4');

const c4 = {
	name: 'c4',
	title: 'c4',
	type: 'weap',
	weight: 10,
	icon: '⌹',
	desc: 'a small brick of c4 capable of destroying a structure. wood tier structures require 1 c4 to destroy, scrap requires 3 to destroy and steel needs 5.',
	craft: true,
	craft_time: 300,
	craft_data: {
		plastic: {
			count: 3,
			title: 'plastic pieces'
		},
		alien_fragment: {
			count: 3,
			title: 'unknown material fragment'
		},
		control_panel: {
			count: 1,
			title: 'control panel'
		}
	},
	breaker: true,
	break_ratio: 100,
};

const structureIdToTier = {
	'wood_block': 1,
	'wood_door': 1,
	'scrap_block': 3,
	'scrap_door': 3,
	'steel_block': 5,
	'steel_door': 5,
	'reality_anchor': 1
};

plug.on('actions::break', (packet, player) => {
	const {x, y} = player.public;
	const {x: breakX, y: breakY} = bullet.util.compassChange(x, y, packet.dir, 1);
	const structure = bullet.chunks.getObject(breakX, breakY);
	if(packet.option === 'c4' && player.private.supplies.c4 > 0 && structure && structureIdToTier[structure.private.structureId]) {
		// do custom breaking
		const tier = structureIdToTier[structure.private.structureId];
		if(player.private.supplies.c4 < tier) {
			bullet.emit('travelers', 'eventLog', 'not enough c4 to break this structure.', player);
		} else {
			bullet.chunks.removeObject(breakX, breakY);
			bullet.emit('travelers', 'takePlayerItem', c4.name, tier, player);
			bullet.emit('travelers', 'renderItems', player);
			if(!(player.private.supplies[c4.name] > 0)) {
				bullet.emit('travelers', 'addExeJs', player, 'BUILD.close_break();');
			}
			bullet.emit('travelers', 'eventLog', 'detonated structure with ' + tier + ' c4.', player);
		}
		return false;
	} else if(packet.option === 'c4' && player.private.supplies.c4 > 0) {
		bullet.emit('travelers', 'eventLog', 'unable to detonate c4 at this location.', player);
		return false;
	}
}, 10);

plug.on('ready', () => {
	bullet.emit('travelers', 'addGameItem', c4.name, c4);
	bullet.emit('travelers', 'addCraftableItem', c4.name, 34);
});
const bullet = require('./bullet');

const plug = bullet.makePlugin('c4');

const c4 = {
	name: 'c4',
	title: 'c4',
	type: 'tool',
	weight: 10,
	icon: '⌹',
	desc: 'a small brick of c4 capable of destroying a structure instantly.',
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

plug.on('travelers::breakStructure', (x, y, player) => {
	if(player.private.breakStructure.item === c4.name) {
		bullet.emit('travelers', 'takePlayerItem', c4.name, 1, player);
		bullet.emit('travelers', 'renderItems', player);
		if(!(player.private.supplies[c4.name] > 0)) {
			bullet.emit('travelers', 'addExeJs', player, 'BUILD.close_break();');
		}
	}
});

plug.on('ready', () => {
	bullet.emit('travelers', 'addGameItem', c4.name, c4);
	bullet.emit('travelers', 'addCraftableItem', c4.name, 24);
});
const bullet = require('./bullet');

const plug = bullet.makePlugin('balanced boat');

const oppositeDirs = {
	'ne': 'sw',
	'nw': 'se',
	'se': 'nw',
	'sw': 'ne',
	'n': 's',
	's': 'n',
	'e': 'w',
	'w': 'e'
};

plug.on('actions::setDir', (packet, player) => {
	const {x, y} = player.public;
	if(player.public.equipped === 'boat' && player?.private?.recentDir !== oppositeDirs[packet.dir] && player?.private?.recentDir !== packet.dir && bullet.generateTileAt(x, y) === 'w') {
		return false;
	}
	if(packet.dir !== '') {
		player.private.recentDir = packet.dir;
	}
}, 10);

plug.on('ready', () => {
	bullet.emit('travelers', 'addCraftableItem', 'boat', 24);
});
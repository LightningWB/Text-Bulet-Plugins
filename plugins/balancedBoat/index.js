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
	if(player.public.equipped === 'boat' && player?.public?.recentDir !== oppositeDirs[packet.dir] && player?.public?.recentDir !== packet.dir && bullet.generateTileAt(x, y) === 'w') {
		return false;
	}
	if(packet.dir !== '') {
		player.public.recentDir = packet.dir;
	}
}, 10);

plug.on('ready', () => {
	bullet.emit('travelers', 'addCraftableItem', 'boat', 24);
	const item = {};
	bullet.emit('travelers', 'getItem', 'boat', item);
	item.func_desc = item.func_desc.replace('.', '. once you set sail, you can only change your direction to the opposite direction.');
	bullet.emit('travelers', 'addGameItem', item.name, item);
});

bullet.patches.addJs('ENGINE.oppositeDirs = ' + JSON.stringify(oppositeDirs) + ';');
bullet.patches.addListener('recentDir', dir => {
	YOU.oldDir = dir;
});
bullet.patches.addPatch('ENGINE.dir', 'YOU.state !== "travel"', 'YOU.state !== "travel" || (EQUIP.current_id === "boat" && YOU.currentTile === "w" && dir !== "a" && (ENGINE.oppositeDirs[YOU.oldDir] !== dir && YOU.oldDir !== dir))', false);
bullet.patches.addPatch('ENGINE.dir', 'clearTimeout(EVENTS.leaveEventCountdown);', 'if(dir!=="a")YOU.oldDir = dir; clearTimeout(EVENTS.leaveEventCountdown);', false);
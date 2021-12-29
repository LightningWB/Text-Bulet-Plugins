const bullet = require('./bullet');
const plugin = bullet.makePlugin('SpeedBoots');

const config = plugin.loadConfig({
	header: 'Speed Boots\nby LightningWB',
	options: {
		speedBoost: {
			allowed: 'Integer',
			default: 5,
			description: 'The speed boost multiplier.',
		}
	}
});

const speedBoots = {
	name: 'speedBoots',
	title: 'speed boots',
	type: 'tool',
	weight: 0,
	icon: '⊾',
	desc: 'so weightless; even touching it makes you feel lighter.',
	func: true,
	func_desc: 'with these boots on, you can run ' + config.speedBoost + 'x faster than ever before.'
}


function getPlayerSpeed(player, out) {
	if(player.public.equipped === speedBoots.name) {
		out.set(out.get() * config.speedBoost);
	}
}

plugin.on('travelers::getMovementSpeed', getPlayerSpeed, 1);
setTimeout(() => {
	bullet.emit('travelers', 'addGameItem', speedBoots.name, speedBoots);
})
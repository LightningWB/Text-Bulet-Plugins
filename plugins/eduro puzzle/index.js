const bullet = require('./bullet');
const monument = require('./monument');
const { chunks } = require('./bullet');

const plug = bullet.makePlugin('eduroPuzzle');

const lifeFormTransformer = {
	name: 'lifeFormTransformer',
	title: 'life form transformer',
	type: 'tool',
	weight: 25,
	desc: 'allows the user to teleport to the nearest life form.',
	icon: '⧰',
	func: true,
	func_desc: 'allows the user to teleport to the nearest life form.',
	func_actions: {
		transform: {
			server: 'transform',
			client: 'ENGINE.log(\'transforming...\');',
			btn_text: 'transform'
		}
	}
};

plug.on('equip_actions::lifeFormTransformer::transform', player => {
	const distanceTo = (loc1, loc2) => Math.max(Math.abs(loc1.x - loc2.x), Math.abs(loc1.y - loc2.y));
	let closest = null;
	let closestDist = Infinity;
	const onlinePlayers = bullet.players.getPlayerNames().map(name => bullet.players.getPlayerByUsername(name));
	for(const pl of onlinePlayers) {
		const dist = distanceTo(pl.public, player.public);
		if(dist < closestDist && pl.public.state !== 'death' && pl.public.username !== player.public.username) {
			closestDist = dist;
			closest = pl;
		}
	}
	if(closest) {
		player.public.x = closest.public.x;
		player.public.y = closest.public.y;
		player.addPropToQueue('x', 'y');
		bullet.emit('travelers', 'eventLog', 'successfully transformed.', player);
	} else {
		bullet.emit('travelers', 'eventLog', 'unable to find awake life form.', player);
	}
})

plug.on('equip_actions::shovel::dig', player => {
	const { x, y} = player.public;
	if(x === 828 && y === -761 && !chunks.isObjectHere(x, y)) {
		bullet.emit('travelers', 'addEventTile', 828, -761, '⧇', 'facility', 'eduroPuzzle');
		bullet.emit('travelers', 'movePlayerToEvent', player);
		bullet.emit('travelers', 'calcPlayerEvent', player);
		return false;
	}
}, 1000);

plug.on('travelers::canPlaceStructure', (data, player, out) => {
	const { x, y } = data;
	if(x === 828 && y === -761) {
		out.set(false);
		return false;
	}
}, 1000);

plug.on('ready', () => {
	monument();
	bullet.emit('travelers', 'addGameItem', lifeFormTransformer.name, lifeFormTransformer);
	// puzzle events
	bullet.emit('travelers', 'addEvent', 'eduroPuzzle', require('./valley.json'));
	bullet.emit('travelers', 'addEvent', 'eduroPuzzle', require('./facility.json'));
	bullet.chunks.waitForChunkToBeLoaded(828, 602).then(chunk => {
		if(chunk['828|602'] === undefined) {
			bullet.emit('travelers', 'addEventTile', 828, 602, '▣', 'valley', 'eduroPuzzle');
		}
	});
});
const bullet = require('./bullet');

const TPS = Math.ceil(parseInt(bullet.options.tps));// sub one tps can be 1

const plug = bullet.makePlugin('path');

const pathItem = {
	name: 'path',
	title: 'wooden path',
	type: 'build',
	weight: 25,
	icon: '⊞',
	desc: 'a wooden pathway. travel on this would be faster.',
	craft: true,
	craft_time: TPS * 60 * 3,// 3 minutes
	craft_data: {
		wood_stick: {
			count: 30,
			title: 'wood stick'
		},
		steel_shard: {
			count: 5,
			title: 'steel shards'
		}
	},
	breakTime: TPS * 15,// 15 seconds
	build: true,
	build_desc: 'a flat lightweight wooden pathway. traveling on this is 3x faster.'
};

const pathStructure = {
	id: pathItem.name,
	placingItem: pathItem.name,
	char: pathItem.icon,
	isBreakable: true,
	breakTime: pathItem.breakTime,
	standOver: true
};

plug.on('travelers::getMovementSpeed', (player, out) => {
	const {x, y} = player.public;
	if(bullet.chunks.isObjectHere(x, y) && bullet.chunks.getObject(x, y).private.structureId === pathStructure.id) {
		out.set(out.get() * 3);
	}
}, 0);

plug.on('ready', () => {
	bullet.emit('travelers', 'addGameItem', pathItem.name, pathItem);
	bullet.emit('travelers', 'addStructureData', pathStructure);
	bullet.emit('travelers', 'addCraftableItem', pathItem.name, 34);
	bullet.emit('tileDescriptors', 'addTileDescription', pathStructure.char, 'a wooden path that enables faster travel.');
});
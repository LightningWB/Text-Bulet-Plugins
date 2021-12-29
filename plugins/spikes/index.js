const bullet = require('./bullet');

const TPS = Math.ceil(parseInt(bullet.options.tps));// sub one tps can be 1

const plug = bullet.makePlugin('spikes');

const steelSpikeItemData = {
	name: 'steelSpike',
	title: 'steel spike',
	type: 'build',
	weight: 50,
	icon: '⧋',
	desc: 'a strong steel spike. treat with caution.',
	craft: true,
	craft_time: TPS * 60 * 3,// 3 minutes
	craft_data: {
		steel_shard: {
			count: 15,
			title: 'steel shard'
		},
		scrap_metal: {
			count: 2,
			title: 'scrap metal'
		},
		rope: {
			count: 1,
			title: 'rope'
		}
	},
	breakTime: TPS * 60 * 5,
	build: true,
	build_desc: 'a spike capable of dealing major damage to anyone who stands on it.'
};

const woodSpikeItemData = {
	name: 'woodSpike',
	title: 'wood spike',
	type: 'build',
	weight: 25,
	icon: 'A',
	desc: 'a small wood spike.',
	craft: true,
	craft_time: TPS * 60,// 1 minute
	craft_data: {
		wood_stick: {
			count: 30,
			title: 'wood plank'
		},
		scrap_metal: {
			count: 2,
			title: 'scrap metal'
		}
	},
	breakTime: TPS * 60,// 1 minute
	build: true,
	build_desc: 'a spike capable of dealing minor damage to anyone who stands on it.'
};

const steelSpikeStructureData = {
	id: steelSpikeItemData.name,
	placingItem: steelSpikeItemData.name,
	char: steelSpikeItemData.icon,
	isBreakable: true,
	breakTime: steelSpikeItemData.breakTime// five minutes
};

const woodSpikeStructureData = {
	id: woodSpikeItemData.name,
	placingItem: woodSpikeItemData.name,
	char: woodSpikeItemData.icon,
	isBreakable: true,
	breakTime: woodSpikeItemData.breakTime// five minutes
}

/**
 * @param {bullet.players.player} player
 */
const playerTick = player => {
	if(player.public.state === 'travel') {
		const {x, y} = player.public;
		if(bullet.chunks.isObjectHere(x, y)) {
			const id = bullet.chunks.getObject(x, y).private.structureId;
			switch(id) {
				case steelSpikeStructureData.id:
					player.public.skills.hp -= 4;// counteract the player healing every cycle
					break;
				case woodSpikeStructureData.id:
					player.public.skills.hp -= 2;// counteract the player healing every cycle
					break;
				default: return;
			}
			player.addPropToQueue('skills');
		}
	}
}
plug.on('playerTick', playerTick, -100);

plug.on('ready', () => {
	// steel spike
	bullet.emit('travelers', 'addGameItem', steelSpikeItemData.name, steelSpikeItemData);
	bullet.emit('travelers', 'addStructureData', steelSpikeStructureData);
	bullet.emit('travelers', 'addCraftableItem', steelSpikeItemData.name, 59);
	// wood spike
	bullet.emit('travelers', 'addGameItem', woodSpikeItemData.name, woodSpikeItemData);
	bullet.emit('travelers', 'addStructureData', woodSpikeStructureData);
	bullet.emit('travelers', 'addCraftableItem', woodSpikeItemData.name, 29);

	bullet.emit('tileDescriptors', 'addTileDescription', steelSpikeItemData.icon, 'a steel spike capable of dealing large amounts of damage.');
	bullet.emit('tileDescriptors', 'addTileDescription', woodSpikeItemData.icon, 'a wooden spike capable of dealing damage.');
});
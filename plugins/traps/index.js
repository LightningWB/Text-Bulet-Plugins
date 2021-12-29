const { chunks } = require('./bullet');
const bullet = require('./bullet');

const landmine = {
	name: 'landmine',
	title: 'landmine',
	type: 'weap',
	weight: 15,
	icon: '▁',
	desc: 'a landmine capable of significant harm.',
	craft: true,
	craft_time: 60 * 3,// 3 minutes
	craft_data: {
		circuit_board: {
			count: 1,
			title: 'circuit board'
		},
		scrap_metal: {
			count: 5,
			title: 'scrap metal'
		},
		steel_shard: {
			count: 5,
			title: 'steel shard'
		},
		battery: {
			count: 1,
			title: 'energy cell'
		},
		alien_fragment: {
			count: 1,
			title: 'unknown material fragment'
		}
	},
	build: true,
	build_desc: 'a landmine capable of significant harm. stepping on it will cause 100 damage.'
};

const landmineStructure = {
	id: landmine.name,
	placingItem: landmine.name,
	char: landmine.icon
};

const bearTrap = {
	name: 'bearTrap',
	title: 'bear trap',
	type: 'weap',
	weight: 25,
	icon: '⊗',
	desc: 'a bear trap capable of locking anyone for one minute.',
	craft: true,
	craft_time: 60 * 3,// 3 minutes
	craft_data: {
		steel_shard: {
			count: 15,
			title: 'steel shard'
		},
		scrap_metal: {
			count: 5,
			title: 'scrap metal'
		},
		rope: {
			count: 1,
			title: 'rope'
		}
	},
	build: true,
	build_desc: 'a bear trap capable of locking anyone for one minute.'
};

const bearTrapStructure = {
	id: bearTrap.name,
	placingItem: bearTrap.name,
	char: bearTrap.icon
};

const plug = bullet.makePlugin('traps');

plug.on('travelers::structurePlaced::landmine', (obj, player) => {
	obj.private.visible = false;
	bullet.emit('travelers', 'eventLog', `landmine placed. (${obj.public.x}, ${obj.public.y})`, player);
});

plug.on('travelers::structurePlaced::bearTrap', (obj, player) => {
	obj.private.visible = false;
	bullet.emit('travelers', 'eventLog', `bear trap placed. (${obj.public.x}, ${obj.public.y})`, player);
});

plug.on('travelers::onPlayerStep', (player, out) => {
	const {x, y} = player.public;
	if(chunks.isObjectHere(x, y)) {
		const obj = chunks.getObject(x, y);
		if(obj.private.structureId === landmineStructure.id) {
			chunks.removeObject(x, y);
			player.public.skills.hp -= 100;
			if(player.public.skills.hp > 0) {
				bullet.emit('travelers', 'addExeJs', player, 'POPUP.new("an explosion", "as you take a step, you hear a click come from bellow. a second later, an explosion pierces your ears, followed by pain.");');
			}
			out.set(true);
		} else if(obj.private.structureId === bearTrapStructure.id) {
			chunks.removeObject(x, y);
			bullet.emit('travelers', 'giveEffect', player, 'trapped', Math.floor(bullet.options.tps * 60));
			bullet.emit('travelers', 'eventLog', 'as your foot touches the ground, two metal bars quickly trap you in spot. it will take a minute to break free.', player);
			delete player.public.equipped;
			bullet.emit('travelers', 'addExeJs', player, 'EQUIP.dequip();');
			out.set(true);
		}
	}
});

plug.on('travelers::getMovementSpeed', (player, out) => {
	if(player.private.effects && player.private.effects.trapped > 0) {
		out.set(0);
	}
});

plug.on('actions::equip', (packet, player) => {
	if(player.private.effects && player.private.effects.trapped > 0) {
		bullet.emit('travelers', 'addExeJs', player, 'EQUIP.dequip();');// hide it client side
		return false;
	}
}, 10);

plug.on('equip_actions::metal_detector::scan_for_landmines', player => {
	const {x: pX, y: pY} = player.public;
	let numMines = 0;
	for(let x = pX - 1; x <= pX + 2; x++) {
		for(let y = pY - 1; y <= pY + 2; y++) {
			if(chunks.isObjectHere(x, y) && chunks.getObject(x, y).private.structureId === landmineStructure.id) {
				numMines++;
			}
		}
	}
	if(numMines > 0) {
		bullet.emit('travelers', 'eventLog', `the metal detector beeps ${numMines} time${numMines > 1 ? 's' : ''}. (${player.public.x}, ${player.public.y})`, player);
	} else if(numMines === 0) {
		bullet.emit('travelers', 'eventLog', 'the metal detector stays silent.', player);
	}
});

plug.on('ready', () => {
	bullet.emit('travelers', 'addGameItem', landmine.name, landmine);
	bullet.emit('travelers', 'addStructureData', landmineStructure);
	bullet.emit('travelers', 'addCraftableItem', landmine.name, 29);
	bullet.emit('travelers', 'addGameItem', bearTrap.name, bearTrap);
	bullet.emit('travelers', 'addStructureData', bearTrapStructure);
	bullet.emit('travelers', 'addCraftableItem', bearTrap.name, 19);
	bullet.emit('travelers', 'addGameEffect', 'trapped', {
		name: 'trapped',
		tip: 'you have been trapped and can\'t move or equip items.'
	});
	const metalDetector = {};
	bullet.emit('travelers', 'getItem', 'metal_detector', metalDetector);
	metalDetector.func_actions.scan_for_landmines = {
		server: 'scan_for_landmines',
		client: "ENGINE.log('scanning...');",
		btn_text: 'scan for landmines'
	};
	bullet.emit('travelers', 'addGameItem', metalDetector.name, metalDetector);
});
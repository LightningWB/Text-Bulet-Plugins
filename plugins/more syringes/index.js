const bullet = require('./bullet');

const adrenalineShot = {
	name: 'adrenalineShot',
	title: 'adrenaline shot',
	type: 'tool',
	weight: 3,
	icon: '⇀',
	desc: 'a small shot capable of replenishing stamina instantly.',
	func: true,
	func_desc: 'a syringe containing a substance that gives 100 stamina.',
	func_actions: {
		inject: {
			server: 'inject',
			client: "ENGINE.log('injecting...');",
			btn_text: 'inject'
		}
	},
	craft: true,
	craft_data: {
		syringe: {
			count: 1,
			title: 'syringe'
		},
		medical_pill: {
			count: 1,
			title: 'medicine pill'
		}
	},
	craft_time: 30
};

const speedShot = {
	name: 'speedShot',
	title: 'movement shot',
	type: 'tool',
	weight: 3,
	icon: '⟼',
	desc: 'a shot containing a strange substance capable of giving you enhanced stamina regeneration.',
	func: true,
	func_desc: 'a syringe containing a strange substance that makes you regenerate three times as much stamina for 60 seconds.',
	func_actions: {
		inject: {
			server: 'inject',
			client: "ENGINE.log('injecting...');",
			btn_text: 'inject'
		}
	},
	craft: true,
	craft_data: {
		adrenalineShot: {
			count: 1,
			title: 'adrenaline shot'
		},
		unknown_material_particle: {
			count: 1,
			title: 'unknown material particle'
		}
	},
	craft_time: 120
};

const xpShot = {
	name: 'xpShot',
	title: 'experience shot',
	type: 'tool',
	weight: 3,
	icon: '⇸',
	desc: 'a shot containing a strange, empowering substance.',
	func: true,
	func_desc: 'a syringe containing a strange, empowering substance that gives you 250 experience.',
	func_actions: {
		inject: {
			server: 'inject',
			client: "ENGINE.log('injecting...');",
			btn_text: 'inject'
		}
	},
	craft: true,
	craft_data: {
		syringe: {
			count: 1,
			title: 'syringe'
		},
		unknown_material_particle: {
			count: 1,
			title: 'unknown material particle'
		}
	},
	craft_time: 120
};

const healthShot = {
	name: 'healthShot',
	title: 'health shot',
	type: 'tool',
	weight: 3,
	icon: '↠',
	desc: 'a syringe containing a regenerative substance',
	func: true,
	func_desc: 'a syringe containing a regenerative substance that gives you 50 health.',
	func_actions: {
		inject: {
			server: 'inject',
			client: "ENGINE.log('injecting...');",
			btn_text: 'inject'
		}
	},
	craft: true,
	craft_data: {
		syringe: {
			count: 1,
			title: 'syringe'
		},
		medical_pill: {
			count: 1,
			title: 'medicine pill'
		}
	},
	craft_time: 180
};

const plugin = bullet.makePlugin('moreSyringes');

plugin.on('playerTick', (player) => {
	if(player.private.effects && player.private.effects.stamRegen > 0) {
		player.public.skills.sp = Math.min(player.public.skills.sp + 2, player.public.skills.max_sp);
		player.addPropToQueue('skills');
	}
})

plugin.on('equip_actions::speedShot::inject', (player) => {
	bullet.emit('travelers', 'giveEffect', player, 'stamRegen', Math.floor(bullet.options.tps * 60));
	bullet.emit('travelers', 'takePlayerItem', 'speedShot', 1, player);
	if(!(player.private.supplies.speedShot > 0)) {
		delete player.public.equipped;
		bullet.emit('travelers', 'addExeJs', player, 'EQUIP.dequip();');
	}
	bullet.emit('travelers', 'renderItems', player);
	bullet.emit('travelers', 'calcWeight', player);
});

plugin.on('equip_actions::adrenalineShot::inject', (player) => {
	player.public.skills.sp = Math.min(player.public.skills.sp + 100, player.public.skills.max_sp);
	player.addPropToQueue('skills');
	bullet.emit('travelers', 'takePlayerItem', 'adrenalineShot', 1, player);
	if(!(player.private.supplies.adrenalineShot > 0)) {
		delete player.public.equipped;
		bullet.emit('travelers', 'addExeJs', player, 'EQUIP.dequip();');
	}
	bullet.emit('travelers', 'renderItems', player);
	bullet.emit('travelers', 'calcWeight', player);
});

plugin.on('equip_actions::xpShot::inject', (player) => {
	player.public.skills.xp += 250;
	player.temp.gained_xp = 250;
	player.addPropToQueue('skills', 'gained_xp');
	bullet.emit('travelers', 'takePlayerItem', 'xpShot', 1, player);
	if(!(player.private.supplies.xpShot > 0)) {
		delete player.public.equipped;
		bullet.emit('travelers', 'addExeJs', player, 'EQUIP.dequip();');
	}
	bullet.emit('travelers', 'renderItems', player);
	bullet.emit('travelers', 'calcWeight', player);
});

plugin.on('equip_actions::healthShot::inject', (player) => {
	if(player.public.skills.hp >= player.public.skills.max_hp) {
		bullet.emit('travelers', 'eventLog', 'already at max health.', player);
		return false;
	}
	player.public.skills.hp = Math.min(player.public.skills.hp + 50, player.public.skills.max_hp);
	player.addPropToQueue('skills');
	bullet.emit('travelers', 'takePlayerItem', 'healthShot', 1, player);
	if(!(player.private.supplies.healthShot > 0)) {
		delete player.public.equipped;
		bullet.emit('travelers', 'addExeJs', player, 'EQUIP.dequip();');
	}
	bullet.emit('travelers', 'renderItems', player);
	bullet.emit('travelers', 'calcWeight', player);
});

plugin.on('ready', () => {
	bullet.emit('travelers', 'addGameItem', adrenalineShot.name, adrenalineShot);
	bullet.emit('travelers', 'addGameEffect', 'stamRegen', {
		name: 'energized',
		tip: 'you are energized and now gain three stamina per cycle'
	});
	bullet.emit('travelers', 'addGameItem', speedShot.name, speedShot);
	bullet.emit('travelers', 'addGameItem', xpShot.name, xpShot);
	bullet.emit('travelers', 'addGameItem', healthShot.name, healthShot);
	bullet.emit('travelers', 'addCraftableItem', adrenalineShot.name, 14);
	bullet.emit('travelers', 'addCraftableItem', speedShot.name, 24);
	bullet.emit('travelers', 'addCraftableItem', xpShot.name, 11);
	bullet.emit('travelers', 'addCraftableItem', healthShot.name, 29);
});
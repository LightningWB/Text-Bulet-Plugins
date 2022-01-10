const bullet = require('./bullet');

const plug = bullet.makePlugin('components');
let bulletStorage = '';

plug.on('travelers::addGameItem', (id, item) => {
	if(id === 'player_scanner') {
		item.craft_data = {
			antenna: {
				count: 1,
				title: 'antenna'
			},
			battery: {
				count: 3,
				title: 'energy cell'
			},
			wire: {
				count: 10,
				title: 'wire'
			},
			scrap_metal: {
				count: 15,
				title: 'scrap metal'
			}
		};
	} else if(id === 'circuit_board') {
		item.craft_data = {
			copper_coil: {
				count: 3,
				title: 'copper coil'
			},
			wire: {
				count: 5,
				title: 'wire'
			},
			plastic: {
				count: 1,
				title: 'plastic pieces'
			},
			steel_shard: {
				count: 3,
				title: 'steel shard'
			}
		};
		item.craft = true;
		item.craft_time = 60;
	} else if(id === 'radio') {
		item.craft_data = {
			circuit_board: {
				count: 1,
				title: 'circuit board'
			},
			antenna: {
				count: 1,
				title: 'antenna'
			},
			plastic: {
				count: 2,
				title: 'plastic pieces'
			}
		};
		item.craft_time = 60;
	} else if(id === 'control_panel') {
		item.craft_data = {
			scrap_metal: {
				count: 1,
				title: 'scrap metal'
			},
			plastic: {
				count: 1,
				title: 'plastic pieces'
			},
			circuit_board: {
				count: 1,
				title: 'circuit board'
			},
			wire: {
				count: 10,
				title: 'wire'
			},
			copper_coil: {
				count: 2,
				title: 'copper coil'
			}
		}
	}
});

plug.on('equip_actions::world_analyzer::scan', player => {
	const out = bullet.util.out(Number.NaN, 'number');
	bullet.emit('generator', 'getBorderDistance', out);
	bullet.emit('travelers', 'eventLog', 'border distance: ' + (out.get() - (Math.max(Math.abs(player.public.x), Math.abs(player.public.y)))), player);
});

plug.on('travelers::structurePlaced::automated_turret', (worldObj, player) => {
	worldObj.private.ignoredPlayers = [player.public.username];
});

plug.on('travelers::calcPlayerEvent', player => {
	if(player.private.eventData && player.private.eventData.type === 'structure_automated_turret' && player.public.state === 'event') {
		if(player.temp.event_data.stage_data.title === 'ignored players') {
			const obj = bullet.chunks.getObject(player.public.x, player.public.y);
			player.temp.event_data.stage_data.desc = player.temp.event_data.stage_data.desc.replace('[IGNORED_PLAYERS]', obj.private.ignoredPlayers.join('<br>'));
		}
	} else if(player.private.eventData && player.private.eventData.type === 'structure_radio_tower' && player.public.state === 'event') {
		const obj = bullet.chunks.getObject(player.public.x, player.public.y);
		player.temp.event_data.stage_data.desc = player.temp.event_data.stage_data.desc.replace('[[FREQUENCY]]', obj.private.frequency || '<i>unencrypted global</i>');
	}
}, -100);

plug.on('actions::genmsg', (packet, player) => {
	if(packet.option === 'addPlayerToTurretList' && player.private.eventData && player.private.eventData.type === 'structure_automated_turret') {
		const r = packet.text || '';
		if(r.length > 3 && bullet.players.getPlayerNames().indexOf(r) !== -1) {
			const obj = bullet.chunks.getObject(player.public.x, player.public.y);
			if(obj.private.ignoredPlayers.indexOf(r) === -1) {
				obj.private.ignoredPlayers.push(r);
				bullet.emit('travelers', 'eventLog', 'added player ' + r + ' to the list of ignored players.', player);
			} else {
				bullet.emit('travelers', 'eventLog', 'user already ignored.', player);
			}
		} else {
			bullet.emit('travelers', 'eventLog', 'invalid username provided.', player);
		}
		return false;
	} else if(packet.option === 'removePlayerFromTurretList' && player.private.eventData && player.private.eventData.type === 'structure_automated_turret') {
		const r = packet.text || '';
		if(r.length > 3 && bullet.players.getPlayerNames().indexOf(r) !== -1) {
			const obj = bullet.chunks.getObject(player.public.x, player.public.y);
			if(obj.private.ignoredPlayers.indexOf(r) !== -1) {
				obj.private.ignoredPlayers.splice(obj.private.ignoredPlayers.indexOf(r), 1);
				bullet.emit('travelers', 'eventLog', 'removed player ' + r + ' from the list of ignored players.', player);
			} else {
				bullet.emit('travelers', 'eventLog', 'user not ignored.', player);
			}
		} else {
			bullet.emit('travelers', 'eventLog', 'invalid username provided.', player);
		}
		return false;
	} else if(packet.option === 'radioSetTower' && player.private.eventData && player.private.eventData.type === 'structure_radio_tower') {
		let r = packet.text || '';
		r = r.replace(/[^a-zA-Z0-9-_~%$#@!?]/g, '');
		if(r.length >= 9) {
			r = r.substring(0, 9);
		}
		const obj = bullet.chunks.getObject(player.public.x, player.public.y);
		obj.private.frequency = r;
		bullet.emit('travelers', 'eventLogUnsafe', 'radio tower encryption code set to ' + (r || '<i>unencrypted global</i>') + '.', player);
		bullet.emit('travelers', 'calcPlayerEvent', player);
		return false;
	}
}, 1000);// avoid state checking

plug.on('playerTick', player => {
	if(player.public.state !== 'death') {
		for(let x = player.public.x - 10; x <= player.public.x + 10; x++) {
			for(let y = player.public.y - 10; y <= player.public.y + 10; y++) {
				if(bullet.chunks.isObjectHere(x, y)) {
					const obj = bullet.chunks.getObject(x, y);
					if(obj.private.structureId === 'automated_turret' && obj.private.ignoredPlayers.indexOf(player.public.username) === -1 && obj.private.eventData.loot && obj.private.eventData.loot[bulletStorage] && obj.private.eventData.loot[bulletStorage].bullet > 0) {
						obj.private.eventData.loot[bulletStorage].bullet--;
						let damage = bullet.util.rand(20, 25);
						if(player.public.equipped === 'bulletProofArmor') {
							damage = Math.floor(damage * .5);
						}
						player.public.skills.hp -= damage + 1;// +1 to counter the natural healing
						player.addPropToQueue('skills');
						if(player.public.skills.hp <= 0) {
							bullet.emit('travelers', 'killPlayer', player);
						} else {
							bullet.emit('travelers', 'eventLog', 'a ' + (player.public.equipped === 'bulletProofArmor' ? 'dull' : 'sharp') + ' pain runs through your body as a bang comes from a nearby tower, causing you to loose ' + damage + ' health.', player);
						}
					}
				}
			}
		}
	}

}, -100);

plug.on('travelers::radioBroadcast', (message, frequency, sender) => {
	for(const player of bullet.players.onlinePlayers()) {
		if(player !== sender && player.public.state !== 'death') {
			for(let x = -25; x <= 25; x++) {
				for(let y = -25; y <= 25; y++) {
					if(bullet.chunks.isObjectHere(player.public.x + x, player.public.y + y)) {
						const obj = bullet.chunks.getObject(player.public.x + x, player.public.y + y);
						if(obj.private.structureId === 'radio_tower' && ((obj.private.frequency || '') === frequency)) {
							bullet.emit('travelers', 'eventLog', 'received transmission from nearby station:\n' + message, player);
						}
					}
				}
			}
		}
	}
});

plug.on('ready', () => {
	const out = bullet.util.out('', 'string');
	bullet.emit('travelers', 'getHashedValue', 'bulletStorage', out);
	bulletStorage = out.get();
	const items = require('./items.json');
	for(const item of items) {
		bullet.emit('travelers', 'addGameItem', item.name, item);
	}
	bullet.emit('travelers', 'addCraftableItem', 'antenna', 9);
	bullet.emit('travelers', 'addCraftableItem', 'circuit_board', 14);
	bullet.emit('travelers', 'addCraftableItem', 'world_analyzer', 14);
	bullet.emit('travelers', 'addCraftableItem', 'unknown_material_particle', 9);
	bullet.emit('travelers', 'addCraftableItem', 'enhanced_baseball_bat', 14);
	bullet.emit('travelers', 'addCraftableItem', 'dagger', 19);
	bullet.emit('travelers', 'addCraftableItem', 'wooden_sword', 9);
	bullet.emit('travelers', 'addCraftableItem', 'wrench', 19);
	bullet.emit('travelers', 'addCraftableItem', 'steel_crate', 29);
	bullet.emit('travelers', 'addCraftableItem', 'steel_cable', 34);
	bullet.emit('travelers', 'addStructureData', {
		id: 'steel_crate',
		placingItem: 'steel_crate',
		char: '⧅',
		eventId: 'structure_steel_crate',
		eventType: 'structure_steel_crate',
		isBreakable: true,
		breakTime: 600
	});
	bullet.emit('travelers', 'addEvent', 'structure_steel_crate', require('./steel_crate.json'));
	bullet.emit('travelers', 'addCraftableItem', 'automated_turret', 54);
	bullet.emit('travelers', 'addStructureData', {
		id: 'automated_turret',
		placingItem: 'automated_turret',
		char: '⍑',
		eventId: 'structure_automated_turret',
		eventType: 'structure_automated_turret',
		isBreakable: true,
		breakTime: 60
	});
	bullet.emit('travelers', 'addEvent', 'structure_automated_turret', require('./automated_turret.json'));
	bullet.emit('tileDescriptors', 'addTileDescription', '⍑', 'a tower with a sentry capable of shooting over walls.');
	bullet.emit('travelers', 'addEvent', 'structure_radio_tower', require('./radio_tower.json'));
	bullet.emit('travelers', 'addCraftableItem', 'radio_tower', 44);
	bullet.emit('travelers', 'addStructureData', {
		id: 'radio_tower',
		placingItem: 'radio_tower',
		char: '⟟',
		eventId: 'structure_radio_tower',
		eventType: 'structure_radio_tower',
		isBreakable: true,
		breakTime: 3600
	});
	bullet.emit('travelers', 'addEvent', 'structure_radio_tower', require('./radio_tower.json'));
});
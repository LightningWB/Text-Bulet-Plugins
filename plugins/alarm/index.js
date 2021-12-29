const bullet = require('./bullet');

const plug = bullet.makePlugin('alarm');

const alarmItem = {
	name: 'alarm',
	title: 'emergency broadcast tower',
	type: 'build',
	weight: 15,
	icon: 'Ω',
	desc: 'an alarm capable of broadcasting on a radio frequency when an untrusted traveler comes within 25 tiles.',
	break_time: 60,
	build: true,
	build_desc: 'an alarm capable of broadcasting on a radio frequency when an untrusted traveler comes within 25 tiles.',
	craft: true,
	craft_time: 500,
	craft_data: {
		wire: {
			count: 15,
			title: 'wire'
		},
		scrap_metal: {
			count: 10,
			title: 'scrap metal'
		},
		antenna: {
			count: 1,
			title: 'antenna',
		},
		charged_core: {
			count: 1,
			title: 'charged core'
		},
		control_panel: {
			count: 1,
			title: 'control panel',
		}
	}
};

const alarmStructure = {
	id: alarmItem.name,
	placingItem: alarmItem.name,
	char: alarmItem.icon,
	eventId: 'alarm',
	eventType: 'alarm',
	isBreakable: true,
	breakTime: alarmItem.break_time
};

plug.on('travelers::structurePlaced::alarm', (obj, player) => {
	obj.private.ignoredPlayers = [player.public.username];
	obj.private.frequency = '';
})

plug.on('travelers::calcPlayerEvent', player => {
	if(player.private.eventData && player.private.eventData.type === 'alarm' && player.public.state === 'event') {
		const obj = bullet.chunks.getObject(player.public.x, player.public.y);
		player.temp.event_data.stage_data.desc = player.temp.event_data.stage_data.desc.replace('[[IGNORED_PLAYERS]]', obj.private.ignoredPlayers.join('<br>')).replace('[[FREQUENCY]]', obj.private.frequency || '<i>unencrypted global</i>').replace('[[NAME]]', obj.private.name || 'unknown');
	}
}, -10);

plug.on('actions::genmsg', (packet, player) => {
	if(packet.option === 'addPlayerToAlarm' && player.private.eventData && player.private.eventData.type === 'alarm') {
		const r = packet.text || '';
		if(r.length > 3 && bullet.players.getPlayerNames().indexOf(r) !== -1) {
			const obj = bullet.chunks.getObject(player.public.x, player.public.y);
			if(obj.private.ignoredPlayers.indexOf(r) === -1) {
				obj.private.ignoredPlayers.push(r);
				bullet.emit('travelers', 'eventLog', 'added player ' + r + ' to the list of trusted players.', player);
			} else {
				bullet.emit('travelers', 'eventLog', 'user already trusted.', player);
			}
		} else {
			bullet.emit('travelers', 'eventLog', 'invalid username provided.', player);
		}
		bullet.emit('travelers', 'calcPlayerEvent', player);
		return false;
	} else if(packet.option === 'removePlayerFromAlarm' && player.private.eventData && player.private.eventData.type === 'alarm') {
		const r = packet.text || '';
		if(r.length > 3 && bullet.players.getPlayerNames().indexOf(r) !== -1) {
			const obj = bullet.chunks.getObject(player.public.x, player.public.y);
			if(obj.private.ignoredPlayers.indexOf(r) !== -1) {
				obj.private.ignoredPlayers.splice(obj.private.ignoredPlayers.indexOf(r), 1);
				bullet.emit('travelers', 'eventLog', 'removed player ' + r + ' from the list of trusted players.', player);
			} else {
				bullet.emit('travelers', 'eventLog', 'user not trusted.', player);
			}
		} else {
			bullet.emit('travelers', 'eventLog', 'invalid username provided.', player);
		}
		bullet.emit('travelers', 'calcPlayerEvent', player);
		return false;
	} else if(packet.option === 'alarmSetChannel' && player.private.eventData && player.private.eventData.type === 'alarm') {
		let r = packet.text || '';
		r = r.replace(/[^a-zA-Z0-9-_~%$#@!?]/g, '');
		if(r.length > 9) {
			r = r.substring(0, 9);
		}
		const obj = bullet.chunks.getObject(player.public.x, player.public.y);
		obj.private.frequency = r;
		bullet.emit('travelers', 'calcPlayerEvent', player);
		return false;
	} else if(packet.option === 'setAlarmName' && player.private.eventData && player.private.eventData.type === 'alarm') {
		let r = packet.text || '';
		r = r.replace(/[^a-zA-Z0-9_-]/g, '');
		if(r.length > 16) {
			r = r.substring(0, 9);
		}
		const obj = bullet.chunks.getObject(player.public.x, player.public.y);
		obj.private.name = r;
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
					if(obj.private.structureId === 'alarm' && obj.private.ignoredPlayers.indexOf(player.public.username) === -1) {
						bullet.emit('travelers', 'radioBroadcast', 'traveler detected at ' + (obj.private.name || 'unknown') + '.', obj.private.frequency);
					}
				}
			}
		}
	}

}, -100);

plug.on('ready', () => {
	bullet.emit('travelers', 'addGameItem', alarmItem.name, alarmItem);
	bullet.emit('travelers', 'addCraftableItem', alarmItem.name, 39);
	bullet.emit('travelers', 'addStructureData', alarmStructure);
	bullet.emit('travelers', 'addEvent', 'alarm', require('./alarm.json'));
})
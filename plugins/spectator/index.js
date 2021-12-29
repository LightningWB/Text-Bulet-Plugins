const bullet = require('./bullet');

const plug = bullet.makePlugin('spectator');

const USERNAME_LENGTH = 16;
const SPECTATING = [];

const spectatingItem = {
	name: 'spectator',
	title: 'prying eye',
	type: 'tool',
	weight: 0,
	icon: '👁️',
	desc: 'allows you to view the world from anyone else\'s perspective',
	func: true,
	func_desc: 'view the world from someone else\'s perspective',
	func_actions: {
		view: {
			server: 'view',
			client: 'MSG.open(\'enter the username to view\', \'username\', ' + USERNAME_LENGTH + ', \'view\', \'cancel\', \'spectate\');',
			btn_text: 'view',
		},
		stopViewing: {
			server: 'stopViewing',
			btn_text: 'stop viewing',
		}
	}
};

plug.on('equip_actions::spectator::view', player => {
	player.message('spectate', name => {
		if(bullet.players.isPlayerOnline(name)) {
			player.cache.spectating = name;
			player.cache.firstSpectate = true;
			player.public.spectating = true;
			SPECTATING.push(player);
		} else {
			bullet.emit('travelers', 'eventLog', name + ' is not online.', player);
		}
	}, USERNAME_LENGTH);
});

plug.on('equip_actions::spectator::stopViewing', player => {
	player.cache.spectating = undefined;
	player.cache.firstSpectate = undefined;
	player.public.spectating = undefined;
	bullet.emit('travelers', 'renderCrafting', player);
	bullet.emit('travelers', 'renderItems', player);
	bullet.emit('travelers', 'eventLog', 'stopped spectating.', player);
	player.addPropToQueue('*');
});

plug.on('gameTick', () => {
	const toRemove = [];
	SPECTATING.forEach(player => {
		if(player.cache) {
			if(player.cache.spectating) {
				if(!bullet.players.isPlayerOnline(player.cache.spectating)) {
					player.cache.spectating = undefined;
					return;
				}
				const {public, private, temp} = bullet.players.getOnlinePlayer(player.cache.spectating);
				const sendData = {
					x: public.x,
					y: public.y,
					username: 'spectating: ' + public.username,
					skills: public.skills,
					exe_js: public.exe_js,
					state: public.state,
					proximity: temp.proximity,
					event_data: temp.event_data,
					item_limit: temp.item_limit,
					loot: temp.loot,
					gained_xp: temp.gained_xp,
					break_time: temp.break_time,
					supplies: temp.supplies,
					effects: temp.effects,
					effects_removed: temp.effects_removed,
					craft_items: temp.craft_items,
					craft_queue: temp.craft_queue,
					int_here: temp.int_here,
					int_messages: temp.int_messages,
					int_gotmsg: temp.int_gotmsg,
					int_killer: temp.int_killer,
					int_looted: temp.int_looted,
					int_defeated: temp.int_defeated,
					int_challenge: temp.int_challenge,
					int_pvpstarted: temp.int_pvpstarted,
					int_offlineloot: temp.int_offlineloot,
					battle_start: temp.battle_start,
					battle_timer: temp.battle_timer,
					opp_ready: temp.opp_ready,
					battle_ready_weapon: temp.battle_ready_weapon,
					battle_startround: temp.battle_startround,
					battle_roundreview: temp.battle_roundreview,
					battle_startnextround: temp.battle_startnextround,
					battle_over: temp.battle_over,
					battle_endchatmsg: temp.battle_endchatmsg,
					battle_close: temp.battle_close,
					doors: temp.doors
				};
				if(player.cache.firstSpectate) {
					player.cache.firstSpectate = undefined;
					sendData.supplies = {};
					for(const id in private.supplies) {
						const item = {};
						bullet.emit('travelers', 'getItem', id, item);
						sendData.supplies[id] = {
							count: private.supplies[id],
							data: item
						};
					}
				}
				for(const key in sendData) {
					player.temp[key] = sendData[key];
					player.addPropToQueue(key);
				}
				player.addPropToQueue('spectating');
			}
		} else {
			toRemove.push(player);
		}
	});
	toRemove.forEach(player => {
		SPECTATING.splice(SPECTATING.indexOf(player), 1);
	});
}, -1000);

bullet.patches.addPatch('ENGINE.applyData', '{', '{ENGINE.data=json;', false)
bullet.patches.addPatch('SUPPLIES.set', '!foundEquipped', '!foundEquipped && !ENGINE.data.spectating', false);

plug.on('ready', () => {
	bullet.emit('travelers', 'addGameItem', spectatingItem.name, spectatingItem);
})
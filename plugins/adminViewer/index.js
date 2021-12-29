const bullet = require('./bullet');

const plug = bullet.makePlugin('adminViewer');

plug.addAdminButton('playerInfoGetter', 'Get Player Locations And States', () => {
	const players = bullet.players.getPlayerNames().map(name => bullet.players.getPlayerByUsername(name));
	let resultStr = '';
	for(const player of players) {
		resultStr += `${player.public.username}: ${bullet.players.isPlayerOnline(player.public.username) ? 'online' : 'offline'}: ${player.public.state}: ${(player.cache && player.cache.activeBattleId !== undefined) ? 'in fight' : 'not in fight'}: (${player.public.x + ', ' + player.public.y})\n`;
	}
	return resultStr;
})
const bullet = require('./bullet');
const fs = require('fs');

const plug = bullet.makePlugin('moreHouses');

plug.on('ready', () => {
	const files = fs.readdirSync(__dirname + '/houses/');
	for(const file of files) {
		bullet.emit('travelers', 'addEvent', 'house', require(__dirname + '/houses/' + file));
	}
});
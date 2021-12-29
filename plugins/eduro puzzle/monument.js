const { readFileSync } = require('fs');
const bullet = require('./bullet');


/**
 * 
 * @param {bullet.plugin} plugin 
 */
module.exports = function() {
	const monument = require('./monument.json');
	monument.rooms.main.body = monument.rooms.main.body.replace('[[image]]', `<img class="puzzle-img" src="data:image/png;base64, ${readFileSync(__dirname + '/monument.png', 'base64')}" />`);
	bullet.emit('travelers', 'addEvent', 'monument', monument);
	bullet.chunks.waitForChunkToBeLoaded(0, 0).then(chunk => {
		if(!chunk['0|0']) {
			bullet.emit('travelers', 'addEventTile', 0, 0, '▋', 'monument', 'monument');
		}
	})
}
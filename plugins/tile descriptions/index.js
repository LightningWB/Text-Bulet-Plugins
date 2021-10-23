const bullet = require('./bullet');

const plug = bullet.makePlugin('tile_descriptions');

bullet.patches.addJs(`
WORLD.tileDescriptions = {};
WORLD.returnTileDesc = (el) => WORLD.tileDescriptions[el.innerHTML] || 'unsure of this location';
`.trim());

plug.on('tileDescriptors::addTileDescription', (char, desc) => {
	bullet.patches.addJs(`WORLD.tileDescriptions['${char}'] = "${desc.replace(/"/g, '\\"')}"`);
});

bullet.emit('tileDescriptors', 'addTileDescription', '&nbsp;', 'sandy plains mixed with ash, forming a dull brown mixture that your feet sink slightly into with every step.');
bullet.emit('tileDescriptors', 'addTileDescription', ',', 'grass, or some more durable form of the original plant, breaks the surface of the layer of ash to introduce some small color to the world.');
bullet.emit('tileDescriptors', 'addTIleDescription', 't', 'a family of trees, mostly dead, but some still hanging onto life. perhaps there\'s water for them deep underground.');
bullet.emit('tileDescriptors', 'addTileDescription', 'w', 'ocean, tainted by the damaged atmosphere to become permanently acidic.');
bullet.emit('tileDescriptors', 'addTileDescription', '~', 'muddy swamps, full of old branches and dead plants. steam fills the air from constant bubbles.');
bullet.emit('tileDescriptors', 'addTileDescription', 'M', 'tall mountains, some whose peaks even break through the ash blanketing the world.');
bullet.emit('tileDescriptors', 'addTileDescription', 'T', 'strong gray trees, reaching into the sky and blocking out what little light is left. their tall and tangled roots make travel slow and difficult.');
bullet.emit('tileDescriptors', 'addTileDescription', 'H', 'an old structure, probably used for residence, or perhaps even small business.');
bullet.emit('tileDescriptors', 'addTIleDescription', 'C', 'a city, arid and empty, pierces the clouds of ash with its highest towers.');
bullet.emit('tileDescriptors', 'addTileDescription', '▋', 'a massive monument, an imposing figure on the surrounding landscape, made of some kind of deep purple material. it reaches high enough to poke through the floating ash in the sky.');
bullet.emit('tileDescriptors', 'addTileDescription', '.', 'fresh sand, unlike the filth from back on the shore. perhaps the acidic moisture protected this place from the falling ash.');
bullet.emit('tileDescriptors', 'addTileDescription', '░', 'a huge wall of rock, smooth and dark, curving inward toward the land you stand upon and reaching higher than you can see.');
bullet.emit('tileDescriptors', 'addTileDescription', '<b>&amp;</b>', 'it\'s you.');
bullet.emit('tileDescriptors', 'addTileDescription', '&amp;', 'a traveler, their silhouette clear against the dark horizon.');
bullet.emit('tileDescriptors', 'addTileDescription', 'u', 'some kind of container. it looks new compared to the surrounding landscape.');
bullet.emit('tileDescriptors', 'addTileDescription', '+', 'a wooden fence, stretching across the landscape.');
bullet.emit('tileDescriptors', 'addTileDescription', 'D', 'a wooden gate, blocking the way past.');
bullet.emit('tileDescriptors', 'addTileDescription', '#', 'a scrap metal fence, stretching across the landscape.');
bullet.emit('tileDescriptors', 'addTileDescription', '<b>D</b>', 'a scrap metal gate, blocking the way past.');
bullet.emit('tileDescriptors', 'addTileDescription', '<b>#</b>', 'a steel wall, stretching across the landscape.');
bullet.emit('tileDescriptors', 'addTileDescription', '$', 'a steel gate, blocking the way past.');
bullet.emit('tileDescriptors', 'addTileDescription', '¶', 'a rickety wooden sign. maybe it has a message on it.');
bullet.emit('tileDescriptors', 'addTileDescription', '◻', 'a small storage container, capable of holding a lot of items.');
bullet.emit('tileDescriptors', 'addTileDescription', '▭', 'a large storage container, capable of holding numerous items.');
bullet.emit('tileDescriptors', 'addTileDescription', '┬', 'some kind of small platform.');
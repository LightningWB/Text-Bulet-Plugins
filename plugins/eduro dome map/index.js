const bullet = require('./bullet');
const fs = require('fs');

const plug = bullet.makePlugin('eduro dome map');

const mapBuffer = fs.readFileSync(__dirname + '/map.png');
const mapBase64 = mapBuffer.toString('base64');

const mapItem = {
	name: 'map',
	title: 'map',
	type: 'tool',
	weight: 1,
	icon: '⌻',
	desc: 'an old map, torn and frayed',
	func: true,
	func_desc: 'an old map, torn and frayed',
	func_actions: {
		view: {
			server: '',
			btn_text: 'view',
			client: `POPUP.new('the map', '<img style="display:block;margin-left:auto;margin-right:auto;width:calc(100% - 100px);" src="data:image/png;base64,${mapBase64}">', [{disp:"close", func:()=>{POPUP.hide();}}]);`
		}
	}
};

bullet.patches.addJs('document.body.insertAdjacentHTML("beforeend", "<style>#event-popup{max-height:max(700px, 80%)}#event-desc{max-height:max(500px, 50%)}</style>");');

plug.on('travelers::addEvent', (id, event) => {
	if(id === 'city' && event?.id === 'withered') {
		event.weight = 10000;
		const tablesToChange = [event.rooms?.rotting, event.rooms?.tall].map(e=>e.lootTable);
		tablesToChange.forEach(table => {
			table.push({
				id: mapItem.name,
				min: 1,
				max: 1,
				chance: .1
			});
		});
	}
}, 100);

plug.on('ready', () => {
	bullet.emit('travelers', 'addGameItem', mapItem.name, mapItem);
}, 100);
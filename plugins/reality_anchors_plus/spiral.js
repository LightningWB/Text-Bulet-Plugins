/**
 * keeps going out in the 8 cardinal directions until cb returns true
 * @param {number} x
 * @param {number} y
 * @param {({x: number, y: number}) => boolean} cb 
 */
 module.exports.loopOut = async function(x, y, cb, attempts = Infinity) {
	if((await cb({x, y})))return;
	let distance = 1;
	while(distance < attempts) {
		// n
		if((await cb({x, y: y + distance})) === true)break;
		// ne
		if((await cb({x: x + distance, y: y + distance})) === true)break;
		// e
		if((await cb({x: x + distance, y})) === true)break;
		// se
		if((await cb({x: x + distance, y: y - distance})) === true)break;
		// s
		if((await cb({x, y: y - distance})) === true)break;
		// sw
		if((await cb({x: x - distance, y: y - distance})) === true)break;
		// w
		if((await cb({x: x - distance, y})) === true)break;
		// nw
		if((await cb({x: x - distance, y: y + distance}) === true))break;
		++distance;// according to coherent this saves a cpu cycle
	}
}